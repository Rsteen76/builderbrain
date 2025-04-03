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

interface ProjectExpensesTabProps {
  expenses: Expense[];
  expensesData: { name: string; value: number; color: string }[];
  phases: ProjectPhase[];
  theme: Theme;
  handleOpenQuickExpenseDialog: (phaseId?: string) => void;
  formatCurrency: (value: number) => string;
}

const ProjectExpensesTab: React.FC<ProjectExpensesTabProps> = ({
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
      
      {/* Expense List */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          All Expenses
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {expenses.length > 0 ? (
          <Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ minWidth: 750 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '100px 1fr 200px 150px 150px',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  py: 1,
                  fontWeight: 600
                }}>
                  <Typography variant="body2">Category</Typography>
                  <Typography variant="body2">Description</Typography>
                  <Typography variant="body2">Phase</Typography>
                  <Typography variant="body2">Date</Typography>
                  <Typography variant="body2" align="right">Amount</Typography>
                </Box>
                
                {expenses.map((expense) => {
                  const phaseName = expense.phaseName || 
                                   phases.find(p => p.id === expense.phaseId)?.name || 
                                   expense.buildingPhase || 
                                   'Unknown Phase';
                  
                  return (
                    <Box 
                      key={expense.id} 
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '100px 1fr 200px 150px 150px',
                        py: 1.5,
                        alignItems: 'center',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.03)
                        }
                      }}
                    >
                      <Box>
                        <Chip 
                          label={expense.category} 
                          size="small" 
                          sx={{
                            fontWeight: 500,
                            borderRadius: 1,
                            bgcolor: expense.category === 'materials' ? alpha(theme.palette.primary.main, 0.1) :
                                     expense.category === 'labor' ? alpha(theme.palette.warning.main, 0.1) :
                                     expense.category === 'permits' ? alpha(theme.palette.info.main, 0.1) :
                                     expense.category === 'equipment' ? alpha(theme.palette.secondary.main, 0.1) :
                                     alpha(theme.palette.grey[500], 0.1),
                            color: expense.category === 'materials' ? theme.palette.primary.main :
                                   expense.category === 'labor' ? theme.palette.warning.main :
                                   expense.category === 'permits' ? theme.palette.info.main :
                                   expense.category === 'equipment' ? theme.palette.secondary.main :
                                   theme.palette.grey[700]
                          }}
                        />
                      </Box>
                      <Typography variant="body2">{expense.description || '-'}</Typography>
                      <Typography variant="body2">{phaseName}</Typography>
                      <Typography variant="body2">
                        {expense.date instanceof Date 
                          ? expense.date.toLocaleDateString() 
                          : new Date(expense.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} align="right">
                        {formatCurrency(expense.amount)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} total
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                Total: {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            py: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="body1" color="text.secondary" align="center">
              No expenses have been added yet
            </Typography>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenQuickExpenseDialog('')}
              sx={{ mt: 2, borderRadius: 1.5 }}
            >
              Add First Expense
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ProjectExpensesTab; 