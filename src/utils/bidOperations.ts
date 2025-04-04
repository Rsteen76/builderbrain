import { v4 as uuidv4 } from 'uuid';
import { BidService } from '../services/bid';
import { ExpenseService } from '../services/expense';
import { Bid, BidPaymentStage, Expense } from '../types';

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
  bidFormData: any,
  editingBidId: string | null,
  projectId: string,
  projectName: string
): Promise<Bid | null> => {
  if (!userId) return null;
  
  console.log('Submitting bid form data:', JSON.stringify(bidFormData, null, 2));
  
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
    const paymentSchedule = [
      {
        id: uuidv4(),
        name: 'Down Payment',
        percentage: bidFormData.paymentTerms.downPaymentPercent,
        amount: (bidFormData.totalAmount * bidFormData.paymentTerms.downPaymentPercent) / 100,
        status: 'pending',
        phaseId: bidFormData.phaseId,
        phaseName: bidFormData.phaseName,
        dueDate: now,
        description: 'Initial payment to start work',
        createdAt: now,
        updatedAt: now
      },
      ...bidFormData.paymentTerms.installments.map((installment: any) => ({
        id: installment.id || uuidv4(),
        name: installment.name,
        percentage: installment.percent,
        amount: (bidFormData.totalAmount * installment.percent) / 100,
        status: 'pending',
        phaseId: installment.phaseId || bidFormData.phaseId,
        phaseName: installment.phaseName || bidFormData.phaseName,
        dueDate: now,
        description: installment.milestoneDescription,
        createdAt: now,
        updatedAt: now
      }))
    ];
    
    // Create a clean copy of the bid data with Dates properly handled
    const cleanBidData: Partial<Bid> = {
      title: bidFormData.title || '',
      subcontractorName: bidFormData.subcontractorName || '',
      contractorName: bidFormData.subcontractorName || '', // Ensure both names are set
      subcontractorId: bidFormData.subcontractorId || '',
      totalAmount: bidFormData.totalAmount || 0,
      phaseId: bidFormData.phaseId || '',
      phaseName: bidFormData.phaseName || '',
      scope: bidFormData.scope || '',
      timeline: bidFormData.timeline || 30,
      notes: bidFormData.notes || '',
      status: (bidFormData.status === 'draft' || 
               bidFormData.status === 'submitted' || 
               bidFormData.status === 'accepted' || 
               bidFormData.status === 'rejected' || 
               bidFormData.status === 'expired') 
               ? bidFormData.status 
               : 'submitted',
      tags: Array.isArray(bidFormData.tags) ? bidFormData.tags : [],
      attachments: Array.isArray(bidFormData.attachments) ? bidFormData.attachments : [],
      projectId: projectId,
      projectName: projectName,
      paymentSchedule,
      updatedAt: now,
      paymentProgress: {
        paid: 0,
        pending: bidFormData.totalAmount,
        remaining: bidFormData.totalAmount
      }
    };
    
    // Ensure dates are proper Date objects or null
    if (bidFormData.submissionDeadline) {
      cleanBidData.submissionDeadline = bidFormData.submissionDeadline instanceof Date 
        ? bidFormData.submissionDeadline 
        : new Date(bidFormData.submissionDeadline);
    } else {
      cleanBidData.submissionDeadline = null;
    }
    
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
    const isNewlyAccepted = bidFormData.status === 'accepted' && (!existingBid || existingBid.status !== 'accepted');

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
              description: `${stage.name} (${stage.percentage}%) - ${bidFormData.title}`,
              amount: stage.amount,
              date: new Date(),
              status: 'pending',
              vendor: bidFormData.subcontractorName || '',
              notes: `This expense is for payment stage: ${stage.name} (${stage.percentage}%) for accepted bid: ${bidFormData.title}`,
              phaseId: stage.phaseId || bidFormData.phaseId || '',
              phaseName: stage.phaseName || bidFormData.phaseName || '',
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
export const deleteBid = async (bidId: string): Promise<boolean> => {
  try {
    await BidService.deleteBid(bidId);
    return true;
  } catch (error) {
    console.error('Error deleting bid:', error);
    return false;
  }
}; 