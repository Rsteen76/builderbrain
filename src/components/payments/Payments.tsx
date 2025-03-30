import React from 'react';
import {
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
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

const Payments: React.FC = () => {
  // Mock data - in a real app, you'd fetch this from your database
  const payments = [
    {
      id: '1',
      amount: 2500,
      date: '2023-04-10',
      status: 'paid',
      project: 'Renovating Smith Residence',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: '2',
      amount: 4800,
      date: '2023-04-05',
      status: 'pending',
      project: 'Commercial Building Construction',
      paymentMethod: 'Check',
    },
    {
      id: '3',
      amount: 1200,
      date: '2023-03-28',
      status: 'paid',
      project: 'Kitchen Remodeling',
      paymentMethod: 'Credit Card',
    },
    {
      id: '4',
      amount: 3600,
      date: '2023-03-22',
      status: 'overdue',
      project: 'Office Building Renovation',
      paymentMethod: 'Bank Transfer',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Payments
        </Typography>
        <Button variant="contained" startIcon={<AttachMoneyIcon />}>
          Record Payment
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6">Total Received</Typography>
            <Typography variant="h4">$8,300.00</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h4">$4,800.00</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6">Overdue</Typography>
            <Typography variant="h4">$3,600.00</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6">This Month</Typography>
            <Typography variant="h4">$7,300.00</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Recent Transactions
      </Typography>

      <Grid container spacing={3}>
        {payments.map((payment) => (
          <Grid item xs={12} md={6} lg={4} key={payment.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">${payment.amount.toLocaleString()}</Typography>
                  <Chip
                    label={payment.status}
                    color={
                      payment.status === 'paid'
                        ? 'success'
                        : payment.status === 'pending'
                        ? 'warning'
                        : 'error'
                    }
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {payment.project}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{payment.date}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{payment.paymentMethod}</Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<ReceiptIcon />}>
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