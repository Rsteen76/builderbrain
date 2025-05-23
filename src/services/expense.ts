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
import { Expense, ExpenseStatus } from '../types';
import { toTimestamp, toDate } from '../../utils/firestoreConverter'; // Added converter imports

interface FirestoreExpense extends Omit<Expense, 'id' | 'date' | 'createdAt' | 'updatedAt'> {
  userId: string;
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bidId?: string;
  paymentStageId?: string;
  categoryId?: string;
}

export class ExpenseService {
  private static collection = collection(db, 'expenses');

  static async createExpense(userId: string, expenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'> & { bidId?: string | null; paymentStageId?: string | null }): Promise<Expense> {
    if (!userId) throw new Error('User ID is required');
    
    try {
      console.log('Expense data received by service:', JSON.stringify(expenseData));
      console.log('PaymentDetails before processing:', expenseData.paymentDetails);
      
      const now = new Date();
      const expense = {
        ...expenseData,
        userId,
        createdBy: userId,
        createdAt: now, // Use JS Date for now
        updatedAt: now, // Use JS Date for now
        date: expenseData.date ? toDate(expenseData.date) : now, // Ensure date is JS Date
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
      const firestoreExpense = this.convertToFirestore(expense); // convertToFirestore will handle date to Timestamp
      
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
    // Type updatePayload more specifically.
    // createdBy is intended to be omitted from expenseData based on the Omit type, so it should not be destructured here.
    const { userId, createdAt, /* createdBy, */ ...updatePayloadRest } = expenseData; 
    const updatePayload: Partial<Omit<Expense, 'id' | 'userId' | 'createdAt' | 'createdBy'>> = updatePayloadRest;

    console.log(`ExpenseService: Updating expense ${id} with data:`, expenseData);

    // Standardize on phaseName field
    const standardizedPayload = { ...updatePayload };
    if (updatePayload.buildingPhase && !updatePayload.phaseName) {
      console.log(`ExpenseService: Standardizing on phaseName instead of buildingPhase: ${updatePayload.buildingPhase}`);
      standardizedPayload.phaseName = updatePayload.buildingPhase;
    }

    const firestoreUpdateData: Partial<FirestoreExpense> = { // Type more specifically
      updatedAt: toTimestamp(new Date()), // Already using toTimestamp from previous change
    };

    // Helper function to clean undefined values from an object
    // Using unknown for broader input, but internal logic should handle types.
    const cleanObject = (objValue: unknown): unknown => { // Renamed obj to objValue
      if (Array.isArray(objValue)) {
        return objValue.map(v => cleanObject(v));
      }
      if (objValue !== null && typeof objValue === 'object') {
        // Firestore Timestamps and Dates should not be recursively cleaned
        if (objValue instanceof Timestamp || objValue instanceof Date) {
          return objValue;
        }
        const cleaned: Record<string, unknown> = {}; // More specific type for cleaned
        // Iterate over properties of objValue
        for (const key in (objValue as Record<string, unknown>)) { 
          if (Object.prototype.hasOwnProperty.call(objValue, key)) {
            const value = cleanObject((objValue as Record<string, unknown>)[key]);
            if (value !== undefined) {
              cleaned[key] = value;
            }
          }
        }
        return cleaned;
      }
      return objValue;
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

        // Handle Date objects specifically for 'date' and 'dueDate'
        if ((typedKey === 'date' || typedKey === 'dueDate') && value !== null) {
          firestoreUpdateData[typedKey] = toTimestamp(toDate(value)); // Convert to JS Date then to Timestamp
        } else if (typeof value === 'object' && value !== null) {
          // Clean nested objects of undefined values
          const cleanedValue = cleanObject(value);
          // Ensure that already converted Timestamps are not re-processed by cleanObject in a harmful way
          if (cleanedValue instanceof Timestamp) {
             firestoreUpdateData[typedKey] = cleanedValue;
          } else if (Object.keys(cleanedValue).length > 0 || Array.isArray(cleanedValue)) {
            firestoreUpdateData[typedKey] = cleanedValue;
          } else if (value === null) { // Explicitly allow nulls to be set
            firestoreUpdateData[typedKey] = null;
          }
        } else {
          firestoreUpdateData[typedKey] = value;
        }
      }
    }
    // Ensure updatedAt is always a Timestamp
    firestoreUpdateData.updatedAt = toTimestamp(new Date());

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

    return this.convertFirestoreData(data as FirestoreExpense, id); // Cast data to FirestoreExpense
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
          const startTimestamp = toTimestamp(filters.startDate);
          if (startTimestamp) q = query(q, where('date', '>=', startTimestamp));
        }
        
        if (filters.endDate) {
          const endTimestamp = toTimestamp(filters.endDate);
          if (endTimestamp) q = query(q, where('date', '<=', endTimestamp));
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

  // Mark an expense as paid or partially paid
  static async markAsPaid(id: string, actualAmountPaidNow: number, paymentDetails: {
    method: string;
    referenceNumber?: string;
    date: string;
    notes?: string;
  }): Promise<void> {
    console.log(`ExpenseService: Marking expense ${id} as paid with amount: ${actualAmountPaidNow}`);
    
    // This method is now deprecated in favor of using ExpenseTransactionService
    // We'll keep this method for backward compatibility but switch its implementation to use transactions
    
    const expenseRef = doc(this.collection, id);
    const expenseSnapshot = await getDoc(expenseRef);
    
    if (!expenseSnapshot.exists()) {
      throw new Error(`Expense with ID ${id} not found`);
    }
    
    const expense = this.convertFirestoreData(expenseSnapshot.data(), id);
    const amountPaid = (expense.amountPaid || 0) + actualAmountPaidNow;
    const amountRemaining = expense.amount - amountPaid;
    
    // Determine if the expense is fully or partially paid
    let status: ExpenseStatus;
    if (amountPaid >= expense.amount) {
      status = 'paid';
    } else if (amountPaid > 0) {
      status = 'partially_paid';
    } else {
      status = expense.status;
    }
    
    const paymentDate = paymentDetails.date ? toDate(paymentDetails.date) : new Date(); // paymentDetails.date is now Date
    const updateData: Partial<FirestoreExpense> = { // Type more specifically
      amountPaid,
      amountRemaining,
      status,
      lastPaymentDate: toTimestamp(paymentDate), 
      paymentDetails: paymentDetails as Expense['paymentDetails'], // Cast if structure is compatible
      updatedAt: toTimestamp(new Date())
    };
    
    await updateDoc(expenseRef, updateData);
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
    
    const expenseDate = toDate(expenseData.date); // Use toDate
      
    if (!expenseDate) return []; // Cannot check without a valid date

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
      where('date', '>=', toTimestamp(startDate)!), // Non-null assertion as startDate is derived from valid expenseDate
      where('date', '<=', toTimestamp(endDate)!)   // Non-null assertion
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

  private static convertFirestoreData(data: FirestoreExpense, id: string): Expense { // Parameter 'data' typed
    return {
      ...data,
      id,
      date: toDate(data.date), // Use toDate
      createdAt: toDate(data.createdAt), // Use toDate
      updatedAt: toDate(data.updatedAt), // Use toDate
      bidId: data.bidId || undefined,
      paymentStageId: data.paymentStageId || undefined
    };
  }

  /**
   * Convert a JavaScript Expense object to a Firestore-friendly format
   */
  private static convertToFirestore(expense: Partial<Expense>): Partial<FirestoreExpense> { 
    console.log('CONVERT TO FIRESTORE - Initial expense object:', expense);
    console.log('CONVERT TO FIRESTORE - Initial paymentDetails:', expense.paymentDetails);
    
    // Helper function to recursively clean the object and convert dates
    const cleanAndConvertDatesToTimestamps = (dataValue: unknown): unknown => {
      if (dataValue === null || dataValue === undefined) {
        return null; // Convert undefined to null for Firestore
      }
      if (typeof dataValue !== 'object') {
        return dataValue; // Primitives
      }
      if (dataValue instanceof Date) {
        return toTimestamp(dataValue);
      }
      if (dataValue instanceof Timestamp) { 
        return dataValue; // Already a Timestamp
      }
      if (Array.isArray(dataValue)) {
        return dataValue.map(item => cleanAndConvertDatesToTimestamps(item));
      }
      
      // Handle general objects
      const cleanObject: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(dataValue as Record<string, unknown>)) {
        const cleanedValue = cleanAndConvertDatesToTimestamps(value);
        if (cleanedValue !== undefined) { // Firestore cannot store undefined directly
          cleanObject[key] = cleanedValue === undefined ? null : cleanedValue;
        }
      }
      return cleanObject;
    };
    
    // Start by removing all undefined values and replacing with null
    const cleanedExpense = cleanForFirestore(expense);
    console.log('CONVERT TO FIRESTORE - After cleanForFirestore:', cleanedExpense);
    console.log('CONVERT TO FIRESTORE - paymentDetails after cleaning:', cleanedExpense.paymentDetails);
    
    // Use the enhanced helper function
    const cleanedAndConvertedExpense = cleanAndConvertDatesToTimestamps(expense) as Partial<FirestoreExpense>;

    console.log('CONVERT TO FIRESTORE - After cleanAndConvertDatesToTimestamps:', cleanedAndConvertedExpense);
    
    // Ensure specific fields that might need default values if null/undefined post-cleaning
    const firestoreExpense: Partial<FirestoreExpense> = {
      ...cleanedAndConvertedExpense,
      tags: cleanedAndConvertedExpense.tags || [], // Ensure tags is an array
      bidId: cleanedAndConvertedExpense.bidId === undefined ? null : cleanedAndConvertedExpense.bidId,
      paymentStageId: cleanedAndConvertedExpense.paymentStageId === undefined ? null : cleanedAndConvertedExpense.paymentStageId,
      paymentDetails: cleanedAndConvertedExpense.paymentDetails === undefined ? null : cleanedAndConvertedExpense.paymentDetails,
    };
    
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
    const createdAt = toDate(data.createdAt); // Use toDate
    const updatedAt = toDate(data.updatedAt); // Use toDate
    const date = toDate(data.date); // Use toDate
    
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