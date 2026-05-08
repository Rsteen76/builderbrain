import { Expense, ExpenseCategory, ExpenseStatus, Project } from '../../../types';
import { UseExpensesFilters } from '../../../hooks/use-expenses';

export type ExpenseSortField = 'amount' | 'date';
export type ExpenseSortDirection = 'asc' | 'desc';
export type ExpenseGroupBy = 'none' | 'project' | 'category' | 'vendor' | 'subcontractor';

export const ALL_EXPENSES_GROUP_NAME = 'All Expenses';

export function buildExpenseHookFilters(
  tabValue: number,
  categoryFilter: string | null,
  projectFilter: string | null,
  projectId?: string,
): UseExpensesFilters {
  const filters: UseExpensesFilters = {};

  if (tabValue === 1) {
    filters.status = ['pending', 'approved'] as ExpenseStatus[];
  } else if (tabValue === 2) {
    filters.status = 'paid';
  }

  if (categoryFilter) {
    filters.category = categoryFilter as ExpenseCategory;
  }

  if (projectId) {
    filters.projectId = projectId;
  } else if (projectFilter) {
    filters.projectId = projectFilter;
  }

  return filters;
}

export function addProjectNames(expenses: Expense[] | undefined, projects: Project[]): Expense[] {
  if (!expenses) return [];

  return expenses.map(expense => ({
    ...expense,
    projectName: projects.find(project => project.id === expense.projectId)?.name || 'Unknown Project',
  }));
}

export function formatExpenseCategory(category: string | undefined): string {
  if (!category) return 'Other';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function filterExpensesBySearch(expenses: Expense[], searchTerm: string): Expense[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  if (!normalizedSearchTerm) return expenses;

  return expenses.filter(expense => (
    expense.description.toLowerCase().includes(normalizedSearchTerm) ||
    expense.vendor?.toLowerCase().includes(normalizedSearchTerm) ||
    expense.projectName?.toLowerCase().includes(normalizedSearchTerm) ||
    expense.subcontractorName?.toLowerCase().includes(normalizedSearchTerm)
  ));
}

export function sortExpenses(
  expenses: Expense[],
  sortField: ExpenseSortField | null,
  sortDirection: ExpenseSortDirection,
): Expense[] {
  if (!sortField) return expenses;

  return [...expenses].sort((a, b) => {
    if (sortField === 'amount') {
      return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }

    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortDirection === 'asc'
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
}

export function groupExpenses(expenses: Expense[], groupBy: ExpenseGroupBy): Record<string, Expense[]> {
  if (groupBy === 'none') {
    return { [ALL_EXPENSES_GROUP_NAME]: expenses };
  }

  return expenses.reduce<Record<string, Expense[]>>((groups, expense) => {
    const groupKey = getExpenseGroupKey(expense, groupBy);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(expense);
    return groups;
  }, {});
}

export function calculateGroupTotals(groupedExpenses: Record<string, Expense[]>): Record<string, number> {
  return Object.entries(groupedExpenses).reduce<Record<string, number>>((totals, [groupName, expenses]) => {
    totals[groupName] = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return totals;
  }, {});
}

export function getNextSortState(
  currentField: ExpenseSortField | null,
  currentDirection: ExpenseSortDirection,
  requestedField: ExpenseSortField,
): { sortField: ExpenseSortField; sortDirection: ExpenseSortDirection } {
  if (currentField === requestedField) {
    return {
      sortField: requestedField,
      sortDirection: currentDirection === 'asc' ? 'desc' : 'asc',
    };
  }

  return { sortField: requestedField, sortDirection: 'desc' };
}

export function getRemainingExpenseAmount(expense: Expense): number {
  const amountPaid = expense.amountPaid || 0;
  return expense.status === 'paid' ? expense.amount : expense.amount - amountPaid;
}

export function getExpenseStatusPresentation(status: ExpenseStatus): {
  label: string;
  color: 'success' | 'warning' | 'info' | 'error' | 'default';
} {
  switch (status) {
    case 'paid':
      return { label: 'Paid', color: 'success' };
    case 'partially_paid':
      return { label: 'Partially Paid', color: 'info' };
    case 'pending':
      return { label: 'Pending', color: 'warning' };
    case 'approved':
      return { label: 'Approved', color: 'default' };
    case 'rejected':
      return { label: 'Rejected', color: 'error' };
    default:
      return { label: status, color: 'warning' };
  }
}

function getExpenseGroupKey(expense: Expense, groupBy: ExpenseGroupBy): string {
  switch (groupBy) {
    case 'project':
      return expense.projectName || 'No Project';
    case 'category':
      return formatExpenseCategory(expense.category);
    case 'vendor':
      return expense.vendor || 'No Vendor';
    case 'subcontractor':
      return expense.subcontractorName || 'No Subcontractor';
    default:
      return ALL_EXPENSES_GROUP_NAME;
  }
}
