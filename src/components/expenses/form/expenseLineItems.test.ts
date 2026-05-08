import { buildExpenseLineItems, mapExpenseCategoryToLineItemCategory } from './expenseLineItems';

describe('expense line item helpers', () => {
  test('maps plural expense categories to line item categories', () => {
    expect(mapExpenseCategoryToLineItemCategory('materials')).toBe('material');
    expect(mapExpenseCategoryToLineItemCategory('permits')).toBe('permit');
    expect(mapExpenseCategoryToLineItemCategory('equipment')).toBe('equipment');
    expect(mapExpenseCategoryToLineItemCategory(undefined)).toBe('other');
  });

  test('builds persisted line items using category rules and non-negative unit costs', () => {
    const items = buildExpenseLineItems(
      [
        {
          id: 'line-1',
          description: 'Concrete material',
          quantity: 2,
          unitCost: 50,
          totalPrice: 100,
        },
        {
          id: 'line-2',
          description: 'Permit adjustment',
          quantity: 1,
          unitCost: -10,
          totalPrice: -10,
        },
      ],
      'permits'
    );

    expect(items).toEqual([
      {
        id: 'line-1',
        description: 'Concrete material',
        quantity: 2,
        unit: '',
        unitCost: 50,
        totalCost: 100,
        category: 'material',
      },
      {
        id: 'line-2',
        description: 'Permit adjustment',
        quantity: 1,
        unit: '',
        unitCost: 0,
        totalCost: -10,
        category: 'permit',
      },
    ]);
  });

  test('forces subcontractor category for itemized subcontractor expenses', () => {
    const items = buildExpenseLineItems(
      [
        {
          id: 'line-1',
          description: 'Material reimbursement',
          quantity: 1,
          unitCost: 20,
          totalPrice: 20,
        },
      ],
      'subcontractor'
    );

    expect(items[0].category).toBe('subcontractor');
  });
});
