import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Stack,
  LinearProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Types
interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  projectId: string;
  projectName: string;
  submittedBy: string;
  receiptUrl?: string;
}

// Mock data - replace with API calls later
const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Building Materials',
    description: 'Lumber and concrete for foundation',
    amount: 2500.00,
    category: 'Materials',
    date: new Date('2024-03-15'),
    status: 'approved',
    projectId: '1',
    projectName: 'Office Renovation',
    submittedBy: 'John Doe',
    receiptUrl: 'https://example.com/receipt1.pdf',
  },
  {
    id: '2',
    title: 'Equipment Rental',
    description: 'Excavator rental for site preparation',
    amount: 1200.00,
    category: 'Equipment',
    date: new Date('2024-03-20'),
    status: 'pending',
    projectId: '1',
    projectName: 'Office Renovation',
    submittedBy: 'Jane Smith',
    receiptUrl: 'https://example.com/receipt2.pdf',
  },
];

const categories = [
  'Materials',
  'Labor',
  'Equipment',
  'Subcontractors',
  'Permits',
  'Utilities',
  'Insurance',
  'Other',
];

const ExpensesList: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);

  // Calculate total expenses and category breakdown
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expenseId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expenseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  // Expense actions
  const handleCreateExpense = () => {
    navigate('/expenses/new');
  };

  const handleEditExpense = (expenseId: string) => {
    navigate(`/expenses/${expenseId}/edit`);
    handleMenuClose();
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
    handleMenuClose();
  };

  const handleViewExpense = (expenseId: string) => {
    navigate(`/expenses/${expenseId}`);
  };

  // Status chip color mapping
  const getStatusColor = (status: Expense['status']) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return colors[status];
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesDateRange = (!dateRange.start || expense.date >= dateRange.start) &&
                           (!dateRange.end || expense.date <= dateRange.end);
    return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateExpense}
        >
          New Expense
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: '#2196f320',
                    borderRadius: '50%',
                    p: 1,
                    mr: 2,
                  }}
                >
                  <MoneyIcon sx={{ color: '#2196f3' }} />
                </Box>
                <Typography variant="h6" component="div">
                  Total Expenses
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatCurrency(totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(categoryBreakdown).map(([category, amount]) => (
                  <Box key={category} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{category}</Typography>
                      <Typography variant="body2">{formatCurrency(amount)}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(amount / totalExpenses) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Expenses List */}
      <Grid container spacing={3}>
        {filteredExpenses.map((expense) => (
          <Grid item xs={12} key={expense.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {expense.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {expense.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip
                        label={expense.category}
                        icon={<CategoryIcon />}
                        size="small"
                      />
                      <Chip
                        label={expense.status.toUpperCase()}
                        color={getStatusColor(expense.status) as any}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Project: {expense.projectName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submitted by: {expense.submittedBy}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {formatCurrency(expense.amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(expense.date)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, expense.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedExpense && handleViewExpense(selectedExpense)}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedExpense && handleEditExpense(selectedExpense)}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedExpense && handleDeleteExpense(selectedExpense)}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ExpensesList; 