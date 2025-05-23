import { BidService, adjustBidPaymentSchedule } from './bid'; // Assuming adjustBidPaymentSchedule is exported from bid.ts
import { Bid, Expense, BidPaymentStage, BidPaymentProgress } from '../types'; // Adjust path as necessary
import { Timestamp } from 'firebase/firestore'; // For mocking Firestore Timestamp

// Mock the ENTIRE BidService class for most tests,
// but we will test adjustBidPaymentSchedule which itself calls BidService.getBid and BidService.updateBid
// So, we need a more nuanced approach for adjustBidPaymentSchedule or ensure its dependencies are mocked.

// Let's mock the static methods of BidService that adjustBidPaymentSchedule depends on.
jest.mock('./bid', () => {
  const originalModule = jest.requireActual('./bid');
  return {
    ...originalModule,
    BidService: {
      ...originalModule.BidService,
      getBid: jest.fn(),
      updateBid: jest.fn(),
      // Mock other BidService methods if they were to be called by other functions under test
    },
  };
});

// Mock formatCurrency as it's used in console logs within the function
jest.mock('../utils/formatters', () => ({
  formatCurrency: jest.fn((amount) => `$${Number(amount).toFixed(2)}`),
}));


describe('BidService - adjustBidPaymentSchedule', () => {
  let mockGetBid: jest.Mock;
  let mockUpdateBid: jest.Mock;

  beforeEach(() => {
    // Assign mocks before each test
    mockGetBid = BidService.getBid as jest.Mock;
    mockUpdateBid = BidService.updateBid as jest.Mock;
    jest.clearAllMocks();
  });

  const userId = 'test-user';
  const mockOriginalExpense = {
    id: 'exp1',
    bidId: 'bid1',
    paymentStageId: 'stage1',
    amount: 500, // This amount might represent the original expense, not the stage amount
    // Other necessary Expense fields
    userId: 'u1', projectId: 'p1', category: 'materials', description: 'Original', date: new Date(), status: 'pending', createdBy: 'u1', createdAt: new Date(), updatedAt: new Date(),
  } as Expense;

  const mockPaymentExpense = { // This is the expense record for the payment itself
    id: 'paymentExp1',
    amount: 100, // The amount being paid now
    // Other necessary Expense fields
    userId: 'u1', projectId: 'p1', category: 'materials', description: 'Payment', date: new Date(), status: 'paid', createdBy: 'u1', createdAt: new Date(), updatedAt: new Date(),
  } as Expense;

  const createMockBid = (stages: BidPaymentStage[], progress?: BidPaymentProgress): Bid => ({
    id: 'bid1',
    userId: 'u1',
    projectId: 'p1',
    totalAmount: 1000,
    paymentSchedule: stages,
    paymentProgress: progress || { paid: 0, pending: 1000, remaining: 1000 },
    // Other necessary Bid fields
    status: 'accepted', createdAt: new Date(), updatedAt: new Date(),
    versions: [],
  });

  test('should fully pay a pending stage and update bid progress', async () => {
    const initialStage: BidPaymentStage = { id: 'stage1', name: 'Phase 1', amount: 100, percentage: 10, status: 'pending', createdAt: new Date(), updatedAt: new Date(), description:'' };
    const mockBid = createMockBid([initialStage]);
    mockGetBid.mockResolvedValue(mockBid);

    await adjustBidPaymentSchedule(userId, mockOriginalExpense, { ...mockPaymentExpense, amount: 100 }, 100);

    expect(mockGetBid).toHaveBeenCalledWith(userId, 'bid1');
    expect(mockUpdateBid).toHaveBeenCalledTimes(1);
    
    const updatedBidData = mockUpdateBid.mock.calls[0][1];
    const updatedStage = updatedBidData.paymentSchedule.find((s: BidPaymentStage) => s.id === 'stage1');
    
    expect(updatedStage.status).toBe('paid');
    expect(updatedStage.paidAmount).toBe(100);
    expect(updatedStage.expenseId).toBe('paymentExp1');
    expect(updatedStage.isPaid).toBe(true);
    expect(updatedBidData.paymentProgress.paid).toBe(100);
    expect(updatedBidData.paymentProgress.remaining).toBe(900);
    expect(updatedBidData.paymentProgress.pending).toBe(900); // (1000 total - 100 paid)
  });

  test('should partially pay a pending stage and update bid progress', async () => {
    const initialStage: BidPaymentStage = { id: 'stage1', name: 'Phase 1', amount: 200, percentage: 20, status: 'pending', createdAt: new Date(), updatedAt: new Date(), description: '' };
    const mockBid = createMockBid([initialStage], { paid: 0, pending: 1000, remaining: 1000 });
    mockGetBid.mockResolvedValue(mockBid);

    await adjustBidPaymentSchedule(userId, mockOriginalExpense, { ...mockPaymentExpense, amount: 75 }, 75);

    expect(mockUpdateBid).toHaveBeenCalledTimes(1);
    const updatedBidData = mockUpdateBid.mock.calls[0][1];
    const updatedStage = updatedBidData.paymentSchedule.find((s: BidPaymentStage) => s.id === 'stage1');

    expect(updatedStage.status).toBe('partially_paid');
    expect(updatedStage.paidAmount).toBe(75);
    expect(updatedStage.expenseId).toBe('paymentExp1'); // Links to the current payment
    expect(updatedStage.isPaid).toBeUndefined(); // Or false, depending on strictness
    expect(updatedBidData.paymentProgress.paid).toBe(75);
    expect(updatedBidData.paymentProgress.remaining).toBe(925);
     // Pending = (stage.amount - stage.paidAmount) = 200 - 75 = 125. If other stages, sum them up.
    expect(updatedBidData.paymentProgress.pending).toBe(125);
  });

  test('should add to paidAmount if stage is already partially_paid', async () => {
    const initialStage: BidPaymentStage = { id: 'stage1', name: 'Phase 1', amount: 200, percentage: 20, status: 'partially_paid', paidAmount: 50, createdAt: new Date(), updatedAt: new Date(), description: '' };
    const mockBid = createMockBid([initialStage], { paid: 50, pending: 950, remaining: 950 });
    mockGetBid.mockResolvedValue(mockBid);

    await adjustBidPaymentSchedule(userId, mockOriginalExpense, { ...mockPaymentExpense, amount: 50 }, 50);

    expect(mockUpdateBid).toHaveBeenCalledTimes(1);
    const updatedBidData = mockUpdateBid.mock.calls[0][1];
    const updatedStage = updatedBidData.paymentSchedule.find((s: BidPaymentStage) => s.id === 'stage1');

    expect(updatedStage.status).toBe('partially_paid'); // Stays partially_paid if not fully paid by this payment
    expect(updatedStage.paidAmount).toBe(100); // 50 (initial) + 50 (new)
    expect(updatedBidData.paymentProgress.paid).toBe(100);
    expect(updatedBidData.paymentProgress.remaining).toBe(900);
    expect(updatedBidData.paymentProgress.pending).toBe(100); // 200 stage amount - 100 paid = 100 pending for this stage
  });
  
  test('should fully pay an already partially_paid stage', async () => {
    const initialStage: BidPaymentStage = { id: 'stage1', name: 'Phase 1', amount: 200, percentage: 20, status: 'partially_paid', paidAmount: 150, createdAt: new Date(), updatedAt: new Date(), description: '' };
    const mockBid = createMockBid([initialStage], { paid: 150, pending: 850, remaining: 850 });
    mockGetBid.mockResolvedValue(mockBid);
    
    // Paying the remaining 50
    await adjustBidPaymentSchedule(userId, mockOriginalExpense, { ...mockPaymentExpense, amount: 50 }, 50);

    expect(mockUpdateBid).toHaveBeenCalledTimes(1);
    const updatedBidData = mockUpdateBid.mock.calls[0][1];
    const updatedStage = updatedBidData.paymentSchedule.find((s: BidPaymentStage) => s.id === 'stage1');

    expect(updatedStage.status).toBe('paid');
    expect(updatedStage.paidAmount).toBe(200); // 150 + 50
    expect(updatedStage.isPaid).toBe(true);
    expect(updatedBidData.paymentProgress.paid).toBe(200);
    expect(updatedBidData.paymentProgress.remaining).toBe(800);
    expect(updatedBidData.paymentProgress.pending).toBe(0); // For this stage
  });

  test('should not update if bid is not found', async () => {
    mockGetBid.mockResolvedValue(null);
    await adjustBidPaymentSchedule(userId, mockOriginalExpense, mockPaymentExpense, 100);
    expect(mockUpdateBid).not.toHaveBeenCalled();
    // Check console.warn if possible/needed: expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Bid bid1 not found'));
  });

  test('should not update if payment stage is not found', async () => {
    const mockBid = createMockBid([]); // Bid with no stages
    mockGetBid.mockResolvedValue(mockBid);
    await adjustBidPaymentSchedule(userId, mockOriginalExpense, mockPaymentExpense, 100);
    expect(mockUpdateBid).not.toHaveBeenCalled();
  });

  test('should not update if bid is missing paymentSchedule', async () => {
    const mockBidNoSchedule = { ...createMockBid([]), paymentSchedule: undefined };
    mockGetBid.mockResolvedValue(mockBidNoSchedule);
    await adjustBidPaymentSchedule(userId, mockOriginalExpense, mockPaymentExpense, 100);
    expect(mockUpdateBid).not.toHaveBeenCalled();
  });
  
  test('should throw error if getBid fails', async () => {
    mockGetBid.mockRejectedValue(new Error('Firestore get error'));
    await expect(adjustBidPaymentSchedule(userId, mockOriginalExpense, mockPaymentExpense, 100))
      .rejects.toThrow('Failed to fetch bid bid1: Firestore get error');
    expect(mockUpdateBid).not.toHaveBeenCalled();
  });

  test('should throw error if updateBid fails', async () => {
    const initialStage: BidPaymentStage = { id: 'stage1', name: 'Phase 1', amount: 100, percentage: 10, status: 'pending', createdAt: new Date(), updatedAt: new Date(), description: '' };
    const mockBid = createMockBid([initialStage]);
    mockGetBid.mockResolvedValue(mockBid);
    mockUpdateBid.mockRejectedValue(new Error('Firestore update error'));

    await expect(adjustBidPaymentSchedule(userId, mockOriginalExpense, mockPaymentExpense, 100))
      .rejects.toThrow('Failed to update bid bid1 after payment adjustment: Firestore update error');
  });

  test('should correctly calculate progress with multiple stages', async () => {
    const stages: BidPaymentStage[] = [
      { id: 'stage1', name: 'Phase 1', amount: 100, percentage: 10, status: 'paid', paidAmount: 100, createdAt: new Date(), updatedAt: new Date(), description: '' },
      { id: 'stage2', name: 'Phase 2', amount: 300, percentage: 30, status: 'pending', createdAt: new Date(), updatedAt: new Date(), description: '' },
      { id: 'stage3', name: 'Phase 3', amount: 600, percentage: 60, status: 'pending', createdAt: new Date(), updatedAt: new Date(), description: '' },
    ];
    const mockBid = createMockBid(stages, { paid: 100, pending: 900, remaining: 900 }); // Initial state: stage1 paid
    mockGetBid.mockResolvedValue(mockBid);

    // Pay 150 for stage2 (partial payment)
    const expenseForStage2 = { ...mockOriginalExpense, paymentStageId: 'stage2' };
    const paymentForStage2 = { ...mockPaymentExpense, amount: 150 };
    await adjustBidPaymentSchedule(userId, expenseForStage2, paymentForStage2, 150);

    expect(mockUpdateBid).toHaveBeenCalledTimes(1);
    const updatedBidData = mockUpdateBid.mock.calls[0][1];
    const updatedStage2 = updatedBidData.paymentSchedule.find((s: BidPaymentStage) => s.id === 'stage2');

    expect(updatedStage2.status).toBe('partially_paid');
    expect(updatedStage2.paidAmount).toBe(150);
    
    // Progress:
    // Stage 1: Paid 100
    // Stage 2: Paid 150 (out of 300)
    // Stage 3: Paid 0 (out of 600)
    // Total Paid: 100 + 150 = 250
    // Total Amount: 1000
    // Remaining: 1000 - 250 = 750
    // Pending: (300-150 for stage2) + 600 (for stage3) = 150 + 600 = 750
    expect(updatedBidData.paymentProgress.paid).toBe(250);
    expect(updatedBidData.paymentProgress.remaining).toBe(750);
    expect(updatedBidData.paymentProgress.pending).toBe(750);
  });
});

// Basic tests for BidService class methods (if time permits)
// These would require more extensive mocking of Firestore directly
describe('BidService - Core Methods (Simplified)', () => {
    // Example: Test for createBid (very basic, needs Firestore mock)
    // test('createBid should call addDoc with transformed data', async () => {
    //   const mockAddDoc = addDoc as jest.Mock;
    //   const mockGetDoc = getDoc as jest.Mock;
      
    //   const bidData: Omit<Bid, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'> = {
    //     projectId: 'p1', totalAmount: 1000, status: 'draft',
    //   };
    //   const userId = 'test-user-create';
      
    //   // Mock addDoc response
    //   mockAddDoc.mockResolvedValue({ id: 'newBid123' });
      
    //   // Mock getDoc response for the subsequent getBid call in createBid
    //   const mockBidDoc = {
    //     exists: () => true,
    //     id: 'newBid123',
    //     data: () => ({ 
    //       /* ... Firestore representation of bid ... */ 
    //       userId, 
    //       ...bidData, 
    //       createdAt: Timestamp.now(), 
    //       updatedAt: Timestamp.now(),
    //       versions: [{ id: 'v1', versionNumber: 1, createdAt: Timestamp.now(), totalAmount: 1000, notes: 'Initial'}]
    //     }),
    //   };
    //   mockGetDoc.mockResolvedValue(mockBidDoc);

    //   await BidService.createBid(userId, bidData);
    //   expect(mockAddDoc).toHaveBeenCalled();
    //   // More assertions here on the data passed to addDoc
    // });
});

// Separate describe block for testing BidService static methods like createBid, updateBid
// This requires mocking the actual Firestore functions.
describe('BidService - createBid / updateBid', () => {
  const mockAddDoc = addDoc as jest.Mock;
  const mockGetDoc = getDoc as jest.Mock;
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;
  const mockCollection = collection as jest.Mock; // If used by the service

  beforeEach(() => {
    mockAddDoc.mockClear();
    mockGetDoc.mockClear();
    mockUpdateDoc.mockClear();
    mockDoc.mockClear();
    mockCollection.mockClear(); // Clear if used

    // Default mock for doc() to return a basic object or string path
    mockDoc.mockImplementation((db, path, id) => `mocked_doc_ref_to_${path}/${id}`); 
  });

  describe('createBid', () => {
    test('should call addDoc with transformed bid data and create an initial version', async () => {
      const userId = 'user-xyz';
      const bidData: Omit<Bid, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'> = {
        projectId: 'proj-123',
        title: 'New Bid',
        totalAmount: 1500,
        status: 'draft',
        // other fields as needed by your Bid type for creation
        projectName: "Test Project",
        scope: "Test Scope",
      };

      const newBidId = 'new-bid-id-123';
      mockAddDoc.mockResolvedValue({ id: newBidId });

      // Mock the getDoc call made by this.getBid inside createBid
      const mockFirestoreBidData = {
        ...bidData,
        userId,
        createdAt: Timestamp.fromDate(new Date()), // Use mocked Timestamp
        updatedAt: Timestamp.fromDate(new Date()),
        versions: [{ id: expect.any(String), versionNumber: 1, createdAt: expect.any(Object), totalAmount: 1500, notes: 'Initial version', lineItems: [], attachments: [] }],
        currentVersionId: expect.any(String),
        paymentSchedule: [], // Assuming default empty
        tags: [],
        attachments: [],
      };
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: newBidId,
        data: () => mockFirestoreBidData,
      });
      
      const result = await BidService.createBid(userId, bidData);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const addDocArgs = mockAddDoc.mock.calls[0][1]; // Second argument to addDoc is the data

      expect(addDocArgs.userId).toBe(userId);
      expect(addDocArgs.projectId).toBe('proj-123');
      expect(addDocArgs.title).toBe('New Bid');
      expect(addDocArgs.totalAmount).toBe(1500);
      expect(addDocArgs.status).toBe('draft');
      expect(addDocArgs.createdAt).toBeInstanceOf(Timestamp);
      expect(addDocArgs.updatedAt).toBeInstanceOf(Timestamp);
      expect(addDocArgs.versions).toHaveLength(1);
      expect(addDocArgs.versions[0].versionNumber).toBe(1);
      expect(addDocArgs.versions[0].totalAmount).toBe(1500);
      expect(addDocArgs.currentVersionId).toBe(addDocArgs.versions[0].id);

      expect(result).toBeDefined();
      expect(result.id).toBe(newBidId);
      expect(result.title).toBe('New Bid');
      expect(result.versions).toHaveLength(1);
    });
  });

  describe('updateBid', () => {
    test('should call updateDoc with transformed partial bid data', async () => {
      const bidId = 'bid-to-update-123';
      const partialBidData: Partial<Omit<Bid, 'id' | 'userId' | 'versions' | 'currentVersionId' | 'createdAt' | 'updatedAt'>> = {
        title: 'Updated Bid Title',
        status: 'submitted',
        totalAmount: 2000,
        submissionDeadline: new Date('2024-12-31'),
      };

      mockUpdateDoc.mockResolvedValue(undefined); // updateDoc doesn't return anything

      await BidService.updateBid(bidId, partialBidData);

      expect(mockDoc).toHaveBeenCalledWith(undefined, 'bids', bidId); // Assuming db is undefined due to mock structure or you pass it
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      
      const updateDocArgs = mockUpdateDoc.mock.calls[0][1]; // Second argument to updateDoc
      
      expect(updateDocArgs.title).toBe('Updated Bid Title');
      expect(updateDocArgs.status).toBe('submitted');
      expect(updateDocArgs.totalAmount).toBe(2000);
      expect(updateDocArgs.submissionDeadline).toEqual(Timestamp.fromDate(new Date('2024-12-31')));
      expect(updateDocArgs.updatedAt).toBeInstanceOf(Timestamp);
    });

    test('should correctly transform paymentSchedule for update', async () => {
      const bidId = 'bid-with-schedule';
      const paymentStage: BidPaymentStage = {
        id: 'stage-abc',
        name: 'Milestone 1',
        amount: 500,
        percentage: 50,
        status: 'pending',
        dueDate: new Date('2025-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'First payment'
      };
      const partialBidData: Partial<Omit<Bid, 'id' | 'userId' | 'versions' | 'currentVersionId' | 'createdAt' | 'updatedAt'>> = {
        paymentSchedule: [paymentStage],
      };
      
      mockUpdateDoc.mockResolvedValue(undefined);
      await BidService.updateBid(bidId, partialBidData);

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateDocArgs = mockUpdateDoc.mock.calls[0][1];
      expect(updateDocArgs.paymentSchedule).toHaveLength(1);
      expect(updateDocArgs.paymentSchedule[0].id).toBe('stage-abc');
      expect(updateDocArgs.paymentSchedule[0].dueDate).toEqual(Timestamp.fromDate(new Date('2025-01-15')));
      expect(updateDocArgs.paymentSchedule[0].createdAt).toBeInstanceOf(Timestamp);

    });
  });
});
