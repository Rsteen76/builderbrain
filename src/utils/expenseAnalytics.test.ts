import { calculateSpent, countsAsSpent, isPaymentRecordExpense } from './expenseAnalytics';
import { Expense } from '../types';

const expense = (status: Expense['status'], amount: number, extra: Partial<Expense> = {}) =>
  ({ status, amount, ...extra } as Expense);

describe('spent', () => {
  it('counts approved, partially paid and paid expenses', () => {
    expect(countsAsSpent(expense('paid', 1))).toBe(true);
    expect(countsAsSpent(expense('approved', 1))).toBe(true);
    expect(countsAsSpent(expense('partially_paid', 1))).toBe(true);
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

  describe('an expense that is paid over time', () => {
    const payment = (amount: number) =>
      expense('paid', amount, { originalExpenseId: 'e1', tags: ['payment_record'] });

    it('counts its full amount once approved', () => {
      expect(calculateSpent([expense('approved', 10000)])).toBe(10000);
    });

    it('still counts 10,000 after a 4,000 partial payment', () => {
      expect(calculateSpent([expense('partially_paid', 10000), payment(4000)])).toBe(10000);
    });

    it('still counts 10,000 when paid in full', () => {
      expect(calculateSpent([expense('paid', 10000), payment(4000), payment(6000)])).toBe(10000);
    });

    it('counts nothing while pending or rejected', () => {
      expect(calculateSpent([expense('pending', 10000)])).toBe(0);
      expect(calculateSpent([expense('rejected', 10000)])).toBe(0);
    });

    it('never counts a payment record by itself', () => {
      expect(isPaymentRecordExpense(payment(1))).toBe(true);
      expect(isPaymentRecordExpense(expense('paid', 1, { tags: ['payment_record'] }))).toBe(true);
      expect(isPaymentRecordExpense(expense('paid', 1))).toBe(false);
      expect(countsAsSpent(payment(4000))).toBe(false);
    });
  });
});
