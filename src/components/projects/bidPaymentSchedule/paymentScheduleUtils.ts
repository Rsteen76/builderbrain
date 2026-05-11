import { BidPaymentStage } from '../../../types';
import { logger } from '../../../utils/logger';

export const toStageAmount = (amount: BidPaymentStage['amount'] | string | undefined): number => {
  if (typeof amount === 'string') {
    return parseFloat(amount);
  }

  return amount || 0;
};

export const getStatusColor = (status: BidPaymentStage['status']) => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'in_progress':
      return 'info';
    case 'completed':
      return 'warning';
    case 'paid':
      return 'success';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

export const formatStatusLabel = (status: BidPaymentStage['status']): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const calculateCompletionPercentage = (paid: number, totalAmount: number): number => {
  return totalAmount > 0 ? Math.round((paid / totalAmount) * 100) : 0;
};

export const calculatePaymentProgress = (schedule: BidPaymentStage[]) => {
  const paid = schedule
    .filter(stage => stage.status === 'paid')
    .reduce((sum, stage) => {
      const amount = toStageAmount(stage.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const total = schedule.reduce((sum, stage) => {
    const amount = toStageAmount(stage.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  let validatedPaid = Math.min(paid, total);
  validatedPaid = Math.max(0, validatedPaid);

  const validatedPending = Math.max(0, total - validatedPaid);

  if (total === 0) {
    return {
      paid: 0,
      pending: 0,
      remaining: 0
    };
  }

  if (validatedPaid !== paid) {
    logger.warn(`Payment calculation corrected: original paid ${paid} -> corrected to ${validatedPaid}`);
  }

  return {
    paid: validatedPaid,
    pending: validatedPending,
    remaining: validatedPending
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};
