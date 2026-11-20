import { calculateSpent, countsAsSpent } from './expenseAnalytics';
import { Expense } from '../types';

const expense = (status: Expense['status'], amount: number) => ({ status, amount } as Expense);

describe('spent', () => {
  it('counts paid and approved expenses only', () => {
    expect(countsAsSpent(expense('paid', 1))).toBe(true);
    expect(countsAsSpent(expense('approved', 1))).toBe(true);
    expect(countsAsSpent(expense('pending', 1))).toBe(false);
    expect(countsAsSpent(expense('rejected', 1))).toBe(false);
  });

  it('leaves pending and rejected expenses out of the total', () => {
    const total = calculateSpent([
      expense('paid', 47300),
      expense('approved', 38500),
      expense('pending', 15000),
      expense('rejected', 9000),
    ]);

    expect(total).toBe(85800);
  });

  it('is 0 with no expenses', () => {
    expect(calculateSpent([])).toBe(0);
  });
});
