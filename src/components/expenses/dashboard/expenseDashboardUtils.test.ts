import { Expense } from '../../../types';
import {
  calculateTotalExpenseAmount,
  getCategoryBreakdownItems,
  getStatusSummaryItems,
  getTopProjectExpenseItems,
} from './expenseDashboardUtils';

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Project One',
  category: 'materials',
  description: 'Concrete',
  amount: 100,
  date: new Date('2026-01-01'),
  status: 'pending',
  createdBy: 'user-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('expenseDashboardUtils', () => {
  test('builds category breakdown items with percentages', () => {
    const items = getCategoryBreakdownItems([
      expense({ category: 'materials', amount: 100 }),
      expense({ category: 'labor', amount: 300 }),
    ]);

    expect(calculateTotalExpenseAmount([
      expense({ amount: 100 }),
      expense({ amount: 300 }),
    ])).toBe(400);
    expect(items).toEqual([
      { category: 'materials', label: 'Materials', amount: 100, percentage: 25 },
      { category: 'labor', label: 'Labor', amount: 300, percentage: 75 },
    ]);
  });

  test('ignores non-numeric legacy amounts when building totals', () => {
    const items = getCategoryBreakdownItems([
      expense({ category: 'materials', amount: 'bad' as unknown as number }),
      expense({ category: 'labor', amount: 300 }),
    ]);

    expect(calculateTotalExpenseAmount([
      expense({ amount: 'bad' as unknown as number }),
      expense({ amount: 300 }),
    ])).toBe(300);
    expect(items).toEqual([
      { category: 'materials', label: 'Materials', amount: 0, percentage: 0 },
      { category: 'labor', label: 'Labor', amount: 300, percentage: 100 },
    ]);
  });

  test('returns top project totals in descending order with a limit', () => {
    const items = getTopProjectExpenseItems([
      expense({ projectName: 'Project One', amount: 50 }),
      expense({ projectName: 'Project Two', amount: 200 }),
      expense({ projectName: 'Project One', amount: 50 }),
      expense({ projectName: 'Project Three', amount: 100 }),
    ], 2);

    expect(items).toEqual([
      { projectName: 'Project Two', amount: 200, percentage: 50 },
      { projectName: 'Project One', amount: 100, percentage: 25 },
    ]);
  });

  test('builds status summary items in dashboard order with donut offsets', () => {
    const items = getStatusSummaryItems([
      expense({ status: 'pending', amount: 100 }),
      expense({ status: 'approved', amount: 300 }),
      expense({ status: 'paid', amount: 100 }),
    ]);

    expect(items.map(item => item.status)).toEqual([
      'pending',
      'approved',
      'partially_paid',
      'paid',
      'rejected',
    ]);
    expect(items.find(item => item.status === 'pending')).toEqual({
      status: 'pending',
      label: 'Pending',
      count: 1,
      amount: 100,
      percentage: 20,
      startPercentage: 0,
    });
    expect(items.find(item => item.status === 'approved')).toEqual(expect.objectContaining({
      count: 1,
      amount: 300,
      percentage: 60,
      startPercentage: 20,
    }));
    expect(items.find(item => item.status === 'paid')).toEqual(expect.objectContaining({
      count: 1,
      amount: 100,
      percentage: 20,
      startPercentage: 80,
    }));
  });
});
