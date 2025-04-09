import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  useTheme,
  alpha,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  ReceiptLong as ReceiptIcon,
  Handshake as HandshakeIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  InfoOutlined as InfoIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  AccountBalance as AccountBalanceIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { formatCurrency, formatPercentage, formatDate } from '../../../utils/formatters';
import { Project, ProjectPhase, Bid, Expense } from '../../../types';

const BudgetDashboard: React.FC = () => {
  const theme = useTheme();
  const { project, phases, bids, expenses, loading, error } = useProjectDetail();
  const [expenseGroupBy, setExpenseGroupBy] = useState<'category'|'contractor'>('category');

  // Calculate budget summary data
  const budgetSummary = useMemo(() => {
    if (!project || !phases || !expenses) {
      return {
        totalBudget: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalCommitted: 0,
        totalProjected: 0,
        remaining: 0,
        variance: 0,
        percentSpent: 0
      };
    }

    // Sum up phase budgets to get total allocated budget
    const totalAllocated = phases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
    
    // Sum up all expenses
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Sum up accepted bids
    const totalCommitted = bids
      .filter(bid => bid.status === 'accepted')
      .reduce((sum, bid) => sum + bid.totalAmount, 0);
    
    // Projected total combines spent and committed amounts
    const totalProjected = totalSpent + (totalCommitted - totalSpent > 0 ? totalCommitted - totalSpent : 0);
    
    // Get total budget value
    const totalBudget = typeof project.budget === 'number' 
      ? project.budget 
      : project.budget?.total || 0;
    
    return {
      totalBudget,
      totalAllocated,
      totalSpent,
      totalCommitted,
      totalProjected,
      remaining: totalBudget - totalSpent,
      variance: totalBudget - totalProjected,
      percentSpent: (totalSpent / totalBudget) * 100
    };
  }, [project, phases, expenses, bids]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    if (!expenses) return [];
    
    const categories: Record<string, number> = {};
    
    expenses.forEach(expense => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0;
      }
      categories[expense.category] += expense.amount;
    });
    
    // Convert to array for chart
    return Object.entries(categories).map(([category, amount], index) => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
        theme.palette.grey[700],
      ];
      
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
        value: amount,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.value - a.value);
  }, [expenses, theme]);

  // NEW: Group expenses by contractor
  const expensesByContractor = useMemo(() => {
    if (!expenses) return [];
    
    const contractors: Record<string, number> = {};
    
    expenses.forEach(expense => {
      // Use either subcontractorName, vendor, or "Direct Expense" as fallback
      const contractorName = expense.subcontractorName || expense.vendor || "Direct Expense";
      
      if (!contractors[contractorName]) {
        contractors[contractorName] = 0;
      }
      contractors[contractorName] += expense.amount;
    });
    
    // Convert to array for chart
    return Object.entries(contractors).map(([contractor, amount], index) => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
        theme.palette.grey[700],
      ];
      
      return {
        name: contractor,
        value: amount,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.value - a.value);
  }, [expenses, theme]);

  // Get the current expense grouping data based on selected view
  const currentExpenseGroupingData = useMemo(() => {
    return expenseGroupBy === 'category' ? expensesByCategory : expensesByContractor;
  }, [expenseGroupBy, expensesByCategory, expensesByContractor]);

  // Handle toggle change for expense grouping
  const handleExpenseGroupingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGrouping: 'category' | 'contractor' | null,
  ) => {
    if (newGrouping !== null) {
      setExpenseGroupBy(newGrouping);
    }
  };

  // Budget allocation by phase for visualization
  const phaseAllocation = useMemo(() => {
    if (!phases || !expenses) return [];
    
    return phases.map((phase, index) => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
      ];
      
      // Calculate actual cost by summing expenses associated with this phase
      const phaseExpenses = expenses.filter(expense => expense.phaseId === phase.id);
      const actualCost = phaseExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: phase.name,
        budget: phase.budget || 0,
        spent: actualCost,
        remaining: (phase.budget || 0) - actualCost,
        percentUsed: phase.budget ? (actualCost / phase.budget) * 100 : 0,
        color: colors[index % colors.length]
      };
    }).sort((a, b) => b.budget - a.budget); // Sort by budget size, largest first
  }, [phases, expenses, theme]);

  // Budget vs. Actual monthly data for trend visualization
  const monthlyTrends = useMemo(() => {
    if (!expenses) return [];
    
    // Group expenses by month
    const monthlyData: Record<string, {month: string, spent: number, projected: number}> = {};
    
    expenses.forEach(expense => {
      const date = typeof expense.date === 'string' 
        ? new Date(expense.date) 
        : expense.date instanceof Date
          ? expense.date
          : new Date();
      
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          spent: 0,
          projected: 0
        };
      }
      
      monthlyData[monthKey].spent += expense.amount;
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item, index, arr) => ({
        ...item,
        cumulative: arr.slice(0, index + 1).reduce((sum, curr) => sum + curr.spent, 0)
      }));
  }, [expenses]);

  // Calculate budget health status
  const budgetHealth = useMemo(() => {
    if (budgetSummary.variance < 0) {
      // Over budget
      const percentOver = (Math.abs(budgetSummary.variance) / budgetSummary.totalBudget) * 100;
      
      if (percentOver > 20) {
        return { status: 'Critical', color: theme.palette.error.dark, icon: <WarningIcon /> };
      } else if (percentOver > 10) {
        return { status: 'At Risk', color: theme.palette.error.main, icon: <WarningIcon /> };  
      } else {
        return { status: 'Caution', color: theme.palette.warning.main, icon: <FlagIcon /> };
      }
    } else if (budgetSummary.percentSpent > 90) {
      // Nearly depleted
      return { status: 'Near Limit', color: theme.palette.warning.main, icon: <FlagIcon /> };
    } else if (budgetSummary.percentSpent < 70 && (budgetSummary.totalProjected || 0) < budgetSummary.totalBudget) {
      // Healthy
      return { status: 'Healthy', color: theme.palette.success.main, icon: <CheckCircleIcon /> };
    } else {
      // On track
      return { status: 'On Track', color: theme.palette.info.main, icon: <TimelineIcon /> };
    }
  }, [budgetSummary, theme]);

  // Top expense items
  const topExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Loading budget data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">Error loading budget data</Typography>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with core metrics */}
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        borderRadius: 2,
        background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">Budget Overview</Typography>
          
          <Box>
            <Tooltip title="Export Budget Report">
              <IconButton sx={{ mr: 1 }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Budget Report">
              <IconButton>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <AccountBalanceIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          {project.name}
          <Chip 
            label={budgetHealth.status}
            icon={budgetHealth.icon}
            sx={{ 
              ml: 2,
              bgcolor: alpha(budgetHealth.color, 0.1),
              color: budgetHealth.color,
              fontWeight: 'bold'
            }}
          />
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.7) }}>
              <Typography variant="subtitle2" color="text.secondary">Total Budget</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                {formatCurrency(budgetSummary.totalBudget)}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.7) }}>
              <Typography variant="subtitle2" color="text.secondary">Spent to Date</Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: theme.palette.primary.main }}>
                {formatCurrency(budgetSummary.totalSpent)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatPercentage(budgetSummary.percentSpent/100)} of budget used
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.7) }}>
              <Typography variant="subtitle2" color="text.secondary">Remaining Budget</Typography>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                  mt: 1, 
                  color: budgetSummary.remaining >= 0 ? theme.palette.success.main : theme.palette.error.main 
                }}
              >
                {formatCurrency(budgetSummary.remaining)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {budgetSummary.remaining >= 0 ? 'Available' : 'Overrun'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.7) }}>
              <Typography variant="subtitle2" color="text.secondary">Projected Total</Typography>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                  mt: 1,
                  color: budgetSummary.variance >= 0 ? theme.palette.success.main : theme.palette.error.main 
                }}
              >
                {formatCurrency(budgetSummary.totalProjected || 0)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {budgetSummary.variance >= 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.success.main }}>
                    <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" fontWeight="medium" color="inherit">
                      {formatCurrency(budgetSummary.variance)} under budget
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.error.main }}>
                    <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" fontWeight="medium" color="inherit">
                      {formatCurrency(Math.abs(budgetSummary.variance))} over budget
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Main content grid */}
      <Grid container spacing={3}>
        {/* Phase Budget Allocation */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title="Phase Budget Allocation"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Tooltip title="Add New Phase">
                  <IconButton>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Phase</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Budget</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Spent</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Remaining</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Usage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {phaseAllocation.map((phase) => (
                      <TableRow key={phase.name} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                bgcolor: phase.color,
                                mr: 1 
                              }} 
                            />
                            {phase.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(phase.budget)}</TableCell>
                        <TableCell align="right">{formatCurrency(phase.spent)}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: phase.remaining >= 0 ? theme.palette.success.main : theme.palette.error.main,
                            fontWeight: 'medium'
                          }}
                        >
                          {formatCurrency(phase.remaining)}
                        </TableCell>
                        <TableCell align="right" sx={{ width: '20%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(phase.percentUsed, 100)}
                              sx={{ 
                                flexGrow: 1,
                                mr: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(phase.color, 0.2),
                                '.MuiLinearProgress-bar': {
                                  bgcolor: phase.percentUsed > 100 
                                    ? theme.palette.error.main 
                                    : phase.color,
                                }
                              }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {phase.percentUsed.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {phaseAllocation.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography color="text.secondary">No phases defined.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Expense Category Breakdown */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ 
            borderRadius: 2, 
            height: '100%',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title={`Expense Breakdown by ${expenseGroupBy === 'category' ? 'Category' : 'Contractor'}`}
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ToggleButtonGroup
                    value={expenseGroupBy}
                    exclusive
                    onChange={handleExpenseGroupingChange}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <ToggleButton value="category" aria-label="category">
                      <Tooltip title="Group by Category">
                        <CategoryIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="contractor" aria-label="contractor">
                      <Tooltip title="Group by Contractor">
                        <BusinessIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title="View All Expenses">
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              {currentExpenseGroupingData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentExpenseGroupingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={1}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {currentExpenseGroupingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: alpha(theme.palette.background.paper, 0.9),
                          border: 'none',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography color="text.secondary">No expense data available.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* NEW: Add a detailed expense breakdown table grouped by the selected option */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            mb: 3
          }}>
            <CardHeader
              title={`Detailed Expense Breakdown by ${expenseGroupBy === 'category' ? 'Category' : 'Contractor'}`}
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>{expenseGroupBy === 'category' ? 'Category' : 'Contractor'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>% of Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Items</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentExpenseGroupingData.map((item) => {
                      const percentOfTotal = budgetSummary.totalSpent > 0 
                        ? (item.value / budgetSummary.totalSpent) * 100 
                        : 0;
                      
                      // Count number of expenses for this group
                      const itemCount = expenses.filter(exp => {
                        if (expenseGroupBy === 'category') {
                          return exp.category === item.name.toLowerCase() || 
                                 exp.category === item.name.toLowerCase().replace(' ', '_');
                        } else {
                          // For contractor view
                          const contractorName = exp.subcontractorName || exp.vendor || "Direct Expense";
                          return contractorName === item.name;
                        }
                      }).length;
                      
                      return (
                        <TableRow key={item.name} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: item.color,
                                  mr: 1 
                                }} 
                              />
                              {item.name}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                            {formatCurrency(item.value)}
                          </TableCell>
                          <TableCell align="right">
                            {percentOfTotal.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">
                            {itemCount}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {currentExpenseGroupingData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography color="text.secondary">No expense data available.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Expense Trend Chart */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title="Budget & Expense Trends"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Add Expense
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {monthlyTrends.length > 0 ? (
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyTrends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        contentStyle={{
                          backgroundColor: alpha(theme.palette.background.paper, 0.9),
                          border: 'none',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="spent" 
                        name="Monthly Expenses" 
                        fill={alpha(theme.palette.primary.main, 0.2)} 
                        stroke={theme.palette.primary.main} 
                        activeDot={{ r: 6 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        name="Cumulative Expenses" 
                        fill={alpha(theme.palette.secondary.main, 0.2)} 
                        stroke={theme.palette.secondary.main} 
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        name="Projected Expense" 
                        stroke={theme.palette.warning.main} 
                        strokeDasharray="5 5"
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography color="text.secondary">No expense trend data available.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Top Expenses */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            height: '100%',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title="Top Expenses"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Tooltip title="View All Expenses">
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topExpenses.map((expense) => (
                      <TableRow key={expense.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 1.5 }}>{expense.description}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={expense.category.replace('_', ' ')} 
                            sx={{ 
                              textTransform: 'capitalize',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {typeof expense.date === 'string' 
                            ? expense.date 
                            : formatDate(expense.date)
                          }
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography color="text.secondary">No expenses recorded.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Budget Health & Recommendations */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            height: '100%',
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title="Budget Health Analysis"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              avatar={
                <Avatar sx={{ bgcolor: budgetHealth.color }}>
                  {budgetHealth.icon}
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2, color: budgetHealth.color, fontWeight: 'bold' }}>
                {budgetHealth.status}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" paragraph>
                  {budgetHealth.status === 'Healthy' && 'Your project is under budget and on track. Current spending patterns indicate you may finish below the allocated budget.'}
                  {budgetHealth.status === 'On Track' && 'Your project is progressing as expected financially. Continue monitoring expenses to maintain budget compliance.'}
                  {budgetHealth.status === 'Near Limit' && 'Your project has utilized most of the allocated budget. Carefully manage remaining funds to prevent overruns.'}
                  {budgetHealth.status === 'Caution' && 'Your project expenses are trending higher than expected. Review upcoming expenses and identify savings opportunities.'}
                  {budgetHealth.status === 'At Risk' && 'Your project is projected to exceed budget by more than 10%. Immediate cost control measures are recommended.'}
                  {budgetHealth.status === 'Critical' && 'Your project is significantly over budget. Comprehensive financial review and corrective actions are required urgently.'}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Recommendations:
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                {budgetHealth.status === 'Healthy' && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Consider allocating surplus to enhance project quality or features
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Document effective cost management practices for future projects
                    </Typography>
                    <Typography component="li" variant="body2">
                      Continue regular financial reviews to maintain budget health
                    </Typography>
                  </>
                )}
                
                {budgetHealth.status === 'On Track' && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Monitor phases with higher spending percentages
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Review upcoming expenses for potential savings
                    </Typography>
                    <Typography component="li" variant="body2">
                      Update cashflow projections based on actual spending
                    </Typography>
                  </>
                )}
                
                {(budgetHealth.status === 'Near Limit' || budgetHealth.status === 'Caution') && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Review all pending expenses for necessity and timing
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Identify cost-saving opportunities in remaining work
                    </Typography>
                    <Typography component="li" variant="body2">
                      Consider reallocating budget from under-spending phases
                    </Typography>
                  </>
                )}
                
                {(budgetHealth.status === 'At Risk' || budgetHealth.status === 'Critical') && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Conduct immediate comprehensive financial review
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Pause non-essential expenses and renegotiate pending contracts
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Prepare budget variance report for stakeholders
                    </Typography>
                    <Typography component="li" variant="body2">
                      Consider requesting budget increase or scope reduction
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BudgetDashboard; 