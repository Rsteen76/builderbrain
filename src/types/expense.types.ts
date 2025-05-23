import { LineItem } from './project.types';

export type ExpenseCategory = 'labor' | 'materials' | 'equipment' | 'permits' | 'subcontractor' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'partially_paid' | 'processing' | 'requires_action';

export interface PaymentDetails {
  method: string;
  /** The date the payment was made. */
  date: Date; 
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
  categoryId?: string;
  description: string;
  amount: number;
  amountPaid?: number;
  amountRemaining?: number;
  /** The primary date of the expense record. */
  date: Date;
  receiptUrl?: string;
  vendor?: string | null;
  subcontractorId?: string | null;
  subcontractorName?: string | null;
  status: ExpenseStatus;
  createdBy: string;
  approvedBy?: string;
  /** Timestamp of when the expense record was created. */
  createdAt: Date;
  /** Timestamp of the last update to the expense record. */
  updatedAt: Date;
  notes?: string;
  /** @deprecated Use phaseName instead */
  buildingPhase?: string;
  lineItems?: LineItem[];
  paymentDetails?: PaymentDetails | null;
  /** Array of transaction IDs associated with this expense */
  transactionIds?: string[];
  tags?: string[];
  projectName?: string;
  /** Reference to the bid this expense was created from */
  bidId?: string | null;
  /** Reference to the payment stage this expense corresponds to */
  paymentStageId?: string | null;
  /** Reference to the original expense if this is a payment record */
  originalExpenseId?: string | null;
  /** Due date for this expense, if applicable. */
  dueDate?: Date | null;
  /** Date of the last payment made towards this expense. */
  lastPaymentDate?: Date | null;
}