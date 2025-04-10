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
  /** 
   * @deprecated Use detailedCategoryId instead. 
   * Simple category for basic expense type. 
   */
  category: ExpenseCategory;
  detailedCategoryId?: string;
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
  paymentDetails?: PaymentDetails | null;
  tags?: string[];
  projectName?: string;
  /** Reference to the bid this expense was created from */
  bidId?: string | null;
  /** Reference to the payment stage this expense corresponds to */
  paymentStageId?: string | null;
} 