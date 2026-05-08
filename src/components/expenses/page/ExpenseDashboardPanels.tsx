import React from 'react';
import {
  Avatar,
  Box,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Typography,
  alpha,
  useTheme,
  Theme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Paid as PaidIcon,
} from '@mui/icons-material';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { getExpenseCategoryIcon } from '../list/ExpenseCategoryIcon';
import {
  calculateTotalExpenseAmount,
  getCategoryBreakdownItems,
  getStatusSummaryItems,
  getTopProjectExpenseItems,
  StatusSummaryItem,
} from '../dashboard/expenseDashboardUtils';

interface ExpenseDashboardPanelsProps {
  expenses: Expense[];
  loading: boolean;
  projectId?: string;
}

function getCategoryColor(category: ExpenseCategory, theme: Theme): string {
  if (category === 'materials') return theme.palette.success.main;
  if (category === 'labor') return theme.palette.info.main;
  if (category === 'equipment') return theme.palette.warning.main;
  if (category === 'permits') return theme.palette.error.main;
  return theme.palette.primary.main;
}

function getStatusIcon(status: ExpenseStatus): JSX.Element {
  switch (status) {
    case 'paid':
    case 'partially_paid':
      return <PaidIcon fontSize="small" />;
    case 'pending':
      return <DescriptionIcon fontSize="small" />;
    case 'approved':
      return <CheckCircleIcon fontSize="small" />;
    case 'rejected':
      return <DeleteIcon fontSize="small" />;
    default:
      return <DescriptionIcon fontSize="small" />;
  }
}

function getStatusColor(status: ExpenseStatus, theme: Theme): string {
  switch (status) {
    case 'paid':
      return theme.palette.success.main;
    case 'partially_paid':
      return theme.palette.info.main;
    case 'pending':
      return theme.palette.warning.main;
    case 'approved':
      return theme.palette.primary.main;
    case 'rejected':
      return theme.palette.error.main;
    default:
      return theme.palette.text.secondary;
  }
}

function getDonutSliceColor(index: number, theme: Theme): string {
  if (index === 0) return theme.palette.warning.main;
  if (index === 1) return theme.palette.primary.main;
  if (index === 2) return theme.palette.info.main;
  if (index === 3) return theme.palette.success.main;
  return theme.palette.error.main;
}

export function ExpenseDashboardPanels({ expenses, loading, projectId }: ExpenseDashboardPanelsProps) {
  const theme = useTheme<Theme>();
  const totalExpensesValue = React.useMemo(() => calculateTotalExpenseAmount(expenses), [expenses]);
  const categoryBreakdownItems = React.useMemo(() => getCategoryBreakdownItems(expenses), [expenses]);
  const topProjectExpenseItems = React.useMemo(() => getTopProjectExpenseItems(expenses), [expenses]);
  const statusSummaryItems = React.useMemo(() => getStatusSummaryItems(expenses), [expenses]);

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Expense Breakdown by Category</Typography>

          <Grid container spacing={2}>
            {loading ? (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Grid>
            ) : categoryBreakdownItems.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">No category data available</Typography>
              </Grid>
            ) : (
              categoryBreakdownItems.map(({ category, label, amount, percentage }) => (
                <Grid item xs={12} key={category}>
                  <Box sx={{ mb: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getExpenseCategoryIcon(category)}
                        <Typography variant="body2" sx={{ ml: 1 }}>{label}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight="medium">{formatCurrency(amount)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(percentage)}% of total
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.light, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getCategoryColor(category, theme),
                        },
                      }}
                    />
                  </Box>
                </Grid>
              ))
            )}
          </Grid>
        </Paper>
      </Grid>

      {!projectId && expenses.length > 0 && (
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Projects by Expense</Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Box>
                {topProjectExpenseItems.map(({ projectName, amount, percentage }, index) => (
                  <Box key={projectName} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem', bgcolor: `hsl(${index * 50}, 70%, 50%)` }}>
                          {projectName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ ml: 1 }}>{projectName}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">{formatCurrency(amount)}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.light, 0.15),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: `hsl(${index * 50}, 70%, 50%)`,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      )}

      <Grid item xs={12} md={projectId ? 12 : 6}>
        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Expense Status Summary</Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {statusSummaryItems.map((item) => (
                    <StatusSummaryRow key={item.status} item={item} />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 200 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    {statusSummaryItems.map(({ status, amount, percentage, startPercentage }, index) => {
                      if (amount === 0) return null;

                      const color = getDonutSliceColor(index, theme);

                      return (
                        <Box
                          key={status}
                          sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            background: `conic-gradient(
                              ${color} ${startPercentage}%,
                              ${color} ${startPercentage + percentage}%,
                              transparent ${startPercentage + percentage}%,
                              transparent 100%
                            )`,
                          }}
                        />
                      );
                    })}

                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                      <Typography variant="body2" fontWeight="bold">{formatCurrency(totalExpensesValue)}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

function StatusSummaryRow({ item }: { item: StatusSummaryItem }) {
  const theme = useTheme<Theme>();

  if (item.count === 0) return null;

  const color = getStatusColor(item.status, theme);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: alpha(color, 0.2),
          color,
          mr: 1.5,
        }}
      >
        {getStatusIcon(item.status)}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight="medium">{item.label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {item.count} {item.count === 1 ? 'expense' : 'expenses'}
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(item.amount)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
