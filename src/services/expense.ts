import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Expense } from '../types';

interface FirestoreExpense extends Omit<Expense, 'id' | 'date' | 'createdAt' | 'updatedAt'> {
  userId: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ExpenseService {
  private static collection = collection(db, 'expenses');

  static async createExpense(userId: string, expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Expense> {
    const now = new Date();
    
    // Convert date to Timestamp if it's a string
    const expenseDate = expenseData.date instanceof Date 
      ? expenseData.date 
      : new Date(expenseData.date);
    
    const firestoreData: FirestoreExpense = {
      ...expenseData,
      userId: userId,
      createdBy: userId, // Default to the user creating the expense
      date: Timestamp.fromDate(expenseDate), // Fixed date type conversion
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    const docRef = await addDoc(this.collection, firestoreData);

    return {
      ...expenseData,
      id: docRef.id,
      userId: userId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async updateExpense(id: string, expenseData: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'createdBy'>>): Promise<void> {
    const expenseRef = doc(this.collection, id);
    const { userId, createdAt, ...updatePayload } = expenseData as any;

    const firestoreUpdateData: Partial<FirestoreExpense> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    for (const key in updatePayload) {
      if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
        const typedKey = key as keyof typeof updatePayload;
        const value = updatePayload[typedKey];

        if (typedKey === 'date' && value instanceof Date) {
          firestoreUpdateData.date = Timestamp.fromDate(value);
        } else {
          (firestoreUpdateData as any)[typedKey] = value;
        }
      }
    }

    await updateDoc(expenseRef, firestoreUpdateData);
  }

  static async deleteExpense(id: string): Promise<void> {
    const expenseRef = doc(this.collection, id);
    await deleteDoc(expenseRef);
  }

  static async getExpense(userId: string, id: string): Promise<Expense | null> {
    const expenseRef = doc(this.collection, id);
    const expenseDoc = await getDoc(expenseRef);

    if (!expenseDoc.exists()) {
      console.log(`ExpenseService: Expense ${id} not found.`);
      return null;
    }

    const data = expenseDoc.data() as FirestoreExpense;

    // Check authorization - only the expense owner or the one who created it can access
    if (data.userId !== userId && data.createdBy !== userId) {
      console.warn(`ExpenseService: User ${userId} attempted to access unauthorized expense ${id}.`);
      return null;
    }

    return this.convertFirestoreData(data, id);
  }

  static async getExpenses(userId: string, filters?: {
    projectId?: string;
    category?: Expense['category'];
    status?: Expense['status'];
    startDate?: Date;
    endDate?: Date;
    vendor?: string;
  }): Promise<Expense[]> {
    // Query expenses where user is either the owner or the creator
    let q = query(
      this.collection, 
      where('userId', '==', userId)
    );

    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }

    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters?.vendor) {
      q = query(q, where('vendor', '==', filters.vendor));
    }

    if (filters?.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters?.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order by date (most recent first)
    q = query(q, orderBy('date', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreExpense;
      return this.convertFirestoreData(data, doc.id);
    });
  }

  // Get project-specific expenses
  static async getProjectExpenses(userId: string, projectId: string): Promise<Expense[]> {
    return this.getExpenses(userId, { projectId });
  }

  // Get expenses by status
  static async getExpensesByStatus(userId: string, status: Expense['status']): Promise<Expense[]> {
    return this.getExpenses(userId, { status });
  }

  // Approve an expense
  static async approveExpense(id: string, approvedBy: string): Promise<void> {
    return this.updateExpense(id, { 
      status: 'approved',
      approvedBy 
    });
  }

  // Reject an expense
  static async rejectExpense(id: string, notes?: string): Promise<void> {
    return this.updateExpense(id, { 
      status: 'rejected',
      notes: notes 
    });
  }

  // Mark an expense as paid
  static async markAsPaid(id: string): Promise<void> {
    return this.updateExpense(id, { status: 'paid' });
  }

  private static convertFirestoreData(data: FirestoreExpense, id: string): Expense {
    return {
      ...data,
      id,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
}