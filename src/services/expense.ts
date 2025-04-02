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
    console.log(`ExpenseService: Creating expense for user: ${userId}`);
    
    if (!userId) {
      console.error("ExpenseService: No userId provided to createExpense");
      throw new Error("User ID is required to create an expense");
    }
    
    // Convert date to Timestamp if it's a string
    const expenseDate = expenseData.date instanceof Date 
      ? expenseData.date 
      : new Date(expenseData.date);
    
    // Standardize on phaseName field - if buildingPhase exists but phaseName doesn't, use buildingPhase value
    const dataWithStandardizedPhase = { ...expenseData };
    if (!dataWithStandardizedPhase.phaseName && dataWithStandardizedPhase.buildingPhase) {
      console.log(`ExpenseService: Standardizing on phaseName instead of buildingPhase: ${dataWithStandardizedPhase.buildingPhase}`);
      dataWithStandardizedPhase.phaseName = dataWithStandardizedPhase.buildingPhase;
    }
    
    const firestoreData: any = {
      ...dataWithStandardizedPhase,
      userId: userId,
      createdBy: userId,
      date: Timestamp.fromDate(expenseDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    console.log("Saving expense to Firestore with data:", JSON.stringify({
      ...firestoreData,
      date: firestoreData.date.toDate().toISOString(),
      createdAt: firestoreData.createdAt.toDate().toISOString(),
      updatedAt: firestoreData.updatedAt.toDate().toISOString(),
    }));
    
    const docRef = await addDoc(this.collection, firestoreData);
    console.log(`Expense created with ID: ${docRef.id}`);

    return {
      ...dataWithStandardizedPhase,
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

    console.log(`ExpenseService: Updating expense ${id} with data:`, expenseData);

    // Standardize on phaseName field
    const standardizedPayload = { ...updatePayload };
    if (updatePayload.buildingPhase && !updatePayload.phaseName) {
      console.log(`ExpenseService: Standardizing on phaseName instead of buildingPhase: ${updatePayload.buildingPhase}`);
      standardizedPayload.phaseName = updatePayload.buildingPhase;
    }

    const firestoreUpdateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Helper function to clean undefined values from an object
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(v => cleanObject(v));
      }
      if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = cleanObject(obj[key]);
            if (value !== undefined) {
              cleaned[key] = value;
            }
          }
        }
        return cleaned;
      }
      return obj;
    };

    // Process each field in the update payload
    for (const key in standardizedPayload) {
      if (Object.prototype.hasOwnProperty.call(standardizedPayload, key)) {
        const typedKey = key as keyof typeof standardizedPayload;
        let value = standardizedPayload[typedKey];

        // Skip undefined values
        if (value === undefined) {
          console.log(`ExpenseService: Skipping undefined value for field ${String(typedKey)}`);
          continue;
        }

        // Handle Date objects
        if (typedKey === 'date' && value instanceof Date) {
          firestoreUpdateData.date = Timestamp.fromDate(value);
        } else if (typeof value === 'object' && value !== null) {
          // Clean nested objects of undefined values
          const cleanedValue = cleanObject(value);
          if (Object.keys(cleanedValue).length > 0) {
            firestoreUpdateData[typedKey] = cleanedValue;
          }
        } else {
          firestoreUpdateData[typedKey] = value;
        }
      }
    }

    console.log(`ExpenseService: Prepared update payload:`, firestoreUpdateData);
    
    try {
      await updateDoc(expenseRef, firestoreUpdateData);
      console.log(`ExpenseService: Successfully updated expense ${id}`);
    } catch (error) {
      console.error(`ExpenseService: Error updating expense ${id}:`, error);
      throw error;
    }
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

    const data = expenseDoc.data() as any;

    // Check authorization - only the expense owner or the one who created it can access
    if (data.userId !== userId && data.createdBy !== userId) {
      console.warn(`ExpenseService: User ${userId} attempted to access unauthorized expense ${id}.`);
      return null;
    }

    return this.convertFirestoreData(data, id);
  }

  static async getExpenses(userId: string, filters?: {
    status?: Expense['status'];
    projectId?: string;
    phaseId?: string;
    subcontractorId?: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    console.log(`ExpenseService.getExpenses - Fetching expenses for user: ${userId}`);
    
    if (!userId) {
      console.error("ExpenseService: No userId provided to getExpenses");
      return [];
    }
    
    // Start with basic userId query
    let q = query(
      this.collection,
      where('userId', '==', userId)
    );

    // Add filters
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }

    if (filters?.phaseId) {
      q = query(q, where('phaseId', '==', filters.phaseId));
    }

    if (filters?.subcontractorId) {
      q = query(q, where('subcontractorId', '==', filters.subcontractorId));
    }

    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters?.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order by date descending (most recent first)
    q = query(q, orderBy('date', 'desc'));

    try {
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }

      const expenses = snapshot.docs.map(doc => {
        const data = doc.data();
        return this.convertFirestoreData(data, doc.id);
      });
      
      return expenses;
    } catch (error) {
      console.error("ExpenseService - Error executing Firestore query:", error);
      return [];
    }
  }
  
  // Get project-specific expenses
  static async getProjectExpenses(userId: string, projectId: string): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses(userId, { projectId });
      return expenses;
    } catch (error) {
      console.error(`ExpenseService.getProjectExpenses - Error retrieving expenses:`, error);
      return [];
    }
  }
  
  // Get phase-specific expenses
  static async getPhaseExpenses(userId: string, projectId: string, phaseId: string): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses(userId, { projectId, phaseId });
      return expenses;
    } catch (error) {
      console.error(`ExpenseService.getPhaseExpenses - Error retrieving expenses:`, error);
      return [];
    }
  }

  // Get expenses by status
  static async getExpensesByStatus(userId: string, status: Expense['status']): Promise<Expense[]> {
    return this.getExpenses(userId, { status });
  }

  // Get expenses for a subcontractor
  static async getSubcontractorExpenses(userId: string, subcontractorId: string): Promise<Expense[]> {
    return this.getExpenses(userId, { subcontractorId });
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
      notes: notes || undefined
    });
  }

  // Mark an expense as paid
  static async markAsPaid(id: string): Promise<void> {
    return this.updateExpense(id, { status: 'paid' });
  }

  // Check for potential duplicate expenses
  static async checkForDuplicates(
    userId: string, 
    expenseData: Partial<Expense>,
    threshold: number = 1 // Default to 1 day threshold
  ): Promise<Expense[]> {
    // Only proceed if we have enough data to check for duplicates
    if (!userId || !expenseData.projectId || !expenseData.amount || !expenseData.date) {
      return [];
    }
    
    const expenseDate = expenseData.date instanceof Date 
      ? expenseData.date 
      : new Date(expenseData.date);
      
    // Calculate date range for threshold
    const startDate = new Date(expenseDate);
    startDate.setDate(startDate.getDate() - threshold);
    
    const endDate = new Date(expenseDate);
    endDate.setDate(endDate.getDate() + threshold);
    
    console.log(`Checking for duplicates within date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Create a query for expenses that match the criteria
    let q = query(
      this.collection,
      where('userId', '==', userId),
      where('projectId', '==', expenseData.projectId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    try {
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      // Filter potential duplicates by amount (exact match) and if vendor or description match
      const potentialDuplicates = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return this.convertFirestoreData(data, doc.id);
        })
        .filter(expense => {
          // Skip the current expense being edited if it has an ID
          if (expenseData.id && expense.id === expenseData.id) {
            return false;
          }
          
          // If the amount is the same (or very close)
          const amountMatches = Math.abs(expense.amount - (expenseData.amount || 0)) < 0.01;
          
          // Check for matching description or vendor
          const descriptionMatches = expenseData.description && 
            expense.description.toLowerCase().includes(expenseData.description.toLowerCase());
          
          const vendorMatches = expenseData.vendor && expense.vendor &&
            expense.vendor.toLowerCase().includes(expenseData.vendor.toLowerCase());
          
          const categoryMatches = expense.category === expenseData.category;
          
          // Return true if amount matches AND either description or vendor matches
          return amountMatches && (descriptionMatches || vendorMatches || categoryMatches);
        });
      
      return potentialDuplicates;
    } catch (error) {
      console.error("Error checking for duplicate expenses:", error);
      return [];
    }
  }

  private static convertFirestoreData(data: any, id: string): Expense {
    return {
      ...data,
      id,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
}