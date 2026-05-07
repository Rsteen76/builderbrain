import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  IconButton,
  FormHelperText,
  InputAdornment,
  Alert,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  CalendarToday as DateIcon,
  Receipt as PaymentIcon,
  CheckCircle as ConfirmIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Expense, PaymentDetails as ExpensePaymentDetails } from '../../types'; // Import PaymentDetails
import { BidService } from '../../services/bid';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSave: (actualAmountPaid: number, paymentDetails: ExpensePaymentDetails) => void;
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  open,
  onClose,
  expense,
  onSave,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actualAmount, setActualAmount] = useState<number | string>('');
  const [bidData, setBidData] = useState<{
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    title: string;
    subcontractorName?: string;
  } | null>(null);
  const [loadingBidData, setLoadingBidData] = useState(false);

  useEffect(() => {
    if (!expense) return;

    // Set the initial amount from the expense
    setActualAmount('');
    
    // If the expense is linked to a bid, fetch the bid data to show payment information
    const fetchBidData = async () => {
      if (expense?.bidId && open && user?.uid) {
        setLoadingBidData(true);
        try {
          const bid = await BidService.getBid(user.uid, expense.bidId);
          if (bid) {
            const totalAmount = bid.totalAmount || 0;
            const amountPaid = bid.paymentProgress?.paid || 0;
            const remainingAmount = bid.paymentProgress?.remaining || totalAmount - amountPaid;

            setBidData({
              totalAmount,
              amountPaid,
              remainingAmount,
              title: bid.title || 'Untitled Bid',
              subcontractorName: bid.subcontractorName
            });

            // Don't auto-set the amount for bid-related expenses
          }
        } catch (error) {
          console.error('Error fetching bid data:', error);
        } finally {
          setLoadingBidData(false);
        }
      }
    };

    fetchBidData();
  }, [expense, open, user?.uid]);

  const resetForm = () => {
    setPaymentMethod('');
    setReferenceNumber('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrors({});
    setActualAmount('');
    setBidData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const numericAmount = Number(actualAmount);
    const remainingExpenseAmount = Math.max((expense?.amount || 0) - (expense?.amountPaid || 0), 0);
    const maxPayableAmount = bidData
      ? Math.min(remainingExpenseAmount, bidData.remainingAmount)
      : remainingExpenseAmount;

    if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.actualAmount = 'Please enter a valid positive amount.';
    } else if (numericAmount > maxPayableAmount) {
      newErrors.actualAmount = `Payment cannot exceed the remaining balance of ${formatCurrency(maxPayableAmount)}.`;
    }
    
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    if (!paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log('[PaymentFormModal] Validation errors:', newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    const finalAmount = Number(actualAmount);
    console.log(`[PaymentFormModal] Processing payment - Amount: ${finalAmount}`);
    
    // Create the payment details object
    const paymentDetailsObj: ExpensePaymentDetails = {
      method: paymentMethod,
      referenceNumber: referenceNumber || undefined, // Ensure undefined if empty
      date: new Date(paymentDate), // Convert string date to Date object
      notes: notes || undefined // Ensure undefined if empty
    };
    
    if (expense?.projectId) {
      const event = new CustomEvent('expense-status-changed', {
        detail: {
          expenseId: expense.id,
          projectId: expense.projectId,
          phaseId: expense.phaseId,
          oldStatus: expense.status,
          newStatus: 'paid'
        }
      });
      window.dispatchEvent(event);
    }
    
    setTimeout(() => {
      try {
        onSave(finalAmount, paymentDetailsObj);
      } catch (error) {
        console.error('[PaymentFormModal] Error processing payment:', error);
      }
      setLoading(false);
      handleClose();
    }, 500);
  };

  if (!expense) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" component="div" fontWeight="bold">
          Mark Expense as Paid
        </Typography>
        <IconButton size="small" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Expense Details
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {expense.description}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="body1" fontWeight="medium">{formatCurrency(expense.amount)}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Date</Typography>
                <Typography variant="body1">{formatDate(expense.date)}</Typography>
              </Grid>
              
              {expense.vendor && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Vendor</Typography>
                  <Typography variant="body1">{expense.vendor}</Typography>
                </Grid>
              )}
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Project</Typography>
                <Typography variant="body1">{expense.projectName || 'Not assigned'}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Category</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{expense.category}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
        
        {/* Bid Payment Information */}
        {expense.bidId && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Bid Payment Status
            </Typography>
            
            {loadingBidData ? (
              <Box display="flex" alignItems="center" justifyContent="center" p={2}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading bid information...</Typography>
              </Box>
            ) : !user?.uid ? (
              <Alert severity="warning">
                Authentication required to load bid details. Please try again.
              </Alert>
            ) : bidData ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2">
                  {bidData.title} {bidData.subcontractorName ? `- ${bidData.subcontractorName}` : ''}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Total Bid</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(bidData.totalAmount)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Already Paid</Typography>
                    <Typography variant="body1" fontWeight="medium" color={bidData.amountPaid > 0 ? 'success.main' : 'text.primary'}>
                      {formatCurrency(bidData.amountPaid)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Remaining</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {formatCurrency(bidData.remainingAmount)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Alert 
                  severity="info" 
                  icon={<InfoIcon fontSize="small" />}
                  sx={{ mt: 2, bgcolor: 'transparent' }}
                >
                  The amount you enter below will be deducted from the remaining balance.
                </Alert>
              </Paper>
            ) : (
              <Alert severity="warning">
                This expense is linked to a bid, but the bid details could not be loaded.
              </Alert>
            )}
          </Box>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Payment Information
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Payment"
              type="number"
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              error={!!errors.actualAmount}
              helperText={errors.actualAmount}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              inputProps={{ 'aria-label': 'Payment' }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.paymentMethod}>
              <InputLabel id="payment-method-label">Payment Method</InputLabel>
              <Select
                labelId="payment-method-label"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
                startAdornment={
                  <InputAdornment position="start">
                    <PaymentIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.paymentMethod && <FormHelperText>{errors.paymentMethod}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              error={!!errors.paymentDate}
              helperText={errors.paymentDate}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DateIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reference/Confirmation Number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ReceiptIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Notes"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ConfirmIcon />}
        >
          {loading ? 'Processing...' : 'Mark as Paid'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentFormModal;
