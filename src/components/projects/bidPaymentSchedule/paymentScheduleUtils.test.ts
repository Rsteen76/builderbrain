import { BidPaymentStage } from '../../../types';
import {
  calculateCompletionPercentage,
  calculatePaymentProgress,
  formatCurrency,
  formatStatusLabel,
  getStatusColor,
} from './paymentScheduleUtils';

const makeStage = (overrides: Partial<BidPaymentStage>): BidPaymentStage => ({
  id: overrides.id || 'stage-id',
  name: overrides.name || 'Stage',
  percentage: overrides.percentage || 0,
  amount: overrides.amount || 0,
  status: overrides.status || 'pending',
  ...overrides,
});

describe('paymentScheduleUtils', () => {
  it('calculates paid, pending, and remaining progress from numeric and string amounts', () => {
    const progress = calculatePaymentProgress([
      makeStage({ id: 'paid', amount: 75, status: 'paid' }),
      makeStage({ id: 'pending', amount: '25' as unknown as number, status: 'pending' }),
      makeStage({ id: 'bad', amount: 'not-a-number' as unknown as number, status: 'paid' }),
    ]);

    expect(progress).toEqual({
      paid: 75,
      pending: 25,
      remaining: 25,
    });
  });

  it('returns zero progress for an empty schedule', () => {
    expect(calculatePaymentProgress([])).toEqual({
      paid: 0,
      pending: 0,
      remaining: 0,
    });
  });

  it('calculates the same rounded completion percentage used by the header', () => {
    expect(calculateCompletionPercentage(33, 100)).toBe(33);
    expect(calculateCompletionPercentage(1, 3)).toBe(33);
    expect(calculateCompletionPercentage(10, 0)).toBe(0);
  });

  it('keeps status display helpers aligned with existing UI behavior', () => {
    expect(getStatusColor('paid')).toBe('success');
    expect(getStatusColor('requires_approval')).toBe('default');
    expect(formatStatusLabel('in_progress')).toBe('In_progress');
  });

  it('formats currency using the existing USD display', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});
