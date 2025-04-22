import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Collapse,
  Button,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
  AlertTitle,
  Box as MuiBox,
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { v4 as uuidv4 } from 'uuid';
import { Bid, BidPaymentStage, Expense, ExpenseCategory, ExpenseStatus } from '../../types';
import { BidService } from '../../services/bid';
import { ExpenseService } from '../../services/expense';
import { createExtraBidExpense } from '../../utils/bidOperations';
import PaymentStageDeletionDialog from '../dialogs/PaymentStageDeletionDialog';

interface BidPaymentScheduleProps {
  bid: Bid;
  userId: string;
  projectId: string;
  onBidUpdate?: (updatedBid: Bid) => void;
}

const getStatusColor = (status: BidPaymentStage['status']) => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'in_progress':
      return 'info';
    case 'completed':
      return 'warning';
    case 'paid':
      return 'success';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

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
  
  // Calculate payment completion percentage
  const completionPercentage = bid.totalAmount > 0 
    ? Math.round((paymentProgress.paid / bid.totalAmount) * 100) 
    : 0;
  
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
    
    console.log(`Deleting payment stage: ${stageToDelete.name} (ID: ${stageToDelete.id})`);
    console.log(`User chose to ${deleteExpense ? 'DELETE' : 'KEEP'} the associated expense`);
    
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
      
      console.log(`Using fixed amount mode: ${isFixedAmountBid}`);
      
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
                console.error(`Error updating expense ${stage.expenseId} after stage deletion:`, error);
              });
            } catch (expenseUpdateError) {
              console.error(`Error updating expense ${stage.expenseId} after stage deletion:`, expenseUpdateError);
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
          console.log(`Deleted expense ${stageToDelete.expenseId} associated with payment stage ${stageId}`);
        } catch (expenseError) {
          console.error(`Error deleting expense ${stageToDelete.expenseId}:`, expenseError);
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
      console.error('Error deleting payment stage:', error);
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
      
      console.log(`Creating/editing stage using fixed amount mode: ${isFixedAmountBid}`);
      
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
            console.log(`Updated expense ${originalStage.expenseId} for payment stage ${cleanStage.id}${cleanStage.status === 'paid' ? ' (marked as paid)' : ''}`);
          } catch (expenseError) {
            console.error(`Error updating expense for payment stage ${cleanStage.id}:`, expenseError);
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
              console.log(`Updated expense ${finalPaymentStage.expenseId} for adjusted final payment stage`);
            } catch (expenseError) {
              console.error(`Error updating expense for final payment stage:`, expenseError);
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
              console.error('Error creating expense for new payment stage:', expenseError);
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
              console.error('Error creating expense for remaining amount stage:', expenseError);
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
      console.error('Error saving payment stage:', error);
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
      console.error('Error creating expense:', error);
      setError('Failed to create expense');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExtraPaymentSubmit = async (extraPaymentData: {
    amount: number;
    description: string;
    notes: string;
    date: Date;
    category: string;
    status: 'pending' | 'approved' | 'paid';
  }) => {
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
      console.error('Error creating extra payment:', error);
      setError('Failed to create extra payment');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to calculate payment progress
  const calculatePaymentProgress = (schedule: BidPaymentStage[]) => {
    // Ensure we work with numeric values by explicitly converting any string amounts
    const paid = schedule
      .filter(stage => stage.status === 'paid')
      .reduce((sum, stage) => {
        // Convert string amounts to numbers
        const amount = typeof stage.amount === 'string' ? parseFloat(stage.amount) : stage.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    
    const total = schedule.reduce((sum, stage) => {
      // Convert string amounts to numbers
      const amount = typeof stage.amount === 'string' ? parseFloat(stage.amount) : stage.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Validate the calculated values to prevent inconsistencies
    let validatedPaid = Math.min(paid, total); // Paid should never exceed total
    validatedPaid = Math.max(0, validatedPaid); // Paid should never be negative
    
    const validatedPending = Math.max(0, total - validatedPaid); // Pending should never be negative
    
    // If total is 0, both paid and pending should be 0
    if (total === 0) {
      return {
        paid: 0,
        pending: 0,
        remaining: 0
      };
    }
    
    // Log any corrections made to help with debugging
    if (validatedPaid !== paid) {
      console.warn(`Payment calculation corrected: original paid ${paid} -> corrected to ${validatedPaid}`);
    }
    
    return {
      paid: validatedPaid,
      pending: validatedPending,
      remaining: validatedPending
    };
  };
  
  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          p: 1
        }}
        onClick={handleToggleExpand}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ ml: 1 }}>
            Payment Schedule
          </Typography>
        </Box>
        
        {/* Payment progress indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: '40%' }}>
          <Typography variant="body2" sx={{ mr: 1, minWidth: '100px' }}>
            {formatCurrency(paymentProgress.paid)} / {formatCurrency(bid.totalAmount)}
          </Typography>
          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: completionPercentage === 100 ? 'success.main' : 'primary.main',
                }
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ ml: 1, minWidth: '40px' }}>
            {completionPercentage}%
          </Typography>
        </Box>
      </Box>
      
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
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Stage</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Percentage</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requirements</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentSchedule.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No payment stages defined
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentSchedule.map((stage) => (
                    <TableRow key={stage.id}>
                      <TableCell>{stage.name}</TableCell>
                      <TableCell>{stage.description || '-'}</TableCell>
                      <TableCell align="right">{stage.percentage}%</TableCell>
                      <TableCell align="right">{formatCurrency(stage.amount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={stage.status.charAt(0).toUpperCase() + stage.status.slice(1)} 
                          color={getStatusColor(stage.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{stage.completionRequirements || '-'}</TableCell>
                      <TableCell>
                        {stage.dueDate ? new Date(stage.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditStage(stage)}
                              disabled={loading}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {!stage.expenseId && (
                            <Tooltip title="Create Expense">
                              <IconButton 
                                size="small"
                                color="primary" 
                                onClick={() => handleCreateExpense(stage)}
                                disabled={loading}
                              >
                                <ReceiptIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              color="error" 
                              onClick={() => handleDeleteStage(stage.id)}
                              disabled={loading}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {stage.status !== 'paid' && (
                            <Tooltip title="Mark as Paid">
                              <IconButton 
                                size="small"
                                color="success" 
                                onClick={() => handleEditStage({...stage, status: 'paid'})}
                                disabled={loading}
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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

// Payment Stage Form Component
interface PaymentStageFormProps {
  initialData?: BidPaymentStage;
  bidTotalAmount: number;
  onSubmit: (data: BidPaymentStage) => void;
  onCancel: () => void;
}

const PaymentStageForm: React.FC<PaymentStageFormProps> = ({ initialData, bidTotalAmount, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<BidPaymentStage>>(
    initialData || {
      name: '',
      description: '',
      percentage: 0,
      amount: 0,
      status: 'pending',
      completionRequirements: '',
      dueDate: undefined,
      paymentDate: undefined
    }
  );
  
  // Track if status is changing to paid
  const [isChangingToPaid, setIsChangingToPaid] = useState(false);
  // Add state for partial payment
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  
  // Initialize partial amount when a stage is selected
  useEffect(() => {
    if (initialData) {
      const stageAmount = typeof initialData.amount === 'string' ? 
        parseFloat(initialData.amount) : initialData.amount;
      setPartialAmount(stageAmount);
      setRemainingAmount(0);
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name!]: value }));
    
    // If percentage changes, update amount
    if (name === 'percentage') {
      const percentage = parseFloat(value as string) || 0;
      const amount = Math.round((percentage / 100) * bidTotalAmount * 100) / 100;
      setFormData(prev => ({ ...prev, amount }));
      
      // Update partial amount if partial payment is enabled
      if (isPartialPayment) {
        setPartialAmount(amount);
      }
    }
    
    // If amount changes, update percentage
    if (name === 'amount') {
      const amount = parseFloat(value as string) || 0;
      const percentage = bidTotalAmount > 0 ? Math.round((amount / bidTotalAmount) * 100 * 100) / 100 : 0;
      setFormData(prev => ({ ...prev, percentage }));
      
      // Update partial amount if partial payment is enabled
      if (isPartialPayment) {
        setPartialAmount(amount);
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    // Check if status is changing to paid
    if (name === 'status' && value === 'paid' && formData.status !== 'paid') {
      setIsChangingToPaid(true);
      // Automatically set payment date to today if changing to paid
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        paymentDate: new Date()
      }));
    } else {
      setFormData(prev => ({ ...prev, [name!]: value }));
    }
  };
  
  const handleDateChange = (field: 'dueDate' | 'paymentDate') => (date: Date | null) => {
    setFormData(prev => ({ ...prev, [field]: date || undefined }));
  };

  // Add handler for partial payment toggle
  const handlePartialPaymentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPartialPayment(e.target.checked);
    
    // Initialize partial amount with the full amount
    if (e.target.checked) {
      const fullAmount = typeof formData.amount === 'string' ? 
        parseFloat(formData.amount) : (formData.amount || 0);
      setPartialAmount(fullAmount / 2); // Default to 50% for partial payments
      setRemainingAmount(fullAmount / 2);
    }
  };
  
  // Add handler for partial amount change
  const handlePartialAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPartialAmount = parseFloat(e.target.value) || 0;
    const fullAmount = typeof formData.amount === 'string' ? 
      parseFloat(formData.amount) : (formData.amount || 0);
    
    // Calculate remaining amount
    const newRemainingAmount = Math.max(0, fullAmount - newPartialAmount);
    
    // Make sure partial amount doesn't exceed the full amount
    const validatedPartialAmount = Math.min(newPartialAmount, fullAmount);
    
    setPartialAmount(validatedPartialAmount);
    setRemainingAmount(newRemainingAmount);
  };
  
  const handleSubmit = () => {
    if (!formData.name || !(formData.amount !== undefined && formData.amount > 0)) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Ensure all required fields are defined and properly typed before submitting
    const cleanedData: BidPaymentStage = {
      id: formData.id || uuidv4(), // Generate ID if not present
      name: formData.name || '',
      description: formData.description || '',
      percentage: typeof formData.percentage === 'string' ? parseFloat(formData.percentage) : (formData.percentage || 0),
      amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : (formData.amount || 0),
      status: (formData.status as BidPaymentStage['status']) || 'pending',
      completionRequirements: formData.completionRequirements || '',
      dueDate: formData.dueDate,
      createdAt: formData.createdAt || new Date(),
      updatedAt: formData.updatedAt || new Date(),
      // Payment date is included if status is paid
      ...(formData.status === 'paid' ? { paymentDate: formData.paymentDate || new Date() } : {}),
      // Only include defined fields
      ...(formData.phaseId ? { phaseId: formData.phaseId } : {}),
      ...(formData.phaseName ? { phaseName: formData.phaseName } : {}),
      ...(formData.expenseId ? { expenseId: formData.expenseId } : {}),
    };
    
    // Handle partial payment
    if (isPartialPayment && formData.status === 'paid') {
      // For partial payment, modify the stage amount to be the partial amount
      cleanedData.partialPayment = true;
      cleanedData.originalAmount = cleanedData.amount;
      cleanedData.amount = partialAmount;
      cleanedData.remainingAmount = remainingAmount;
      
      // Add note about partial payment
      cleanedData.description = (cleanedData.description || '') + 
        `\nPartial payment: $${partialAmount.toFixed(2)} of $${cleanedData.originalAmount.toFixed(2)}`;
    }
    
    onSubmit(cleanedData);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Stage Name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status || 'pending'}
              onChange={handleSelectChange}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Percentage"
            name="percentage"
            type="number"
            value={formData.percentage || ''}
            onChange={handleChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount || ''}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        
        {/* Add partial payment option for paid status */}
        {formData.status === 'paid' && (
          <>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPartialPayment}
                      onChange={handlePartialPaymentToggle}
                      color="primary"
                    />
                  }
                  label="Make a partial payment"
                />
                {isPartialPayment && (
                  <Tooltip title="Record a partial payment instead of marking the entire stage as paid">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
            
            {isPartialPayment && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount to Pay Now"
                    type="number"
                    value={partialAmount}
                    onChange={handlePartialAmountChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={`Remaining: $${remainingAmount.toFixed(2)}`}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box>
                        This will create a new payment stage for the remaining amount.
                      </Box>
                    </Alert>
                  </Box>
                </Grid>
              </>
            )}
          </>
        )}
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Completion Requirements"
            name="completionRequirements"
            value={formData.completionRequirements || ''}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Due Date"
              value={formData.dueDate ? new Date(formData.dueDate) : null}
              onChange={handleDateChange('dueDate')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        {/* Show payment date field if status is paid */}
        {formData.status === 'paid' && (
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={formData.paymentDate ? new Date(formData.paymentDate) : new Date()}
                onChange={handleDateChange('paymentDate')}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        )}
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Save
        </Button>
      </Box>
    </Box>
  );
};

// Simple Expense Form Component
interface ExpenseFormProps {
  initialData: Partial<Expense>;
  onSubmit: (data: Partial<Expense>) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Expense>>(initialData);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name!]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name!]: value }));
  };
  
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, date: date || new Date() }));
  };
  
  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount || ''}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category || 'other'}
              onChange={handleSelectChange}
              label="Category"
            >
              <MenuItem value="labor">Labor</MenuItem>
              <MenuItem value="materials">Materials</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="permits">Permits</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={formData.date ? new Date(formData.date) : null}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vendor/Supplier"
            name="vendor"
            value={formData.vendor || ''}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Create Expense
        </Button>
      </Box>
    </Box>
  );
};

// Extra Payment Form Component
interface ExtraPaymentFormProps {
  bid: Bid;
  onSubmit: (data: {
    amount: number;
    description: string;
    notes: string;
    date: Date;
    category: string;
    status: 'pending' | 'approved' | 'paid';
  }) => void;
  onCancel: () => void;
}

const ExtraPaymentForm: React.FC<ExtraPaymentFormProps> = ({ bid, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    description: `Extra payment for bid: ${bid.title || 'Untitled'}`,
    amount: 0,
    notes: 'Additional payment outside of the regular payment schedule',
    date: new Date(),
    category: 'construction',
    status: 'pending' as 'pending' | 'approved' | 'paid'
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, date: date || new Date() }));
  };
  
  const handleSubmit = () => {
    if (!formData.description || formData.amount <= 0) {
      alert('Please enter a description and a valid amount');
      return;
    }
    
    onSubmit(formData);
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleSelectChange}
              label="Category"
            >
              <MenuItem value="labor">Labor</MenuItem>
              <MenuItem value="materials">Materials</MenuItem>
              <MenuItem value="construction">Construction</MenuItem>
              <MenuItem value="change_order">Change Order</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              label="Status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Create Extra Payment
        </Button>
      </Box>
    </Box>
  );
};

export default BidPaymentSchedule;