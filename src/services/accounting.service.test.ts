jest.mock('../config/firebase', () => ({
  db: {},
}));

jest.mock('../config/devMode', () => ({
  isDevAuthBypassEnabled: false,
}));

jest.mock('./bid', () => ({
  BidService: {
    getBid: jest.fn(),
    getBids: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => {
  class MockTimestamp {
    private readonly date: Date;

    constructor(date: Date) {
      this.date = date;
    }

    toDate() {
      return this.date;
    }

    static fromDate = jest.fn((date: Date) => new MockTimestamp(date));
  }

  return {
    addDoc: jest.fn(),
    collection: jest.fn((_db, path) => `collection:${path}`),
    doc: jest.fn((_collectionRef, id) => `doc:${id}`),
    getDocs: jest.fn(),
    query: jest.fn((base, ...constraints) => ({ base, constraints })),
    Timestamp: MockTimestamp,
    updateDoc: jest.fn(),
    where: jest.fn((field, op, value) => ({ field, op, value })),
  };
});

import { AccountingService } from './accounting';
import { Bid } from '../types';

const acceptedBid = (overrides: Partial<Bid> = {}): Bid => ({
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Hillside Remodel',
  subcontractorId: 'sub-1',
  subcontractorName: 'Framing Co',
  title: 'Framing package',
  scope: 'Frame addition',
  status: 'accepted',
  totalAmount: 10000,
  paymentSchedule: [
    {
      id: 'stage-1',
      name: 'Deposit',
      amount: 2500,
      percentage: 25,
      dueDate: new Date('2026-05-10T00:00:00.000Z'),
      status: 'paid',
      paidAmount: 2500,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      updatedAt: new Date('2026-05-02T00:00:00.000Z'),
    },
    {
      id: 'stage-2',
      name: 'Rough framing',
      amount: 7500,
      percentage: 75,
      dueDate: new Date('2026-06-01T00:00:00.000Z'),
      status: 'pending',
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      updatedAt: new Date('2026-05-02T00:00:00.000Z'),
    },
  ],
  paymentProgress: {
    paid: 2500,
    pending: 7500,
    remaining: 7500,
  },
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-02T00:00:00.000Z'),
  ...overrides,
});

describe('AccountingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds a commitment from an accepted bid and preserves bid payment milestones', () => {
    const commitment = AccountingService.buildCommitmentFromBid(
      'user-1',
      acceptedBid()
    );

    expect(commitment).toMatchObject({
      userId: 'user-1',
      projectId: 'project-1',
      sourceBidId: 'bid-1',
      subcontractorName: 'Framing Co',
      title: 'Framing package',
      status: 'active',
      contractAmount: 10000,
      paidAmount: 2500,
      outstandingAmount: 7500,
      lienWaiverStatus: 'needed',
    });
    expect(commitment.paymentSchedule).toEqual([
      expect.objectContaining({
        id: 'stage-1',
        sourceBidStageId: 'stage-1',
        amount: 2500,
        status: 'paid',
      }),
      expect.objectContaining({
        id: 'stage-2',
        sourceBidStageId: 'stage-2',
        amount: 7500,
        status: 'pending',
      }),
    ]);
  });

  test('summarizes active commitments, non-void invoices, completed payments, and lien waivers', async () => {
    jest.spyOn(AccountingService, 'getCommitments').mockResolvedValue([
      {
        ...AccountingService.buildCommitmentFromBid('user-1', acceptedBid()),
        id: 'commitment-1',
      },
      {
        ...AccountingService.buildCommitmentFromBid(
          'user-1',
          acceptedBid({ id: 'bid-2', totalAmount: 2000 })
        ),
        id: 'commitment-2',
        status: 'cancelled',
        contractAmount: 2000,
        outstandingAmount: 2000,
      },
    ]);
    jest.spyOn(AccountingService, 'getVendorInvoices').mockResolvedValue([
      {
        id: 'invoice-1',
        userId: 'user-1',
        projectId: 'project-1',
        commitmentId: 'commitment-1',
        description: 'Deposit invoice',
        invoiceDate: new Date('2026-05-03T00:00:00.000Z'),
        amount: 2500,
        retainageHeld: 100,
        netAmount: 2400,
        paidAmount: 2400,
        status: 'paid',
        paymentMilestoneIds: ['stage-1'],
        createdAt: new Date('2026-05-03T00:00:00.000Z'),
        updatedAt: new Date('2026-05-03T00:00:00.000Z'),
      },
      {
        id: 'invoice-void',
        userId: 'user-1',
        projectId: 'project-1',
        commitmentId: 'commitment-1',
        description: 'Voided invoice',
        invoiceDate: new Date('2026-05-03T00:00:00.000Z'),
        amount: 1000,
        retainageHeld: 0,
        netAmount: 1000,
        paidAmount: 0,
        status: 'void',
        paymentMilestoneIds: [],
        createdAt: new Date('2026-05-03T00:00:00.000Z'),
        updatedAt: new Date('2026-05-03T00:00:00.000Z'),
      },
    ]);
    jest.spyOn(AccountingService, 'getVendorPayments').mockResolvedValue([
      {
        id: 'payment-1',
        userId: 'user-1',
        projectId: 'project-1',
        commitmentId: 'commitment-1',
        vendorInvoiceId: 'invoice-1',
        amount: 2400,
        paymentDate: new Date('2026-05-04T00:00:00.000Z'),
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdAt: new Date('2026-05-04T00:00:00.000Z'),
        updatedAt: new Date('2026-05-04T00:00:00.000Z'),
      },
    ]);
    jest.spyOn(AccountingService, 'getOwnerInvoices').mockResolvedValue([]);
    jest.spyOn(AccountingService, 'getOwnerPayments').mockResolvedValue([]);

    const dashboard = await AccountingService.getAccountingDashboard('user-1');

    expect(dashboard.summary).toMatchObject({
      committed: 10000,
      commitmentOutstanding: 7500,
      vendorInvoiced: 2400,
      vendorPaid: 2400,
      retainageHeld: 100,
      ownerBilled: 0,
      ownerReceived: 0,
      lienWaiversNeeded: 1,
    });
  });
});
