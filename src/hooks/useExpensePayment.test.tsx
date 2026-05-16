import { act, renderHook } from '@testing-library/react';
import { useExpensePayment } from './useExpensePayment';
import { ExpenseService } from '../services/expense';
import { BidService } from '../services/bid';
import type { Bid, Expense, PaymentDetails } from '../types';

jest.mock('../services/expense', () => ({
  ExpenseService: {
    createExpense: jest.fn(),
    updateExpense: jest.fn(),
    getExpense: jest.fn(),
  },
}));

jest.mock('../services/bid', () => ({
  BidService: {
    getBid: jest.fn(),
    updateBid: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockedExpenseService = ExpenseService as jest.Mocked<typeof ExpenseService>;
const mockedBidService = BidService as jest.Mocked<typeof BidService>;

const baseExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Hillside Build',
  phaseId: 'phase-1',
  phaseName: 'Foundation',
  category: 'subcontractor',
  description: 'Foundation draw',
  amount: 10000,
  amountPaid: 2000,
  amountRemaining: 8000,
  date: new Date('2026-05-01T00:00:00'),
  status: 'approved',
  createdBy: 'user-1',
  vendor: 'Concrete Co',
  subcontractorId: 'sub-1',
  subcontractorName: 'Concrete Co',
  notes: 'Original notes',
  tags: ['draw'],
  createdAt: new Date('2026-04-01T00:00:00'),
  updatedAt: new Date('2026-04-01T00:00:00'),
  ...overrides,
});

const paymentDetails: PaymentDetails = {
  method: 'bank_transfer',
  referenceNumber: 'ACH-100',
  date: new Date('2026-05-10T00:00:00'),
  notes: 'Paid from operating account',
};

const baseBid = (overrides: Partial<Bid> = {}): Bid => ({
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Hillside Build',
  title: 'Concrete package',
  subcontractorName: 'Concrete Co',
  scope: 'Foundation',
  totalAmount: 10000,
  status: 'accepted',
  paymentSchedule: [
    {
      id: 'stage-1',
      name: 'Foundation draw',
      amount: 10000,
      percentage: 100,
      status: 'pending',
      dueDate: new Date('2026-05-01T00:00:00'),
      paidAmount: 2000,
    },
  ],
  paymentProgress: {
    paid: 2000,
    pending: 8000,
    remaining: 8000,
  },
  createdAt: new Date('2026-04-01T00:00:00'),
  updatedAt: new Date('2026-04-01T00:00:00'),
  ...overrides,
});

describe('useExpensePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects payment processing when no user is authenticated', async () => {
    const { result } = renderHook(() => useExpensePayment());

    const response = await act(async () =>
      result.current.processExpensePayment(null, baseExpense(), 1000, paymentDetails)
    );

    expect(response).toEqual({
      success: false,
      message: 'User not authenticated.',
    });
    expect(result.current.error).toBe('User not authenticated.');
    expect(mockedExpenseService.createExpense).not.toHaveBeenCalled();
  });

  test('records a partial expense payment without bid schedule updates', async () => {
    const originalExpense = baseExpense();
    const paymentRecord = baseExpense({
      id: 'payment-expense-1',
      amount: 3000,
      date: paymentDetails.date,
      status: 'paid',
      originalExpenseId: 'expense-1',
    } as Partial<Expense>);
    const updatedExpense = baseExpense({
      amountPaid: 5000,
      amountRemaining: 5000,
      status: 'partially_paid',
    });
    mockedExpenseService.createExpense.mockResolvedValue(paymentRecord);
    mockedExpenseService.updateExpense.mockResolvedValue(undefined);
    mockedExpenseService.getExpense.mockResolvedValue(updatedExpense);

    const { result } = renderHook(() => useExpensePayment());

    const response = await act(async () =>
      result.current.processExpensePayment({ uid: 'user-1' }, originalExpense, 3000, paymentDetails)
    );

    expect(response).toMatchObject({
      success: true,
      updatedExpense,
    });
    expect(response.message).toContain('$3,000.00');
    expect(mockedExpenseService.createExpense).toHaveBeenCalledWith('user-1', expect.objectContaining({
      projectId: 'project-1',
      description: 'Payment for: Foundation draw',
      amount: 3000,
      status: 'paid',
      originalExpenseId: 'expense-1',
      tags: ['draw', 'payment_record'],
    }));
    expect(mockedExpenseService.updateExpense).toHaveBeenCalledWith('expense-1', expect.objectContaining({
      amountPaid: 5000,
      status: 'partially_paid',
      lastPaymentDate: paymentDetails.date,
    }));
    expect(mockedBidService.updateBid).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  test('marks linked bid payment stages paid when the expense is fully paid', async () => {
    const originalExpense = baseExpense({
      bidId: 'bid-1',
      paymentStageId: 'stage-1',
    });
    const paymentRecord = baseExpense({
      id: 'payment-expense-1',
      amount: 8000,
      date: paymentDetails.date,
      status: 'paid',
      originalExpenseId: 'expense-1',
      bidId: 'bid-1',
      paymentStageId: 'stage-1',
    } as Partial<Expense>);
    const updatedExpense = baseExpense({
      bidId: 'bid-1',
      paymentStageId: 'stage-1',
      amountPaid: 10000,
      amountRemaining: 0,
      status: 'paid',
    });
    const updatedBid = baseBid({
      paymentSchedule: [
        {
          ...baseBid().paymentSchedule![0],
          status: 'paid',
          paidAmount: 10000,
          expenseId: 'payment-expense-1',
        },
      ],
      paymentProgress: {
        paid: 10000,
        pending: 0,
        remaining: 0,
      },
    });

    mockedExpenseService.createExpense.mockResolvedValue(paymentRecord);
    mockedExpenseService.updateExpense.mockResolvedValue(undefined);
    mockedExpenseService.getExpense.mockResolvedValue(updatedExpense);
    mockedBidService.getBid
      .mockResolvedValueOnce(baseBid())
      .mockResolvedValueOnce(updatedBid);
    mockedBidService.updateBid.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpensePayment());

    const response = await act(async () =>
      result.current.processExpensePayment({ uid: 'user-1' }, originalExpense, 8000, paymentDetails)
    );

    expect(response).toMatchObject({
      success: true,
      updatedExpense,
      updatedBid,
    });
    expect(mockedExpenseService.updateExpense).toHaveBeenCalledWith('expense-1', expect.objectContaining({
      amountPaid: 10000,
      status: 'paid',
      paymentDetails,
    }));
    expect(mockedBidService.updateBid).toHaveBeenCalledWith('bid-1', expect.objectContaining({
      paymentSchedule: [
        expect.objectContaining({
          id: 'stage-1',
          status: 'paid',
          paidAmount: 10000,
          expenseId: 'payment-expense-1',
          paymentDate: paymentDetails.date,
        }),
      ],
      paymentProgress: {
        paid: 10000,
        pending: 0,
        remaining: 0,
      },
    }));
  });

  test('returns a failure response and exposes errors from service failures', async () => {
    mockedExpenseService.createExpense.mockRejectedValue(new Error('write failed'));

    const { result } = renderHook(() => useExpensePayment());

    const response = await act(async () =>
      result.current.processExpensePayment({ uid: 'user-1' }, baseExpense(), 1000, paymentDetails)
    );

    expect(response).toEqual({
      success: false,
      message: 'write failed',
    });
    expect(result.current.error).toBe('write failed');
    expect(result.current.isProcessing).toBe(false);
  });
});
