import React from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../../utils/formatters';
import { ProjectPhase } from '../../../types';
import { BidFormData, BidPaymentInstallmentFormData, BidPaymentTermsFormData } from '../../../types/form.types';
import { buildPaymentScheduleSummary, PaymentTemplate } from './paymentTermsHelpers';

interface PaymentTermsSectionProps {
  bidForm: BidFormData;
  formPaymentTerms: BidPaymentTermsFormData;
  paymentTemplate: string;
  currentProjectPhases: ProjectPhase[];
  handlePaymentTemplateChange: (e: SelectChangeEvent<string>) => void;
  updateDownPayment: (value: number, isFixedAmountInput: boolean) => void;
  addInstallment: () => void;
  updateInstallment: (id: string, field: keyof Omit<BidPaymentInstallmentFormData, 'id'>, value: any) => void;
  removeInstallment: (id: string) => void;
  getTotalScheduledAmount: () => number;
  getTotalScheduledPercent: (currentTotalBidAmount: number) => number;
  setPaymentTemplate: React.Dispatch<React.SetStateAction<PaymentTemplate>>;
}

const PaymentTermsSection: React.FC<PaymentTermsSectionProps> = ({
  bidForm,
  formPaymentTerms,
  paymentTemplate,
  currentProjectPhases,
  handlePaymentTemplateChange,
  updateDownPayment,
  addInstallment,
  updateInstallment,
  removeInstallment,
  getTotalScheduledAmount,
  getTotalScheduledPercent,
  setPaymentTemplate,
}) => (
  <Box className="form-section">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
        Payment Terms
      </Typography>
      <FormControl size="small" variant="outlined" sx={{ minWidth: 160 }}>
        <InputLabel id="payment-template-label">Template</InputLabel>
        <Select
          labelId="payment-template-label"
          value={paymentTemplate}
          label="Template"
          onChange={handlePaymentTemplateChange}
          sx={{ borderRadius: 1 }}
        >
          <MenuItem value="one-time">One-time Payment (100%)</MenuItem>
          <MenuItem value="standard">Standard (50/50)</MenuItem>
          <MenuItem value="trades">Trades (30/40/30)</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>
    </Box>

    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Initial Payment Type</InputLabel>
              <Select
                value={formPaymentTerms.isDownPaymentFixed ? 'amount' : 'percent'}
                label="Initial Payment Type"
                onChange={(e) => {
                  const isFixed = e.target.value === 'amount';
                  const currentValue = isFixed ? formPaymentTerms.downPaymentAmount : formPaymentTerms.downPaymentPercent;
                  updateDownPayment(currentValue, isFixed);
                  setPaymentTemplate('custom');
                }}
              >
                <MenuItem value="percent">Percentage (%)</MenuItem>
                <MenuItem value="amount">Fixed Amount ($)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            {formPaymentTerms.isDownPaymentFixed ? (
              <TextField
                fullWidth
                label="Initial Payment"
                type="number"
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { borderRadius: 1 } }}
                value={formPaymentTerms.downPaymentAmount || 0}
                onChange={(e) => {
                  updateDownPayment(Number(e.target.value), true);
                  setPaymentTemplate('custom');
                }}
                variant="outlined"
              />
            ) : (
              <TextField
                fullWidth
                label="Initial Payment"
                type="number"
                size="small"
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment>, sx: { borderRadius: 1 } }}
                value={formPaymentTerms.downPaymentPercent}
                onChange={(e) => {
                  updateDownPayment(Number(e.target.value), false);
                  setPaymentTemplate('custom');
                }}
                variant="outlined"
              />
            )}
          </Grid>
        </Grid>
        <FormHelperText sx={{ textAlign: 'right', mt: 0.5 }}>
          {formPaymentTerms.isDownPaymentFixed ?
            `Equivalent: ${(bidForm.totalAmount > 0 ? (formPaymentTerms.downPaymentAmount || 0) / bidForm.totalAmount * 100 : 0).toFixed(1)}%` :
            `Amount: ${formatCurrency(bidForm.totalAmount * formPaymentTerms.downPaymentPercent / 100)}`}
        </FormHelperText>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={addInstallment}
          sx={{ borderRadius: 1 }}
        >
          Add Installment
        </Button>
      </Grid>
    </Grid>

    {formPaymentTerms.installments.map((installment, index) => (
      <Paper
        key={installment.id}
        elevation={0}
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 1.5,
          borderRadius: 1,
          borderColor: 'divider',
          position: 'relative'
        }}
      >
        <IconButton
          size="small"
          onClick={() => removeInstallment(installment.id)}
          color="inherit"
          sx={{ position: 'absolute', top: 6, right: 6, opacity: 0.5 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
          Installment {index + 1}: {installment.name}
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              required
              label="Name"
              size="small"
              value={installment.name}
              onChange={(e) => updateInstallment(installment.id, 'name', e.target.value)}
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Input Type</InputLabel>
              <Select
                value={installment.isFixedAmount ? 'amount' : 'percent'}
                label="Input Type"
                onChange={(e) => updateInstallment(installment.id, 'isFixedAmount', e.target.value === 'amount')}
              >
                <MenuItem value="percent">Percentage (%)</MenuItem>
                <MenuItem value="amount">Fixed Amount ($)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            {installment.isFixedAmount ? (
              <TextField
                fullWidth
                required
                label="Amount"
                type="number"
                size="small"
                value={installment.fixedAmount || 0}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { borderRadius: 1 }
                }}
                onChange={(e) => updateInstallment(installment.id, 'fixedAmount', Number(e.target.value))}
                variant="outlined"
              />
            ) : (
              <TextField
                fullWidth
                required
                label="Percent"
                type="number"
                size="small"
                value={installment.percent}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  sx: { borderRadius: 1 }
                }}
                onChange={(e) => updateInstallment(installment.id, 'percent', Number(e.target.value))}
                variant="outlined"
              />
            )}
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              disabled
              label={installment.isFixedAmount ? 'Equivalent %' : 'Equivalent $'}
              size="small"
              value={installment.isFixedAmount ?
                `${(bidForm.totalAmount > 0 ? (installment.fixedAmount || 0) / bidForm.totalAmount * 100 : 0).toFixed(1)}%` :
                formatCurrency(bidForm.totalAmount * (installment.percent || 0) / 100)}
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Related Phase</InputLabel>
              <Select
                value={installment.phaseId || ''}
                label="Related Phase"
                onChange={(e) => updateInstallment(installment.id, 'phaseId', e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {currentProjectPhases && currentProjectPhases.length > 0 ? (
                  currentProjectPhases.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.id === bidForm.phaseId ? ' (Default)' : ''}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="caption" color="textSecondary">
                      No phases available for this project
                    </Typography>
                  </MenuItem>
                )}
              </Select>
              {installment.phaseId && installment.phaseId === bidForm.phaseId && (
                <FormHelperText>Using default bid phase</FormHelperText>
              )}
              {installment.phaseId && installment.phaseId !== bidForm.phaseId && (
                <FormHelperText>Custom phase selection</FormHelperText>
              )}
              {(!currentProjectPhases || currentProjectPhases.length === 0) && (
                <FormHelperText>
                  This project has no phases defined
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              label="Milestone Description"
              placeholder="Payment trigger..."
              size="small"
              value={installment.milestoneDescription}
              onChange={(e) => updateInstallment(installment.id, 'milestoneDescription', e.target.value)}
              variant="outlined"
              InputProps={{ sx: { borderRadius: 1 } }}
            />
          </Grid>
        </Grid>
      </Paper>
    ))}

    <PaymentScheduleSummaryAlert
      bidForm={bidForm}
      formPaymentTerms={formPaymentTerms}
      totalScheduledPercent={getTotalScheduledPercent(bidForm.totalAmount)}
      totalScheduledAmount={getTotalScheduledAmount()}
    />
  </Box>
);

interface PaymentScheduleSummaryAlertProps {
  bidForm: BidFormData;
  formPaymentTerms: BidPaymentTermsFormData;
  totalScheduledPercent: number;
  totalScheduledAmount: number;
}

const PaymentScheduleSummaryAlert: React.FC<PaymentScheduleSummaryAlertProps> = ({
  bidForm,
  formPaymentTerms,
  totalScheduledPercent,
  totalScheduledAmount,
}) => {
  const summary = buildPaymentScheduleSummary(
    formPaymentTerms,
    bidForm.totalAmount,
    totalScheduledPercent,
    totalScheduledAmount,
  );

  if (!summary.exactlyOneHundred || !summary.matchesTotalBid) {
    return (
      <Alert severity="warning" variant="outlined" sx={{ mt: 1, mb: 3, borderRadius: 1, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>Payment Schedule Incomplete</Typography>
          <Typography variant="body2" color="text.secondary">
            {!summary.exactlyOneHundred
              ? `Total: ${totalScheduledPercent.toFixed(1)}% (needs to be 100%)`
              : `Total: ${formatCurrency(totalScheduledAmount)} (should be ${formatCurrency(bidForm.totalAmount)})`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Initial Payment</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(summary.downPaymentAmount)} ({summary.downPaymentPercent.toFixed(1)}%)
            </Typography>
          </Box>
          {summary.intermediateInstallments.length > 0 && (
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">Intermediate</Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatCurrency(summary.intermediateAmount)} ({summary.intermediatePercent.toFixed(1)}%)
              </Typography>
            </Box>
          )}
          {summary.hasFinalPayment && (
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                Final Payment
                {!summary.exactlyOneHundred && (
                  <Tooltip title="Needs adjustment">
                    <InfoIcon fontSize="small" color="warning" sx={{ ml: 0.5, opacity: 0.7, width: 16, height: 16 }} />
                  </Tooltip>
                )}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatCurrency(summary.finalPaymentAmount)} ({summary.finalPaymentPercent.toFixed(1)}%)
              </Typography>
              {!summary.exactlyOneHundred && Math.abs(summary.finalPaymentPercent - summary.remainingPercent) > 0.01 && (
                <Typography variant="caption" color="warning.main">
                  Should be: {formatCurrency(summary.suggestedFinalAmount)} ({summary.remainingPercent.toFixed(1)}%)
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {!summary.exactlyOneHundred
            ? `To complete, the final payment should be ${formatCurrency(summary.suggestedFinalAmount)} (${summary.remainingPercent.toFixed(1)}%).`
            : 'Adjust payment amounts to match total bid.'}
        </Typography>
      </Alert>
    );
  }

  return (
    <Alert severity="success" variant="outlined" sx={{ mt: 1, mb: 3, borderRadius: 1, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>Payment Schedule Complete</Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {formatCurrency(totalScheduledAmount)} (100%)
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ minWidth: 120 }}>
          <Typography variant="caption" color="text.secondary">Initial Payment</Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(summary.downPaymentAmount)} ({summary.downPaymentPercent.toFixed(1)}%)
          </Typography>
        </Box>
        {summary.intermediateInstallments.length > 0 && (
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Intermediate</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(summary.intermediateAmount)} ({summary.intermediatePercent.toFixed(1)}%)
            </Typography>
          </Box>
        )}
        {summary.hasFinalPayment && (
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary">Final Payment</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(summary.finalPaymentAmount)} ({summary.finalPaymentPercent.toFixed(1)}%)
            </Typography>
          </Box>
        )}
      </Box>
    </Alert>
  );
};

export default PaymentTermsSection;
