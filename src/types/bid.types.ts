import type { LineItem } from './project.types';

export type BidStatus = 
  | 'draft' 
  | 'submitted' 
  | 'accepted' 
  | 'rejected' 
  | 'expired' 
  | 'withdrawn' 
  | 'revision_requested';

export type BidPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface BidPaymentStage {
  id: string;
  name: string;
  description?: string; // Made optional
  percentage: number;
  amount: number;
  dueDate?: Date | null; // Changed to Date | null
  phaseId?: string;
  phaseName?: string;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'in_progress' | 'requires_approval' | 'completed'; // Added more statuses for flexibility
  paidAmount?: number;
  paidDate?: Date | null; // Changed to Date | null
  paymentDate?: Date | null;
  expenseId?: string; // Link to the associated expense
  invoiceId?: string; // Link to an invoice if applicable
  isPaid?: boolean; // Explicit flag if the stage is considered fully paid
  isFixedAmount?: boolean;
  fixedAmount?: number;
  partialPayment?: boolean;
  originalAmount?: number;
  remainingAmount?: number;
  parentStageId?: string;
  createdAt?: Date; // Added for tracking
  updatedAt?: Date; // Added for tracking
  /** Specific completion requirements for this payment stage. */
  completionRequirements?: string; 
}

export interface BidVersion {
  id: string;
  versionNumber: number;
  createdAt: Date;
  totalAmount: number;
  notes?: string;
  lineItems?: LineItem[];
  attachments?: string[];
}

export interface BidPaymentProgress {
  paid: number;
  pending: number;
  remaining: number;
}

export interface BidAttachment {
  name: string;
  url: string;
}

export interface Bid {
  id: string;
  userId: string;
  projectId: string;
  phaseId?: string;
  phaseName?: string;
  projectName?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  contractorName?: string;
  bidAmount?: number;
  title?: string;
  scope?: string;
  status: BidStatus;
  priority?: BidPriority;
  submissionDeadline?: Date | null;
  startDate?: Date | null;
  completionDate?: Date | null;
  totalAmount: number;
  timeline?: number; // Duration in days
  paymentTerms?: string;
  currentVersionId?: string;
  versions?: BidVersion[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  notes?: string;
  requiresInsurance?: boolean;
  requiresBond?: boolean;
  isPublic?: boolean;
  isApproved?: boolean;
  attachments?: BidAttachment[] | string[];
  paymentSchedule?: BidPaymentStage[];
  paymentProgress?: BidPaymentProgress;
  categoryId?: string;
  submissionDate?: Date | null; // Changed to Date | null
  approvalDate?: Date | null; // Changed to Date | null
  rejectionDate?: Date | null; // Changed to Date | null
  rejectionReason?: string;
  // TODO: Investigate and remove if confirmed unused (Redundant with scope?)
  // description?: string;
}
