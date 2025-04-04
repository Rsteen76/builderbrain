import { v4 as uuidv4 } from 'uuid';
import { BidService } from '../services/bid';
import { ExpenseService } from '../services/expense';
import { Bid, BidPaymentStage, Expense } from '../types';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Extended Expense type that includes bid references
interface EnhancedExpense extends Expense {
  bidId?: string;
  paymentStageId?: string;
}

/**
 * Find an existing expense for a payment stage to avoid duplicates
 */
export const findExistingExpenseForPaymentStage = async (
  userId: string,
  bidId: string, 
  paymentStageId: string
): Promise<EnhancedExpense | null> => {
  try {
    // Get all expenses for the project (limited scope for now)
    const expenses = await ExpenseService.getExpenses(userId);
    
    // Filter to find expenses associated with this payment stage
    const matchingExpense = expenses.find(
      (expense: any) => 
        expense.bidId === bidId && 
        expense.paymentStageId === paymentStageId
    ) as EnhancedExpense | undefined;
    
    return matchingExpense || null;
  } catch (error) {
    console.error('Error finding existing expense for payment stage:', error);
    return null;
  }
};

/**
 * Handle creating and updating bids with consistent expense generation
 */
export const submitBid = async (
  userId: string,
  bidData: {
    title: string;
    subcontractorName: string;
    subcontractorId?: string;
    totalAmount: number;
    phaseId?: string;
    phaseName?: string;
    scope: string;
    timeline: number;
    submissionDeadline?: Date;
    paymentTerms: {
      downPaymentPercent: number;
      installments: {
        id: string;
        name: string;
        percent: number;
        milestoneDescription: string;
        phaseId?: string;
        phaseName?: string;
      }[];
    };
    notes: string;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
    attachments: string[];
    tags: string[];
  },
  editingBidId: string | null,
  projectId: string,
  projectName: string
): Promise<Bid | null> => {
  if (!userId) return null;
  
  console.log('Submitting bid form data:', JSON.stringify(bidData, null, 2));
  
  try {
    const now = new Date();
    
    // Fetch existing bid data if we are editing
    let existingBid: Bid | null = null;
    if (editingBidId) {
      try {
        existingBid = await BidService.getBid(userId, editingBidId);
      } catch (fetchError) {
        console.error(`Error fetching existing bid ${editingBidId} during update:`, fetchError);
        // Decide whether to proceed or throw error
      }
    }
    
    // Create payment schedule
    const paymentSchedule: BidPaymentStage[] = [
      {
        id: uuidv4(),
        name: 'Down Payment',
        percentage: bidData.paymentTerms.downPaymentPercent,
        amount: (bidData.totalAmount * bidData.paymentTerms.downPaymentPercent) / 100,
        status: 'pending' as const,
        phaseId: bidData.phaseId,
        phaseName: bidData.phaseName,
        dueDate: now,
        description: 'Initial payment to start work',
        createdAt: now,
        updatedAt: now
      },
      ...bidData.paymentTerms.installments.map(installment => ({
        id: installment.id || uuidv4(),
        name: installment.name,
        percentage: installment.percent,
        amount: (bidData.totalAmount * installment.percent) / 100,
        status: 'pending' as const,
        phaseId: installment.phaseId || bidData.phaseId,
        phaseName: installment.phaseName || bidData.phaseName,
        dueDate: now,
        description: installment.milestoneDescription,
        createdAt: now,
        updatedAt: now
      }))
    ];
    
    // Create a clean copy of the bid data with Dates properly handled
    const cleanBidData: Partial<Bid> = {
      title: bidData.title || '',
      subcontractorName: bidData.subcontractorName || '',
      contractorName: bidData.subcontractorName || '', // Ensure both names are set
      subcontractorId: bidData.subcontractorId || '',
      totalAmount: bidData.totalAmount || 0,
      phaseId: bidData.phaseId || '',
      phaseName: bidData.phaseName || '',
      scope: bidData.scope || '',
      timeline: bidData.timeline || 30,
      notes: bidData.notes || '',
      status: bidData.status,
      tags: Array.isArray(bidData.tags) ? bidData.tags : [],
      attachments: Array.isArray(bidData.attachments) ? bidData.attachments : [],
      projectId: projectId,
      projectName: projectName,
      paymentSchedule,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      submissionDeadline: bidData.submissionDeadline || null,
      paymentProgress: {
        paid: 0,
        pending: bidData.totalAmount,
        remaining: bidData.totalAmount
      }
    };
    
    let resultBid: Bid;
    
    if (editingBidId) {
      // Update existing bid
      await BidService.updateBid(editingBidId, cleanBidData);
      
      // Fetch updated bid for the return value
      const updatedBid = await BidService.getBid(userId, editingBidId);
      if (!updatedBid) {
        throw new Error('Failed to retrieve updated bid');
      }
      
      resultBid = updatedBid;
    } else {
      // Create new bid
      const newBidId = uuidv4();
      const newBid: Bid = {
        id: newBidId,
        userId: userId,
        ...cleanBidData,
        createdAt: now,
      } as Bid;
      
      resultBid = await BidService.createBid(userId, newBid);
    }
    
    // Handle expenses ONLY when status transitions to 'accepted'
    const isNewlyAccepted = bidData.status === 'accepted' && (!existingBid || existingBid.status !== 'accepted');

    if (isNewlyAccepted) {
      console.log(`Bid ${editingBidId || resultBid.id} is newly accepted. Creating expenses...`);
      try {
        // Create expenses for all payment stages that don't already have an expense
        for (const stage of paymentSchedule) {
          try {
            // Check if this payment stage already has an expense
            const existingExpense = await findExistingExpenseForPaymentStage(
              userId,
              editingBidId || resultBid.id, 
              stage.id
            );
            
            if (existingExpense) {
              console.log(`Expense already exists for payment stage ${stage.id}, skipping creation`);
              continue; // Skip to next stage
            }
            
            // Create an expense for this payment stage
            const expenseData: Omit<EnhancedExpense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
              projectId: projectId,
              category: 'subcontractor',
              description: `${stage.name} (${stage.percentage}%) - ${bidData.title}`,
              amount: stage.amount,
              date: new Date(),
              status: 'pending',
              vendor: bidData.subcontractorName || '',
              notes: `This expense is for payment stage: ${stage.name} (${stage.percentage}%) for accepted bid: ${bidData.title}`,
              phaseId: stage.phaseId || bidData.phaseId || '',
              phaseName: stage.phaseName || bidData.phaseName || '',
              bidId: editingBidId || resultBid.id,
              paymentStageId: stage.id
            };
            
            // Create the expense
            const expense = await ExpenseService.createExpense(userId, expenseData);
            
            // Update the payment stage with the expense ID
            if (expense) {
              const updatedSchedule = [...paymentSchedule] as BidPaymentStage[];
              const stageIndex = updatedSchedule.findIndex(s => s.id === stage.id);
              if (stageIndex !== -1) {
                updatedSchedule[stageIndex].expenseId = expense.id;
                
                await BidService.updateBid(editingBidId || resultBid.id, {
                  paymentSchedule: updatedSchedule
                });
              }
            }
          } catch (error) {
            console.error(`Error creating expense for payment stage ${stage.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error creating expenses for accepted bid:', error);
        // We'll continue with the flow even if expense creation fails
      }
    }
    
    return resultBid;
  } catch (error) {
    console.error('Error submitting bid:', error);
    throw error;
  }
};

/**
 * Delete a bid and return whether the operation was successful
 */
export const deleteBid = async (bidId: string, selectedExpenseIds?: string[]): Promise<boolean> => {
  console.log(`Starting deletion process for bid ID: ${bidId}`);
  try {
    // If specific expense IDs are provided, only delete those expenses
    if (selectedExpenseIds && selectedExpenseIds.length > 0) {
      console.log(`Deleting specified expenses for bid ${bidId}:`, selectedExpenseIds);
      for (const expenseId of selectedExpenseIds) {
        console.log(`Attempting to delete expense ID: ${expenseId}`);
        await ExpenseService.deleteExpense(expenseId);
        console.log(`Successfully deleted expense ID: ${expenseId}`);
      }
    } else {
      // If no specific expenses are selected, delete all expenses associated with the bid
      console.log(`Finding all associated expenses for bid ${bidId}`);
      const expenses = await findExpensesForBid(bidId);
      console.log(`Found ${expenses.length} associated expenses for bid ${bidId}`);
      for (const expense of expenses) {
        if (expense.id) {
          console.log(`Attempting to delete associated expense ID: ${expense.id}`);
          await ExpenseService.deleteExpense(expense.id);
          console.log(`Successfully deleted associated expense ID: ${expense.id}`);
        }
      }
    }

    // Delete the bid
    console.log(`Attempting to delete bid ID: ${bidId}`);
    await BidService.deleteBid(bidId);
    console.log(`Successfully deleted bid ID: ${bidId}. Returning true.`);
    return true;
  } catch (error) {
    console.error(`Error during deletion process for bid ID: ${bidId}`, error);
    console.log(`Deletion failed for bid ID: ${bidId}. Returning false.`);
    return false;
  }
};

/**
 * Find all expenses associated with a bid
 */
export const findExpensesForBid = async (bidId: string): Promise<Expense[]> => {
  console.log(`findExpensesForBid called for bidId: ${bidId}`);
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('bidId', '==', bidId));
    const querySnapshot = await getDocs(q);
    console.log(`Firestore query for expenses with bidId=${bidId} returned ${querySnapshot.docs.length} documents.`);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  } catch (error) {
    console.error(`Error finding expenses for bid ${bidId}:`, error);
    return [];
  }
}; 