import { LineItem } from './project.types';

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
  description: string;
  percentage: number;
  amount: number;
  dueDate?: Date | string;
  status?: 'pending' | 'paid' | 'overdue';
  paidDate?: Date | string;
  paid?: boolean;
  isFixedAmount?: boolean;
  fixedAmount?: number;
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
  submissionDate?: Date | string;
  approvalDate?: Date | string;
  rejectionDate?: Date | string;
  rejectionReason?: string;
  description?: string;
} 