import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
  Chip,
  alpha,
  Theme,
} from '@mui/material';
import {
  Add as AddIcon,
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
import { Expense, ProjectPhase } from '../../../types';
import ExpensesList from '../../expenses/Expenses';

interface ProjectExpensesTabProps {
  projectId: string;
  expenses: Expense[];
  expensesData: { name: string; value: number; color: string }[];
  phases: ProjectPhase[];
  theme: Theme;
  handleOpenQuickExpenseDialog: (phaseId?: string) => void;
  formatCurrency: (value: number) => string;
}

const ProjectExpensesTab: React.FC<ProjectExpensesTabProps> = ({
  projectId,
  expenses,
  expensesData,
  phases,
  theme,
  handleOpenQuickExpenseDialog,
  formatCurrency,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Project Expenses</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => handleOpenQuickExpenseDialog('')}
          sx={{ borderRadius: 1.5 }}
        >
          Add Expense
        </Button>
      </Box>
      
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
              {expensesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8" // Default fill, overridden by Cell
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
              ) : (
                <Box sx={{ 
                  height: '100%', 
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
            
            {phases.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={phases.map(p => ({
                      name: p.name,
                      budget: p.budget,
                      actual: p.actualCost,
                      variance: p.budget - p.actualCost
                    }))}
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
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center'
              }}>
                <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} /> 
                <Typography variant="body1" color="text.secondary" align="center">
                  No phase budget data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Display project-specific expenses using the enhanced Expenses component */}
      <ExpensesList projectId={projectId} />
    </Box>
  );
};

export default ProjectExpensesTab; 