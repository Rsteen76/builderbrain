// src/hooks/useExpensePayment.ts
import { useState } from 'react';
import { ExpenseService } from '../services/expense'; // Adjusted path
import { BidService } from '../services/bid'; // Adjusted path
import { Expense, Bid, BidPaymentStage } from '../types'; // Adjust path
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../utils/formatters'; // Adjust path

export interface UseExpensePaymentReturn {
  isProcessing: boolean;
  error: string | null;
  processExpensePayment: (
    user: { uid: string } | null,
    expenseToUpdate: Expense,
    actualAmountPaid: number,
    paymentDetails: { method: string; referenceNumber: string; date: string; notes: string }
  ) => Promise<{ success: boolean; message: string; updatedExpense?: Expense, updatedBid?: Bid }>;
}

// Define adjustBidPaymentSchedule locally within the hook
const adjustBidPaymentScheduleInternal = async (
    userId: string,
    originalExpense: Expense,
    paymentExpenseRecord: Expense,
    amountPaidForThisTransaction: number,
    bidService: typeof BidService
): Promise<Bid | null> => {
    if (!originalExpense.bidId || !originalExpense.paymentStageId) {
        console.log('[adjustBidPaymentScheduleInternal] Expense not linked to a Bid or Payment Stage. Skipping adjustment.');
        return null;
    }

    // Assuming getBid returns a Bid or null directly, or throws an error
    const bid = await bidService.getBid(userId, originalExpense.bidId);
    if (!bid) {
        console.warn(`[adjustBidPaymentScheduleInternal] Bid ${originalExpense.bidId} not found. Skipping adjustment.`);
        return null;
    }

    if (!bid.paymentSchedule || !bid.paymentProgress) {
        console.warn(`[adjustBidPaymentScheduleInternal] Bid ${bid.id} is missing paymentSchedule or paymentProgress. Skipping adjustment.`);
        return null;
    }

    const schedule: BidPaymentStage[] = JSON.parse(JSON.stringify(bid.paymentSchedule)); // Deep copy
    const progress = { ...bid.paymentProgress };
    const stageIndex = schedule.findIndex(stage => stage.id === originalExpense.paymentStageId);

    if (stageIndex === -1) {
        console.warn(`[adjustBidPaymentScheduleInternal] Payment Stage ${originalExpense.paymentStageId} not found in Bid's schedule. Skipping adjustment.`);
        return null;
    }

    const stageToUpdate = schedule[stageIndex];
    const originalStageAmountDue = stageToUpdate.amount - (stageToUpdate.paidAmount || 0);

    stageToUpdate.paidAmount = (stageToUpdate.paidAmount || 0) + amountPaidForThisTransaction;

    if (stageToUpdate.paidAmount >= stageToUpdate.amount) {
        stageToUpdate.status = 'paid';
        stageToUpdate.paymentDate = paymentExpenseRecord.date instanceof Date
            ? paymentExpenseRecord.date
            : new Date(paymentExpenseRecord.date);
        // Link to the new payment expense if different from original (which it should be for payment records)
        if (paymentExpenseRecord.id !== originalExpense.id) {
             stageToUpdate.expenseId = paymentExpenseRecord.id;
        }
    } else {
        stageToUpdate.status = 'partially_paid';
        // stageToUpdate.paymentDate = paymentExpenseRecord.date; // Date of last partial payment
    }

    // Recalculate overall bid progress
    progress.paid = schedule.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    progress.remaining = bid.totalAmount - progress.paid;
    progress.pending = bid.totalAmount - progress.paid;


    await bidService.updateBid(bid.id, { // Assuming updateBid exists
        paymentSchedule: schedule,
        paymentProgress: progress,
    });
    console.log(`[adjustBidPaymentScheduleInternal] Successfully updated bid ${bid.id} payment schedule and progress.`);
    const updatedBid = await bidService.getBid(userId, bid.id);
    return updatedBid || bid;
};


export const useExpensePayment = (): UseExpensePaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Services might be better instantiated outside or passed in if they have internal state/config,
  // but for this example, instantiating here is fine.
  // const expenseService = new ExpenseService();
  // const bidService = new BidService();

  const processExpensePayment = async (
    user: { uid: string } | null,
    expenseToUpdate: Expense,
    actualAmountPaid: number,
    paymentDetails: { method: string; referenceNumber: string; date: string; notes: string }
  ): Promise<{ success: boolean; message: string; updatedExpense?: Expense, updatedBid?: Bid }> => {
    if (!user || !user.uid) {
      setError('User not authenticated.');
      return { success: false, message: 'User not authenticated.' };
    }
    setIsProcessing(true);
    setError(null);

    try {
      const isPartialPaymentOverall = actualAmountPaid < (expenseToUpdate.amount - (expenseToUpdate.amountPaid || 0));

      const paymentExpenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
        projectId: expenseToUpdate.projectId,
        phaseId: expenseToUpdate.phaseId,
        phaseName: expenseToUpdate.phaseName,
        category: expenseToUpdate.category,
        description: `Payment for: ${expenseToUpdate.description}`,
        amount: actualAmountPaid,
        date: new Date(paymentDetails.date),
        status: 'paid', // This record itself is a paid transaction
        vendor: expenseToUpdate.vendor,
        subcontractorId: expenseToUpdate.subcontractorId,
        subcontractorName: expenseToUpdate.subcontractorName,
        notes: `Payment for original expense ID: ${expenseToUpdate.id}. ${paymentDetails.notes || ''}`,
        paymentDetails: paymentDetails,
        tags: [...(expenseToUpdate.tags || []), 'payment_record'],
        projectName: expenseToUpdate.projectName,
        bidId: expenseToUpdate.bidId,
        paymentStageId: expenseToUpdate.paymentStageId,
        originalExpenseId: expenseToUpdate.id,
      };

      // Use static methods from services
      const newPaymentExpenseRecord = await ExpenseService.createExpense(user.uid, paymentExpenseData);
      if (!newPaymentExpenseRecord || !newPaymentExpenseRecord.id) { // Adjusted check based on typical createExpense return
          throw new Error('Failed to create payment expense record.');
      }

      const updatePayload: Partial<Expense> = {
        amountPaid: (expenseToUpdate.amountPaid || 0) + actualAmountPaid,
        status: isPartialPaymentOverall ? 'partially_paid' : 'paid',
        notes: `${expenseToUpdate.notes || ''}\n[${new Date().toLocaleString()}] Payment of ${formatCurrency(actualAmountPaid)} recorded. Ref: ${newPaymentExpenseRecord.id}.`,
        lastPaymentDate: new Date(paymentDetails.date),
      };
      if (!isPartialPaymentOverall) {
        updatePayload.paymentDetails = paymentDetails;
      }

      await ExpenseService.updateExpense(expenseToUpdate.id!, updatePayload);
      // Fetch the updated original expense to get the full object with new timestamps etc.
      const finalUpdatedExpense = await ExpenseService.getExpense(user.uid, expenseToUpdate.id!);
       if (!finalUpdatedExpense) {
          throw new Error('Failed to fetch updated original expense.');
      }


      let updatedBidResult: Bid | null = null;
      if (expenseToUpdate.bidId && expenseToUpdate.paymentStageId) {
         // Pass static services or instantiate if needed by adjustBidPaymentScheduleInternal
        updatedBidResult = await adjustBidPaymentScheduleInternal(user.uid, finalUpdatedExpense, newPaymentExpenseRecord, actualAmountPaid, BidService);
      }

      setIsProcessing(false);
      return {
        success: true,
        message: `Payment of ${formatCurrency(actualAmountPaid)} recorded successfully.`,
        updatedExpense: finalUpdatedExpense,
        updatedBid: updatedBidResult || undefined
      };

    } catch (err: any) {
      console.error('[useExpensePayment] Error:', err);
      setError(err.message || 'Failed to process payment.');
      setIsProcessing(false);
      return { success: false, message: err.message || 'Failed to process payment.' };
    }
  };

  return { isProcessing, error, processExpensePayment };
};
