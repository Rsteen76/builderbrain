import { LineItem } from './project.types';

export type ExpenseCategory = 'labor' | 'materials' | 'equipment' | 'permits' | 'subcontractor' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface PaymentDetails {
  method: string;
  date: string;
  referenceNumber?: string;
  notes?: string;
}

export interface Expense {
  id?: string;
  userId: string;
  projectId: string;
  phaseId?: string;
  phaseName?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date | string;
  receiptUrl?: string;
  vendor?: string | null;
  subcontractorId?: string | null;
  subcontractorName?: string | null;
  status: ExpenseStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  notes?: string;
  /** @deprecated Use phaseName instead */
  buildingPhase?: string;
  lineItems?: LineItem[];
  paymentDetails?: PaymentDetails;
  tags?: string[];
  projectName?: string;
  /** Reference to the bid this expense was created from */
  bidId?: string;
  /** Reference to the payment stage this expense corresponds to */
  paymentStageId?: string;
} 