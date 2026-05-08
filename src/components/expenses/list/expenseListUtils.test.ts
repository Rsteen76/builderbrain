import { Expense, Project } from '../../../types';
import {
  addProjectNames,
  buildExpenseHookFilters,
  calculateGroupTotals,
  filterExpensesBySearch,
  getExpenseStatusPresentation,
  getNextSortState,
  getRemainingExpenseAmount,
  groupExpenses,
  sortExpenses,
} from './expenseListUtils';

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
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

describe('expenseListUtils', () => {
  test('builds query filters from tabs and page filters', () => {
    expect(buildExpenseHookFilters(0, null, null)).toEqual({});
    expect(buildExpenseHookFilters(1, 'labor', 'project-filter')).toEqual({
      status: ['pending', 'approved'],
      category: 'labor',
      projectId: 'project-filter',
    });
    expect(buildExpenseHookFilters(2, null, 'project-filter', 'project-prop')).toEqual({
      status: 'paid',
      projectId: 'project-prop',
    });
  });

  test('adds project names with an unknown fallback', () => {
    const projects: Project[] = [
      { id: 'project-1', userId: 'user-1', name: 'Kitchen Remodel' } as Project,
    ];

    expect(addProjectNames([expense(), expense({ id: 'expense-2', projectId: 'missing' })], projects)).toEqual([
      expect.objectContaining({ id: 'expense-1', projectName: 'Kitchen Remodel' }),
      expect.objectContaining({ id: 'expense-2', projectName: 'Unknown Project' }),
    ]);
  });

  test('filters expenses by description, vendor, project, or subcontractor', () => {
    const expenses = [
      expense({ id: 'description-match', description: 'Framing lumber' }),
      expense({ id: 'vendor-match', description: 'Invoice', vendor: 'Lumber Yard' }),
      expense({ id: 'project-match', description: 'Invoice', projectName: 'Garage Build' }),
      expense({ id: 'sub-match', description: 'Invoice', subcontractorName: 'North Electric' }),
      expense({ id: 'miss', description: 'Concrete' }),
    ];

    expect(filterExpensesBySearch(expenses, 'lumber').map(item => item.id)).toEqual([
      'description-match',
      'vendor-match',
    ]);
    expect(filterExpensesBySearch(expenses, 'garage').map(item => item.id)).toEqual(['project-match']);
    expect(filterExpensesBySearch(expenses, 'electric').map(item => item.id)).toEqual(['sub-match']);
    expect(filterExpensesBySearch(expenses, '   ')).toBe(expenses);
  });

  test('sorts by amount or date without mutating the input array', () => {
    const expenses = [
      expense({ id: 'middle', amount: 20, date: new Date('2026-02-01') }),
      expense({ id: 'high', amount: 30, date: new Date('2026-03-01') }),
      expense({ id: 'low', amount: 10, date: new Date('2026-01-01') }),
    ];

    expect(sortExpenses(expenses, 'amount', 'asc').map(item => item.id)).toEqual(['low', 'middle', 'high']);
    expect(sortExpenses(expenses, 'date', 'desc').map(item => item.id)).toEqual(['high', 'middle', 'low']);
    expect(expenses.map(item => item.id)).toEqual(['middle', 'high', 'low']);
    expect(sortExpenses(expenses, null, 'desc')).toBe(expenses);
  });

  test('groups expenses and calculates totals', () => {
    const grouped = groupExpenses([
      expense({ id: 'one', category: 'materials', amount: 25 }),
      expense({ id: 'two', category: 'materials', amount: 75 }),
      expense({ id: 'three', category: 'labor', amount: 50 }),
    ], 'category');

    expect(Object.keys(grouped)).toEqual(['Materials', 'Labor']);
    expect(calculateGroupTotals(grouped)).toEqual({
      Materials: 100,
      Labor: 50,
    });
  });

  test('calculates sort toggles and expense presentation values', () => {
    expect(getNextSortState(null, 'desc', 'amount')).toEqual({ sortField: 'amount', sortDirection: 'desc' });
    expect(getNextSortState('amount', 'desc', 'amount')).toEqual({ sortField: 'amount', sortDirection: 'asc' });
    expect(getExpenseStatusPresentation('partially_paid')).toEqual({ label: 'Partially Paid', color: 'info' });
    expect(getRemainingExpenseAmount(expense({ amount: 100, amountPaid: 40, status: 'partially_paid' }))).toBe(60);
    expect(getRemainingExpenseAmount(expense({ amount: 100, amountPaid: 40, status: 'paid' }))).toBe(100);
  });
});
