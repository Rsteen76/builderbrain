import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { findExpensesForBid } from '../../utils/bidOperations';
import { formatCurrency } from '../../utils/formatters';
import { Expense } from '../../types';

interface BidDeletionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bidId: string;
  bidTitle: string;
  userId: string;
}

const BidDeletionDialog: React.FC<BidDeletionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  bidId,
  bidTitle,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (open) {
      loadExpenses();
    }
  }, [open, bidId]);

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const associatedExpenses = await findExpensesForBid(bidId);
      setExpenses(associatedExpenses);
      // Pre-select all expenses by default
      setSelectedExpenses(associatedExpenses.map(expense => expense.id || '').filter(Boolean));
      setSelectAll(true);
      setLoading(false);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError('Failed to load associated expenses');
      setLoading(false);
    }
  };

  const handleToggleExpense = (expenseId: string) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map(exp => exp.id || '').filter(Boolean));
    }
    setSelectAll(!selectAll);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Bid</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete the bid "{bidTitle}"?
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Associated Expenses
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              }
              label="Select All Expenses"
            />

            <List>
              {expenses.map((expense) => (
                <ListItem key={expense.id || ''} dense>
                  <Checkbox
                    edge="start"
                    checked={selectedExpenses.includes(expense.id || '')}
                    onChange={() => handleToggleExpense(expense.id || '')}
                  />
                  <ListItemText
                    primary={expense.description}
                    secondary={formatCurrency(expense.amount)}
                  />
                </ListItem>
              ))}
            </List>

            {expenses.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No associated expenses found.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={loading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BidDeletionDialog; 