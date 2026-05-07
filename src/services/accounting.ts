import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { isDevAuthBypassEnabled } from '../config/devMode';
import {
  AccountingDashboardData,
  Commitment,
  CommitmentPaymentMilestone,
  OwnerInvoice,
  OwnerPayment,
  VendorInvoice,
  VendorPayment,
  Bid,
  BidPaymentStage,
} from '../types';
import { BidService } from './bid';
import { logger } from '../utils/logger';

const commitmentCollection = collection(db, 'commitments');
const vendorInvoiceCollection = collection(db, 'vendor_invoices');
const vendorPaymentCollection = collection(db, 'vendor_payments');
const ownerInvoiceCollection = collection(db, 'owner_invoices');
const ownerPaymentCollection = collection(db, 'owner_payments');

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toFirestoreDate = (value: Date | string | null | undefined) => {
  const date = toDate(value);
  return date ? Timestamp.fromDate(date) : null;
};

const cleanUndefined = <T extends Record<string, unknown>>(value: T): T => {
  const cleaned = { ...value };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

const normalizeMilestone = (stage: BidPaymentStage, bid: Bid): CommitmentPaymentMilestone => ({
  id: stage.id,
  name: stage.name || 'Payment milestone',
  description: stage.description,
  phaseId: stage.phaseId || bid.phaseId,
  phaseName: stage.phaseName || bid.phaseName,
  amount: Math.max(stage.amount || 0, 0),
  percentage: Math.max(stage.percentage || 0, 0),
  dueDate: toDate(stage.dueDate),
  status:
    stage.status === 'paid'
      ? 'paid'
      : stage.status === 'partially_paid'
        ? 'partially_paid'
        : 'pending',
  sourceBidStageId: stage.id,
});

const defaultScheduleFromBid = (bid: Bid): CommitmentPaymentMilestone[] => {
  if (bid.paymentSchedule?.length) {
    return bid.paymentSchedule.map((stage) => normalizeMilestone(stage, bid));
  }

  return [
    {
      id: `milestone-${bid.id}`,
      name: 'Contract payment',
      amount: Math.max(bid.totalAmount || 0, 0),
      percentage: 100,
      phaseId: bid.phaseId,
      phaseName: bid.phaseName,
      status: 'pending',
      sourceBidStageId: `synthetic-${bid.id}`,
    },
  ];
};

const commitmentToFirestore = (commitment: Omit<Commitment, 'id'>): DocumentData =>
  cleanUndefined({
    ...commitment,
    createdAt: Timestamp.fromDate(commitment.createdAt),
    updatedAt: Timestamp.fromDate(commitment.updatedAt),
    closedAt: commitment.closedAt ? Timestamp.fromDate(commitment.closedAt) : null,
    paymentSchedule: commitment.paymentSchedule.map((milestone) =>
      cleanUndefined({
        ...milestone,
        dueDate: toFirestoreDate(milestone.dueDate),
      })
    ),
  });

const commitmentFromFirestore = (docSnap: QueryDocumentSnapshot<DocumentData>): Commitment => {
  const data = docSnap.data();
  return {
    ...(data as Commitment),
    id: docSnap.id,
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    closedAt: toDate(data.closedAt),
    paymentSchedule: ((data.paymentSchedule || []) as CommitmentPaymentMilestone[]).map((milestone) => ({
      ...milestone,
      dueDate: toDate(milestone.dueDate),
    })),
  };
};

const datedDocFromFirestore = <T extends { id?: string; createdAt: Date; updatedAt: Date }>(
  docSnap: QueryDocumentSnapshot<DocumentData>
): T => {
  const data = docSnap.data();
  return {
    ...(data as T),
    id: docSnap.id,
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
    invoiceDate: toDate(data.invoiceDate),
    dueDate: toDate(data.dueDate),
    paymentDate: toDate(data.paymentDate),
  } as T;
};

const emptyDashboard = (): AccountingDashboardData => ({
  commitments: [],
  vendorInvoices: [],
  vendorPayments: [],
  ownerInvoices: [],
  ownerPayments: [],
  summary: {
    committed: 0,
    commitmentOutstanding: 0,
    vendorInvoiced: 0,
    vendorPaid: 0,
    retainageHeld: 0,
    ownerBilled: 0,
    ownerReceived: 0,
    lienWaiversNeeded: 0,
  },
});

const activeCommitments = (commitments: Commitment[]) =>
  commitments.filter((commitment) => commitment.status === 'active');

export class AccountingService {
  static buildCommitmentFromBid(userId: string, bid: Bid, existing?: Commitment): Omit<Commitment, 'id'> {
    const now = new Date();
    const paymentSchedule = defaultScheduleFromBid(bid);
    const paidAmount = Math.max(bid.paymentProgress?.paid || 0, 0);
    const contractAmount = Math.max(bid.totalAmount || bid.bidAmount || 0, 0);
    const retainagePercent = existing?.retainagePercent ?? 0;
    const retainedAmount = Math.round(contractAmount * retainagePercent) / 100;

    return {
      userId,
      projectId: bid.projectId,
      projectName: bid.projectName,
      sourceBidId: bid.id,
      subcontractorId: bid.subcontractorId,
      subcontractorName: bid.subcontractorName || bid.contractorName,
      title: bid.title || 'Accepted bid commitment',
      scope: bid.scope,
      phaseId: bid.phaseId,
      phaseName: bid.phaseName,
      status: existing?.status || 'active',
      contractAmount,
      retainagePercent,
      retainedAmount,
      paidAmount,
      outstandingAmount: Math.max(contractAmount - paidAmount, 0),
      paymentSchedule,
      lienWaiverStatus: existing?.lienWaiverStatus || 'needed',
      requiredDocuments: existing?.requiredDocuments || ['Subcontract agreement', 'Certificate of insurance', 'Lien waiver'],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      closedAt: existing?.closedAt || null,
    };
  }

  static async createOrUpdateCommitmentFromBid(userId: string, bid: Bid): Promise<Commitment | null> {
    if (!userId || bid.status !== 'accepted') {
      return null;
    }

    if (isDevAuthBypassEnabled) {
      return {
        ...this.buildCommitmentFromBid(userId, bid),
        id: `commitment-${bid.id}`,
      };
    }

    try {
      const existing = await this.getCommitmentForBid(userId, bid.id);
      const commitmentData = this.buildCommitmentFromBid(userId, bid, existing || undefined);

      if (existing?.id) {
        await updateDoc(doc(commitmentCollection, existing.id), commitmentToFirestore(commitmentData));
        return { ...commitmentData, id: existing.id };
      }

      const docRef = await addDoc(commitmentCollection, commitmentToFirestore(commitmentData));
      return { ...commitmentData, id: docRef.id };
    } catch (error) {
      logger.error('AccountingService: failed to create/update commitment from bid', error);
      throw error;
    }
  }

  static async getCommitmentForBid(userId: string, bidId: string): Promise<Commitment | null> {
    if (isDevAuthBypassEnabled) {
      const bid = await BidService.getBid(userId, bidId);
      if (!bid || bid.status !== 'accepted') return null;
      return {
        ...this.buildCommitmentFromBid(userId, bid),
        id: `commitment-${bid.id}`,
      };
    }

    const q = query(
      commitmentCollection,
      where('userId', '==', userId),
      where('sourceBidId', '==', bidId)
    );
    const snapshot = await getDocs(q);
    const first = snapshot.docs[0];
    return first ? commitmentFromFirestore(first) : null;
  }

  static async getCommitments(userId: string, projectId?: string): Promise<Commitment[]> {
    if (isDevAuthBypassEnabled) {
      const bids = await BidService.getBids(
        userId,
        {
          projectId,
          status: 'accepted',
        },
        { field: 'updatedAt', direction: 'desc' },
        Number.MAX_SAFE_INTEGER
      );

      return bids.map((bid) => ({
        ...this.buildCommitmentFromBid(userId, bid),
        id: `commitment-${bid.id}`,
      }));
    }

    const constraints = [where('userId', '==', userId)];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const snapshot = await getDocs(query(commitmentCollection, ...constraints));
    return snapshot.docs.map(commitmentFromFirestore);
  }

  static async getVendorInvoices(userId: string, projectId?: string): Promise<VendorInvoice[]> {
    if (isDevAuthBypassEnabled) return [];

    const constraints = [where('userId', '==', userId)];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const snapshot = await getDocs(query(vendorInvoiceCollection, ...constraints));
    return snapshot.docs.map((docSnap) => datedDocFromFirestore<VendorInvoice>(docSnap));
  }

  static async getVendorPayments(userId: string, projectId?: string): Promise<VendorPayment[]> {
    if (isDevAuthBypassEnabled) return [];

    const constraints = [where('userId', '==', userId)];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const snapshot = await getDocs(query(vendorPaymentCollection, ...constraints));
    return snapshot.docs.map((docSnap) => datedDocFromFirestore<VendorPayment>(docSnap));
  }

  static async getOwnerInvoices(userId: string, projectId?: string): Promise<OwnerInvoice[]> {
    if (isDevAuthBypassEnabled) return [];

    const constraints = [where('userId', '==', userId)];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const snapshot = await getDocs(query(ownerInvoiceCollection, ...constraints));
    return snapshot.docs.map((docSnap) => datedDocFromFirestore<OwnerInvoice>(docSnap));
  }

  static async getOwnerPayments(userId: string, projectId?: string): Promise<OwnerPayment[]> {
    if (isDevAuthBypassEnabled) return [];

    const constraints = [where('userId', '==', userId)];
    if (projectId) constraints.push(where('projectId', '==', projectId));
    const snapshot = await getDocs(query(ownerPaymentCollection, ...constraints));
    return snapshot.docs.map((docSnap) => datedDocFromFirestore<OwnerPayment>(docSnap));
  }

  static async getAccountingDashboard(userId: string, projectId?: string): Promise<AccountingDashboardData> {
    if (!userId) return emptyDashboard();

    const [commitments, vendorInvoices, vendorPayments, ownerInvoices, ownerPayments] = await Promise.all([
      this.getCommitments(userId, projectId),
      this.getVendorInvoices(userId, projectId),
      this.getVendorPayments(userId, projectId),
      this.getOwnerInvoices(userId, projectId),
      this.getOwnerPayments(userId, projectId),
    ]);

    return {
      commitments,
      vendorInvoices,
      vendorPayments,
      ownerInvoices,
      ownerPayments,
      summary: {
        committed: activeCommitments(commitments).reduce((sum, commitment) => sum + commitment.contractAmount, 0),
        commitmentOutstanding: activeCommitments(commitments).reduce((sum, commitment) => sum + commitment.outstandingAmount, 0),
        vendorInvoiced: vendorInvoices
          .filter((invoice) => invoice.status !== 'void')
          .reduce((sum, invoice) => sum + invoice.netAmount, 0),
        vendorPaid: vendorPayments
          .filter((payment) => payment.status === 'completed')
          .reduce((sum, payment) => sum + payment.amount, 0),
        retainageHeld: Math.max(
          activeCommitments(commitments).reduce((sum, commitment) => sum + commitment.retainedAmount, 0),
          vendorInvoices
            .filter((invoice) => invoice.status !== 'void')
            .reduce((sum, invoice) => sum + invoice.retainageHeld, 0)
        ),
        ownerBilled: ownerInvoices
          .filter((invoice) => invoice.status !== 'void')
          .reduce((sum, invoice) => sum + invoice.netAmount, 0),
        ownerReceived: ownerPayments
          .filter((payment) => payment.status === 'completed')
          .reduce((sum, payment) => sum + payment.amount, 0),
        lienWaiversNeeded: activeCommitments(commitments).filter(
          (commitment) => commitment.lienWaiverStatus === 'needed' || commitment.lienWaiverStatus === 'requested'
        ).length,
      },
    };
  }

  static emptyDashboard = emptyDashboard;
}
