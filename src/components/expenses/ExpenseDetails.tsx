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
  Link,
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
  Engineering as SubcontractorIcon,
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
  vendor?: string;
  subcontractorId?: string;
  subcontractorName?: string;
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
          vendor: 'Home Depot',
          subcontractorId: 'sub-123',
          subcontractorName: 'ABC Construction',
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
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {expense && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" component="h2">
                    {expense.title}
                  </Typography>
                  <Chip
                    label={expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    color={getStatusColor(expense.status) as any}
                    icon={getStatusIcon(expense.status)}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" component="span" fontWeight="bold">
                      Amount:
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                      {formatCurrency(expense.amount)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" component="span" fontWeight="bold">
                      Category:
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                      {expense.category}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" component="span" fontWeight="bold">
                      Date:
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                      {formatDate(expense.date)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" component="span" fontWeight="bold">
                      Project:
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                      {expense.projectName}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" component="span" fontWeight="bold">
                      Description:
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                      {expense.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" component="span" fontWeight="bold">
                      Submitted By:
                    </Typography>
                    <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                      {expense.submittedBy}
                    </Typography>
                  </Box>

                  {expense.vendor && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Vendor:
                      </Typography>
                      <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                        {expense.vendor}
                      </Typography>
                    </Box>
                  )}

                  {expense.subcontractorName && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SubcontractorIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Subcontractor:
                      </Typography>
                      <Link 
                        component="button"
                        variant="body1"
                        onClick={() => navigate(`/subcontractors/${expense.subcontractorId}`)}
                        sx={{ ml: 1, textDecoration: 'none' }}
                      >
                        {expense.subcontractorName}
                      </Link>
                    </Box>
                  )}

                  {expense.receiptUrl && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" component="span" fontWeight="bold">
                        Receipt:
                      </Typography>
                      <Link
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: 1 }}
                      >
                        View Receipt
                      </Link>
                    </Box>
                  )}
                </Stack>
              </Grid>

              {expense.status === 'pending' && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleReject}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleApprove}
                    >
                      Approve
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ExpenseDetails; 