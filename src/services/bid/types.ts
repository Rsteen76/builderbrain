import { Timestamp } from 'firebase/firestore';
import type {
  BidPriority,
  BidStatus,
  BidVersion,
  LineItem,
  BidPaymentStage,
} from '../../types';

export interface FirestoreBid {
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
  description?: string;
  scope?: string;
  status: BidStatus;
  priority?: BidPriority;
  submissionDeadline?: Timestamp | null;
  startDate?: Timestamp | null;
  completionDate?: Timestamp | null;
  totalAmount: number;
  timeline?: number;
  paymentTerms?: string;
  currentVersionId?: string;
  versions?: FirestoreBidVersion[];
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  notes?: string;
  requiresInsurance?: boolean;
  requiresBond?: boolean;
  isPublic?: boolean;
  isApproved?: boolean;
  attachments?: string[] | { name: string; url: string }[];
  paymentSchedule?: FirestoreBidPaymentStage[];
  paymentProgress?: {
    paid: number;
    pending: number;
    remaining: number;
  };
  categoryId?: string;
}

export interface FirestoreBidVersion extends Omit<BidVersion, 'createdAt' | 'lineItems'> {
  createdAt: Timestamp;
  lineItems?: LineItem[];
}

export interface FirestoreBidPaymentStage extends Omit<BidPaymentStage, 'createdAt' | 'updatedAt' | 'dueDate' | 'paymentDate'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  paymentDate?: Timestamp;
}
