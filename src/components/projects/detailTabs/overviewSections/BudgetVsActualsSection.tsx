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
  Numbers as BudgetIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../../../utils/formatters';

interface BudgetVsActualsSectionProps {
  combinedExpenses: { name: string; budget: number; actual: number }[];
  theme: Theme;
}

const BudgetVsActualsSection: React.FC<BudgetVsActualsSectionProps> = ({
  combinedExpenses,
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
        <BudgetIcon sx={{ mr: 1 }} /> Budget vs Actuals
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {combinedExpenses.length > 0 ? (
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={combinedExpenses}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
              <Legend />
              <Bar 
                dataKey="budget" 
                name="Budget" 
                fill={theme.palette.primary.main}
                opacity={0.8}
                barSize={20} 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="actual" 
                name="Actual" 
                fill={theme.palette.success.main}
                opacity={0.8} 
                barSize={20}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
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
          <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="body1" color="text.secondary" align="center">
            No budget data available
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default BudgetVsActualsSection; 