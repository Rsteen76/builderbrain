// In src/types/form.types.ts
import { BidStatus, ProjectPhase } from './'; // Adjust import as necessary

export interface BidPaymentInstallmentFormData {
  id: string;
  name: string;
  percent: number;
  isFixedAmount: boolean;
  fixedAmount: number;
  milestoneDescription: string;
  phaseId?: string; // Optional as it might default to bid's phase
  phaseName?: string; // Optional
  manuallyConfigured?: boolean; // From ReusableBidForm state
}

export interface BidPaymentTermsFormData {
  downPaymentPercent: number;
  isDownPaymentFixed: boolean;
  downPaymentAmount: number;
  installments: BidPaymentInstallmentFormData[];
  syncInstallmentPhases: boolean;
}

export interface BidAttachmentFormData { // Assuming attachments in form are just URLs or file objects
  name?: string; // Or whatever structure the form uses
  url: string; // Or File object
}

export interface BidFormData {
  title: string;
  subcontractorId?: string;
  subcontractorName: string;
  projectId?: string; // Optional if form can be standalone for a new project
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  totalAmount: number;
  scope: string;
  timeline: number; // Duration in days
  submissionDeadline?: Date | null;
  paymentTerms: BidPaymentTermsFormData;
  notes: string;
  status: BidStatus; // Or a subset if status is limited on create/edit
  attachments: string[];
  tags: string[];
  // Add any other fields that ReusableBidForm directly manages in its state
}
