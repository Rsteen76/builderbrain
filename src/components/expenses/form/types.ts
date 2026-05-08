import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';

export interface LineItemErrors {
  description?: string;
  quantity?: string;
  unitCost?: string;
}

export interface FormErrors {
  [key: string]: any;
  lineItems?: {
    [id: string]: LineItemErrors;
  } & { general?: string };
}

export type ExpenseLineItemForm = ExpenseLineItemFormData;
