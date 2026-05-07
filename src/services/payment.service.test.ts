import { PaymentService } from './payment';
import { AccountingService } from './accounting';
import { ExpenseService } from './expense';
import { ExpenseTransactionService } from './expense-transaction';
import { Expense, ExpenseTransaction } from '../types';

jest.mock('./expense', () => ({
  ExpenseService: {
    getExpenses: jest.fn(),
  },
}));

jest.mock('./expense-transaction', () => ({
  ExpenseTransactionService: {
    getTransactionsForExpense: jest.fn(),
    getTransactionsForExpenses: jest.fn(),
  },
}));

const mockAccountingSummary = {
  committed: 0,
  commitmentOutstanding: 0,
  vendorInvoiced: 0,
  vendorPaid: 0,
  retainageHeld: 0,
  ownerBilled: 0,
  ownerReceived: 0,
  lienWaiversNeeded: 0,
};

jest.mock('./accounting', () => ({
  AccountingService: {
    getAccountingDashboard: jest.fn(),
    emptyDashboard: jest.fn(() => ({
      commitments: [],
      vendorInvoices: [],
      vendorPayments: [],
      ownerInvoices: [],
      ownerPayments: [],
      summary: mockAccountingSummary,
    })),
  },
}));

const mockGetExpenses = ExpenseService.getExpenses as jest.Mock;
const mockGetTransactionsForExpense =
  ExpenseTransactionService.getTransactionsForExpense as jest.Mock;
const mockGetTransactionsForExpenses =
  ExpenseTransactionService.getTransactionsForExpenses as jest.Mock;
const mockGetAccountingDashboard =
  AccountingService.getAccountingDashboard as jest.Mock;

const baseExpense = (overrides: Partial<Expense>): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Project One',
  category: 'materials',
  description: 'Material invoice',
  amount: 1000,
  amountPaid: 0,
  amountRemaining: 1000,
  date: new Date('2026-05-01T00:00:00.000Z'),
  status: 'approved',
  createdBy: 'user-1',
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  updatedAt: new Date('2026-04-01T00:00:00.000Z'),
  ...overrides,
});

const baseTransaction = (
  overrides: Partial<ExpenseTransaction>
): ExpenseTransaction => ({
  id: 'transaction-1',
  expenseId: 'expense-transaction-backed',
  userId: 'user-1',
  projectId: 'project-1',
  amount: 350,
  paymentMethod: 'bank_transfer',
  transactionDate: new Date('2026-05-03T00:00:00.000Z'),
  status: 'completed',
  createdAt: new Date('2026-05-03T00:00:00.000Z'),
  updatedAt: new Date('2026-05-03T00:00:00.000Z'),
  processedBy: 'user-1',
  ...overrides,
});

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionsForExpense.mockResolvedValue([]);
    mockGetTransactionsForExpenses.mockResolvedValue([]);
    mockGetAccountingDashboard.mockResolvedValue({
      commitments: [],
      vendorInvoices: [],
      vendorPayments: [],
      ownerInvoices: [],
      ownerPayments: [],
      summary: mockAccountingSummary,
    });
  });

  test('builds dashboard totals from paid expense fields and open balances', async () => {
    mockGetExpenses.mockResolvedValue([
      baseExpense({
        id: 'paid-expense',
        amount: 1000,
        amountPaid: 1000,
        amountRemaining: 0,
        status: 'paid',
        paymentDetails: {
          method: 'check',
          date: '2026-05-02',
          referenceNumber: 'CHK-1',
        },
      }),
      baseExpense({
        id: 'pending-expense',
        amount: 500,
        amountPaid: 0,
        amountRemaining: 500,
        dueDate: new Date('2026-05-10T00:00:00.000Z'),
      }),
      baseExpense({
        id: 'overdue-expense',
        amount: 250,
        amountPaid: 0,
        amountRemaining: 250,
        dueDate: new Date('2026-05-01T00:00:00.000Z'),
      }),
    ]);

    const dashboard = await PaymentService.getPaymentsDashboard('user-1', {
      now: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(dashboard.summary).toEqual({
      totalReceived: 1000,
      pending: 500,
      overdue: 250,
      thisMonth: 1000,
      ...mockAccountingSummary,
    });
    expect(dashboard.payments).toHaveLength(1);
    expect(dashboard.payments[0]).toMatchObject({
      id: 'paid-expense-payment-summary',
      amount: 1000,
      paymentMethod: 'Check',
      referenceNumber: 'CHK-1',
      status: 'paid',
    });
  });

  test('adds accounting commitment and invoice totals to the dashboard summary', async () => {
    mockGetExpenses.mockResolvedValue([]);
    mockGetAccountingDashboard.mockResolvedValue({
      commitments: [],
      vendorInvoices: [],
      vendorPayments: [],
      ownerInvoices: [],
      ownerPayments: [],
      summary: {
        committed: 5000,
        commitmentOutstanding: 4250,
        vendorInvoiced: 1500,
        vendorPaid: 750,
        retainageHeld: 250,
        ownerBilled: 3000,
        ownerReceived: 2000,
        lienWaiversNeeded: 2,
      },
    });

    const dashboard = await PaymentService.getPaymentsDashboard('user-1', {
      now: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(mockGetAccountingDashboard).toHaveBeenCalledWith('user-1');
    expect(dashboard.summary).toMatchObject({
      committed: 5000,
      commitmentOutstanding: 4250,
      vendorInvoiced: 1500,
      vendorPaid: 750,
      retainageHeld: 250,
      ownerBilled: 3000,
      ownerReceived: 2000,
      lienWaiversNeeded: 2,
    });
  });

  test('uses explicit transactions instead of expense amountPaid when transaction ids exist', async () => {
    mockGetExpenses.mockResolvedValue([
      baseExpense({
        id: 'expense-transaction-backed',
        amount: 1000,
        amountPaid: 700,
        amountRemaining: 300,
        status: 'partially_paid',
        transactionIds: ['transaction-1', 'transaction-2'],
      }),
    ]);
    mockGetTransactionsForExpenses.mockResolvedValue([
      baseTransaction({ id: 'transaction-1', amount: 350 }),
      baseTransaction({
        id: 'transaction-2',
        amount: 150,
        transactionDate: new Date('2026-04-30T00:00:00.000Z'),
      }),
    ]);

    const dashboard = await PaymentService.getPaymentsDashboard('user-1', {
      now: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(mockGetTransactionsForExpenses).toHaveBeenCalledWith(
      'user-1',
      ['expense-transaction-backed']
    );
    expect(mockGetTransactionsForExpense).not.toHaveBeenCalled();
    expect(dashboard.summary.totalReceived).toBe(500);
    expect(dashboard.summary.pending).toBe(300);
    expect(dashboard.summary.thisMonth).toBe(350);
    expect(dashboard.payments.map((payment) => payment.id)).toEqual([
      'transaction-1',
      'transaction-2',
    ]);
  });

  test('keeps pending transactions visible without counting them as received', async () => {
    mockGetExpenses.mockResolvedValue([
      baseExpense({
        id: 'expense-transaction-backed',
        amount: 1000,
        amountPaid: 350,
        amountRemaining: 650,
        status: 'partially_paid',
        transactionIds: ['transaction-1', 'transaction-2', 'transaction-3'],
      }),
    ]);
    mockGetTransactionsForExpenses.mockResolvedValue([
      baseTransaction({ id: 'transaction-1', amount: 350, status: 'completed' }),
      baseTransaction({ id: 'transaction-2', amount: 125, status: 'pending' }),
      baseTransaction({ id: 'transaction-3', amount: 90, status: 'failed' }),
    ]);

    const dashboard = await PaymentService.getPaymentsDashboard('user-1', {
      now: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(dashboard.payments.map((payment) => payment.id)).toEqual([
      'transaction-1',
      'transaction-2',
    ]);
    expect(dashboard.payments[1].status).toBe('pending');
    expect(dashboard.summary.totalReceived).toBe(350);
    expect(dashboard.summary.thisMonth).toBe(350);
  });

  test('bulk loads transactions for listed expenses instead of fetching one expense at a time', async () => {
    mockGetExpenses.mockResolvedValue([
      baseExpense({
        id: 'expense-one',
        projectName: 'Project One',
        description: 'First invoice',
        transactionIds: ['transaction-1'],
      }),
      baseExpense({
        id: 'expense-two',
        projectName: 'Project Two',
        description: 'Second invoice',
        transactionIds: ['transaction-2'],
      }),
      baseExpense({
        id: 'expense-without-transactions',
        amountPaid: 0,
      }),
    ]);
    mockGetTransactionsForExpenses.mockResolvedValue([
      baseTransaction({
        id: 'transaction-1',
        expenseId: 'expense-one',
        projectId: 'project-1',
        amount: 200,
      }),
      baseTransaction({
        id: 'transaction-2',
        expenseId: 'expense-two',
        projectId: 'project-2',
        amount: 300,
      }),
    ]);

    const dashboard = await PaymentService.getPaymentsDashboard('user-1', {
      now: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(mockGetTransactionsForExpenses).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionsForExpenses).toHaveBeenCalledWith('user-1', [
      'expense-one',
      'expense-two',
    ]);
    expect(mockGetTransactionsForExpense).not.toHaveBeenCalled();
    expect(dashboard.payments.map((payment) => payment.id)).toEqual([
      'transaction-1',
      'transaction-2',
    ]);
  });

  test('does not double count original expenses when payment record expenses exist', async () => {
    mockGetExpenses.mockResolvedValue([
      baseExpense({
        id: 'original-expense',
        amount: 1000,
        amountPaid: 400,
        amountRemaining: 600,
        status: 'partially_paid',
      }),
      baseExpense({
        id: 'payment-record-expense',
        amount: 400,
        amountPaid: 0,
        amountRemaining: 400,
        status: 'paid',
        originalExpenseId: 'original-expense',
        tags: ['payment_record'],
        paymentDetails: {
          method: 'credit_card',
          date: '2026-05-04',
        },
      }),
    ]);

    const dashboard = await PaymentService.getPaymentsDashboard('user-1', {
      now: new Date('2026-05-07T00:00:00.000Z'),
    });

    expect(dashboard.summary.totalReceived).toBe(400);
    expect(dashboard.payments).toHaveLength(1);
    expect(dashboard.payments[0]).toMatchObject({
      id: 'payment-record-expense',
      expenseId: 'original-expense',
      paymentMethod: 'Credit Card',
    });
  });

  test('requires a user id', async () => {
    await expect(PaymentService.getPaymentsDashboard('')).rejects.toThrow(
      'User ID is required'
    );
  });
});
