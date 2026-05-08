import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Paid as PaidIcon,
} from '@mui/icons-material';
import { Expense } from '../../../types';

interface ExpenseActionMenuProps {
  anchorEl: HTMLElement | null;
  selectedExpense: Expense | null;
  onClose: () => void;
  onEdit: () => void;
  onPay: () => void;
  onDelete: () => void;
}

export function ExpenseActionMenu({
  anchorEl,
  selectedExpense,
  onClose,
  onEdit,
  onPay,
  onDelete,
}: ExpenseActionMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <MenuItem onClick={onEdit}>
        <EditIcon fontSize="small" sx={{ mr: 1 }} />
        Edit Expense
      </MenuItem>

      {selectedExpense && selectedExpense.status !== 'paid' && (
        <MenuItem onClick={onPay}>
          <PaidIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as Paid
        </MenuItem>
      )}

      <MenuItem onClick={onDelete} sx={{ color: 'error.main' }}>
        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
        Delete
      </MenuItem>
    </Menu>
  );
}
