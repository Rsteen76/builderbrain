import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  QueryDocumentSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { ExpenseTransaction, TransactionStatus } from '../types/expense-transaction.types';
import { ExpenseService } from './expense';
import { Expense, ExpenseStatus } from '../types';
import { logger } from '../utils/logger';

interface FirestoreExpenseTransaction extends Omit<ExpenseTransaction, 'id' | 'transactionDate' | 'createdAt' | 'updatedAt'> {
  transactionDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ExpenseTransactionService {
  private static collection = collection(db, 'expense_transactions');
  private static readonly expenseIdInQueryLimit = 10;

  /**
   * Create a new expense transaction and update the related expense
   */
  static async createTransaction(
    userId: string,
    transactionData: Omit<ExpenseTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TransactionStatus }
  ): Promise<{ transaction: ExpenseTransaction; updatedExpense: Expense }> {
    try {
      const now = new Date();
      
      // Get the expense to update
      const expense = await ExpenseService.getExpense(userId, transactionData.expenseId);
      if (!expense) {
        throw new Error(`Expense with ID ${transactionData.expenseId} not found`);
      }
      
      // Create transaction object
      const transaction: Omit<ExpenseTransaction, 'id'> = {
        ...transactionData,
        userId,
        status: transactionData.status || 'completed',
        createdAt: now,
        updatedAt: now,
      };
      
      // Convert to Firestore format
      const firestoreTransaction = this.convertToFirestore(transaction);
      
      // Add transaction to Firestore
      const docRef = await addDoc(this.collection, firestoreTransaction);
      const createdTransaction = { ...transaction, id: docRef.id };
      
      // Update the expense with new payment information
      const amountPaid = (expense.amountPaid || 0) + transactionData.amount;
      const amountRemaining = expense.amount - amountPaid;
      
      // Determine new status based on payment amount
      let newStatus: ExpenseStatus = expense.status;
      if (amountPaid >= expense.amount) {
        newStatus = 'paid';
      } else if (amountPaid > 0) {
        newStatus = 'partially_paid';
      }
      
      // Add transaction ID to the expense's transactionIds array
      const transactionIds = expense.transactionIds || [];
      transactionIds.push(docRef.id);
      
      // Update the expense
      await ExpenseService.updateExpense(expense.id!, {
        amountPaid,
        amountRemaining,
        status: newStatus,
        lastPaymentDate: now,
        transactionIds,
      });
      
      // Get the updated expense
      const updatedExpense = await ExpenseService.getExpense(userId, expense.id!);
      if (!updatedExpense) {
        throw new Error('Failed to retrieve updated expense');
      }
      
      return { 
        transaction: createdTransaction, 
        updatedExpense
      };
    } catch (error) {
      logger.error('Error creating expense transaction:', error);
      throw error;
    }
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(
    id: string, 
    transactionData: Partial<Omit<ExpenseTransaction, 'id' | 'expenseId' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const transactionRef = doc(this.collection, id);
    
    // Prepare update data
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    // Add provided fields to the update
    Object.keys(transactionData).forEach(key => {
      const value = transactionData[key as keyof typeof transactionData];
      if (value !== undefined) {
        if (key === 'transactionDate' && value instanceof Date) {
          updateData.transactionDate = Timestamp.fromDate(value);
        } else {
          updateData[key] = value;
        }
      }
    });
    
    await updateDoc(transactionRef, updateData);
  }

  /**
   * Delete a transaction and update the related expense
   */
  static async deleteTransaction(userId: string, id: string): Promise<void> {
    try {
      // Get the transaction first to access its data
      const transaction = await this.getTransaction(userId, id);
      if (!transaction) {
        throw new Error(`Transaction with ID ${id} not found`);
      }
      
      // Get the related expense
      const expense = await ExpenseService.getExpense(userId, transaction.expenseId);
      if (!expense) {
        throw new Error(`Expense with ID ${transaction.expenseId} not found`);
      }
      
      // Update the expense with new payment information
      const amountPaid = (expense.amountPaid || 0) - transaction.amount;
      const amountRemaining = expense.amount - amountPaid;
      
      // Determine new status based on payment amount
      let newStatus: Expense['status'] = expense.status;
      if (amountPaid <= 0) {
        newStatus = 'approved'; // If previously paid but now no payment, revert to approved
      } else if (amountPaid < expense.amount) {
        newStatus = 'partially_paid';
      }
      
      // Remove transaction ID from the expense's transactionIds array
      const transactionIds = (expense.transactionIds || []).filter(tid => tid !== id);
      
      const batch = writeBatch(db);
      
      // Delete the transaction
      const transactionRef = doc(this.collection, id);
      batch.delete(transactionRef);
      
      // Update the expense
      const expenseRef = doc(collection(db, 'expenses'), expense.id!);
      batch.update(expenseRef, {
        amountPaid,
        amountRemaining,
        status: newStatus,
        transactionIds,
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      await batch.commit();
    } catch (error) {
      logger.error('Error deleting expense transaction:', error);
      throw error;
    }
  }

  /**
   * Get a specific transaction
   */
  static async getTransaction(userId: string, id: string): Promise<ExpenseTransaction | null> {
    const transactionRef = doc(this.collection, id);
    const transactionDoc = await getDoc(transactionRef);

    if (!transactionDoc.exists()) {
      return null;
    }

    const data = transactionDoc.data() as FirestoreExpenseTransaction;
    
    // Check authorization
    if (data.userId !== userId && data.processedBy !== userId) {
      return null;
    }

    return this.convertFromFirestore(transactionDoc);
  }

  /**
   * Get all transactions for an expense
   */
  static async getTransactionsForExpense(userId: string, expenseId: string): Promise<ExpenseTransaction[]> {
    try {
      const q = query(
        this.collection,
        where('expenseId', '==', expenseId),
        where('userId', '==', userId),
        orderBy('transactionDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.convertFromFirestore(doc));
    } catch (error) {
      logger.error('Error fetching transactions for expense:', error);
      throw error;
    }
  }

  /**
   * Get transactions for multiple expenses using chunked Firestore in queries.
   */
  static async getTransactionsForExpenses(
    userId: string,
    expenseIds: string[]
  ): Promise<ExpenseTransaction[]> {
    const uniqueExpenseIds = Array.from(new Set(expenseIds.filter(Boolean)));
    if (uniqueExpenseIds.length === 0) {
      return [];
    }

    try {
      const chunks: string[][] = [];
      for (
        let index = 0;
        index < uniqueExpenseIds.length;
        index += this.expenseIdInQueryLimit
      ) {
        chunks.push(uniqueExpenseIds.slice(index, index + this.expenseIdInQueryLimit));
      }

      const snapshots = await Promise.all(
        chunks.map((expenseIdChunk) => {
          const q = query(
            this.collection,
            where('expenseId', 'in', expenseIdChunk),
            where('userId', '==', userId)
          );

          return getDocs(q);
        })
      );

      return snapshots
        .flatMap((querySnapshot) =>
          querySnapshot.docs.map(doc => this.convertFromFirestore(doc))
        )
        .sort(
          (a, b) =>
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime()
        );
    } catch (error) {
      logger.error('Error fetching transactions for expenses:', error);
      throw error;
    }
  }

  /**
   * Get all transactions for a project
   */
  static async getProjectTransactions(userId: string, projectId: string): Promise<ExpenseTransaction[]> {
    try {
      const q = query(
        this.collection,
        where('projectId', '==', projectId),
        where('userId', '==', userId),
        orderBy('transactionDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.convertFromFirestore(doc));
    } catch (error) {
      logger.error('Error fetching project transactions:', error);
      throw error;
    }
  }

  /**
   * Convert a transaction to Firestore format
   */
  private static convertToFirestore(transaction: Partial<ExpenseTransaction>): any {
    const firestoreData: any = { ...transaction };
    
    if (transaction.transactionDate instanceof Date) {
      firestoreData.transactionDate = Timestamp.fromDate(transaction.transactionDate);
    } else if (typeof transaction.transactionDate === 'string') {
      firestoreData.transactionDate = Timestamp.fromDate(new Date(transaction.transactionDate));
    }
    
    if (transaction.createdAt instanceof Date) {
      firestoreData.createdAt = Timestamp.fromDate(transaction.createdAt);
    } else if (typeof transaction.createdAt === 'string') {
      firestoreData.createdAt = Timestamp.fromDate(new Date(transaction.createdAt));
    }
    
    if (transaction.updatedAt instanceof Date) {
      firestoreData.updatedAt = Timestamp.fromDate(transaction.updatedAt);
    } else if (typeof transaction.updatedAt === 'string') {
      firestoreData.updatedAt = Timestamp.fromDate(new Date(transaction.updatedAt));
    }
    
    return firestoreData;
  }

  /**
   * Convert from Firestore to transaction object
   */
  private static convertFromFirestore(doc: QueryDocumentSnapshot): ExpenseTransaction {
    const data = doc.data() as FirestoreExpenseTransaction;
    
    return {
      id: doc.id,
      expenseId: data.expenseId,
      userId: data.userId,
      projectId: data.projectId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      transactionDate: data.transactionDate.toDate(),
      status: data.status,
      notes: data.notes,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      processedBy: data.processedBy,
      receiptUrl: data.receiptUrl,
    };
  }
}
