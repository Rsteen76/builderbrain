import { Bid } from '.';

/**
 * Interface for the form data expected by the bid form dialog
 */
export interface BidFormData {
  title: string;
  subcontractorName: string;
  subcontractorId?: string;
  totalAmount: number;
  phaseId?: string;
  phaseName?: string;
  scope: string;
  timeline: number;
  submissionDeadline?: Date;
  paymentTerms: {
    downPaymentPercent: number;
    installments: {
      id: string;
      name: string;
      percent: number;
      milestoneDescription: string;
      phaseId?: string;
      phaseName?: string;
    }[];
  };
  notes: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'revision_requested';
  attachments: string[];
  tags: string[];
  projectId?: string;
  projectName?: string;
}

/**
 * Interface for bid operation callbacks
 */
export interface BidCallbacks {
  onSubmitSuccess?: (bid: Bid) => void;
  onError?: (error: string) => void;
} 