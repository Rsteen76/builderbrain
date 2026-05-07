import React from 'react';
import { Card, CardContent, CardHeader, Grid, Skeleton, Typography } from '@mui/material';
import { Expense } from '../../types';

interface ExpenseSummaryCardsProps {
  expenses: Expense[];
  loading: boolean;
  totalExpenses: number;
}

const money = (value: number) => `$${value.toFixed(2)}`;

export function ExpenseSummaryCards({
  expenses,
  loading,
  totalExpenses,
}: ExpenseSummaryCardsProps) {
  const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const averageAmount = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

  const cards = [
    {
      title: 'Total Expenses',
      value: money(totalAmount),
      description: 'Total amount of all expenses',
    },
    {
      title: 'Number of Expenses',
      value: String(totalExpenses),
      description: 'Total number of expenses recorded',
    },
    {
      title: 'Average Expense',
      value: money(averageAmount),
      description: 'Average amount spent per expense',
    },
    {
      title: 'Placeholder Card',
      value: 'N/A',
      description: 'This is a placeholder card',
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
