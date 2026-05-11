import type { Expense } from '../../../types';
import {
  buildNewExpenseData,
  normalizeExpensePaymentDetails,
  shouldShowCreatedExpenseInCurrentTab,
  shouldShowDefaultSaveSuccess,
} from './expenseSaveFlow';

describe('expenseSaveFlow', () => {
  test('normalizes undefined payment details to null', () => {
    expect(normalizeExpensePaymentDetails({ description: 'Permit' }).paymentDetails).toBeNull();

    const paymentDetails = { method: 'card', date: '2025-01-01' };
    expect(normalizeExpensePaymentDetails({ paymentDetails }).paymentDetails).toBe(paymentDetails);
  });

  test('builds create payload defaults from partial expense data', () => {
    const payload = buildNewExpenseData({
      projectId: 'project-1',
      description: 'Lumber',
      amount: 125,
      vendor: '',
      tags: ['materials'],
    });

    expect(payload).toMatchObject({
      projectId: 'project-1',
      category: 'other',
      description: 'Lumber',
      amount: 125,
      status: 'pending',
      vendor: null,
      subcontractorId: null,
      subcontractorName: null,
      tags: ['materials'],
    });
    expect(payload.date).toBeInstanceOf(Date);
  });

  test('detects whether created expenses are visible in the active tab', () => {
    const pendingExpense = { status: 'pending' } as Expense;
    const paidExpense = { status: 'paid' } as Expense;

    expect(shouldShowCreatedExpenseInCurrentTab(pendingExpense, 0)).toBe(true);
    expect(shouldShowCreatedExpenseInCurrentTab(pendingExpense, 1)).toBe(true);
    expect(shouldShowCreatedExpenseInCurrentTab(pendingExpense, 2)).toBe(false);
    expect(shouldShowCreatedExpenseInCurrentTab(paidExpense, 1)).toBe(false);
    expect(shouldShowCreatedExpenseInCurrentTab(paidExpense, 2)).toBe(true);
  });

  test('suppresses default success when a new expense is hidden by the active tab', () => {
    expect(shouldShowDefaultSaveSuccess({ status: 'paid' }, 1)).toBe(false);
    expect(shouldShowDefaultSaveSuccess({ status: 'pending' }, 2)).toBe(false);
    expect(shouldShowDefaultSaveSuccess({ id: 'expense-1', status: 'paid' }, 1)).toBe(true);
    expect(shouldShowDefaultSaveSuccess({ status: 'paid' }, 0)).toBe(true);
  });
});
