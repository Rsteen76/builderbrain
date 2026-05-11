import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  WarningAmberRounded as WarningAmberRoundedIcon,
} from '@mui/icons-material';
import type { Expense } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface ExpenseDuplicateWarningDialogProps {
  open: boolean;
  duplicateExpenses: Expense[];
  onClose: () => void;
  onSaveAnyway: () => void;
}

const ExpenseDuplicateWarningDialog: React.FC<ExpenseDuplicateWarningDialogProps> = ({
  open,
  duplicateExpenses,
  onClose,
  onSaveAnyway,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="duplicate-warning-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="duplicate-warning-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberRoundedIcon sx={{ color: '#f59e0b' }} />
          <Typography variant="h6">Potential Duplicate Expense</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          We found {duplicateExpenses.length} similar expense{duplicateExpenses.length > 1 ? 's' : ''} that might be duplicates:
        </DialogContentText>

        <List sx={{
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
        }}>
          {duplicateExpenses.map((expense) => (
            <ListItem key={expense.id} divider>
              <ListItemText
                primary={
                  <Typography variant="subtitle2">{expense.description}</Typography>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" component="span">
                      {new Date(expense.date).toLocaleDateString()} • {formatCurrency(expense.amount)}
                    </Typography>
                    {expense.vendor && (
                      <Typography variant="body2" color="text.secondary" component="span">
                        {' • '}{expense.vendor}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <DialogContentText>
          Do you still want to save this expense? If this is not a duplicate, please continue.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
        >
          Go Back and Edit
        </Button>
        <Button
          onClick={onSaveAnyway}
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon fontSize="small" />}
        >
          Save Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDuplicateWarningDialog;
