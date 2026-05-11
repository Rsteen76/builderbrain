import { BidService } from '../../../services/bid';
import { ExpenseService } from '../../../services/expense';
import { Expense } from '../../../types';
import { logger } from '../../../utils/logger';
import type { ExpenseSnackbarState } from './ExpensePageNotifications';

interface AdjustPaidExpenseBidScheduleInput {
  userId: string;
  expenseData: Partial<Expense>;
  expenses: Expense[];
  refetchExpenses: () => void;
  showSnackbar: (snackbar: ExpenseSnackbarState) => void;
}

export const adjustPaidExpenseBidSchedule = async ({
  userId,
  expenseData,
  expenses,
  refetchExpenses,
  showSnackbar,
}: AdjustPaidExpenseBidScheduleInput): Promise<{ shouldStopSaveFlow: boolean }> => {
  if (
    expenseData.status !== 'paid' ||
    !expenseData.paymentDetails ||
    !expenseData.paymentStageId ||
    !expenseData.bidId
  ) {
    return { shouldStopSaveFlow: false };
  }

  logger.log('Expense is being marked as paid with payment details. Triggering bid adjustment...');

  const actualAmountPaid = expenseData.amount || 0;

  try {
    const expenseToUpdate = expenses.find(expense => expense.id === expenseData.id);
    if (!expenseToUpdate) {
      throw new Error('Expense not found locally');
    }

    logger.log(`[handleSaveExpense][BidAdjust] Expense ${expenseData.id} - Actual Amount Paid: ${actualAmountPaid}`);

    const paymentStageId = expenseToUpdate.paymentStageId;
    const projectId = expenseToUpdate.projectId;
    const bidId = expenseToUpdate.bidId;

    if (!paymentStageId || !projectId) {
      logger.log('[handleSaveExpense] Expense not linked to a Payment Stage or Project ID. No Bid adjustment needed.');
      return { shouldStopSaveFlow: false };
    }

    logger.log(`[handleSaveExpense][BidAdjust] Starting adjustment for stage ${paymentStageId} in project ${projectId}.`);
    logger.log(`[handleSaveExpense][BidAdjust] Fetching bids for project ${projectId}...`);
    const bids = await BidService.getBids(userId, { projectId });

    if (!bids || bids.length === 0) {
      logger.warn(`[handleSaveExpense][BidAdjust] No Bid found for project ${projectId}. Skipping adjustment.`);
      return { shouldStopSaveFlow: true };
    }

    let bid;
    if (bidId) {
      bid = bids.find(candidate => candidate.id === bidId);
      if (bid) {
        logger.log(`[handleSaveExpense][BidAdjust] Found specific Bid ID: ${bid.id} from expense`);
      } else {
        logger.warn(`[handleSaveExpense][BidAdjust] Bid ID ${bidId} from expense not found. Using first bid.`);
        bid = bids[0];
      }
    } else {
      if (bids.length > 1) {
        logger.warn(`[handleSaveExpense][BidAdjust] Multiple bids found for project ${projectId}. Using the first one. Consider implications.`);
      }
      bid = bids[0];
    }

    logger.log(`[handleSaveExpense][BidAdjust] Using Bid ID: ${bid.id}`);

    if (!bid.paymentSchedule || !bid.paymentProgress) {
      logger.warn(`[handleSaveExpense][BidAdjust] Bid ${bid.id} is missing paymentSchedule or paymentProgress. Skipping adjustment.`);
      return { shouldStopSaveFlow: false };
    }

    logger.log(`[handleSaveExpense][BidAdjust] Bid has schedule and progress. Processing stage ${paymentStageId}.`);
    const schedule = [...bid.paymentSchedule];
    const progress = { ...bid.paymentProgress };

    const stageIndex = schedule.findIndex(stage => stage.id === paymentStageId);

    if (stageIndex === -1) {
      logger.warn(`[handleSaveExpense][BidAdjust] Payment Stage ${paymentStageId} not found in Bid's schedule. Skipping adjustment.`);
      return { shouldStopSaveFlow: false };
    }

    const paidStage = schedule[stageIndex];
    const originalStageAmount = paidStage.amount;

    logger.log(`[handleSaveExpense][BidAdjust] Found Stage ${paidStage.id} ('${paidStage.name}') with original amount ${originalStageAmount}.`);

    paidStage.status = 'paid';
    paidStage.paymentDate = new Date();
    paidStage.expenseId = expenseData.id;
    paidStage.amount = actualAmountPaid;
    logger.log(`[handleSaveExpense][BidAdjust] Updated paid stage ${paidStage.id} status to 'paid' and amount to actual: ${paidStage.amount}`);

    let calculatedTotalPaid = 0;
    schedule.forEach(stage => {
      if (stage.status === 'paid') {
        calculatedTotalPaid += stage.amount;
      }
    });

    const newTotalPaid = calculatedTotalPaid;
    const newRemaining = bid.totalAmount - newTotalPaid;

    progress.paid = newTotalPaid;
    progress.remaining = newRemaining;
    progress.pending = bid.totalAmount - newTotalPaid;
    logger.log(`[handleSaveExpense][BidAdjust] Recalculated Bid Progress: Paid=${progress.paid}, Remaining=${progress.remaining}, Pending=${progress.pending}`);

    const difference = actualAmountPaid - originalStageAmount;
    logger.log(`[handleSaveExpense][BidAdjust] Payment difference for this stage: ${difference} (Actual: ${actualAmountPaid}, Scheduled Original: ${originalStageAmount})`);

    if (Math.abs(difference) > 0.001) {
      logger.log(`[handleSaveExpense][BidAdjust] Adjustment needed due to difference.`);
      let lastPendingStageIndex = -1;
      for (let i = schedule.length - 1; i >= 0; i--) {
        if (schedule[i].status !== 'paid') {
          lastPendingStageIndex = i;
          break;
        }
      }
      logger.log(`[handleSaveExpense][BidAdjust] Found last pending stage index: ${lastPendingStageIndex}`);

      if (lastPendingStageIndex !== -1 && lastPendingStageIndex !== stageIndex) {
        const lastPendingStage = schedule[lastPendingStageIndex];
        logger.log(`[handleSaveExpense][BidAdjust] Adjusting last pending stage: ${lastPendingStage.id} ('${lastPendingStage.name}')`);
        lastPendingStage.amount -= difference;
        logger.log(`[handleSaveExpense][BidAdjust] Adjusted last pending stage amount to: ${lastPendingStage.amount}`);

        if (lastPendingStage.expenseId) {
          logger.log(`[handleSaveExpense][BidAdjust] Updating final payment expense: ${lastPendingStage.expenseId}`);
          try {
            await ExpenseService.updateExpense(lastPendingStage.expenseId, {
              amount: lastPendingStage.amount,
              updatedAt: new Date(),
            });
            logger.log(`[handleSaveExpense][BidAdjust] Final payment expense updated successfully`);
          } catch (expenseUpdateError) {
            logger.error(`[handleSaveExpense][BidAdjust] Error updating final payment expense:`, expenseUpdateError);
          }
        } else {
          logger.log(`[handleSaveExpense][BidAdjust] No expense ID found for final payment stage`);
        }
      } else if (lastPendingStageIndex === stageIndex) {
        logger.log(`[handleSaveExpense][BidAdjust] The paid stage was the last pending stage. Amount already updated to actual paid.`);
      } else {
        logger.warn('[handleSaveExpense][BidAdjust] No pending stages left to adjust. Difference recorded in overall progress.');
      }
    } else {
      logger.log(`[handleSaveExpense][BidAdjust] No adjustment needed for other stages (difference is negligible).`);
    }

    const cleanedSchedule = schedule.map(stage => {
      const cleanStage = { ...stage };

      Object.keys(cleanStage).forEach(key => {
        if (cleanStage[key as keyof typeof cleanStage] === undefined) {
          delete cleanStage[key as keyof typeof cleanStage];
        }
      });

      return cleanStage;
    });

    const cleanedProgress = { ...progress };
    Object.keys(cleanedProgress).forEach(key => {
      if (cleanedProgress[key as keyof typeof cleanedProgress] === undefined) {
        delete cleanedProgress[key as keyof typeof cleanedProgress];
      }
    });

    await BidService.updateBid(bid.id, {
      paymentSchedule: cleanedSchedule,
      paymentProgress: cleanedProgress,
    });
    logger.log(`[handleSaveExpense][BidAdjust] Bid ${bid.id} update successful.`);

    refetchExpenses();

    showSnackbar({
      open: true,
      message: 'Expense marked as paid successfully',
      severity: 'success',
    });
  } catch (bidUpdateError) {
    logger.error('[handleSaveExpense][BidAdjust] Error during Bid update:', bidUpdateError);
    showSnackbar({
      open: true,
      message: 'Expense marked as paid, but failed to update Bid schedule.',
      severity: 'warning',
    });
  }

  return { shouldStopSaveFlow: false };
};
