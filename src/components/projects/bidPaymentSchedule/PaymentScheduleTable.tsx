import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { BidPaymentStage } from '../../../types';
import { formatCurrency, formatStatusLabel, getStatusColor } from './paymentScheduleUtils';

interface PaymentScheduleTableProps {
  paymentSchedule: BidPaymentStage[];
  loading: boolean;
  onEditStage: (stage: BidPaymentStage) => void;
  onCreateExpense: (stage: BidPaymentStage) => void;
  onDeleteStage: (stageId: string) => void;
}

const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = ({
  paymentSchedule,
  loading,
  onEditStage,
  onCreateExpense,
  onDeleteStage,
}) => {
  return (
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
                    label={formatStatusLabel(stage.status)}
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
                        onClick={() => onEditStage(stage)}
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
                          onClick={() => onCreateExpense(stage)}
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
                        onClick={() => onDeleteStage(stage.id)}
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
                          onClick={() => onEditStage({ ...stage, status: 'paid' })}
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
  );
};

export default PaymentScheduleTable;
