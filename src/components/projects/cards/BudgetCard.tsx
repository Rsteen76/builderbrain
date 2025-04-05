import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  alpha,
  Theme,
} from '@mui/material';

interface BudgetCardProps {
  budgetData: {
    totalBudget: number;
    totalActual: number;
    difference: number;
    percentUsed: number;
  };
  expenseBreakdown: {
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
  };
  theme: Theme;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  budgetData,
  expenseBreakdown,
  theme,
  formatCurrency,
  formatPercentage,
}) => {
  return (
    <Card elevation={0} sx={{ 
      borderRadius: 2, 
      height: '100%',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Budget
        </Typography>
        <Typography variant="h6" component="div" fontWeight="bold">
          {formatCurrency(budgetData.totalBudget)}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Spent
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(budgetData.totalActual)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" align="right" display="block">
              Remaining
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600} 
              color={budgetData.difference < 0 ? 'error' : 'success.main'}
            >
              {formatCurrency(budgetData.difference)}
            </Typography>
          </Box>
        </Box>
        
        {/* Expense Breakdown */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={7}>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" align="right" display="block" color="warning.main" fontWeight={500}>
                {formatCurrency(expenseBreakdown.pending)}
              </Typography>
            </Grid>
            
            <Grid item xs={7}>
              <Typography variant="caption" color="text.secondary">
                Approved
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" align="right" display="block" color="info.main" fontWeight={500}>
                {formatCurrency(expenseBreakdown.approved)}
              </Typography>
            </Grid>
            
            <Grid item xs={7}>
              <Typography variant="caption" color="text.secondary">
                Paid
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Typography variant="caption" align="right" display="block" color="success.main" fontWeight={500}>
                {formatCurrency(expenseBreakdown.paid)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(budgetData.percentUsed, 100)}
            color={budgetData.percentUsed > 100 ? 'error' : 'success'}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: alpha(
                budgetData.percentUsed > 100 ? theme.palette.error.main : theme.palette.success.main, 
                0.1
              ),
              mb: 0.5
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatPercentage(budgetData.percentUsed / 100)} of budget used
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BudgetCard; 