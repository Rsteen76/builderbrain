import { validateExpenseForm } from './expenseFormValidation';

describe('validateExpenseForm', () => {
  const baseFormData = {
    projectId: 'project-1',
    description: 'Concrete material',
    amount: 100,
    date: new Date('2024-01-15T00:00:00.000Z'),
    category: 'materials' as const,
  };

  test('requires core fields for simple expenses', () => {
    const errors = validateExpenseForm({
      formData: {
        description: '  ',
        amount: 0,
        category: 'materials',
      },
      showLineItems: false,
      lineItems: [],
      lineItemsTotal: 0,
    });

    expect(errors).toMatchObject({
      description: 'Description is required',
      projectId: 'Project is required',
      amount: 'Amount must be greater than 0',
      date: 'Date is required',
    });
  });

  test('requires a subcontractor for subcontractor expenses', () => {
    const errors = validateExpenseForm({
      formData: {
        ...baseFormData,
        category: 'subcontractor',
      },
      showLineItems: false,
      lineItems: [],
      lineItemsTotal: 0,
    });

    expect(errors.subcontractorId).toBe('Subcontractor is required');
  });

  test('validates line item rows and total when itemized', () => {
    const errors = validateExpenseForm({
      formData: {
        ...baseFormData,
        amount: 0,
      },
      showLineItems: true,
      lineItems: [
        {
          id: 'line-1',
          description: '',
          quantity: 0,
          unitCost: -5,
          totalPrice: 0,
        },
      ],
      lineItemsTotal: 0,
    });

    expect(errors.amount).toBeUndefined();
    expect(errors.lineItems?.['line-1']).toMatchObject({
      description: 'Description is required',
      quantity: 'Quantity must be greater than 0',
      unitCost: 'Unit cost cannot be negative',
    });
    expect(errors.lineItems?.general).toBe('Total amount must be greater than 0');
  });
});
