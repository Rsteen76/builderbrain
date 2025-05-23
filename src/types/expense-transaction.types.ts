import { Timestamp } from 'firebase/firestore';

export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
export type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';

export interface ExpenseTransaction {
  id?: string;
  expenseId: string;
  userId: string;
  projectId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  transactionDate: Date | string;
  status: TransactionStatus;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  processedBy: string;
  receiptUrl?: string;
}

interface FirestoreExpenseTransaction extends Omit<ExpenseTransaction, 'id' | 'transactionDate' | 'createdAt' | 'updatedAt'> {
  transactionDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
} 