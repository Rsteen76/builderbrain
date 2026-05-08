import type { Expense } from '../../../types';
import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';
import { cleanForFirestore } from '../../../utils/firestoreUtils';
import { buildExpenseLineItems } from './expenseLineItems';

interface BuildExpenseSavePayloadInput {
  formData: Partial<Expense>;
  showLineItems: boolean;
  lineItems: ExpenseLineItemFormData[];
  lineItemsTotal: number;
  receiptPreview: string | null;
  tags: string[];
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  paymentNotes: string;
  expenseId?: string;
  userId?: string;
}

export const buildExpenseSavePayload = ({
  formData,
  showLineItems,
  lineItems,
  lineItemsTotal,
  receiptPreview,
  tags,
  paymentMethod,
  paymentDate,
  referenceNumber,
  paymentNotes,
  expenseId,
  userId,
}: BuildExpenseSavePayloadInput): Partial<Expense> => {
  const calculatedTotal = showLineItems ? lineItemsTotal : formData.amount || 0;
  const finalLineItems = showLineItems ? buildExpenseLineItems(lineItems, formData.category) : [];

  const finalData = cleanForFirestore({
    ...formData,
    amount: calculatedTotal,
    date: formData.date instanceof Date ? formData.date : new Date(formData.date || Date.now()),
    lineItems: finalLineItems,
    projectId: formData.projectId || null,
    phaseId: formData.phaseId || null,
    categoryId: formData.categoryId || undefined,
    receiptUrl: receiptPreview || null,
    status: formData.status || 'pending',
    subcontractorId: formData.category === 'subcontractor' ? (formData.subcontractorId || null) : null,
    vendor: formData.category !== 'subcontractor' ? (formData.vendor || null) : null,
    tags,
    paymentDetails: formData.status === 'paid' ? {
      method: paymentMethod,
      date: paymentDate,
      referenceNumber,
      notes: paymentNotes,
    } : null,
    ...(expenseId && { id: expenseId }),
    bidId: formData.bidId || null,
  }) as Partial<Expense>;

  if (userId) {
    finalData.userId = userId;
  }

  return finalData;
};
