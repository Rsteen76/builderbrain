import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Expense, ProjectPhase } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RecentExpensesProps {
  expenses: Expense[];
  phases: ProjectPhase[];
}

const RecentExpenses: React.FC<RecentExpensesProps> = ({
  expenses,
  phases
}) => {
  // Get only the most recent 6 expenses
  const recentExpenses = expenses.slice(-6).reverse();

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          backgroundColor: 'success.main',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600} color="success.main">Recent Expenses</Typography>
        <Chip 
          label={`${expenses.length} Total`} 
          color="success" 
          size="small" 
          sx={{ fontWeight: 600 }} 
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          {recentExpenses.map((expense) => {
            const phaseName = expense.phaseName || 
                             phases.find(p => p.id === expense.phaseId)?.name || 
                             'Unknown Phase';
                             
            return (
              <Grid item xs={12} sm={6} md={6} lg={4} key={expense.id}>
                <Card elevation={2} sx={{ p: 0, borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between'}}>
                      <Chip label={expense.category} size="small" />
                      <Typography variant="h6" fontWeight={700}>{formatCurrency(expense.amount)}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ my: 1 }}>
                      {expense.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">Phase: {phaseName}</Typography>
                      <Typography variant="caption">Date: {formatDate(expense.date)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );
};

export default RecentExpenses; 
