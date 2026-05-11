import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface ExpensePageHeaderProps {
  onAddExpense: () => void;
}

export function ExpensePageHeader({ onAddExpense }: ExpensePageHeaderProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="h4" component="h1" fontWeight="bold">
        Expenses & Payments
      </Typography>

      <Button
        variant="contained"
        size="medium"
        startIcon={<AddIcon />}
        onClick={onAddExpense}
        sx={{
          backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
          }
        }}
      >
        Add Expense
      </Button>
    </Box>
  );
}
