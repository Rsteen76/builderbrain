import { v4 as uuidv4 } from 'uuid';

import type { Expense, Project, ProjectPhase } from '../../../types';
import type { ExpenseLineItemFormData } from '../../../hooks/useExpenseLineItems';

export interface ExpenseFormStateSnapshot {
  formData: Partial<Expense>;
  lineItems: ExpenseLineItemFormData[];
  showLineItems: boolean;
  receiptPreview: string | null;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  paymentNotes: string;
  currentProjectPhases: ProjectPhase[];
}

export const getTodayInputValue = (): string => new Date().toISOString().split('T')[0];

export const getProjectPhasesForExpense = (
  projectId: string | undefined,
  projects: Project[],
): ProjectPhase[] => {
  const currentProject = projects.find(project => project.id === projectId);
  return ((currentProject?.phases || []).filter(phase => typeof phase.id === 'string' && phase.id !== '') as ProjectPhase[]);
};

export const buildPhaseOptions = (projectPhases: ProjectPhase[]): Array<{ value: string; label: string }> => (
  projectPhases.map(phase => ({
    value: phase.id || '',
    label: phase.name || 'Unnamed Phase',
  }))
);

export const buildExpenseFormStateFromExpense = (
  expense: Partial<Expense>,
  projects: Project[],
): ExpenseFormStateSnapshot => {
  const lineItems = (expense.lineItems || []).map(lineItem => ({
    id: lineItem.id || uuidv4(),
    description: lineItem.description || '',
    quantity: lineItem.quantity || 1,
    unitCost: lineItem.unitCost || 0,
    totalPrice: (lineItem.quantity || 1) * (lineItem.unitCost || 0),
  }));

  const paymentDate = expense.paymentDetails?.date
    ? new Date(expense.paymentDetails.date).toISOString().split('T')[0]
    : getTodayInputValue();
  const hasPaymentDetails = (expense.status === 'paid' || expense.status === 'partially_paid') && expense.paymentDetails;

  return {
    formData: {
      projectId: expense.projectId || projects[0]?.id || 'undefined',
      description: expense.description || '',
      amount: expense.amount || 0,
      date: expense.date ? new Date(expense.date) : new Date(),
      category: expense.category || 'other',
      categoryId: expense.categoryId || '',
      vendor: expense.vendor || '',
      subcontractorId: expense.subcontractorId || '',
      subcontractorName: expense.subcontractorName || '',
      phaseId: expense.phaseId || '',
      status: expense.status || 'pending',
      notes: expense.notes || '',
      tags: expense.tags || [],
      amountPaid: expense.amountPaid || 0,
      paymentDetails: expense.paymentDetails || null,
      bidId: expense.bidId || '',
      paymentStageId: expense.paymentStageId || '',
    },
    lineItems,
    showLineItems: lineItems.length > 0,
    receiptPreview: expense.receiptUrl || null,
    paymentMethod: hasPaymentDetails ? expense.paymentDetails?.method || 'other' : '',
    paymentDate: hasPaymentDetails ? paymentDate : getTodayInputValue(),
    referenceNumber: hasPaymentDetails ? expense.paymentDetails?.referenceNumber || '' : '',
    paymentNotes: hasPaymentDetails ? expense.paymentDetails?.notes || '' : '',
    currentProjectPhases: expense.projectId ? getProjectPhasesForExpense(expense.projectId, projects) : [],
  };
};

export const buildNewExpenseFormState = (projects: Project[]): ExpenseFormStateSnapshot => ({
  formData: {
    projectId: projects[0]?.id || 'undefined',
    description: '',
    amount: 0,
    date: new Date(),
    category: 'other',
    categoryId: '',
    vendor: '',
    subcontractorId: '',
    subcontractorName: '',
    phaseId: '',
    status: 'pending',
    notes: '',
    tags: [],
    amountPaid: 0,
    bidId: '',
    paymentStageId: '',
  },
  lineItems: [],
  showLineItems: false,
  receiptPreview: null,
  paymentMethod: 'other',
  paymentDate: getTodayInputValue(),
  referenceNumber: '',
  paymentNotes: '',
  currentProjectPhases: [],
});
