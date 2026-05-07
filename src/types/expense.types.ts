import { LineItem } from './project.types';

export type ExpenseCategory = 'labor' | 'materials' | 'equipment' | 'permits' | 'subcontractor' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'partially_paid';

export interface PaymentDetails {
  method: string;
  date: Date | string;
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
  /** Due date for this expense */
  dueDate?: Date | string | null;
  /** Last payment date */
  lastPaymentDate?: Date | string | null;
}
