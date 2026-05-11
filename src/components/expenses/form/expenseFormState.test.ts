import {
  buildExpenseFormStateFromExpense,
  buildNewExpenseFormState,
  buildPhaseOptions,
  getProjectPhasesForExpense,
} from './expenseFormState';
import type { Expense, Project } from '../../../types';

const projects: Project[] = [
  {
    id: 'project-1',
    name: 'Main Project',
    description: 'Main test project',
    status: 'active',
    userId: 'user-1',
    startDate: new Date('2025-01-01'),
    budget: 100000,
    location: '123 Main St',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    progress: 0,
    phases: [
      { id: 'phase-1', name: 'Foundation', status: 'planning', progress: 0, budget: 0, actualCost: 0 },
      { id: '', name: 'Missing ID', status: 'planning', progress: 0, budget: 0, actualCost: 0 },
    ],
  } as Project,
];

describe('expenseFormState', () => {
  test('builds phase options with stable fallbacks', () => {
    expect(buildPhaseOptions([
      { id: 'phase-1', name: 'Foundation' } as any,
      { id: undefined, name: undefined } as any,
    ])).toEqual([
      { value: 'phase-1', label: 'Foundation' },
      { value: '', label: 'Unnamed Phase' },
    ]);
  });

  test('gets only project phases with usable ids', () => {
    expect(getProjectPhasesForExpense('project-1', projects).map(phase => phase.id)).toEqual(['phase-1']);
    expect(getProjectPhasesForExpense('missing', projects)).toEqual([]);
  });

  test('builds edit state from an existing expense', () => {
    const expense: Partial<Expense> = {
      id: 'expense-1',
      projectId: 'project-1',
      description: 'Concrete',
      amount: 500,
      date: new Date('2025-02-03'),
      category: 'materials',
      status: 'paid',
      receiptUrl: 'https://example.com/receipt.jpg',
      paymentDetails: {
        method: 'check',
        date: new Date('2025-02-04'),
        referenceNumber: '1001',
        notes: 'Cleared',
      },
      lineItems: [
        { id: 'line-1', description: 'Bags', quantity: 2, unitCost: 25, totalPrice: 50 },
        { description: 'Labor', quantity: 3, unitCost: 40, totalPrice: 120 } as any,
      ],
    };

    const state = buildExpenseFormStateFromExpense(expense, projects);

    expect(state.formData.projectId).toBe('project-1');
    expect(state.formData.description).toBe('Concrete');
    expect(state.currentProjectPhases.map(phase => phase.id)).toEqual(['phase-1']);
    expect(state.showLineItems).toBe(true);
    expect(state.lineItems).toHaveLength(2);
    expect(state.lineItems[0]).toMatchObject({ id: 'line-1', totalPrice: 50 });
    expect(state.lineItems[1].id).toEqual(expect.any(String));
    expect(state.receiptPreview).toBe('https://example.com/receipt.jpg');
    expect(state.paymentMethod).toBe('check');
    expect(state.paymentDate).toBe('2025-02-04');
    expect(state.referenceNumber).toBe('1001');
    expect(state.paymentNotes).toBe('Cleared');
  });

  test('builds new expense state from the first project', () => {
    const state = buildNewExpenseFormState(projects);

    expect(state.formData).toMatchObject({
      projectId: 'project-1',
      amount: 0,
      category: 'other',
      status: 'pending',
    });
    expect(state.lineItems).toEqual([]);
    expect(state.showLineItems).toBe(false);
    expect(state.receiptPreview).toBeNull();
    expect(state.paymentMethod).toBe('other');
  });
});
