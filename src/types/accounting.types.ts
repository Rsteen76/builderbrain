import type { PaymentMethod } from './expense-transaction.types';

export type CommitmentStatus = 'active' | 'closed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'submitted' | 'approved' | 'partially_paid' | 'paid' | 'void';
export type AccountingPaymentStatus = 'pending' | 'completed' | 'void';
export type LienWaiverStatus = 'not_required' | 'needed' | 'requested' | 'received';

export interface CommitmentPaymentMilestone {
  id: string;
  name: string;
  description?: string;
  phaseId?: string;
  phaseName?: string;
  amount: number;
  percentage: number;
  dueDate?: Date | null;
  status: 'pending' | 'invoiced' | 'partially_paid' | 'paid' | 'closed';
  sourceBidStageId?: string;
}

export interface Commitment {
  id?: string;
  userId: string;
  projectId: string;
  projectName?: string;
  sourceBidId: string;
  subcontractorId?: string;
  subcontractorName?: string;
  title: string;
  scope?: string;
  phaseId?: string;
  phaseName?: string;
  status: CommitmentStatus;
  contractAmount: number;
  retainagePercent: number;
  retainedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentSchedule: CommitmentPaymentMilestone[];
  lienWaiverStatus: LienWaiverStatus;
  requiredDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
}

export interface VendorInvoice {
  id?: string;
  userId: string;
  projectId: string;
  commitmentId: string;
  sourceBidId?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  invoiceNumber?: string;
  description: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  amount: number;
  retainageHeld: number;
  netAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentMilestoneIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPayment {
  id?: string;
  userId: string;
  projectId: string;
  commitmentId: string;
  vendorInvoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  status: AccountingPaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnerInvoice {
  id?: string;
  userId: string;
  projectId: string;
  invoiceNumber?: string;
  description: string;
  invoiceDate: Date;
  dueDate?: Date | null;
  amount: number;
  retainageHeld: number;
  netAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnerPayment {
  id?: string;
  userId: string;
  projectId: string;
  ownerInvoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  status: AccountingPaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LienWaiver {
  id?: string;
  userId: string;
  projectId: string;
  commitmentId: string;
  vendorInvoiceId?: string;
  vendorPaymentId?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  status: LienWaiverStatus;
  requiredForCloseout: boolean;
  documentId?: string;
  requestedAt?: Date | null;
  receivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountingDashboardData {
  commitments: Commitment[];
  vendorInvoices: VendorInvoice[];
  vendorPayments: VendorPayment[];
  ownerInvoices: OwnerInvoice[];
  ownerPayments: OwnerPayment[];
  summary: {
    committed: number;
    commitmentOutstanding: number;
    vendorInvoiced: number;
    vendorPaid: number;
    retainageHeld: number;
    ownerBilled: number;
    ownerReceived: number;
    lienWaiversNeeded: number;
  };
}
