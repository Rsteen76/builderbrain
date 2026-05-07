import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentRecord, PaymentsDashboardData, PaymentService } from '../../services/payment';
import { formatCurrency, formatDate } from '../../utils/formatters';

const emptyDashboard: PaymentsDashboardData = {
  payments: [],
  summary: {
    totalReceived: 0,
    pending: 0,
    overdue: 0,
    thisMonth: 0,
  },
};

const getStatusColor = (status: PaymentRecord['status']) => {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  return 'error';
};

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<PaymentsDashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPayments = async () => {
      if (!user?.uid) {
        setDashboard(emptyDashboard);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await PaymentService.getPaymentsDashboard(user.uid);
        if (isMounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load payments');
          setDashboard(emptyDashboard);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Payments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AttachMoneyIcon />}
          onClick={() => navigate('/expenses')}
        >
          Record Payment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6">Total Received</Typography>
            <Typography variant="h4">{formatCurrency(dashboard.summary.totalReceived)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h4">{formatCurrency(dashboard.summary.pending)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6">Overdue</Typography>
            <Typography variant="h4">{formatCurrency(dashboard.summary.overdue)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6">This Month</Typography>
            <Typography variant="h4">{formatCurrency(dashboard.summary.thisMonth)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Recent Transactions
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && dashboard.payments.length === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">
            No payments have been recorded yet.
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {!loading && dashboard.payments.map((payment) => (
          <Grid item xs={12} md={6} lg={4} key={payment.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{formatCurrency(payment.amount)}</Typography>
                  <Chip
                    label={payment.status}
                    color={getStatusColor(payment.status)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {payment.projectName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {payment.description}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{formatDate(payment.date)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{payment.paymentMethod}</Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate('/expenses')}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Payments;
