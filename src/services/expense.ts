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
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Expense } from '../types';

interface FirestoreExpense extends Omit<Expense, 'id' | 'date' | 'createdAt' | 'updatedAt'> {
  userId: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bidId?: string;
  paymentStageId?: string;
}

export class ExpenseService {
  private static collection = collection(db, 'expenses');

  static async createExpense(userId: string, expenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> & { bidId?: string | null; paymentStageId?: string | null }): Promise<Expense> {
    if (!userId) throw new Error('User ID is required');
    
    try {
      console.log('Expense data received by service:', JSON.stringify(expenseData));
      console.log('PaymentDetails before processing:', expenseData.paymentDetails);
      
      const expense = {
        ...expenseData,
        userId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Make sure tags exists
        tags: expenseData.tags || [],
        // Ensure bidId and paymentStageId are properly passed through
        bidId: expenseData.bidId ?? null,
        paymentStageId: expenseData.paymentStageId ?? null,
        // Explicitly handle paymentDetails
        paymentDetails: expenseData.paymentDetails ?? null,
      };
      
      console.log('Expense object after initial prep:', JSON.stringify(expense));
      console.log('PaymentDetails after prep:', expense.paymentDetails);
      
      // Convert dates to Firestore timestamps
      const firestoreExpense = this.convertToFirestore(expense);
      
      console.log('Final Firestore expense object (stringified):', JSON.stringify(firestoreExpense));
      console.log('Final paymentDetails (direct):', firestoreExpense.paymentDetails);
      
      const docRef = await addDoc(this.collection, firestoreExpense);
      
      return {
        ...expense,
        id: docRef.id,
      };
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
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
    projectId?: string;
    category?: Expense['category'];
    startDate?: Date;
    endDate?: Date;
    status?: Expense['status'] | Expense['status'][];
    phaseId?: string;
    subcontractorId?: string;
  }): Promise<Expense[]> {
    console.log(`ExpenseService: Fetching expenses for user: ${userId}, with filters:`, filters);
    
    if (!userId) {
      console.error("ExpenseService: No userId provided to getExpenses");
      return [];
    }
    
    try {
      let q = query(this.collection, where('userId', '==', userId));
      
      if (filters) {
        if (filters.projectId) {
          q = query(q, where('projectId', '==', filters.projectId));
        }
        
        if (filters.category) {
          q = query(q, where('category', '==', filters.category));
        }
        
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            if (filters.status.length > 0 && filters.status.length <= 10) {
              q = query(q, where('status', 'in', filters.status));
            } else if (filters.status.length > 10) {
              console.warn("ExpenseService: Cannot filter by more than 10 statuses at once.");
            }
          } else {
            q = query(q, where('status', '==', filters.status));
          }
        }
        
        if (filters.startDate) {
          const startTimestamp = Timestamp.fromDate(filters.startDate);
          q = query(q, where('date', '>=', startTimestamp));
        }
        
        if (filters.endDate) {
          const endTimestamp = Timestamp.fromDate(filters.endDate);
          q = query(q, where('date', '<=', endTimestamp));
        }
        
        if (filters.phaseId) {
          q = query(q, where('phaseId', '==', filters.phaseId));
        }
        
        if (filters.subcontractorId) {
          q = query(q, where('subcontractorId', '==', filters.subcontractorId));
        }
      }
      
      // Always sort by date, most recent first
      q = query(q, orderBy('date', 'desc'));
      
      const querySnapshot = await getDocs(q);
      console.log(`ExpenseService: Found ${querySnapshot.docs.length} expenses`);
      
      return querySnapshot.docs.map(doc => {
        return this.convertFromFirestore(doc);
      });
    } catch (error) {
      console.error("ExpenseService: Error fetching expenses:", error);
      throw error;
    }
  }
  
  static async getProjectExpenses(userId: string, projectId: string): Promise<Expense[]> {
    console.log(`ExpenseService: Fetching expenses for project: ${projectId}`);
    
    if (!userId || !projectId) {
      console.error("ExpenseService: Missing userId or projectId in getProjectExpenses");
      return [];
    }
    
    try {
      const q = query(
        this.collection,
        where('userId', '==', userId),
        where('projectId', '==', projectId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`ExpenseService: Found ${querySnapshot.docs.length} expenses for project ${projectId}`);
      
      return querySnapshot.docs.map(doc => {
        return this.convertFromFirestore(doc);
      });
    } catch (error) {
      console.error(`ExpenseService: Error fetching expenses for project ${projectId}:`, error);
      throw error;
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
  static async markAsPaid(id: string, actualAmount?: number, paymentDetails?: {
    method: string;
    referenceNumber?: string;
    date: string;
    notes?: string;
  }): Promise<void> {
    const updateData: Partial<Expense> = { 
      status: 'paid',
    };

    // If an actual amount is provided, update the expense amount
    if (actualAmount !== undefined) {
      updateData.amount = actualAmount;
    }

    // If payment details are provided, include them in the update
    if (paymentDetails) {
      updateData.paymentDetails = paymentDetails;
    }

    return this.updateExpense(id, updateData);
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
      bidId: data.bidId || undefined,
      paymentStageId: data.paymentStageId || undefined
    };
  }

  /**
   * Convert a JavaScript Expense object to a Firestore-friendly format
   */
  private static convertToFirestore(expense: Partial<Expense>): any {
    console.log('CONVERT TO FIRESTORE - Initial expense object:', expense);
    console.log('CONVERT TO FIRESTORE - Initial paymentDetails:', expense.paymentDetails);
    
    // Helper function to recursively clean the object
    const cleanForFirestore = (data: any): any => {
      // Handle null, primitive values, and unsupported types
      if (data === null || data === undefined || typeof data !== 'object') {
        return data === undefined ? null : data;
      }
      
      // Handle Date objects (convert to Timestamp)
      if (data instanceof Date) {
        return Timestamp.fromDate(data);
      }
      
      // Handle arrays
      if (Array.isArray(data)) {
        return data.map(item => cleanForFirestore(item));
      }
      
      // Handle objects
      const cleanObject: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        const cleanedValue = cleanForFirestore(value);
        // Only include the key if the value is not undefined
        // If value is undefined, replace with null (Firestore accepts null)
        cleanObject[key] = cleanedValue;
      }
      
      return cleanObject;
    };
    
    // Start by removing all undefined values and replacing with null
    const cleanedExpense = cleanForFirestore(expense);
    console.log('CONVERT TO FIRESTORE - After cleanForFirestore:', cleanedExpense);
    console.log('CONVERT TO FIRESTORE - paymentDetails after cleaning:', cleanedExpense.paymentDetails);
    
    // Ensure these specific fields are never undefined
    const firestoreExpense = {
      ...cleanedExpense,
      // Ensure mandatory fields
      tags: cleanedExpense.tags || [],
      bidId: cleanedExpense.bidId ?? null,
      paymentStageId: cleanedExpense.paymentStageId ?? null,
      paymentDetails: cleanedExpense.paymentDetails ?? null,
    };
    
    // Double-check problematic fields before returning
    if (firestoreExpense.paymentDetails === undefined) {
      console.error('ERROR: paymentDetails is still undefined after all processing! Setting to null as last resort');
      firestoreExpense.paymentDetails = null;
    }
    
    // Log the cleaned object for debugging
    console.log('CONVERT TO FIRESTORE - Final expense object:', firestoreExpense);
    console.log('CONVERT TO FIRESTORE - Final paymentDetails:', firestoreExpense.paymentDetails);
    
    return firestoreExpense;
  }
  
  /**
   * Convert a Firestore document to a JavaScript Expense object
   */
  private static convertFromFirestore(doc: QueryDocumentSnapshot): Expense {
    const data = doc.data();
    
    // Convert Firestore Timestamps to JavaScript Date objects
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt;
    const date = data.date instanceof Timestamp ? data.date.toDate() : data.date;
    
    // Ensure tags is an array
    const tags = data.tags || [];
    
    // Get bid references if they exist
    const bidId = data.bidId || undefined;
    const paymentStageId = data.paymentStageId || undefined;
    
    // Create the full expense object with type assertion to unknown first
    return {
      id: doc.id,
      ...data,
      createdAt,
      updatedAt,
      date,
      tags,
      bidId,
      paymentStageId
    } as unknown as Expense;
  }

  /**
   * Get unique vendors from user's expenses
   */
  static async getUniqueVendors(userId: string): Promise<string[]> {
    if (!userId) return [];
    
    try {
      console.log(`ExpenseService: Fetching unique vendors for user: ${userId}`);
      
      // Query all expenses for this user
      const q = query(
        this.collection,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Extract unique vendor names
      const vendors = new Set<string>();
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.vendor && typeof data.vendor === 'string' && data.vendor.trim() !== '') {
          vendors.add(data.vendor.trim());
        }
      });
      
      const uniqueVendors = Array.from(vendors);
      console.log(`ExpenseService: Found ${uniqueVendors.length} unique vendors`);
      
      return uniqueVendors;
    } catch (error) {
      console.error("ExpenseService: Error fetching unique vendors:", error);
      return [];
    }
  }
}