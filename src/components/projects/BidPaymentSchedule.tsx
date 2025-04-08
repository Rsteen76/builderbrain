import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { Bid, BidPaymentStage, Expense } from '../../types';
import { ExpenseService } from '../../services/expense';
import { BidService } from '../../services/bid';
import { v4 as uuidv4 } from 'uuid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<BidPaymentStage | null>(null);
  
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
  
  const handleDeleteStage = async (stageId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment stage?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Filter out the stage to delete
      const updatedSchedule = paymentSchedule.filter(stage => stage.id !== stageId);
      
      // Recalculate payment progress
      const updatedProgress = calculatePaymentProgress(updatedSchedule);
      
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
      let updatedSchedule: BidPaymentStage[];
      const now = new Date();
      
      if (selectedStage) {
        // Editing existing stage
        updatedSchedule = paymentSchedule.map(s => 
          s.id === stage.id ? { ...stage, updatedAt: now } : s
        );
      } else {
        // Creating new stage
        const newStage = {
          ...stage,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        };
        updatedSchedule = [...paymentSchedule, newStage];
      }
      
      // Recalculate payment progress
      const updatedProgress = calculatePaymentProgress(updatedSchedule);
      
      // Update the bid
      await BidService.updateBid(bid.id, {
        paymentSchedule: updatedSchedule,
        paymentProgress: updatedProgress
      });
      
      // Get updated bid
      const updatedBid = await BidService.getBid(userId, bid.id);
      if (updatedBid) {
        onBidUpdate?.(updatedBid);
        setSuccess(selectedStage ? 'Payment stage updated successfully' : 'New payment stage added successfully');
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
  
  // Helper function to calculate payment progress
  const calculatePaymentProgress = (schedule: BidPaymentStage[]) => {
    const paid = schedule
      .filter(stage => stage.status === 'paid')
      .reduce((sum, stage) => sum + stage.amount, 0);
    
    const total = schedule.reduce((sum, stage) => sum + stage.amount, 0);
    const pending = total - paid;
    
    return {
      paid,
      pending,
      remaining: pending
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
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
                              disabled={loading || stage.status === 'paid'}
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
      dueDate: undefined
    }
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name!]: value }));
    
    // If percentage changes, update amount
    if (name === 'percentage') {
      const percentage = parseFloat(value as string) || 0;
      const amount = Math.round((percentage / 100) * bidTotalAmount * 100) / 100;
      setFormData(prev => ({ ...prev, amount }));
    }
    
    // If amount changes, update percentage
    if (name === 'amount') {
      const amount = parseFloat(value as string) || 0;
      const percentage = bidTotalAmount > 0 ? Math.round((amount / bidTotalAmount) * 100 * 100) / 100 : 0;
      setFormData(prev => ({ ...prev, percentage }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name!]: value }));
  };
  
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, dueDate: date || undefined }));
  };
  
  const handleSubmit = () => {
    if (!formData.name || !(formData.amount !== undefined && formData.amount > 0)) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSubmit(formData as BidPaymentStage);
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

export default BidPaymentSchedule; 