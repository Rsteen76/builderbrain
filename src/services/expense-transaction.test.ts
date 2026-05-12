import { ExpenseTransactionService } from './expense-transaction';
import { ExpenseService } from './expense';
import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { Expense } from '../types';

jest.mock('../config/firebase', () => ({
  db: { type: 'mock-db' },
}));

jest.mock('./expense', () => ({
  ExpenseService: {
    getExpense: jest.fn(),
    updateExpense: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockTimestamp = (date: Date) => ({
  toDate: () => date,
});

const mockBatch = {
  delete: jest.fn(),
  update: jest.fn(),
  commit: jest.fn(),
};

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((_db, name) => ({ type: 'collection', name })),
  doc: jest.fn((...parts) => ({ type: 'doc', parts, id: parts[parts.length - 1] })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn((field, direction) => ({ field, direction })),
  query: jest.fn((...parts) => ({ type: 'query', parts })),
  updateDoc: jest.fn(),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  writeBatch: jest.fn(() => mockBatch),
  Timestamp: {
    fromDate: jest.fn((date: Date) => mockTimestamp(date)),
  },
}));

const mockedExpenseService = ExpenseService as jest.Mocked<typeof ExpenseService>;
const mockedAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockedGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockedGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockedUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  description: 'Foundation invoice',
  category: 'subcontractor',
  amount: 1000,
  amountPaid: 200,
  amountRemaining: 800,
  status: 'approved',
  createdBy: 'user-1',
  date: new Date('2026-05-01T00:00:00'),
  createdAt: new Date('2026-04-01T00:00:00'),
  updatedAt: new Date('2026-04-01T00:00:00'),
  transactionIds: ['txn-old'],
  ...overrides,
});

const transactionData = (overrides: Record<string, unknown> = {}) => ({
  expenseId: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  amount: 300,
  paymentMethod: 'bank_transfer',
  referenceNumber: 'ACH-1',
  transactionDate: mockTimestamp(new Date('2026-05-10T00:00:00')),
  status: 'completed',
  notes: 'Payment recorded',
  createdAt: mockTimestamp(new Date('2026-05-10T01:00:00')),
  updatedAt: mockTimestamp(new Date('2026-05-10T01:00:00')),
  processedBy: 'user-1',
  receiptUrl: 'https://example.test/receipt.pdf',
  ...overrides,
});

const queryDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
});

const documentSnapshot = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  exists: () => exists,
  data: () => data,
});

describe('ExpenseTransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.delete.mockClear();
    mockBatch.update.mockClear();
    mockBatch.commit.mockResolvedValue(undefined);
    mockedUpdateDoc.mockResolvedValue(undefined);
  });

  test('creates a transaction and partially pays the related expense', async () => {
    mockedExpenseService.getExpense
      .mockResolvedValueOnce(expense())
      .mockResolvedValueOnce(expense({
        amountPaid: 500,
        amountRemaining: 500,
        status: 'partially_paid',
        transactionIds: ['txn-old', 'txn-new'],
      }));
    mockedAddDoc.mockResolvedValueOnce({ id: 'txn-new' } as any);

    const result = await ExpenseTransactionService.createTransaction('user-1', {
      expenseId: 'expense-1',
      projectId: 'project-1',
      amount: 300,
      paymentMethod: 'bank_transfer',
      referenceNumber: 'ACH-1',
      transactionDate: new Date('2026-05-10T00:00:00'),
      notes: 'Payment recorded',
      processedBy: 'user-1',
    });

    expect(mockedAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      expenseId: 'expense-1',
      userId: 'user-1',
      amount: 300,
      status: 'completed',
    }));
    expect(mockedExpenseService.updateExpense).toHaveBeenCalledWith('expense-1', expect.objectContaining({
      amountPaid: 500,
      amountRemaining: 500,
      status: 'partially_paid',
      transactionIds: ['txn-old', 'txn-new'],
      lastPaymentDate: expect.any(Date),
    }));
    expect(result.transaction).toMatchObject({
      id: 'txn-new',
      amount: 300,
      status: 'completed',
    });
    expect(result.updatedExpense.status).toBe('partially_paid');
  });

  test('marks the expense paid when transaction totals meet the full amount', async () => {
    mockedExpenseService.getExpense
      .mockResolvedValueOnce(expense({ amountPaid: 700 }))
      .mockResolvedValueOnce(expense({
        amountPaid: 1000,
        amountRemaining: 0,
        status: 'paid',
      }));
    mockedAddDoc.mockResolvedValueOnce({ id: 'txn-final' } as any);

    await ExpenseTransactionService.createTransaction('user-1', {
      expenseId: 'expense-1',
      projectId: 'project-1',
      amount: 300,
      paymentMethod: 'check',
      transactionDate: new Date('2026-05-12T00:00:00'),
      processedBy: 'user-1',
    });

    expect(mockedExpenseService.updateExpense).toHaveBeenCalledWith('expense-1', expect.objectContaining({
      amountPaid: 1000,
      amountRemaining: 0,
      status: 'paid',
      transactionIds: ['txn-old', 'txn-final'],
    }));
  });

  test('updates only provided transaction fields and converts transaction dates', async () => {
    await ExpenseTransactionService.updateTransaction('txn-1', {
      amount: 450,
      transactionDate: new Date('2026-05-15T00:00:00'),
      notes: undefined,
    });

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'txn-1');
    expect(mockedUpdateDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'txn-1' }), {
      amount: 450,
      transactionDate: expect.objectContaining({ toDate: expect.any(Function) }),
      updatedAt: expect.objectContaining({ toDate: expect.any(Function) }),
    });
  });

  test('gets a transaction only for the owner or processor', async () => {
    mockedGetDoc.mockResolvedValueOnce(
      documentSnapshot('txn-1', transactionData({ userId: 'user-2', processedBy: 'user-1' })) as any
    );

    await expect(ExpenseTransactionService.getTransaction('user-1', 'txn-1')).resolves.toMatchObject({
      id: 'txn-1',
      expenseId: 'expense-1',
      userId: 'user-2',
      amount: 300,
      transactionDate: new Date('2026-05-10T00:00:00'),
    });

    mockedGetDoc.mockResolvedValueOnce(
      documentSnapshot('txn-2', transactionData({ userId: 'user-2', processedBy: 'user-3' })) as any
    );

    await expect(ExpenseTransactionService.getTransaction('user-1', 'txn-2')).resolves.toBeNull();

    mockedGetDoc.mockResolvedValueOnce(documentSnapshot('txn-3', {}, false) as any);
    await expect(ExpenseTransactionService.getTransaction('user-1', 'txn-3')).resolves.toBeNull();
  });

  test('deletes a transaction and rolls back expense payment state', async () => {
    mockedGetDoc.mockResolvedValueOnce(
      documentSnapshot('txn-1', transactionData({ amount: 300 })) as any
    );
    mockedExpenseService.getExpense.mockResolvedValueOnce(expense({
      amountPaid: 500,
      transactionIds: ['txn-old', 'txn-1'],
    }));

    await ExpenseTransactionService.deleteTransaction('user-1', 'txn-1');

    expect(mockBatch.delete).toHaveBeenCalledWith(expect.objectContaining({ id: 'txn-1' }));
    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-1' }),
      expect.objectContaining({
        amountPaid: 200,
        amountRemaining: 800,
        status: 'partially_paid',
        transactionIds: ['txn-old'],
      })
    );
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  test('queries transactions for expenses and chunks Firestore in filters', async () => {
    const firstDate = new Date('2026-05-10T00:00:00');
    const secondDate = new Date('2026-05-12T00:00:00');
    mockedGetDocs
      .mockResolvedValueOnce({
        docs: [queryDoc('txn-1', transactionData({ transactionDate: mockTimestamp(firstDate) }))],
      } as any)
      .mockResolvedValueOnce({
        docs: [queryDoc('txn-2', transactionData({ transactionDate: mockTimestamp(secondDate), amount: 700 }))],
      } as any);

    const ids = Array.from({ length: 12 }, (_, index) => `expense-${index + 1}`);
    const transactions = await ExpenseTransactionService.getTransactionsForExpenses('user-1', [
      ...ids,
      'expense-1',
      '',
    ]);

    expect(mockedGetDocs).toHaveBeenCalledTimes(2);
    expect(transactions.map(transaction => transaction.id)).toEqual(['txn-2', 'txn-1']);
    expect(transactions[0]).toMatchObject({
      amount: 700,
      transactionDate: secondDate,
    });

    await expect(ExpenseTransactionService.getTransactionsForExpenses('user-1', [])).resolves.toEqual([]);
  });

  test('queries transactions by expense and project', async () => {
    mockedGetDocs
      .mockResolvedValueOnce({
        docs: [queryDoc('txn-expense', transactionData())],
      } as any)
      .mockResolvedValueOnce({
        docs: [queryDoc('txn-project', transactionData({ projectId: 'project-1' }))],
      } as any);

    await expect(
      ExpenseTransactionService.getTransactionsForExpense('user-1', 'expense-1')
    ).resolves.toEqual([
      expect.objectContaining({ id: 'txn-expense', expenseId: 'expense-1' }),
    ]);
    await expect(
      ExpenseTransactionService.getProjectTransactions('user-1', 'project-1')
    ).resolves.toEqual([
      expect.objectContaining({ id: 'txn-project', projectId: 'project-1' }),
    ]);
  });
});
