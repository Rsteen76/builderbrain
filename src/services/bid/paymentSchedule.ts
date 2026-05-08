import type { BidPaymentProgress, BidPaymentStage } from '../../types';

export const calculatePaymentProgress = (
  paymentSchedule: BidPaymentStage[],
  totalAmount: number
): BidPaymentProgress => {
  let paid = 0;
  let pending = 0;

  paymentSchedule.forEach(stage => {
    if (stage.status === 'paid') {
      paid += stage.amount;
    } else if (stage.status === 'partially_paid' && stage.paidAmount) {
      paid += stage.paidAmount;
      pending += stage.amount - stage.paidAmount;
    } else {
      pending += stage.amount;
    }
  });

  return {
    paid,
    pending,
    remaining: totalAmount - paid,
  };
};

export const calculateProgressFromScheduleState = (
  paymentSchedule: BidPaymentStage[],
  totalAmount: number,
  existingProgress?: BidPaymentProgress
): BidPaymentProgress => {
  const paid = paymentSchedule.reduce((sum, stage) => {
    if (stage.status === 'paid') {
      return sum + Number(stage.amount || 0);
    }
    return sum + Number(stage.paidAmount || 0);
  }, 0);

  const pending = paymentSchedule.reduce((sum, stage) => {
    if (stage.status === 'paid') {
      return sum;
    }
    return sum + Math.max(Number(stage.amount || 0) - Number(stage.paidAmount || 0), 0);
  }, 0);

  return {
    ...existingProgress,
    paid,
    pending,
    remaining: Math.max(Number(totalAmount || 0) - paid, 0),
  };
};

export const applyPaymentToSchedule = (
  paymentSchedule: BidPaymentStage[],
  stageId: string,
  paymentExpenseId: string | undefined,
  amountPaid: number,
  paymentDate: Date = new Date()
): BidPaymentStage[] | null => {
  const stageIndex = paymentSchedule.findIndex(stage => stage.id === stageId);
  if (stageIndex === -1) {
    return null;
  }

  const schedule = paymentSchedule.map(stage => ({ ...stage }));
  const stageToUpdate = schedule[stageIndex];
  const currentPaid = Number(stageToUpdate.paidAmount || 0);
  const stageAmount = Number(stageToUpdate.amount || 0);
  const remainingStageAmount = Math.max(stageAmount - currentPaid, 0);
  const appliedAmount = Math.min(amountPaid, remainingStageAmount);

  stageToUpdate.paidAmount = currentPaid + appliedAmount;
  stageToUpdate.expenseId = paymentExpenseId;
  stageToUpdate.paymentDate = paymentDate;

  if (stageToUpdate.paidAmount >= stageAmount) {
    stageToUpdate.status = 'paid';
    stageToUpdate.paidAmount = stageAmount;
    stageToUpdate.isPaid = true;
  } else {
    stageToUpdate.status = 'partially_paid';
    delete stageToUpdate.isPaid;
  }

  return schedule;
};
