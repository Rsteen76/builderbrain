import React from 'react';
import { alpha, Box, Chip, Grid, Paper, Typography, useTheme } from '@mui/material';
import type { Expense } from '../../../types';

interface ExpensePaymentHistorySectionProps {
  formData: Partial<Expense>;
}

const ExpensePaymentHistorySection: React.FC<ExpensePaymentHistorySectionProps> = ({ formData }) => {
  const theme = useTheme();
  const amount = formData.amount ?? 0;
  const amountPaid = formData.amountPaid ?? 0;
  const remainingAmount = amount - amountPaid;

  return (
    <Box sx={{ display: 'block', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment History
      </Typography>

      {amountPaid > 0 ? (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Amount Paid:</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                    ${amountPaid.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Original Amount:</Typography>
                  <Typography variant="body2">
                    ${amount.toFixed(2)}
                  </Typography>
                </Box>

                {amount > amountPaid && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Remaining:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                      ${remainingAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={formData.status === 'paid' ? 'Paid' : formData.status === 'partially_paid' ? 'Partially Paid' : formData.status}
                    color={formData.status === 'paid' ? 'success' : formData.status === 'partially_paid' ? 'info' : 'default'}
                    size="small"
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>Payment Details:</Typography>

                {formData.paymentDetails ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Method:</Typography>
                      <Typography variant="body2">
                        {formData.paymentDetails.method?.charAt(0).toUpperCase() + formData.paymentDetails.method?.slice(1) || 'Not specified'}
                      </Typography>
                    </Box>

                    {formData.paymentDetails.date && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Date:</Typography>
                        <Typography variant="body2">
                          {new Date(formData.paymentDetails.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}

                    {formData.paymentDetails.referenceNumber && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Reference:</Typography>
                        <Typography variant="body2">
                          {formData.paymentDetails.referenceNumber}
                        </Typography>
                      </Box>
                    )}

                    {formData.paymentDetails.notes && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">Notes:</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {formData.paymentDetails.notes}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No detailed payment information available
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Note: To record additional payments, use the "Mark as Paid" action from the expense list. This payment information is read-only in the edit form.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary">
          No payments have been recorded for this expense yet.
        </Typography>
      )}
    </Box>
  );
};

export default ExpensePaymentHistorySection;
