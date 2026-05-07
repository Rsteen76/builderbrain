import { v4 as uuidv4 } from 'uuid';
import { BidService } from '../services/bid';
import { AccountingService } from '../services/accounting';
import { ExpenseService } from '../services/expense';
import { Bid, BidPaymentStage, Expense, ExpenseCategory } from '../types';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { mapSimpleToDetailedCategory } from '../data/hierarchicalCategories';
import { BidFormData } from '../types/form.types';
import { logger } from './logger';

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
    logger.error('Error finding existing expense for payment stage:', error);
    return null;
  }
};

const inferExpenseCategoryFromBid = (bid: Pick<Bid, 'scope' | 'title'>): ExpenseCategory => {
  const text = `${bid.scope || ''} ${bid.title || ''}`.toLowerCase();

  if (['labor', 'framing', 'install', 'carpentry'].some((term) => text.includes(term))) {
    return 'labor';
  }
  if (['material', 'supplies', 'concrete', 'lumber'].some((term) => text.includes(term))) {
    return 'materials';
  }
  if (['equipment', 'machinery', 'tools', 'rental'].some((term) => text.includes(term))) {
    return 'equipment';
  }
  if (['permit', 'inspection', 'license', 'certification'].some((term) => text.includes(term))) {
    return 'permits';
  }

  return 'subcontractor';
};

export const ensureExpensesForAcceptedBid = async (
  userId: string,
  bid: Bid
): Promise<Bid> => {
  if (!userId) throw new Error('User ID is required');
  if (!bid.id) throw new Error('Bid ID is required');
  if (bid.status !== 'accepted') return bid;

  const paymentSchedule = bid.paymentSchedule || [];
  if (paymentSchedule.length === 0) return bid;

  const updatedSchedule: BidPaymentStage[] = [...paymentSchedule];
  let scheduleChanged = false;

  for (let index = 0; index < updatedSchedule.length; index += 1) {
    const stage = updatedSchedule[index];
    if (!stage.id) continue;

    const existingExpense = stage.expenseId
      ? null
      : await findExistingExpenseForPaymentStage(userId, bid.id, stage.id);

    if (stage.expenseId && !existingExpense) {
      continue;
    }

    const expense = existingExpense || await ExpenseService.createOrGetBidPaymentStageExpense(
      userId,
      bid.id,
      stage.id,
      {
        projectId: bid.projectId,
        category: inferExpenseCategoryFromBid(bid),
        description: `${stage.name} (${stage.percentage}%) - ${bid.title || bid.scope || 'Accepted bid'} - ${bid.subcontractorName || bid.contractorName || 'Unknown contractor'}`,
        amount: stage.amount,
        date: new Date(),
        status: 'pending',
        subcontractorId: bid.subcontractorId || '',
        subcontractorName: bid.subcontractorName || bid.contractorName || '',
        notes: `Payment stage: ${stage.name} (${stage.percentage}%) for accepted bid (ID: ${bid.id}).\n\nRequirements: ${stage.completionRequirements || stage.description || 'None'}\n\nOriginal bid notes: ${bid.notes || 'None'}`,
        phaseId: stage.phaseId || bid.phaseId || '',
        phaseName: stage.phaseName || bid.phaseName || '',
      }
    );

    if (expense.id && updatedSchedule[index].expenseId !== expense.id) {
      updatedSchedule[index] = {
        ...updatedSchedule[index],
        expenseId: expense.id,
        updatedAt: new Date(),
      };
      scheduleChanged = true;
    }
  }

  const paymentProgress = bid.paymentProgress || {
    paid: 0,
    pending: bid.totalAmount || 0,
    remaining: bid.totalAmount || 0,
  };

  if (scheduleChanged || !bid.paymentProgress) {
    await BidService.updateBid(bid.id, {
      paymentSchedule: updatedSchedule,
      paymentProgress,
    });

    return {
      ...bid,
      paymentSchedule: updatedSchedule,
      paymentProgress,
    };
  }

  return bid;
};

/**
 * Handle creating and updating bids with consistent expense generation
 */
export const submitBid = async (
  userId: string,
  bidData: BidFormData,
  editingBidId: string | null,
  projectId: string,
  projectName: string
): Promise<Bid | null> => {
  if (!userId) return null;
  
  logger.log('Submitting bid form data:', JSON.stringify(bidData, null, 2));
  
  try {
    const now = new Date();
    
    // Fetch existing bid data if we are editing
    let existingBid: Bid | null = null;
    if (editingBidId) {
      try {
        existingBid = await BidService.getBid(userId, editingBidId);
      } catch (fetchError) {
        logger.error(`Error fetching existing bid ${editingBidId} during update:`, fetchError);
        // Decide whether to proceed or throw error
      }
    }
    
    // Create payment schedule
    const paymentSchedule: BidPaymentStage[] = [
      {
        id: uuidv4(),
        name: 'Down Payment',
        percentage: Math.round(bidData.paymentTerms.downPaymentPercent * 10) / 10,
        amount: (bidData.totalAmount * Math.round(bidData.paymentTerms.downPaymentPercent * 10) / 10) / 100,
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
        percentage: Math.round(installment.percent * 10) / 10,
        amount: (bidData.totalAmount * Math.round(installment.percent * 10) / 10) / 100,
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
    
    // Calculate categoryId based on bid data if it wasn't provided
    // Note: We only calculate this for display purposes in the client
    // The actual categorization might happen on the server
    try {
      // Only attempt to determine category if we have enough information
      if (bidData.title || bidData.subcontractorName || bidData.scope) {
        // This is just for suggestion, not enforcing a value
        const categoryId = mapSimpleToDetailedCategory(
          'bid',
          bidData.subcontractorName || '',
          (bidData.title || '') + ' - ' + (bidData.scope || '')
        );
        
        // Only set if we got a valid category
        if (categoryId && categoryId !== 'uncategorized') {
          cleanBidData.categoryId = categoryId;
        }
      }
    } catch (catError) {
      // Log but don't fail the whole operation just for category mapping
      logger.warn('Non-critical error calculating bid category:', catError);
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
      logger.log('Creating new bid with data:', cleanBidData);
      
      // Ensure projectId is defined (it's required by the service)
      if (!projectId) {
        throw new Error('Project ID is required to create a bid');
      }
      
      try {
        // Create a bid object with required fields guaranteed to be non-optional
        const createBidPayload = {
          projectId, // This is guaranteed to be a string now
          projectName: projectName || 'Unknown Project',
          title: cleanBidData.title || '',
          subcontractorName: cleanBidData.subcontractorName || '',
          contractorName: cleanBidData.contractorName || cleanBidData.subcontractorName || '',
          subcontractorId: cleanBidData.subcontractorId || '',
          totalAmount: cleanBidData.totalAmount || 0,
          status: cleanBidData.status || 'draft',
          scope: cleanBidData.scope || '',
          notes: cleanBidData.notes || '',
          timeline: cleanBidData.timeline || 30,
          paymentSchedule: cleanBidData.paymentSchedule || [],
          tags: cleanBidData.tags || [],
          attachments: cleanBidData.attachments || [],
          submissionDeadline: bidData.submissionDeadline
        };
        
        // Only add categoryId if it exists in cleanBidData
        if (cleanBidData.categoryId) {
          (createBidPayload as any).categoryId = cleanBidData.categoryId;
        }
        
        logger.log('Calling BidService.createBid with payload:', JSON.stringify(createBidPayload, null, 2));
        
        // DEBUG: Try to wrap the creation call in a more detailed error handling block
        try {
          resultBid = await BidService.createBid(userId, createBidPayload);
          logger.log('Successfully created bid:', resultBid);
        } catch (createError) {
          logger.error('ERROR IN BidService.createBid:', createError);
          if (createError instanceof Error) {
            logger.error('Error message:', createError.message);
            logger.error('Error stack:', createError.stack);
          }
          // Re-throw to be caught by the outer catch block
          throw createError;
        }
      } catch (innerError) {
        logger.error('CRITICAL: Error preparing or creating bid:', innerError);
        throw new Error(`Failed to create bid: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
      }
    }
    
    // Handle expenses ONLY when status transitions to 'accepted'
    const isNewlyAccepted = bidData.status === 'accepted' && (!existingBid || existingBid.status !== 'accepted');

    if (resultBid.status === 'accepted') {
      try {
        await AccountingService.createOrUpdateCommitmentFromBid(userId, resultBid);
      } catch (error) {
        logger.error('Error creating accounting commitment for accepted bid:', error);
      }
    }

    if (isNewlyAccepted) {
      logger.log(`Bid ${editingBidId || resultBid.id} is newly accepted. Creating expenses...`);
      try {
        resultBid = await ensureExpensesForAcceptedBid(userId, resultBid);
      } catch (error) {
        logger.error('Error creating expenses for accepted bid:', error);
        throw error;
      }
    }
    
    return resultBid;
  } catch (error) {
    logger.error('Error submitting bid:', error);
    throw error;
  }
};

/**
 * Delete a bid and return whether the operation was successful
 */
export const deleteBid = async (bidId: string, selectedExpenseIds?: string[]): Promise<boolean> => {
  logger.log(`Starting deletion process for bid ID: ${bidId}`);
  try {
    // If specific expense IDs are provided, only delete those expenses
    if (selectedExpenseIds && selectedExpenseIds.length > 0) {
      logger.log(`Deleting specified expenses for bid ${bidId}:`, selectedExpenseIds);
      for (const expenseId of selectedExpenseIds) {
        logger.log(`Attempting to delete expense ID: ${expenseId}`);
        await ExpenseService.deleteExpense(expenseId);
        logger.log(`Successfully deleted expense ID: ${expenseId}`);
      }
    } else {
      // If no specific expenses are selected, delete all expenses associated with the bid
      logger.log(`Finding all associated expenses for bid ${bidId}`);
      const expenses = await findExpensesForBid(bidId);
      logger.log(`Found ${expenses.length} associated expenses for bid ${bidId}`);
      for (const expense of expenses) {
        if (expense.id) {
          logger.log(`Attempting to delete associated expense ID: ${expense.id}`);
          await ExpenseService.deleteExpense(expense.id);
          logger.log(`Successfully deleted associated expense ID: ${expense.id}`);
        }
      }
    }

    // Delete the bid
    logger.log(`Attempting to delete bid ID: ${bidId}`);
    await BidService.deleteBid(bidId);
    logger.log(`Successfully deleted bid ID: ${bidId}. Returning true.`);
    return true;
  } catch (error) {
    logger.error(`Error during deletion process for bid ID: ${bidId}`, error);
    logger.log(`Deletion failed for bid ID: ${bidId}. Returning false.`);
    return false;
  }
};

/**
 * Find all expenses associated with a bid
 */
export const findExpensesForBid = async (bidId: string): Promise<Expense[]> => {
  logger.log(`findExpensesForBid called for bidId: ${bidId}`);
  try {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('bidId', '==', bidId));
    const querySnapshot = await getDocs(q);
    logger.log(`Firestore query for expenses with bidId=${bidId} returned ${querySnapshot.docs.length} documents.`);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  } catch (error) {
    logger.error(`Error finding expenses for bid ${bidId}:`, error);
    return [];
  }
};

/**
 * Create an extra expense for a bid outside of the regular payment schedule
 * and update the bid's payment progress accordingly
 */
export const createExtraBidExpense = async (
  userId: string,
  bidId: string,
  expenseData: {
    amount: number;
    description: string;
    notes?: string;
    date?: Date;
    category?: string;
    status?: 'pending' | 'approved' | 'paid';
  }
): Promise<Expense | null> => {
  if (!userId || !bidId) return null;
  
  try {
    // Fetch the bid to get project info and contractor details
    const bid = await BidService.getBid(userId, bidId);
    if (!bid) {
      throw new Error(`Bid ${bidId} not found`);
    }
    
    // Create the expense
    const expenseToCreate = {
      projectId: bid.projectId,
      description: expenseData.description || `Extra payment for bid: ${bid.title || 'Untitled'}`,
      amount: expenseData.amount,
      date: expenseData.date || new Date(),
      category: (expenseData.category as ExpenseCategory) || 'construction',
      status: expenseData.status || 'pending',
      subcontractorId: bid.subcontractorId || '',
      subcontractorName: bid.subcontractorName || '',
      notes: expenseData.notes || `Extra expense for bid outside regular payment schedule. Bid ID: ${bidId}`,
      bidId: bidId, // Link to the bid
      isExtraPayment: true // Mark this as an extra payment
    };
    
    // Create the expense in the database
    const expense = await ExpenseService.createExpense(userId, expenseToCreate);
    
    // Update the bid's total amount and payment progress
    // Calculate the new total amount by adding the extra payment amount to the existing total
    const updatedTotalAmount = bid.totalAmount + expenseData.amount;
    
    // Create a new payment stage for the extra payment
    const now = new Date();
    const extraPaymentStage: BidPaymentStage = {
      id: uuidv4(),
      name: `Extra Payment - ${now.toLocaleDateString()}`,
      description: expenseData.description || 'Additional payment outside regular schedule',
      percentage: Math.round((expenseData.amount / updatedTotalAmount) * 100 * 10) / 10, // Calculate percentage of new total
      amount: expenseData.amount,
      status: (expenseData.status === 'paid' ? 'paid' : 'pending') as BidPaymentStage['status'],
      dueDate: expenseData.date || now,
      expenseId: expense.id, // Link the expense to this payment stage
      createdAt: now,
      updatedAt: now
    };
    
    // Update or create payment schedule with the new stage
    const updatedPaymentSchedule = [...(bid.paymentSchedule || []), extraPaymentStage];
    
    // Update existing payment stage percentages based on new total amount
    // This keeps the payment stage amounts the same, but recalculates percentages
    const recalculatedPaymentSchedule = updatedPaymentSchedule.map(stage => {
      if (stage.id !== extraPaymentStage.id) { // Skip the extra payment we just added
        return {
          ...stage,
          percentage: Math.round((stage.amount / updatedTotalAmount) * 100 * 10) / 10, // Recalculate percentage
          updatedAt: now
        };
      }
      return stage;
    });
    
    if (bid.paymentProgress) {
      const updatedProgress = { ...bid.paymentProgress };
      
      // If expense is already marked as paid, update paid amount
      if (expenseData.status === 'paid') {
        updatedProgress.paid += expenseData.amount;
      } else {
        // Otherwise update pending amount
        updatedProgress.pending += expenseData.amount;
      }
      
      // Update remaining amount based on new total
      updatedProgress.remaining = updatedTotalAmount - updatedProgress.paid;
      
      // Update the bid with new total amount, payment schedule, and payment progress
      await BidService.updateBid(bidId, {
        totalAmount: updatedTotalAmount,
        paymentSchedule: recalculatedPaymentSchedule,
        paymentProgress: updatedProgress
      });

      try {
        const updatedBid = await BidService.getBid(userId, bidId);
        if (updatedBid?.status === 'accepted') {
          await AccountingService.createOrUpdateCommitmentFromBid(userId, updatedBid);
        }
      } catch (error) {
        logger.error('Error updating accounting commitment for extra bid expense:', error);
      }
      
      logger.log(`Updated bid ${bidId} with extra payment stage and adjusted payment schedule`);
    } else {
      // If there's no payment progress yet, create it
      const initialPaid = expenseData.status === 'paid' ? expenseData.amount : 0;
      const initialPending = expenseData.status !== 'paid' ? expenseData.amount : 0;
      
      await BidService.updateBid(bidId, {
        totalAmount: updatedTotalAmount,
        paymentSchedule: recalculatedPaymentSchedule,
        paymentProgress: {
          paid: initialPaid,
          pending: initialPending,
          remaining: updatedTotalAmount - initialPaid
        }
      });

      try {
        const updatedBid = await BidService.getBid(userId, bidId);
        if (updatedBid?.status === 'accepted') {
          await AccountingService.createOrUpdateCommitmentFromBid(userId, updatedBid);
        }
      } catch (error) {
        logger.error('Error updating accounting commitment for extra bid expense:', error);
      }
      
      logger.log(`Created payment schedule with extra payment for bid ${bidId}`);
    }
    
    return expense;
  } catch (error) {
    logger.error('Error creating extra bid expense:', error);
    return null;
  }
};
