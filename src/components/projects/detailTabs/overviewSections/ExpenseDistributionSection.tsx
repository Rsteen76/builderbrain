import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Box,
  alpha,
  Theme,
} from '@mui/material';
import {
  AttachMoney as ExpensesIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../../../utils/formatters';

interface ExpenseDistributionSectionProps {
  expensesData: { name: string; value: number; color: string }[];
  theme: Theme;
}

const ExpenseDistributionSection: React.FC<ExpenseDistributionSectionProps> = ({
  expensesData,
  theme,
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ExpensesIcon sx={{ mr: 1 }} /> Expense Distribution
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {expensesData.length > 0 ? (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expensesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                dataKey="value"
                nameKey="name"
                label={(entry: any) => `${entry.name}: ${((entry.value / expensesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
              >
                {expensesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box sx={{ 
          height: 300, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
          <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="body1" color="text.secondary" align="center">
            No expense data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ExpenseDistributionSection; 