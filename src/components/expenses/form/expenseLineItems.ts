import type { ExpenseCategory, LineItem as ExpenseLineItem } from '../../../types';
import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';

export const mapExpenseCategoryToLineItemCategory = (
  expCategory: ExpenseCategory | undefined
): ExpenseLineItem['category'] => {
  switch (expCategory) {
    case 'materials':
      return 'material';
    case 'permits':
      return 'permit';
    case 'labor':
      return 'labor';
    case 'equipment':
      return 'equipment';
    case 'subcontractor':
      return 'subcontractor';
    case 'other':
      return 'other';
    default:
      return 'other';
  }
};

export const buildExpenseLineItems = (
  lineItems: ExpenseLineItemFormData[],
  expenseCategory: ExpenseCategory | undefined
): ExpenseLineItem[] => {
  return lineItems.map((li): ExpenseLineItem => {
    let itemCategory: ExpenseLineItem['category'];

    if (expenseCategory === 'subcontractor') {
      itemCategory = 'subcontractor';
    } else if (li.description.toLowerCase().includes('material')) {
      itemCategory = 'material';
    } else {
      itemCategory = mapExpenseCategoryToLineItemCategory(expenseCategory);
    }

    return {
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unit: '',
      unitCost: li.unitCost > 0 ? li.unitCost : 0,
      totalCost: li.totalPrice,
      category: itemCategory,
    };
  });
};
