import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Paid as PaidIcon,
} from '@mui/icons-material';
import { Expense } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getExpenseCategoryIcon } from './ExpenseCategoryIcon';
import {
  ExpenseGroupBy,
  ExpenseSortDirection,
  ExpenseSortField,
  formatExpenseCategory,
  getExpenseStatusPresentation,
  getRemainingExpenseAmount,
} from './expenseListUtils';

interface ExpenseRowProps {
  expense: Expense;
  groupBy: ExpenseGroupBy;
  sortField: ExpenseSortField | null;
  sortDirection: ExpenseSortDirection;
  onView: (expense: Expense) => void;
  onSort: (field: ExpenseSortField) => void;
  onEdit: (expense: Expense) => void;
  onPay: (expense: Expense) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, expenseId: string) => void;
}

export function ExpenseRow({
  expense,
  groupBy,
  sortField,
  sortDirection,
  onView,
  onSort,
  onEdit,
  onPay,
  onMenuOpen,
}: ExpenseRowProps) {
  const theme = useTheme();
  const amountPaid = expense.amountPaid || 0;
  const remainingAmount = getRemainingExpenseAmount(expense);
  const status = getExpenseStatusPresentation(expense.status);

  return (
    <TableRow
      key={expense.id}
      hover
      onClick={() => onView(expense)}
      sx={{
        cursor: 'pointer',
        '&:last-child td, &:last-child th': { border: 0 },
        ...(expense.status === 'paid' && {
          bgcolor: alpha(theme.palette.success.light, 0.08),
        }),
        ...(expense.status === 'partially_paid' && {
          bgcolor: alpha(theme.palette.info.light, 0.08),
        }),
      }}
    >
      <TableCell component="th" scope="row">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getExpenseCategoryIcon(expense.category)}
          <Typography sx={{ ml: 1.5, fontWeight: 'medium' }}>
            {expense.description}
          </Typography>

          {expense.tags && expense.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {expense.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
        {expense.lineItems && expense.lineItems.length > 0 && (
          <Chip
            size="small"
            label={`${expense.lineItems.length} item${expense.lineItems.length > 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        )}
      </TableCell>

      <TableCell
        align="right"
        onClick={(event) => {
          event.stopPropagation();
          onSort('amount');
        }}
        sx={{
          cursor: 'pointer',
          '&:hover': { color: theme.palette.primary.main },
        }}
      >
        <Tooltip title={`Total: ${formatCurrency(expense.amount)}`}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight="medium">
              {formatCurrency(remainingAmount)}
            </Typography>
            {expense.status === 'partially_paid' && (
              <Typography variant="caption" color="text.secondary">
                Paid: {formatCurrency(amountPaid)}
              </Typography>
            )}
            {sortField === 'amount' && (
              <span style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
              </span>
            )}
          </Box>
        </Tooltip>
      </TableCell>

      <TableCell
        onClick={(event) => {
          event.stopPropagation();
          onSort('date');
        }}
        sx={{
          cursor: 'pointer',
          '&:hover': { color: theme.palette.primary.main },
        }}
      >
        {formatDate(expense.date)}
        {sortField === 'date' && (
          <Tooltip title={`Sort by date (${sortDirection === 'asc' ? 'oldest first' : 'newest first'})`}>
            <span style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
              {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
            </span>
          </Tooltip>
        )}
      </TableCell>

      <TableCell>
        <Chip label={status.label} size="small" color={status.color} />
      </TableCell>

      {groupBy !== 'project' && <TableCell>{expense.projectName}</TableCell>}
      {groupBy !== 'category' && <TableCell>{formatExpenseCategory(expense.category)}</TableCell>}
      {groupBy !== 'vendor' && <TableCell>{expense.vendor || '-'}</TableCell>}
      {groupBy !== 'subcontractor' && <TableCell>{expense.subcontractorName || '-'}</TableCell>}

      <TableCell align="center">
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(expense);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          {expense.status !== 'paid' && (
            <IconButton
              size="small"
              color="success"
              onClick={(event) => {
                event.stopPropagation();
                onPay(expense);
              }}
            >
              <PaidIcon fontSize="small" />
            </IconButton>
          )}

          <IconButton
            size="small"
            color="default"
            onClick={(event) => {
              event.stopPropagation();
              onMenuOpen(event, expense.id || '');
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
}
