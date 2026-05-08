import { applyPaymentToSchedule, calculatePaymentProgress, calculateProgressFromScheduleState } from './paymentSchedule';
import type { BidPaymentStage } from '../../types';

const stage = (overrides: Partial<BidPaymentStage>): BidPaymentStage => ({
  id: 'stage',
  name: 'Stage',
  percentage: 10,
  amount: 100,
  status: 'pending',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('bid payment schedule helpers', () => {
  test('calculatePaymentProgress matches paid, partial, and pending stages', () => {
    const schedule = [
      stage({ id: 'paid', amount: 100, status: 'paid' }),
      stage({ id: 'partial', amount: 300, status: 'partially_paid', paidAmount: 125 }),
      stage({ id: 'pending', amount: 600, status: 'pending' }),
    ];

    expect(calculatePaymentProgress(schedule, 1000)).toEqual({
      paid: 225,
      pending: 775,
      remaining: 775,
    });
  });

  test('applyPaymentToSchedule partially pays the target stage without mutating input', () => {
    const paymentDate = new Date('2026-02-01T00:00:00.000Z');
    const schedule = [stage({ id: 'stage-1', amount: 200 })];

    const result = applyPaymentToSchedule(schedule, 'stage-1', 'expense-1', 75, paymentDate);

    expect(result).not.toBe(schedule);
    expect(schedule[0].status).toBe('pending');
    expect(result?.[0]).toMatchObject({
      status: 'partially_paid',
      paidAmount: 75,
      expenseId: 'expense-1',
      paymentDate,
    });
    expect(result?.[0].isPaid).toBeUndefined();
  });

  test('applyPaymentToSchedule caps overpayment and marks a stage paid', () => {
    const schedule = [stage({ id: 'stage-1', amount: 200, status: 'partially_paid', paidAmount: 150 })];

    const result = applyPaymentToSchedule(schedule, 'stage-1', 'expense-2', 100);

    expect(result?.[0]).toMatchObject({
      status: 'paid',
      paidAmount: 200,
      isPaid: true,
    });
  });

  test('calculateProgressFromScheduleState preserves existing fields while clamping remaining', () => {
    const schedule = [
      stage({ id: 'stage-1', amount: 100, status: 'paid', paidAmount: 100 }),
      stage({ id: 'stage-2', amount: 50, status: 'partially_paid', paidAmount: 25 }),
    ];

    expect(calculateProgressFromScheduleState(schedule, 120, { paid: 0, pending: 0, remaining: 0 })).toEqual({
      paid: 125,
      pending: 25,
      remaining: 0,
    });
  });
});
