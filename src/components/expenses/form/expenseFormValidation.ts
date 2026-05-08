import type { Expense } from '../../../types';
import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';
import type { FormErrors } from './types';

interface ValidateExpenseFormInput {
  formData: Partial<Expense>;
  showLineItems: boolean;
  lineItems: ExpenseLineItemFormData[];
  lineItemsTotal: number;
}

export const validateExpenseForm = ({
  formData,
  showLineItems,
  lineItems,
  lineItemsTotal,
}: ValidateExpenseFormInput): FormErrors => {
  const validationErrors: FormErrors = {};

  if (!formData.description?.trim()) {
    validationErrors.description = 'Description is required';
  }

  if (!formData.projectId) {
    validationErrors.projectId = 'Project is required';
  }

  if (!showLineItems && (formData.amount === undefined || formData.amount <= 0)) {
    validationErrors.amount = 'Amount must be greater than 0';
  }

  if (!formData.date) {
    validationErrors.date = 'Date is required';
  }

  if (formData.category === 'subcontractor' && !formData.subcontractorId) {
    validationErrors.subcontractorId = 'Subcontractor is required';
  }

  if (showLineItems && lineItems.length > 0) {
    let hasLineItemErrors = false;
    const lineItemErrors: FormErrors['lineItems'] = {};

    lineItems.forEach(item => {
      const itemErrors: NonNullable<FormErrors['lineItems']>[string] = {};
      let hasItemError = false;

      if (!item.description.trim()) {
        itemErrors.description = 'Description is required';
        hasItemError = true;
      }

      if (item.quantity <= 0) {
        itemErrors.quantity = 'Quantity must be greater than 0';
        hasItemError = true;
      }

      if (item.unitCost < 0) {
        itemErrors.unitCost = 'Unit cost cannot be negative';
        hasItemError = true;
      }

      if (hasItemError) {
        lineItemErrors[item.id] = itemErrors;
        hasLineItemErrors = true;
      }
    });

    if (hasLineItemErrors) {
      validationErrors.lineItems = lineItemErrors;
    }

    if (lineItemsTotal <= 0) {
      if (!validationErrors.lineItems) {
        validationErrors.lineItems = {};
      }

      validationErrors.lineItems.general = 'Total amount must be greater than 0';
    }
  }

  return validationErrors;
};
