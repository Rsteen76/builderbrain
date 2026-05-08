import type { Bid } from '../../types';

export const withPaymentProgress = (bid: Bid): Bid => {
  if (!bid.paymentSchedule || bid.paymentSchedule.length === 0) {
    return {
      ...bid,
      paymentProgress: {
        paid: 0,
        pending: bid.totalAmount,
        remaining: bid.totalAmount,
      },
    };
  }

  const paid = bid.paymentSchedule.reduce(
    (sum, stage) => sum + (stage.paidAmount || 0),
    0
  );
  const pending = bid.paymentSchedule
    .filter((stage) => stage.status !== 'paid')
    .reduce((sum, stage) => sum + (stage.amount || 0), 0);

  return {
    ...bid,
    paymentProgress: {
      paid,
      pending,
      remaining: Math.max(bid.totalAmount - paid, 0),
    },
  };
};
