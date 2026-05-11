import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import {
  Paper,
  Box,
  Collapse,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { Bid, BidPaymentStage, Expense, ExpenseCategory } from '../../types';
import { BidService } from '../../services/bid';
import { ExpenseService } from '../../services/expense';
import { createExtraBidExpense } from '../../utils/bidOperations';
import PaymentStageDeletionDialog from '../dialogs/PaymentStageDeletionDialog';
import ExpenseForm from './bidPaymentSchedule/ExpenseForm';
import ExtraPaymentForm, { ExtraPaymentData } from './bidPaymentSchedule/ExtraPaymentForm';
import PaymentProgressHeader from './bidPaymentSchedule/PaymentProgressHeader';
import PaymentScheduleTable from './bidPaymentSchedule/PaymentScheduleTable';
import PaymentStageForm from './bidPaymentSchedule/PaymentStageForm';
import { calculatePaymentProgress } from './bidPaymentSchedule/paymentScheduleUtils';

interface BidPaymentScheduleProps {
  bid: Bid;
  userId: string;
  projectId: string;
  onBidUpdate?: (updatedBid: Bid) => void;
}

const BidPaymentSchedule: React.FC<BidPaymentScheduleProps> = ({ bid, userId, projectId, onBidUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [extraPaymentModalOpen, setExtraPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<BidPaymentStage | null>(null);
  // State for the deletion dialog
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<BidPaymentStage | null>(null);
  
  // Payment schedule data
  const paymentSchedule = bid.paymentSchedule || [];
  const paymentProgress = bid.paymentProgress || { paid: 0, pending: bid.totalAmount, remaining: bid.totalAmount };
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleAddStage = () => {
    setSelectedStage(null);
    setModalOpen(true);
  };
  
  const handleEditStage = (stage: BidPaymentStage) => {
    // If the stage is already paid and we're trying to mark it as paid again,
    // show a warning and do nothing to prevent double payments
    if (stage.status === 'paid') {
      const existingStage = paymentSchedule.find(s => s.id === stage.id);
      if (existingStage && existingStage.status === 'paid') {
        setError('This payment has already been marked as paid. To avoid double payments, no changes were made.');
        return;
      }
    }
    
    setSelectedStage(stage);
    setModalOpen(true);
  };
  
  const handleCreateExpense = (stage: BidPaymentStage) => {
    setSelectedStage(stage);
    setExpenseModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStage(null);
  };
  
  const handleCloseExpenseModal = () => {
    setExpenseModalOpen(false);
    setSelectedStage(null);
  };
  
  const handleDeleteStage = (stageId: string) => {
    // Find the stage to delete to check if it has an associated expense
    const stage = paymentSchedule.find(stage => stage.id === stageId);
    if (!stage) return;
    
    // Set the stage to delete and open the deletion dialog
    setStageToDelete(stage);
    setDeletionDialogOpen(true);
  };
  
  const handleConfirmDeletion = (deleteExpense: boolean) => {
    if (!stageToDelete) return;
    
    logger.log(`Deleting payment stage: ${stageToDelete.name} (ID: ${stageToDelete.id})`);
    logger.log(`User chose to ${deleteExpense ? 'DELETE' : 'KEEP'} the associated expense`);
    
    // Perform the deletion with the user's choice
    deletePaymentStage(stageToDelete.id, deleteExpense);
    
    // Reset state and close dialog
    setDeletionDialogOpen(false);
    setStageToDelete(null);
  };
  
  const handleCloseDeletionDialog = () => {
    setDeletionDialogOpen(false);
    setStageToDelete(null);
  };
  
  // Function to actually perform the deletion
  const deletePaymentStage = async (stageId: string, deleteExpense: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      // Find the stage to delete
      const stageToDelete = paymentSchedule.find(stage => stage.id === stageId);
      if (!stageToDelete) {
        throw new Error('Payment stage not found');
      }
      
      // Get the amount that needs to be redistributed
      const amountToRedistribute = stageToDelete.amount;
      
      // Filter out the stage to delete
      const updatedSchedule = paymentSchedule.filter(stage => stage.id !== stageId);
      
      // Check if the bid uses fixed amounts (not percentage-based)
      // We'll use the presence of custom amounts that don't directly correspond to percentages
      // as an indicator that we're using fixed amounts
      const isFixedAmountBid = paymentSchedule.some(stage => {
        const calculatedAmount = Math.round((stage.percentage / 100) * bid.totalAmount * 100) / 100;
        const actualAmount = typeof stage.amount === 'string' ? parseFloat(stage.amount) : stage.amount;
        // Allow for small rounding differences (0.01)
        return Math.abs(calculatedAmount - actualAmount) > 0.01;
      });
      
      logger.log(`Using fixed amount mode: ${isFixedAmountBid}`);
      
      // If there are remaining stages, redistribute the deleted amount
      if (updatedSchedule.length > 0) {
        // Calculate the current total (excluding the deleted stage)
        const currentTotal = updatedSchedule.reduce((sum, stage) => {
          return sum + (typeof stage.amount === 'string' ? parseFloat(stage.amount) : stage.amount);
        }, 0);
        
        const now = new Date();
        
        // Redistribute the amount proportionally to maintain the original bid total
        updatedSchedule.forEach(stage => {
          // Calculate the stage's current proportion of the remaining total
          const proportion = (typeof stage.amount === 'string' ? 
            parseFloat(stage.amount) : stage.amount) / currentTotal;
            
          // Distribute the deleted amount based on this proportion
          const additionalAmount = proportion * amountToRedistribute;
          const newAmount = (typeof stage.amount === 'string' ? 
            parseFloat(stage.amount) : stage.amount) + additionalAmount;
            
          // Update the stage amount
          stage.amount = Math.round(newAmount * 100) / 100; // Round to 2 decimal places
          stage.updatedAt = now;
          
          // If this stage has an associated expense, update it too
          if (stage.expenseId) {
            try {
              ExpenseService.updateExpense(stage.expenseId, {
                amount: stage.amount,
                notes: `Amount adjusted after deleting payment stage: ${stageToDelete.name}`
              }).catch(error => {
                logger.error(`Error updating expense ${stage.expenseId} after stage deletion:`, error);
              });
            } catch (expenseUpdateError) {
              logger.error(`Error updating expense ${stage.expenseId} after stage deletion:`, expenseUpdateError);
            }
          }
        });
        
        // Only recalculate percentages if we're not using fixed amounts
        // or if all stages are deleted (leaving just one)
        if (!isFixedAmountBid || updatedSchedule.length <= 1) {
          // Recalculate percentages based on the new amounts
          const totalAmount = updatedSchedule.reduce((sum, s) => {
            const amount = typeof s.amount === 'string' ? parseFloat(s.amount) : s.amount;
            return sum + amount;
          }, 0);
          
          if (totalAmount > 0) {
            updatedSchedule.forEach(s => {
              const amount = typeof s.amount === 'string' ? parseFloat(s.amount) : (s.amount || 0);
              s.percentage = Math.round((amount / totalAmount) * 100 * 10) / 10; // Round to 1 decimal
            });
          }
        }
      }
      
      // Recalculate payment progress
      const updatedProgress = calculatePaymentProgress(updatedSchedule);
      
      // If the stage has an associated expense and user chose to delete it
      if (stageToDelete && stageToDelete.expenseId && deleteExpense) {
        try {
          await ExpenseService.deleteExpense(stageToDelete.expenseId);
          logger.log(`Deleted expense ${stageToDelete.expenseId} associated with payment stage ${stageId}`);
        } catch (expenseError) {
          logger.error(`Error deleting expense ${stageToDelete.expenseId}:`, expenseError);
          // Continue with deleting the stage even if we fail to delete the expense
        }
      }
      
      // Update the bid
      await BidService.updateBid(bid.id, {
        paymentSchedule: updatedSchedule,
        paymentProgress: updatedProgress
      });
      
      // Get updated bid
      const updatedBid = await BidService.getBid(userId, bid.id);
      if (updatedBid) {
        onBidUpdate?.(updatedBid);
        setSuccess('Payment stage deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      logger.error('Error deleting payment stage:', error);
      setError('Failed to delete payment stage');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveStage = async (stage: BidPaymentStage) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validation: If marking as paid, check if it's already paid to prevent duplicate payments
      if (stage.status === 'paid' && selectedStage) {
        const originalStage = paymentSchedule.find(s => s.id === stage.id);
        if (originalStage && originalStage.status === 'paid') {
          setError('This payment has already been marked as paid. To avoid double payments, no changes were made.');
          setLoading(false);
          return;
        }
      }
      
      let updatedSchedule: BidPaymentStage[];
      const now = new Date();
      const originalBidAmount = bid.totalAmount;
      
      // Clean the stage data to remove any undefined values
      const cleanStage = Object.entries(stage).reduce((acc, [key, value]) => {
        // Only include properties that are not undefined
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>) as BidPaymentStage;
      
      // Check if the bid uses fixed amounts (not percentage-based)
      const isFixedAmountBid = paymentSchedule.some(stage => {
        const calculatedAmount = Math.round((stage.percentage / 100) * bid.totalAmount * 100) / 100;
        const actualAmount = typeof stage.amount === 'string' ? parseFloat(stage.amount) : stage.amount;
        // Allow for small rounding differences (0.01)
        return Math.abs(calculatedAmount - actualAmount) > 0.01;
      });
      
      logger.log(`Creating/editing stage using fixed amount mode: ${isFixedAmountBid}`);
      
      let newStageId: string | null = null;
      let isNewStage = false;
      
      // Check if this is a partial payment
      const isPartialPayment = cleanStage.partialPayment === true;
      let remainingStageId: string | null = null;
      
      if (selectedStage) {
        // Editing existing stage - keep track of original amount for adjustment
        const originalStage = paymentSchedule.find(s => s.id === cleanStage.id);
        const originalAmount = originalStage ? originalStage.amount : 0;
        
        // For partial payments, we need to handle differently
        if (isPartialPayment && cleanStage.status === 'paid') {
          // Get the amount that will remain unpaid
          const remainingAmount = cleanStage.remainingAmount || 0;
          
          // Update the stage with the partial amount (this is the amount being paid now)
          updatedSchedule = paymentSchedule.map(s => 
            s.id === cleanStage.id ? { 
              ...s, 
              ...cleanStage, 
              updatedAt: now,
              amount: cleanStage.amount, // This is now the partial amount
              partialPayment: true,
              originalAmount: originalAmount,
            } : s
          );
          
          // Create a new stage for the remaining amount
          if (remainingAmount > 0) {
            const remainingStage: BidPaymentStage = {
              id: uuidv4(),
              name: `${originalStage?.name || cleanStage.name} (Remaining)`,
              description: `Remaining amount from partially paid stage: ${originalStage?.name || cleanStage.name}`,
              percentage: isFixedAmountBid ? 0 : Math.round((remainingAmount / bid.totalAmount) * 100 * 10) / 10,
              amount: remainingAmount,
              status: 'pending',
              completionRequirements: originalStage?.completionRequirements || cleanStage.completionRequirements || '',
              dueDate: originalStage?.dueDate || cleanStage.dueDate,
              createdAt: now,
              updatedAt: now,
              // Copy over phase information if it exists
              ...(originalStage?.phaseId ? { phaseId: originalStage.phaseId } : {}),
              ...(originalStage?.phaseName ? { phaseName: originalStage.phaseName } : {}),
              // Link to original stage
              parentStageId: cleanStage.id
            };
            
            // Add the remaining stage to the schedule
            updatedSchedule = [...updatedSchedule, remainingStage];
            remainingStageId = remainingStage.id;
          }
        } else {
          // Regular non-partial payment update
          const amountDifference = (typeof cleanStage.amount === 'string' ? 
            parseFloat(cleanStage.amount) : cleanStage.amount) - originalAmount;
          
          // Update the stage
          updatedSchedule = paymentSchedule.map(s => 
            s.id === cleanStage.id ? { ...s, ...cleanStage, updatedAt: now } : s
          );
        }
        
        // If expense exists for this stage, update it with the new amount
        if (originalStage?.expenseId) {
          try {
            const updatedExpenseData: Partial<Expense> = {
              amount: cleanStage.amount,
              description: `${cleanStage.name} (${cleanStage.percentage}%) - ${bid.title || 'Untitled Bid'}`
            };
            
            // If stage status has changed to paid, update the expense status to paid
            if (cleanStage.status === 'paid' && originalStage.status !== 'paid') {
              updatedExpenseData.status = 'paid';
              updatedExpenseData.date = cleanStage.paymentDate || new Date();
              
              // Add partial payment information if applicable
              if (isPartialPayment) {
                updatedExpenseData.notes = `Partial payment: $${cleanStage.amount.toFixed(2)} of $${cleanStage.originalAmount?.toFixed(2) || originalAmount.toFixed(2)} for payment stage: ${cleanStage.name} for bid: ${bid.title || bid.scope || 'Unnamed bid'}. Payment processed on ${(cleanStage.paymentDate || new Date()).toLocaleDateString()}`;
              } else {
                updatedExpenseData.notes = `Paid expense for payment stage: ${cleanStage.name} (${cleanStage.percentage}%) for bid: ${bid.title || bid.scope || 'Unnamed bid'}. Payment processed on ${(cleanStage.paymentDate || new Date()).toLocaleDateString()}`;
              }
            } else {
              // For updated non-paid expenses
              if (isPartialPayment) {
                updatedExpenseData.notes = `Updated partial payment expense for payment stage: ${cleanStage.name} for bid: ${bid.title || bid.scope || 'Unnamed bid'}`;
              } else {
                updatedExpenseData.notes = `Updated expense for payment stage: ${cleanStage.name} (${cleanStage.percentage}%) for bid: ${bid.title || bid.scope || 'Unnamed bid'}`;
              }
            }
            
            // Update expense with new amount and description
            await ExpenseService.updateExpense(originalStage.expenseId, updatedExpenseData);
            logger.log(`Updated expense ${originalStage.expenseId} for payment stage ${cleanStage.id}${cleanStage.status === 'paid' ? ' (marked as paid)' : ''}`);
          } catch (expenseError) {
            logger.error(`Error updating expense for payment stage ${cleanStage.id}:`, expenseError);
          }
        }
      } else {
        // Creating new stage
        isNewStage = true;
        const newStage = {
          ...cleanStage,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        };
        newStageId = newStage.id;
        updatedSchedule = [...paymentSchedule, newStage];
      }

      // Important: When adding a new stage, preserve the original total amount
      // and adjust other stages proportionally
      if (isNewStage) {
        const newStageAmount = typeof cleanStage.amount === 'string' ? 
          parseFloat(cleanStage.amount) : cleanStage.amount;
          
        // Find the final payment stage if it exists (typically the largest one)
        let finalPaymentStage: BidPaymentStage | undefined;
        
        if (paymentSchedule.length > 0) {
          // Sort stages by amount descending to find the largest one
          const sortedStages = [...paymentSchedule].sort((a, b) => b.amount - a.amount);
          finalPaymentStage = sortedStages[0];
          
          // Adjust the final payment stage amount
          const adjustedFinalAmount = Math.max(0, finalPaymentStage.amount - newStageAmount);
          
          // Update the final payment stage with new amount
          updatedSchedule = updatedSchedule.map(s => 
            s.id === finalPaymentStage?.id ? { 
              ...s, 
              amount: adjustedFinalAmount,
              updatedAt: now 
            } : s
          );
          
          // If the final stage has an associated expense, update it
          if (finalPaymentStage.expenseId) {
            try {
              await ExpenseService.updateExpense(finalPaymentStage.expenseId, {
                amount: adjustedFinalAmount,
                description: `${finalPaymentStage.name} (adjusted) - ${bid.title || 'Untitled Bid'}`,
                notes: `Amount adjusted after adding new payment stage: ${cleanStage.name}`
              });
              logger.log(`Updated expense ${finalPaymentStage.expenseId} for adjusted final payment stage`);
            } catch (expenseError) {
              logger.error(`Error updating expense for final payment stage:`, expenseError);
            }
          }
        }
      }
      
      // Only recalculate percentages if not using fixed amounts or if it's a new bid with first stage
      if (!isFixedAmountBid || paymentSchedule.length <= 1) {
        // Recalculate percentages based on the amounts
        const totalAmount = updatedSchedule.reduce((sum, s) => {
          const amount = typeof s.amount === 'string' ? parseFloat(s.amount) : (s.amount || 0);
          return sum + amount;
        }, 0);
        
        if (totalAmount > 0) {
          updatedSchedule = updatedSchedule.map(s => {
            const amount = typeof s.amount === 'string' ? parseFloat(s.amount) : (s.amount || 0);
            const percentage = Math.round((amount / totalAmount) * 100 * 10) / 10; // Round to 1 decimal
            return {
              ...s,
              percentage,
              updatedAt: now
            };
          });
        }
      }
      
      // Recalculate payment progress
      const updatedProgress = calculatePaymentProgress(updatedSchedule);
      
      // Update the bid with payment schedule and progress
      await BidService.updateBid(bid.id, {
        paymentSchedule: updatedSchedule,
        paymentProgress: updatedProgress
      });
      
      // For new stages, automatically create an expense
      if (newStageId || remainingStageId) {
        // Create expense for the originally created new stage
        if (newStageId) {
          const newStageData = updatedSchedule.find(s => s.id === newStageId);
          if (newStageData) {
            try {
              await createExpenseForStage(newStageData, bid);
            } catch (expenseError) {
              logger.error('Error creating expense for new payment stage:', expenseError);
              // We'll continue even if expense creation fails
            }
          }
        }
        
        // Create expense for the remaining amount stage (in case of partial payment)
        if (remainingStageId) {
          const remainingStageData = updatedSchedule.find(s => s.id === remainingStageId);
          if (remainingStageData) {
            try {
              await createExpenseForStage(remainingStageData, bid);
            } catch (expenseError) {
              logger.error('Error creating expense for remaining amount stage:', expenseError);
              // We'll continue even if expense creation fails
            }
          }
        }
      }
      
      // Get updated bid
      const updatedBid = await BidService.getBid(userId, bid.id);
      if (updatedBid) {
        onBidUpdate?.(updatedBid);
        
        // Success message based on action performed
        let successMessage = '';
        if (selectedStage) {
          if (isPartialPayment) {
            successMessage = 'Partial payment recorded successfully';
          } else {
            successMessage = 'Payment stage updated successfully';
          }
        } else {
          successMessage = 'New payment stage added successfully';
        }
        
        setSuccess(successMessage);
        setTimeout(() => setSuccess(null), 3000);
      }
      
      handleCloseModal();
    } catch (error) {
      logger.error('Error saving payment stage:', error);
      setError('Failed to save payment stage');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to create an expense for a payment stage
  const createExpenseForStage = async (stageData: BidPaymentStage, bid: Bid) => {
    const expenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> & { bidId?: string | null; paymentStageId?: string | null } = {
      projectId: projectId,
      category: 'subcontractor' as ExpenseCategory,
      description: stageData.partialPayment ? 
        `${stageData.name} (Partial: $${stageData.amount}) - ${bid.title || 'Untitled Bid'}` :
        `${stageData.name} (${stageData.percentage}%) - ${bid.title || 'Untitled Bid'}`,
      amount: stageData.amount,
      date: stageData.status === 'paid' ? (stageData.paymentDate || new Date()) : new Date(),
      status: stageData.status === 'paid' ? 'paid' : 'pending',
      subcontractorId: bid.subcontractorId || '',
      subcontractorName: bid.subcontractorName || '',
      notes: stageData.partialPayment ?
        `This expense is for a partial payment of stage: ${stageData.name} for bid: ${bid.title || bid.scope || 'Unnamed bid'}` :
        stageData.status === 'paid' ? 
          `Paid expense for payment stage: ${stageData.name} (${stageData.percentage}%) for bid: ${bid.title || bid.scope || 'Unnamed bid'}. Payment processed on ${(stageData.paymentDate || new Date()).toLocaleDateString()}` :
          `This expense is for payment stage: ${stageData.name} (${stageData.percentage}%) for bid: ${bid.title || bid.scope || 'Unnamed bid'}`,
      phaseId: stageData.phaseId || bid.phaseId || '',
      phaseName: stageData.phaseName || bid.phaseName || '',
      bidId: bid.id,
      paymentStageId: stageData.id,
      vendor: bid.subcontractorName || '',
      tags: [],
      receiptUrl: ''
    };
    
    // Create the expense
    const expense = await ExpenseService.createExpense(userId, expenseData);
    
    // Update the payment stage with the expense ID
    if (expense) {
      const stageWithExpense = paymentSchedule.map(s => 
        s.id === stageData.id ? { ...s, expenseId: expense.id } : s
      ).concat(
        // Add the stage if it's not in the payment schedule yet
        paymentSchedule.find(s => s.id === stageData.id) ? [] : [{...stageData, expenseId: expense.id}]
      );
      
      // Update the bid with the updated payment schedule
      await BidService.updateBid(bid.id, {
        paymentSchedule: stageWithExpense
      });
    }
    
    return expense;
  };
  
  const handleCreateExpenseSubmit = async (expenseData: Partial<Expense>) => {
    if (!selectedStage) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create the expense
      const expense = await ExpenseService.createExpense(userId, {
        projectId: projectId,
        category: expenseData.category || 'other',
        description: expenseData.description || `Payment for ${selectedStage.name}`,
        amount: expenseData.amount || selectedStage.amount,
        date: expenseData.date || new Date(),
        status: 'pending',
        subcontractorId: bid.subcontractorId || '',
        subcontractorName: bid.subcontractorName || '',
        notes: expenseData.notes || `This expense is for payment stage: ${selectedStage.name} of bid: ${bid.title || bid.scope || 'Unnamed bid'}`
      });
      
      // Update the payment stage with the expense ID
      const updatedSchedule = paymentSchedule.map(stage => 
        stage.id === selectedStage.id ? { ...stage, expenseId: expense.id } : stage
      );
      
      // Update the bid
      await BidService.updateBid(bid.id, {
        paymentSchedule: updatedSchedule
      });
      
      // Get updated bid
      const updatedBid = await BidService.getBid(userId, bid.id);
      if (updatedBid) {
        onBidUpdate?.(updatedBid);
        setSuccess('Expense created successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
      
      handleCloseExpenseModal();
    } catch (error) {
      logger.error('Error creating expense:', error);
      setError('Failed to create expense');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExtraPaymentSubmit = async (extraPaymentData: ExtraPaymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const expense = await createExtraBidExpense(
        userId,
        bid.id,
        extraPaymentData
      );
      
      if (!expense) {
        throw new Error('Failed to create extra payment expense');
      }
      
      // Get updated bid to reflect the payment progress
      const updatedBid = await BidService.getBid(userId, bid.id);
      if (updatedBid) {
        onBidUpdate?.(updatedBid);
        setSuccess('Extra payment added successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
      
      setExtraPaymentModalOpen(false);
    } catch (error) {
      logger.error('Error creating extra payment:', error);
      setError('Failed to create extra payment');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <PaymentProgressHeader
        expanded={expanded}
        paidAmount={paymentProgress.paid}
        totalAmount={bid.totalAmount}
        onToggleExpand={handleToggleExpand}
      />
      
      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={() => setExtraPaymentModalOpen(true)}
              disabled={loading}
              color="secondary"
            >
              Add Extra Payment
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleAddStage}
              disabled={loading}
            >
              Add Payment Stage
            </Button>
          </Box>
          
          <PaymentScheduleTable
            paymentSchedule={paymentSchedule}
            loading={loading}
            onEditStage={handleEditStage}
            onCreateExpense={handleCreateExpense}
            onDeleteStage={handleDeleteStage}
          />
        </Box>
      </Collapse>
      
      {/* Payment Stage Form Dialog */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStage ? 'Edit Payment Stage' : 'Add Payment Stage'}
        </DialogTitle>
        <DialogContent>
          <PaymentStageForm 
            initialData={selectedStage || undefined}
            bidTotalAmount={bid.totalAmount}
            onSubmit={handleSaveStage}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
      
      {/* Create Expense Dialog */}
      <Dialog open={expenseModalOpen} onClose={handleCloseExpenseModal} maxWidth="md" fullWidth>
        <DialogTitle>Create Expense for Payment Stage</DialogTitle>
        <DialogContent>
          <ExpenseForm 
            initialData={{
              category: 'other',
              description: selectedStage ? `Payment for ${selectedStage.name}` : '',
              amount: selectedStage ? selectedStage.amount : 0,
              date: new Date(),
              vendor: bid.subcontractorName || '',
              notes: selectedStage ? `This expense is for payment stage: ${selectedStage.name} of bid: ${bid.title || bid.scope || 'Unnamed bid'}` : ''
            }}
            onSubmit={handleCreateExpenseSubmit}
            onCancel={handleCloseExpenseModal}
          />
        </DialogContent>
      </Dialog>
      
      {/* Extra Payment Dialog */}
      <Dialog open={extraPaymentModalOpen} onClose={() => setExtraPaymentModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Extra Payment for Bid</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Alert severity="info">
              This will create an expense outside the regular payment schedule for this bid. The payment will be reflected in the overall bid payment progress.
            </Alert>
          </Box>
          <ExtraPaymentForm 
            bid={bid}
            onSubmit={handleExtraPaymentSubmit}
            onCancel={() => setExtraPaymentModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Payment Stage Deletion Dialog */}
      <PaymentStageDeletionDialog
        open={deletionDialogOpen}
        onClose={handleCloseDeletionDialog}
        onConfirm={handleConfirmDeletion}
        stageName={stageToDelete?.name || 'Unknown'}
        hasExpense={!!stageToDelete?.expenseId}
        loading={loading}
      />
    </Paper>
  );
};

export default BidPaymentSchedule;
