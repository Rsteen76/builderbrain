import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { Bid, BidPaymentStage } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BidPaymentTermsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (paymentSchedule: BidPaymentStage[]) => Promise<void>;
  bid: Bid;
}

const defaultPaymentTemplates = [
  { name: 'Standard (30-40-30)', stages: [
    { name: 'Initial Deposit', percentage: 30, description: 'Upfront payment to begin work', completionRequirements: 'Upon contract signing' },
    { name: 'Progress Payment', percentage: 40, description: 'Mid-project milestone payment', completionRequirements: '50% project completion' },
    { name: 'Final Payment', percentage: 30, description: 'Final payment upon completion', completionRequirements: 'Upon project completion and final inspection' }
  ]},
  { name: 'Milestone Based (4 Stages)', stages: [
    { name: 'Initial Deposit', percentage: 20, description: 'Upfront payment to begin work', completionRequirements: 'Upon contract signing' },
    { name: 'Foundation Complete', percentage: 25, description: 'Payment after foundation work', completionRequirements: 'Foundation completion and inspection' },
    { name: 'Framing Complete', percentage: 25, description: 'Payment after framing', completionRequirements: 'Framing completion and inspection' },
    { name: 'Final Payment', percentage: 30, description: 'Final payment upon completion', completionRequirements: 'Upon project completion and final inspection' }
  ]},
  { name: 'Equal Installments (25% each)', stages: [
    { name: 'First Payment', percentage: 25, description: 'First installment', completionRequirements: 'Upon contract signing' },
    { name: 'Second Payment', percentage: 25, description: 'Second installment', completionRequirements: '33% project completion' },
    { name: 'Third Payment', percentage: 25, description: 'Third installment', completionRequirements: '66% project completion' },
    { name: 'Final Payment', percentage: 25, description: 'Final installment', completionRequirements: 'Project completion' }
  ]},
];

const BidPaymentTermsModal: React.FC<BidPaymentTermsModalProps> = ({ open, onClose, onSubmit, bid }) => {
  const [paymentSchedule, setPaymentSchedule] = useState<BidPaymentStage[]>([]);
  const [editingStage, setEditingStage] = useState<BidPaymentStage | null>(null);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Calculate total percentage and amount
  const totalPercentage = paymentSchedule.reduce((sum, stage) => sum + stage.percentage, 0);
  const totalAmount = paymentSchedule.reduce((sum, stage) => sum + stage.amount, 0);
  const isValid = totalPercentage === 100 && Math.abs(totalAmount - bid.totalAmount) < 0.01;

  useEffect(() => {
    if (open) {
      // Initialize with default schedule if bid doesn't have one
      if (!bid.paymentSchedule || bid.paymentSchedule.length === 0) {
        const defaultSchedule = defaultPaymentTemplates[0].stages.map(template => {
          const amount = Math.round((template.percentage / 100) * bid.totalAmount * 100) / 100;
          return {
            id: uuidv4(),
            name: template.name,
            description: template.description,
            percentage: template.percentage,
            amount: amount,
            status: 'pending' as const,
            completionRequirements: template.completionRequirements,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
        setPaymentSchedule(defaultSchedule);
      } else {
        // Use existing payment schedule if available
        setPaymentSchedule(bid.paymentSchedule);
      }
      setError(null);
    }
  }, [open, bid]);

  const handleAddStage = () => {
    setEditingStage(null);
    setStageFormOpen(true);
  };

  const handleEditStage = (stage: BidPaymentStage) => {
    setEditingStage(stage);
    setStageFormOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    setPaymentSchedule(prev => prev.filter(stage => stage.id !== stageId));
  };

  const handleCloseStageForm = () => {
    setStageFormOpen(false);
    setEditingStage(null);
  };

  const handleSaveStage = (stage: BidPaymentStage) => {
    if (editingStage) {
      // Update existing stage
      setPaymentSchedule(prev => prev.map(s => s.id === stage.id ? stage : s));
    } else {
      // Add new stage
      setPaymentSchedule(prev => [...prev, { ...stage, id: uuidv4(), createdAt: new Date(), updatedAt: new Date() }]);
    }
    setStageFormOpen(false);
    setEditingStage(null);
  };

  const handleTemplateChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const templateName = e.target.value as string;
    setSelectedTemplate(templateName);
    
    if (templateName) {
      const template = defaultPaymentTemplates.find(t => t.name === templateName);
      if (template) {
        const newSchedule = template.stages.map(template => {
          const amount = Math.round((template.percentage / 100) * bid.totalAmount * 100) / 100;
          return {
            id: uuidv4(),
            name: template.name,
            description: template.description,
            percentage: template.percentage,
            amount: amount,
            status: 'pending' as const,
            completionRequirements: template.completionRequirements,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
        setPaymentSchedule(newSchedule);
      }
    }
  };

  const handleSubmit = async () => {
    if (!isValid) {
      setError('Payment schedule must total 100% and match the bid amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(paymentSchedule);
      onClose();
    } catch (err) {
      logger.error('Error saving payment schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save payment schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Payment Terms for Accepted Bid
          <Typography variant="subtitle2" color="text.secondary">
            Set up a payment schedule for this contractor
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>
                  Bid Amount: {formatCurrency(bid.totalAmount)}
                </Typography>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200, ml: 'auto' }}>
                  <InputLabel>Payment Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateChange as any}
                    label="Payment Template"
                  >
                    <MenuItem value=""><em>Custom</em></MenuItem>
                    {defaultPaymentTemplates.map(template => (
                      <MenuItem key={template.name} value={template.name}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Name</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Completion Requirements</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentSchedule.map((stage) => (
                      <TableRow key={stage.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {stage.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stage.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{stage.percentage}%</TableCell>
                        <TableCell align="right">{formatCurrency(stage.amount)}</TableCell>
                        <TableCell>{stage.completionRequirements}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditStage(stage)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDeleteStage(stage.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paymentSchedule.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No payment stages added. Click "Add Payment Stage" to create your payment schedule.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>
                        <Typography variant="subtitle2">Total</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="subtitle2" 
                          color={totalPercentage === 100 ? 'success.main' : 'error.main'}
                        >
                          {totalPercentage}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="subtitle2"
                          color={Math.abs(totalAmount - bid.totalAmount) < 0.01 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddStage}
              >
                Add Payment Stage
              </Button>
            </Grid>
          </Grid>

          {/* Payment Stage Form Dialog */}
          <Dialog open={stageFormOpen} onClose={handleCloseStageForm} maxWidth="sm" fullWidth>
            <DialogTitle>{editingStage ? 'Edit Payment Stage' : 'Add Payment Stage'}</DialogTitle>
            <DialogContent>
              <PaymentStageForm
                initialData={editingStage}
                bidTotalAmount={bid.totalAmount}
                onSubmit={handleSaveStage}
                onCancel={handleCloseStageForm}
              />
            </DialogContent>
          </Dialog>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            disabled={loading || !isValid}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Payment Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

interface PaymentStageFormProps {
  initialData: BidPaymentStage | null;
  bidTotalAmount: number;
  onSubmit: (data: BidPaymentStage) => void;
  onCancel: () => void;
}

const PaymentStageForm: React.FC<PaymentStageFormProps> = ({ initialData, bidTotalAmount, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<BidPaymentStage>>({
    name: '',
    description: '',
    percentage: 0,
    amount: 0,
    status: 'pending',
    completionRequirements: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value) || 0;
    const amount = Math.round((percentage / 100) * bidTotalAmount * 100) / 100;
    
    setFormData(prev => ({
      ...prev,
      percentage,
      amount,
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    const percentage = bidTotalAmount > 0 ? Math.round((amount / bidTotalAmount) * 100 * 100) / 100 : 0;
    
    setFormData(prev => ({
      ...prev,
      amount,
      percentage,
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || 
        (formData.percentage === undefined || formData.percentage <= 0) || 
        (formData.amount === undefined || formData.amount <= 0)) {
      return;
    }

    onSubmit({
      id: initialData?.id || uuidv4(),
      name: formData.name || '',
      description: formData.description || '',
      percentage: formData.percentage || 0,
      amount: formData.amount || 0,
      status: 'pending',
      completionRequirements: formData.completionRequirements || '',
      createdAt: initialData?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <Box component="form" sx={{ pt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Payment Name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            required
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
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Percentage"
            name="percentage"
            type="number"
            value={formData.percentage || ''}
            onChange={handlePercentageChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{ min: 0, max: 100, step: "0.01" }}
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
            onChange={handleAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: "0.01" }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Completion Requirements"
            name="completionRequirements"
            value={formData.completionRequirements || ''}
            onChange={handleChange}
            placeholder="e.g., Upon contract signing, 50% completion, etc."
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          {initialData ? 'Save Changes' : 'Add Stage'}
        </Button>
      </Box>
    </Box>
  );
};

export default BidPaymentTermsModal; 