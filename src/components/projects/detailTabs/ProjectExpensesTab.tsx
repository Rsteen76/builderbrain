import React, { Suspense, lazy, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  alpha,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AttachMoney as ExpensesIcon,
  Numbers as BudgetIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { formatCurrency } from '../../../utils/formatters';
import { calculateExpensesChartData, ExpenseChartData } from '../../../utils/expenseAnalytics';

const ExpensesList = lazy(() => import('../../expenses/Expenses'));

const ProjectExpensesTab: React.FC = () => {
  const theme = useTheme();
  const {
    projectId,
    expenses,
    phases,
    loading,
    error,
    openNewExpenseDialog,
  } = useProjectDetail();

  const expensesChartData: ExpenseChartData[] = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    return calculateExpensesChartData(expenses);
  }, [expenses]);

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />;
  }
  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>Error loading expense data: {error}</Alert>;
  }
  if (!projectId) {
    return <Alert severity="warning" sx={{ mt: 2 }}>Project context not available.</Alert>;
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Expense Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Expense Categories
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ height: 300 }}>
              {expensesChartData && expensesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={(entry: any) => {
                        const total = expensesChartData.reduce((acc: number, curr: ExpenseChartData) => acc + curr.value, 0);
                        return total > 0 ? `${entry.name}: ${((entry.value / total) * 100).toFixed(0)}%` : entry.name;
                      }}
                    >
                      {expensesChartData.map((entry: ExpenseChartData, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" align="center">
                    No expense data available for chart
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Phase Budget vs Actual
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {phases && phases.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={phases.map(p => ({
                      name: p.name,
                      budget: p.budget || 0,
                      actual: p.actualCost || 0,
                      variance: (p.budget || 0) - (p.actualCost || 0)
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar 
                      dataKey="budget" 
                      name="Budget" 
                      stackId="a" 
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="actual" 
                      name="Actual" 
                      stackId="b" 
                      fill={theme.palette.success.main}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} /> 
                <Typography variant="body1" color="text.secondary" align="center">
                  No phase budget data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Suspense fallback={<CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />}>
        <ExpensesList projectId={projectId} />
      </Suspense>
    </Box>
  );
};

export default ProjectExpensesTab;
