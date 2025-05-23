import { ExpenseService } from './expense';
import { Expense, ExpenseCategory, ExpenseStatus, PaymentDetails } from '../types'; // Adjust path as necessary
import { Timestamp, addDoc, updateDoc, doc, collection } from 'firebase/firestore';

// Mock Firestore
jest.mock('firebase/firestore', () => {
  const originalFirestore = jest.requireActual('firebase/firestore');
  return {
    ...originalFirestore,
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    doc: jest.fn(),
    collection: jest.fn((db, path) => `mocked_collection_path_for_${path}`),
    Timestamp: {
      fromDate: jest.fn(date => ({ // Simple mock for Timestamp.fromDate
        toDate: () => date, 
        seconds: date.getTime() / 1000, 
        nanoseconds: (date.getTime() % 1000) * 1e6 
      })),
      now: jest.fn(() => ({ // Simple mock for Timestamp.now
        toDate: () => new Date(),
        seconds: Date.now() / 1000,
        nanoseconds: (Date.now() % 1000) * 1e6
      })),
    },
  };
});

// Mock utility functions if they are complex or have external dependencies
jest.mock('../../utils/firestoreConverter', () => ({
  toTimestamp: jest.fn(date => date ? ({ seconds: date.getTime() / 1000, nanoseconds: 0 }) : null), // Simplified mock
  toDate: jest.fn(ts => ts ? new Date(ts.seconds * 1000) : null), // Simplified mock
}));


describe('ExpenseService', () => {
  const mockAddDoc = addDoc as jest.Mock;
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;
  // const mockCollection = collection as jest.Mock; // Already mocked above

  const userId = 'test-user-id';
  const projectId = 'test-project-id';
  const mockDate = new Date('2023-10-01T10:00:00.000Z');
  const mockTimestamp = Timestamp.fromDate(mockDate);


  beforeEach(() => {
    mockAddDoc.mockClear();
    mockUpdateDoc.mockClear();
    mockDoc.mockClear();
    (Timestamp.fromDate as jest.Mock).mockClear().mockReturnValue(mockTimestamp);
    (Timestamp.now as jest.Mock).mockClear().mockReturnValue(mockTimestamp);
  });

  describe('createExpense', () => {
    const basicExpenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
      projectId,
      category: 'materials' as ExpenseCategory,
      description: 'Test Expense',
      amount: 100,
      date: mockDate,
      status: 'pending' as ExpenseStatus,
    };

    test('should create an expense with correct transformations and default values', async () => {
      mockAddDoc.mockResolvedValue({ id: 'new-expense-id' });
      mockDoc.mockReturnValue('mocked_doc_ref'); // doc is called by addDoc

      const result = await ExpenseService.createExpense(userId, basicExpenseData);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const addDocCallArg = mockAddDoc.mock.calls[0][1]; // Data passed to addDoc

      expect(addDocCallArg.userId).toBe(userId);
      expect(addDocCallArg.createdBy).toBe(userId);
      expect(addDocCallArg.projectId).toBe(projectId);
      expect(addDocCallArg.category).toBe('materials');
      expect(addDocCallArg.description).toBe('Test Expense');
      expect(addDocCallArg.amount).toBe(100);
      expect(addDocCallArg.date).toEqual(mockTimestamp); // Check for Timestamp
      expect(addDocCallArg.createdAt).toEqual(mockTimestamp);
      expect(addDocCallArg.updatedAt).toEqual(mockTimestamp);
      expect(addDocCallArg.status).toBe('pending');
      expect(addDocCallArg.tags).toEqual([]); // Default value
      expect(addDocCallArg.bidId).toBeNull(); // Default
      expect(addDocCallArg.paymentStageId).toBeNull(); // Default
      expect(addDocCallArg.paymentDetails).toBeNull(); // Default

      expect(result.id).toBe('new-expense-id');
      expect(result.userId).toBe(userId);
      expect(result.date).toEqual(mockDate); // Should be JS Date in returned object
    });

    test('should handle optional fields like paymentDetails correctly', async () => {
      const paymentDetails: Expense['paymentDetails'] = {
        method: 'card',
        date: new Date('2023-09-30'),
        referenceNumber: 'ref123',
      };
      const expenseWithDetails = { ...basicExpenseData, paymentDetails };
      mockAddDoc.mockResolvedValue({ id: 'exp-details-id' });

      await ExpenseService.createExpense(userId, expenseWithDetails);
      const addDocCallArg = mockAddDoc.mock.calls[0][1];
      
      expect(addDocCallArg.paymentDetails.method).toBe('card');
      expect(addDocCallArg.paymentDetails.date).toEqual(Timestamp.fromDate(new Date('2023-09-30')));
      expect(addDocCallArg.paymentDetails.referenceNumber).toBe('ref123');
    });

    test('should throw error if userId is not provided', async () => {
      await expect(ExpenseService.createExpense('', basicExpenseData)).rejects.toThrow('User ID is required');
    });
  });

  describe('updateExpense', () => {
    const expenseId = 'existing-expense-id';
    const updateData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'createdBy'>> = {
      description: 'Updated Description',
      amount: 150,
      status: 'approved' as ExpenseStatus,
      date: new Date('2023-10-05T12:00:00.000Z'),
    };
    const mockUpdateTimestamp = Timestamp.fromDate(new Date('2023-10-05T12:00:00.000Z'));


    test('should update an expense with correct transformations', async () => {
      (Timestamp.fromDate as jest.Mock).mockImplementation(date => ({ // more specific mock for this test
          toDate: () => date, seconds: date.getTime()/1000, nanoseconds: 0 
      }));

      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue(`mocked_doc_ref_for_${expenseId}`);

      await ExpenseService.updateExpense(expenseId, updateData);

      expect(mockDoc).toHaveBeenCalledWith(undefined, 'expenses', expenseId); // db is undefined in mock
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateDocCallArg = mockUpdateDoc.mock.calls[0][1];

      expect(updateDocCallArg.description).toBe('Updated Description');
      expect(updateDocCallArg.amount).toBe(150);
      expect(updateDocCallArg.status).toBe('approved');
      // Check if date is converted to Timestamp. 
      // The mock for Timestamp.fromDate needs to be consistent.
      // The updateData.date will be passed to toDate then toTimestamp by the service.
      expect(updateDocCallArg.date).toEqual(toTimestamp(new Date('2023-10-05T12:00:00.000Z')));
      expect(updateDocCallArg.updatedAt).toBeDefined(); // Should be a Timestamp set by the service
      expect(updateDocCallArg.updatedAt.seconds).toBeGreaterThanOrEqual(mockDate.getTime()/1000);
    });

    test('should handle buildingPhase to phaseName standardization', async () => {
      const updateWithBuildingPhase = { buildingPhase: 'New Phase Name', amount: 200 };
      mockUpdateDoc.mockResolvedValue(undefined);

      await ExpenseService.updateExpense(expenseId, updateWithBuildingPhase as any); // Cast as any to pass buildingPhase

      const updateDocCallArg = mockUpdateDoc.mock.calls[0][1];
      expect(updateDocCallArg.phaseName).toBe('New Phase Name');
      expect(updateDocCallArg.buildingPhase).toBeUndefined(); // Should be removed
      expect(updateDocCallArg.amount).toBe(200);
    });
    
    test('should correctly handle null or undefined for optional fields', async () => {
      const updateWithNulls: Partial<Expense> = { vendor: null, notes: undefined };
      mockUpdateDoc.mockResolvedValue(undefined);

      await ExpenseService.updateExpense(expenseId, updateWithNulls);
      const updateDocCallArg = mockUpdateDoc.mock.calls[0][1];
      
      expect(updateDocCallArg.vendor).toBeNull(); // Null should be preserved
      expect(updateDocCallArg.notes).toBeUndefined(); // Undefined should be stripped by cleanObject/convertToFirestore
                                                    // or set to null depending on implementation.
                                                    // Current ExpenseService.updateExpense's cleanObject would strip it.
                                                    // If it's set to null, the test should be `toBeNull()`.
                                                    // Given the current implementation of cleanObject in ExpenseService,
                                                    // undefined fields are skipped.
    });
  });

  // TODO: Add tests for checkForDuplicates if time permits and mocking getDocs/query is feasible.
  // It requires more complex Firestore query mocking.

  describe('checkForDuplicates', () => {
    const userId = 'user-check-duplicate';
    const projectId = 'project-check-duplicate';
    const baseExpenseData: Partial<Expense> = {
      userId,
      projectId,
      amount: 100,
      date: new Date('2023-01-15'),
      description: 'Duplicate Test Item',
      category: 'materials',
    };

    const mockExpenseDoc = (id: string, data: Partial<FirestoreExpense>) => ({
      id,
      data: () => ({
        ...data,
        // Ensure required FirestoreExpense fields are present if not in partial data
        userId: data.userId || userId,
        projectId: data.projectId || projectId,
        amount: data.amount || 0,
        date: data.date || Timestamp.fromDate(new Date()),
        createdAt: data.createdAt || Timestamp.fromDate(new Date()),
        updatedAt: data.updatedAt || Timestamp.fromDate(new Date()),
        category: data.category || 'other',
        description: data.description || '',
        status: data.status || 'pending',
        createdBy: data.createdBy || userId,
      }),
      exists: () => true,
    } as any); // Cast to any to satisfy QueryDocumentSnapshot if needed by map

    beforeEach(() => {
      (getDocs as jest.Mock).mockClear();
    });

    test('should return empty array if no existing expenses match criteria', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
      const duplicates = await ExpenseService.checkForDuplicates(userId, baseExpenseData);
      expect(duplicates).toEqual([]);
    });

    test('should return empty array if crucial input data is missing', async () => {
      expect(await ExpenseService.checkForDuplicates(userId, { projectId, amount: 100 })).toEqual([]);
      expect(await ExpenseService.checkForDuplicates(userId, { projectId, date: new Date() })).toEqual([]);
      // ... etc. for other missing fields
    });
    
    test('should find and return potential duplicates', async () => {
      const existingExpenseFirestore: Partial<FirestoreExpense> = {
        userId,
        projectId,
        amount: 100,
        date: Timestamp.fromDate(new Date('2023-01-15')),
        description: 'Duplicate Test Item', // Matches baseExpenseData
        category: 'materials',
      };
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [mockExpenseDoc('existing-id-1', existingExpenseFirestore)],
      });

      const duplicates = await ExpenseService.checkForDuplicates(userId, baseExpenseData);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].id).toBe('existing-id-1');
      expect(duplicates[0].description).toBe('Duplicate Test Item');
    });

    test('should not return itself as a duplicate when an expenseId is provided', async () => {
      const expenseBeingEdited: Partial<Expense> = { ...baseExpenseData, id: 'current-expense-id' };
      const existingExpenseFirestore: Partial<FirestoreExpense> = {
        userId,
        projectId,
        amount: 100,
        date: Timestamp.fromDate(new Date('2023-01-15')),
        description: 'Duplicate Test Item',
        category: 'materials',
      };
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          mockExpenseDoc('current-expense-id', existingExpenseFirestore), // This is the expense being edited
          mockExpenseDoc('other-duplicate-id', existingExpenseFirestore), // This is a genuine duplicate
        ],
      });

      const duplicates = await ExpenseService.checkForDuplicates(userId, expenseBeingEdited);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].id).toBe('other-duplicate-id');
    });
    
    test('should return empty array if amount does not match', async () => {
      const existingExpenseFirestore: Partial<FirestoreExpense> = {
        userId,
        projectId,
        amount: 250, // Different amount
        date: Timestamp.fromDate(new Date('2023-01-15')),
        description: 'Duplicate Test Item',
        category: 'materials',
      };
      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [mockExpenseDoc('existing-id-3', existingExpenseFirestore)],
      });
      const duplicates = await ExpenseService.checkForDuplicates(userId, baseExpenseData);
      expect(duplicates).toEqual([]);
    });
    
    test('should find duplicate if vendor matches (even if description differs slightly)', async () => {
        const expenseDataWithVendor: Partial<Expense> = {
            ...baseExpenseData,
            description: "Slightly different item",
            vendor: "Test Vendor Inc."
        };
        const existingExpenseFirestore: Partial<FirestoreExpense> = {
            userId,
            projectId,
            amount: 100,
            date: Timestamp.fromDate(new Date('2023-01-15')),
            description: 'Another item',
            vendor: "Test Vendor Inc.", // Matching vendor
            category: 'materials',
        };
        (getDocs as jest.Mock).mockResolvedValue({
            empty: false,
            docs: [mockExpenseDoc('vendor-match-id', existingExpenseFirestore)],
        });
        const duplicates = await ExpenseService.checkForDuplicates(userId, expenseDataWithVendor);
        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].id).toBe('vendor-match-id');
    });
  });
});
