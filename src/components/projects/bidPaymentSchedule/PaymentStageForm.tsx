import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { v4 as uuidv4 } from 'uuid';
import { BidPaymentStage } from '../../../types';

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

  const [isChangingToPaid, setIsChangingToPaid] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);

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

    if (name === 'percentage') {
      const percentage = parseFloat(value as string) || 0;
      const amount = Math.round((percentage / 100) * bidTotalAmount * 100) / 100;
      setFormData(prev => ({ ...prev, amount }));

      if (isPartialPayment) {
        setPartialAmount(amount);
      }
    }

    if (name === 'amount') {
      const amount = parseFloat(value as string) || 0;
      const percentage = bidTotalAmount > 0 ? Math.round((amount / bidTotalAmount) * 100 * 100) / 100 : 0;
      setFormData(prev => ({ ...prev, percentage }));

      if (isPartialPayment) {
        setPartialAmount(amount);
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    if (name === 'status' && value === 'paid' && formData.status !== 'paid') {
      setIsChangingToPaid(true);
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

  const handlePartialPaymentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPartialPayment(e.target.checked);

    if (e.target.checked) {
      const fullAmount = typeof formData.amount === 'string' ?
        parseFloat(formData.amount) : (formData.amount || 0);
      setPartialAmount(fullAmount / 2);
      setRemainingAmount(fullAmount / 2);
    }
  };

  const handlePartialAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPartialAmount = parseFloat(e.target.value) || 0;
    const fullAmount = typeof formData.amount === 'string' ?
      parseFloat(formData.amount) : (formData.amount || 0);

    const newRemainingAmount = Math.max(0, fullAmount - newPartialAmount);
    const validatedPartialAmount = Math.min(newPartialAmount, fullAmount);

    setPartialAmount(validatedPartialAmount);
    setRemainingAmount(newRemainingAmount);
  };

  const handleSubmit = () => {
    if (!formData.name || !(formData.amount !== undefined && formData.amount > 0)) {
      alert('Please fill in all required fields');
      return;
    }

    const cleanedData: BidPaymentStage = {
      id: formData.id || uuidv4(),
      name: formData.name || '',
      description: formData.description || '',
      percentage: typeof formData.percentage === 'string' ? parseFloat(formData.percentage) : (formData.percentage || 0),
      amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : (formData.amount || 0),
      status: (formData.status as BidPaymentStage['status']) || 'pending',
      completionRequirements: formData.completionRequirements || '',
      dueDate: formData.dueDate,
      createdAt: formData.createdAt || new Date(),
      updatedAt: formData.updatedAt || new Date(),
      ...(formData.status === 'paid' ? { paymentDate: formData.paymentDate || new Date() } : {}),
      ...(formData.phaseId ? { phaseId: formData.phaseId } : {}),
      ...(formData.phaseName ? { phaseName: formData.phaseName } : {}),
      ...(formData.expenseId ? { expenseId: formData.expenseId } : {}),
    };

    if (isPartialPayment && formData.status === 'paid') {
      cleanedData.partialPayment = true;
      cleanedData.originalAmount = cleanedData.amount;
      cleanedData.amount = partialAmount;
      cleanedData.remainingAmount = remainingAmount;

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

export default PaymentStageForm;
