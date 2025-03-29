import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';

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

const ExpenseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Simulate API call to fetch expense details
    const fetchExpense = async () => {
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock expense data
        const mockExpense: Expense = {
          id: id || '1',
          title: 'Building Materials',
          description: 'Lumber and concrete for foundation',
          amount: 2500.00,
          category: 'Materials',
          date: new Date('2024-03-15'),
          status: 'pending',
          projectId: '1',
          projectName: 'Office Renovation',
          submittedBy: 'John Doe',
          receiptUrl: 'https://example.com/receipt1.pdf',
        };
        
        setExpense(mockExpense);
      } catch (err) {
        setError('Failed to load expense details');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/expenses/${id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    // Simulate API call to delete expense
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/expenses');
    } catch (err) {
      setError('Failed to delete expense');
    }
    handleMenuClose();
  };

  const handleApprove = async () => {
    if (!expense) return;
    
    try {
      // Simulate API call to update status
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExpense({ ...expense, status: 'approved' });
    } catch (err) {
      setError('Failed to approve expense');
    }
  };

  const handleReject = async () => {
    if (!expense) return;
    
    try {
      // Simulate API call to update status
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExpense({ ...expense, status: 'rejected' });
    } catch (err) {
      setError('Failed to reject expense');
    }
  };

  const getStatusIcon = (status: Expense['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusColor = (status: Expense['status']) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!expense) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Expense not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expense Details
        </Typography>
        <Box>
          {expense.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleApprove}
                sx={{ mr: 1 }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleReject}
                sx={{ mr: 1 }}
              >
                Reject
              </Button>
            </>
          )}
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {expense.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {expense.description}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      icon={<CategoryIcon />}
                      label={expense.category}
                      variant="outlined"
                    />
                    <Chip
                      icon={getStatusIcon(expense.status)}
                      label={expense.status.toUpperCase()}
                      color={getStatusColor(expense.status) as any}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Amount
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {formatCurrency(expense.amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Date
                      </Typography>
                      <Typography variant="h6">
                        {formatDate(expense.date)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Project Information
                  </Typography>
                  <Typography variant="body1">
                    <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {expense.projectName}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Submitted By
                  </Typography>
                  <Typography variant="body1">
                    <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {expense.submittedBy}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Receipt
              </Typography>
              {expense.receiptUrl ? (
                <Box>
                  <img
                    src={expense.receiptUrl}
                    alt="Receipt"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<ReceiptIcon />}
                    href={expense.receiptUrl}
                    target="_blank"
                    sx={{ mt: 2 }}
                  >
                    View Full Receipt
                  </Button>
                </Box>
              ) : (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No receipt attached
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ExpenseDetails; 