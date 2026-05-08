import React from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Expense } from '../../../types';
import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';
import type { FormErrors } from './types';

interface ExpenseLineItemsSectionProps {
  amount?: number;
  amountPaid?: number;
  status?: Expense['status'];
  showLineItems: boolean;
  amountError?: string;
  lineItemErrors?: FormErrors['lineItems'];
  lineItems: ExpenseLineItemFormData[];
  totalLineItemsAmount: number;
  onToggleLineItems: () => void;
  onAmountChange: (amount: number) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (id: string) => void;
  onLineItemChange: (
    id: string,
    field: keyof Omit<ExpenseLineItemFormData, 'id' | 'totalPrice'>,
    value: string | number
  ) => void;
}

const ExpenseLineItemsSection: React.FC<ExpenseLineItemsSectionProps> = ({
  amount,
  amountPaid = 0,
  status,
  showLineItems,
  amountError,
  lineItemErrors,
  lineItems,
  totalLineItemsAmount,
  onToggleLineItems,
  onAmountChange,
  onAddLineItem,
  onRemoveLineItem,
  onLineItemChange,
}) => {
  const hasPayments = amountPaid > 0;
  const remainingAmount = (amount ?? 0) - amountPaid;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
          Amount Details
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={showLineItems}
              onChange={onToggleLineItems}
              color="primary"
              size="small"
            />
          }
          label={<Typography variant="caption">{showLineItems ? 'Itemized' : 'Simple'}</Typography>}
          sx={{ m: 0 }}
        />
      </Box>

      {hasPayments && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Original Amount:</Typography>
            <Typography variant="body2" fontWeight="bold">${(amount ?? 0).toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">${amountPaid.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight="bold">Remaining:</Typography>
            <Typography variant="body2" fontWeight="bold" color="warning.main">
              ${remainingAmount.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      )}

      {!showLineItems ? (
        <Box>
          <TextField
            fullWidth
            id="amount"
            name="amount"
            label={hasPayments ? 'Original Total Amount' : 'Amount'}
            type="number"
            value={amount || ''}
            onChange={(e) => onAmountChange(parseFloat(e.target.value))}
            error={!!amountError}
            helperText={hasPayments ? 'Original amount cannot be changed after payments are recorded' : amountError || null}
            size="small"
            disabled={hasPayments}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MoneyIcon fontSize="small" color="primary" />
                </InputAdornment>
              ),
              readOnly: hasPayments,
            }}
          />

          {hasPayments && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon
                  fontSize="small"
                  color={status === 'paid' ? 'success' : 'info'}
                  sx={{ mr: 0.5 }}
                />
                <Typography variant="body2" color={status === 'paid' ? 'success.main' : 'info.main'}>
                  {status === 'paid' ? 'Fully Paid' : 'Partially Paid'}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAddLineItem}
              size="small"
              sx={{
                textTransform: 'none',
              }}
            >
              Add Item
            </Button>

            <Typography variant="subtitle2" fontWeight={600} color="success.main">
              Total: ${totalLineItemsAmount.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
            {lineItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No line items yet. Add some!
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Cost</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell padding="checkbox"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <TextField
                            fullWidth
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => onLineItemChange(item.id, 'description', e.target.value)}
                            error={!!lineItemErrors?.[item.id]?.description}
                            helperText={lineItemErrors?.[item.id]?.description}
                            variant="standard"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => onLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            error={!!lineItemErrors?.[item.id]?.quantity}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                            variant="standard"
                            size="small"
                            sx={{ width: 70 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => onLineItemChange(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                            error={!!lineItemErrors?.[item.id]?.unitCost}
                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                            variant="standard"
                            size="small"
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          ${item.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell padding="checkbox">
                          <IconButton
                            size="small"
                            onClick={() => onRemoveLineItem(item.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ExpenseLineItemsSection;
