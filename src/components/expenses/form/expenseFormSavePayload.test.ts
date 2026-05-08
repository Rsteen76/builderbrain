import { buildExpenseSavePayload } from './expenseFormSavePayload';

describe('buildExpenseSavePayload', () => {
  test('builds simple expense payload while preserving save mappings', () => {
    const payload = buildExpenseSavePayload({
      formData: {
        projectId: 'project-1',
        phaseId: '',
        category: 'materials',
        categoryId: '',
        description: 'Concrete',
        amount: 125,
        date: '2026-01-15T00:00:00.000Z',
        status: 'approved',
        vendor: 'Supply Co',
        subcontractorId: 'sub-1',
        bidId: '',
      },
      showLineItems: false,
      lineItems: [],
      lineItemsTotal: 0,
      receiptPreview: null,
      tags: ['site'],
      paymentMethod: '',
      paymentDate: '2026-01-16',
      referenceNumber: '',
      paymentNotes: '',
      userId: 'user-1',
    });

    expect(payload).toMatchObject({
      projectId: 'project-1',
      phaseId: null,
      category: 'materials',
      description: 'Concrete',
      amount: 125,
      lineItems: [],
      receiptUrl: null,
      status: 'approved',
      vendor: 'Supply Co',
      subcontractorId: null,
      paymentDetails: null,
      bidId: null,
      tags: ['site'],
      userId: 'user-1',
    });
    expect(payload.categoryId).toBeUndefined();
    expect(payload.date).toBeInstanceOf(Date);
  });

  test('uses line item totals and category mapping for itemized expenses', () => {
    const payload = buildExpenseSavePayload({
      formData: {
        projectId: 'project-1',
        category: 'subcontractor',
        description: 'Framing',
        amount: 20,
        date: new Date('2026-02-01T00:00:00.000Z'),
        status: 'pending',
        vendor: 'Ignored Vendor',
        subcontractorId: 'sub-1',
      },
      showLineItems: true,
      lineItems: [
        {
          id: 'line-1',
          description: 'Framing labor',
          quantity: 2,
          unitCost: 150,
          totalPrice: 300,
        },
      ],
      lineItemsTotal: 300,
      receiptPreview: 'data:image/png;base64,receipt',
      tags: [],
      paymentMethod: '',
      paymentDate: '2026-02-02',
      referenceNumber: '',
      paymentNotes: '',
      expenseId: 'expense-1',
    });

    expect(payload.amount).toBe(300);
    expect(payload.id).toBe('expense-1');
    expect(payload.vendor).toBeNull();
    expect(payload.subcontractorId).toBe('sub-1');
    expect(payload.receiptUrl).toBe('data:image/png;base64,receipt');
    expect(payload.lineItems).toEqual([
      {
        id: 'line-1',
        description: 'Framing labor',
        quantity: 2,
        unit: '',
        unitCost: 150,
        totalCost: 300,
        category: 'subcontractor',
      },
    ]);
  });

  test('includes payment details only for paid status', () => {
    const payload = buildExpenseSavePayload({
      formData: {
        projectId: 'project-1',
        category: 'other',
        description: 'Closeout',
        amount: 50,
        date: new Date('2026-03-01T00:00:00.000Z'),
        status: 'paid',
      },
      showLineItems: false,
      lineItems: [],
      lineItemsTotal: 0,
      receiptPreview: null,
      tags: [],
      paymentMethod: 'check',
      paymentDate: '2026-03-02',
      referenceNumber: '1001',
      paymentNotes: 'Final',
    });

    expect(payload.paymentDetails).toEqual({
      method: 'check',
      date: '2026-03-02',
      referenceNumber: '1001',
      notes: 'Final',
    });
  });
});
