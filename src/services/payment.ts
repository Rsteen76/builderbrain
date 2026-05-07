import { Expense, ExpenseTransaction, PaymentMethod } from '../types';
import { AccountingService } from './accounting';
import { ExpenseService } from './expense';
import { ExpenseTransactionService } from './expense-transaction';
import { logger } from '../utils/logger';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface PaymentRecord {
  id: string;
  expenseId: string;
  projectId: string;
  projectName: string;
  description: string;
  amount: number;
  date: Date;
  status: PaymentStatus;
  paymentMethod: string;
  referenceNumber?: string;
  vendor?: string | null;
}

export interface PaymentSummary {
  totalReceived: number;
  pending: number;
  overdue: number;
  thisMonth: number;
  committed: number;
  commitmentOutstanding: number;
  vendorInvoiced: number;
  vendorPaid: number;
  retainageHeld: number;
  ownerBilled: number;
  ownerReceived: number;
  lienWaiversNeeded: number;
}

export interface PaymentsDashboardData {
  summary: PaymentSummary;
  payments: PaymentRecord[];
}

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeMethod = (method?: string | PaymentMethod): string => {
  if (!method) return 'Not recorded';
  return method
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const isPaymentRecordExpense = (expense: Expense): boolean =>
  !!expense.originalExpenseId || (expense.tags || []).includes('payment_record');

const getPaidAmount = (expense: Expense): number => {
  if (isPaymentRecordExpense(expense)) {
    return Math.max(expense.amount || 0, 0);
  }

  if (typeof expense.amountPaid === 'number') {
    return Math.max(expense.amountPaid, 0);
  }

  return expense.status === 'paid' ? Math.max(expense.amount || 0, 0) : 0;
};

const getRemainingAmount = (expense: Expense): number => {
  if (isPaymentRecordExpense(expense)) return 0;
  if (typeof expense.amountRemaining === 'number') {
    return Math.max(expense.amountRemaining, 0);
  }

  return Math.max((expense.amount || 0) - (expense.amountPaid || 0), 0);
};

const isSameMonth = (date: Date, referenceDate: Date): boolean =>
  date.getFullYear() === referenceDate.getFullYear() &&
  date.getMonth() === referenceDate.getMonth();

const emptyAccountingSummary = () => AccountingService.emptyDashboard().summary;

export class PaymentService {
  static async getPaymentsDashboard(
    userId: string,
    options: { now?: Date } = {}
  ): Promise<PaymentsDashboardData> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const now = options.now || new Date();
    const [expenses, accountingDashboard] = await Promise.all([
      ExpenseService.getExpenses(userId),
      AccountingService.getAccountingDashboard(userId).catch((error) => {
        logger.error('PaymentService: Failed to load accounting dashboard', error);
        return AccountingService.emptyDashboard();
      }),
    ]);
    const accountingSummary = accountingDashboard.summary || emptyAccountingSummary();
    const explicitPaymentExpenseSourceIds = new Set(
      expenses
        .filter(isPaymentRecordExpense)
        .map((expense) => expense.originalExpenseId)
        .filter((id): id is string => !!id)
    );

    const transactionPayments = await this.getTransactionPayments(userId, expenses);
    const transactionExpenseIds = new Set(
      transactionPayments.map((payment) => payment.expenseId)
    );

    const fallbackPayments = expenses
      .filter((expense) => {
        const expenseId = expense.id;
        if (!expenseId) return false;
        if (transactionExpenseIds.has(expenseId)) return false;
        if (explicitPaymentExpenseSourceIds.has(expenseId)) return false;
        return getPaidAmount(expense) > 0;
      })
      .map((expense) => this.fromExpensePayment(expense));

    const payments = [...transactionPayments, ...fallbackPayments]
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const openExpenses = expenses.filter(
      (expense) =>
        !isPaymentRecordExpense(expense) &&
        ['pending', 'approved', 'partially_paid'].includes(expense.status) &&
        getRemainingAmount(expense) > 0
    );

    const overdue = openExpenses.reduce((sum, expense) => {
      const dueDate = toDate(expense.dueDate);
      return dueDate && dueDate < now ? sum + getRemainingAmount(expense) : sum;
    }, 0);

    const pending = openExpenses.reduce((sum, expense) => {
      const dueDate = toDate(expense.dueDate);
      return !dueDate || dueDate >= now ? sum + getRemainingAmount(expense) : sum;
    }, 0);

    return {
      payments,
      summary: {
        totalReceived: payments
          .filter((payment) => payment.status === 'paid')
          .reduce((sum, payment) => sum + payment.amount, 0),
        pending,
        overdue,
        thisMonth: payments
          .filter(
            (payment) => payment.status === 'paid' && isSameMonth(payment.date, now)
          )
          .reduce((sum, payment) => sum + payment.amount, 0),
        committed: accountingSummary.committed,
        commitmentOutstanding: accountingSummary.commitmentOutstanding,
        vendorInvoiced: accountingSummary.vendorInvoiced,
        vendorPaid: accountingSummary.vendorPaid,
        retainageHeld: accountingSummary.retainageHeld,
        ownerBilled: accountingSummary.ownerBilled,
        ownerReceived: accountingSummary.ownerReceived,
        lienWaiversNeeded: accountingSummary.lienWaiversNeeded,
      },
    };
  }

  private static async getTransactionPayments(
    userId: string,
    expenses: Expense[]
  ): Promise<PaymentRecord[]> {
    const transactionResults = await Promise.all(
      expenses
        .filter((expense) => expense.id && (expense.transactionIds || []).length > 0)
        .map(async (expense) => {
          try {
            const transactions = await ExpenseTransactionService.getTransactionsForExpense(
              userId,
              expense.id!
            );
            return transactions
              .filter((transaction) =>
                ['completed', 'pending'].includes(transaction.status)
              )
              .map((transaction) => this.fromTransaction(transaction, expense));
          } catch (error) {
            logger.error(
              `PaymentService: Failed to load transactions for expense ${expense.id}`,
              error
            );
            return [this.fromExpensePayment(expense)];
          }
        })
    );

    return transactionResults.flat();
  }

  private static fromTransaction(
    transaction: ExpenseTransaction,
    expense: Expense
  ): PaymentRecord {
    return {
      id: transaction.id || `${transaction.expenseId}-${transaction.transactionDate}`,
      expenseId: transaction.expenseId,
      projectId: transaction.projectId,
      projectName: expense.projectName || 'Unknown Project',
      description: expense.description,
      amount: Math.max(transaction.amount || 0, 0),
      date: toDate(transaction.transactionDate) || new Date(0),
      status: transaction.status === 'pending' ? 'pending' : 'paid',
      paymentMethod: normalizeMethod(transaction.paymentMethod),
      referenceNumber: transaction.referenceNumber,
      vendor: expense.vendor,
    };
  }

  private static fromExpensePayment(expense: Expense): PaymentRecord {
    const paymentDetails = expense.paymentDetails || undefined;
    const paymentDate =
      toDate(paymentDetails?.date) ||
      toDate(expense.lastPaymentDate) ||
      toDate(expense.date) ||
      new Date(0);

    return {
      id: isPaymentRecordExpense(expense)
        ? expense.id!
        : `${expense.id}-payment-summary`,
      expenseId: expense.originalExpenseId || expense.id!,
      projectId: expense.projectId,
      projectName: expense.projectName || 'Unknown Project',
      description: expense.description,
      amount: getPaidAmount(expense),
      date: paymentDate,
      status: 'paid',
      paymentMethod: normalizeMethod(paymentDetails?.method),
      referenceNumber: paymentDetails?.referenceNumber,
      vendor: expense.vendor,
    };
  }
}
