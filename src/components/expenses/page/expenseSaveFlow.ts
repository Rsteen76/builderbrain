import type { Expense, PaymentDetails } from '../../../types';

export const normalizeExpensePaymentDetails = (expenseData: Partial<Expense>): Partial<Expense> => ({
  ...expenseData,
  paymentDetails: expenseData.paymentDetails === undefined ? null : expenseData.paymentDetails,
});

export const buildNewExpenseData = (
  expenseData: Partial<Expense>,
): Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> => ({
  projectId: expenseData.projectId || '',
  category: expenseData.category || 'other',
  description: expenseData.description || '',
  amount: expenseData.amount || 0,
  date: expenseData.date || new Date(),
  status: expenseData.status || 'pending',
  vendor: expenseData.vendor || null,
  subcontractorId: expenseData.subcontractorId || null,
  subcontractorName: expenseData.subcontractorName || null,
  notes: expenseData.notes,
  phaseId: expenseData.phaseId || undefined,
  phaseName: expenseData.phaseName || undefined,
  tags: expenseData.tags || [],
  lineItems: expenseData.lineItems || undefined,
  paymentDetails: (expenseData.paymentDetails || undefined) as PaymentDetails | undefined,
});

export const shouldShowCreatedExpenseInCurrentTab = (savedExpense: Expense, tabValue: number): boolean => (
  tabValue === 0 ||
  (tabValue === 1 && savedExpense.status !== 'paid') ||
  (tabValue === 2 && savedExpense.status === 'paid')
);

export const shouldShowDefaultSaveSuccess = (
  processedExpenseData: Partial<Expense>,
  tabValue: number,
): boolean => !(
  processedExpenseData.id === undefined &&
  tabValue !== 0 &&
  (
    (tabValue === 1 && processedExpenseData.status === 'paid') ||
    (tabValue === 2 && processedExpenseData.status !== 'paid')
  )
);
