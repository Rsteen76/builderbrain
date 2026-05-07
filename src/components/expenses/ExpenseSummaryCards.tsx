import React from 'react';
import { Card, CardContent, CardHeader, Grid, Skeleton, Typography } from '@mui/material';
import { Expense } from '../../types';

interface ExpenseSummaryCardsProps {
  expenses: Expense[];
  loading: boolean;
  totalExpenses: number;
}

const money = (value: number) => `$${value.toFixed(2)}`;

const getPaidAmount = (expense: Expense) => {
  if (typeof expense.amountPaid === 'number') {
    return Math.min(Math.max(expense.amountPaid, 0), expense.amount);
  }

  return expense.status === 'paid' ? expense.amount : 0;
};

export function ExpenseSummaryCards({
  expenses,
  loading,
  totalExpenses,
}: ExpenseSummaryCardsProps) {
  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const paidAmount = expenses.reduce((acc, expense) => acc + getPaidAmount(expense), 0);
  const approvedUnpaidAmount = expenses.reduce((acc, expense) => {
    if (!['approved', 'partially_paid'].includes(expense.status)) {
      return acc;
    }

    return acc + Math.max(expense.amount - getPaidAmount(expense), 0);
  }, 0);
  const pendingAmount = expenses
    .filter((expense) => expense.status === 'pending')
    .reduce((acc, expense) => acc + expense.amount, 0);
  const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

  const cards = [
    {
      title: 'Total Actual Cost',
      value: money(totalAmount),
      description: 'Recorded job cost across transactions',
    },
    {
      title: 'Paid',
      value: money(paidAmount),
      description: 'Vendor and subcontractor costs paid',
    },
    {
      title: 'Approved Unpaid',
      value: money(approvedUnpaidAmount),
      description: `Pending approval: ${money(pendingAmount)}`,
    },
    {
      title: 'Transactions',
      value: String(totalExpenses),
      description: `Average transaction: ${money(averageAmount)}`,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} lg={3} key={card.title}>
          <Card component="div" role="article" sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="subtitle2">{card.title}</Typography>}
              sx={{ pb: 0 }}
            />
            <CardContent>
              {loading ? (
                <Skeleton data-testid="summary-skeleton" variant="text" width="50%" height={40} />
              ) : (
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {card.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
