import { Timestamp, DocumentData, where, query, getDocs, orderBy } from 'firebase/firestore';
import { BaseService } from './base.service';
import { Expense, ApiResponse } from '../types';

export class ExpenseService extends BaseService<Expense> {
  constructor() {
    super('expenses', {
      toFirestore: (expense: Expense): DocumentData => {
        // Deep clean object to remove all undefined values before sending to Firestore
        const cleanedExpense = this.deepCleanObject(expense);

        // Ensure paymentDetails is never undefined
        if (cleanedExpense.paymentDetails === undefined) {
          cleanedExpense.paymentDetails = null;
        }
        
        const firestoreExpense: DocumentData = {
          userId: cleanedExpense.userId,
          projectId: cleanedExpense.projectId,
          phaseId: cleanedExpense.phaseId,
          phaseName: cleanedExpense.phaseName,
          category: cleanedExpense.category,
          description: cleanedExpense.description,
          amount: cleanedExpense.amount,
          vendor: cleanedExpense.vendor,
          subcontractorId: cleanedExpense.subcontractorId,
          subcontractorName: cleanedExpense.subcontractorName,
          status: cleanedExpense.status,
          receiptUrl: cleanedExpense.receiptUrl,
          createdBy: cleanedExpense.createdBy,
          approvedBy: cleanedExpense.approvedBy,
          notes: cleanedExpense.notes,
          lineItems: cleanedExpense.lineItems,
          paymentDetails: cleanedExpense.paymentDetails,
          tags: cleanedExpense.tags || [],
          projectName: cleanedExpense.projectName,
          bidId: cleanedExpense.bidId || null,
          
          // Convert dates to Timestamps
          date: cleanedExpense.date instanceof Date 
            ? this.dateToTimestamp(cleanedExpense.date) 
            : typeof cleanedExpense.date === 'string' 
              ? this.dateToTimestamp(new Date(cleanedExpense.date)) 
              : Timestamp.now(),
          createdAt: cleanedExpense.createdAt instanceof Date 
            ? this.dateToTimestamp(cleanedExpense.createdAt) 
            : typeof cleanedExpense.createdAt === 'string' 
              ? this.dateToTimestamp(new Date(cleanedExpense.createdAt)) 
              : Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        // Final check for any undefined values that might have been introduced
        return this.deepCleanObject(firestoreExpense);
      },
      
      fromFirestore: (data: DocumentData): Expense => {
        // Convert timestamps to dates
        const date = this.timestampToDate(data.date) || new Date();
        const createdAt = this.timestampToDate(data.createdAt) || new Date();
        const updatedAt = this.timestampToDate(data.updatedAt) || new Date();
        
        return {
          id: data.id,
          userId: data.userId,
          projectId: data.projectId,
          phaseId: data.phaseId,
          phaseName: data.phaseName,
          category: data.category,
          description: data.description,
          amount: data.amount,
          date,
          receiptUrl: data.receiptUrl,
          vendor: data.vendor,
          subcontractorId: data.subcontractorId,
          subcontractorName: data.subcontractorName,
          status: data.status,
          createdBy: data.createdBy,
          approvedBy: data.approvedBy,
          createdAt,
          updatedAt,
          notes: data.notes,
          lineItems: data.lineItems || [],
          paymentDetails: data.paymentDetails,
          tags: data.tags || [],
          projectName: data.projectName,
        };
      }
    });
  }

  /**
   * Get expenses for a user with optional filters.
   */
  async getExpenses(userId: string, filters?: {
    status?: Expense['status'] | Expense['status'][];
    category?: Expense['category'];
    projectId?: string;
    phaseId?: string;
    subcontractorId?: string;
  }): Promise<ApiResponse<Expense[]>> {
    try {
      const constraints = [where('userId', '==', userId)];

      if (filters?.projectId) {
        constraints.push(where('projectId', '==', filters.projectId));
      }

      if (filters?.phaseId) {
        constraints.push(where('phaseId', '==', filters.phaseId));
      }

      if (filters?.subcontractorId) {
        constraints.push(where('subcontractorId', '==', filters.subcontractorId));
      }

      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          if (filters.status.length > 0 && filters.status.length <= 10) {
            constraints.push(where('status', 'in', filters.status));
          }
        } else {
          constraints.push(where('status', '==', filters.status));
        }
      }

      const q = query(this.collectionRef, ...constraints, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        expenses.push(this.converter!.fromFirestore({
          ...doc.data(),
          id: doc.id,
        }));
      });

      return {
        data: expenses,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Expense[]>(error, 'getExpenses');
    }
  }
  
  /**
   * Get expenses for a specific project
   */
  async getExpensesByProject(projectId: string, filters?: {
    category?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ApiResponse<Expense[]>> {
    try {
      let constraints = [where('projectId', '==', projectId)];
      
      // Apply additional filters if provided
      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      // Date range filtering will need to be done after query
      const q = query(this.collectionRef, ...constraints, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      let expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const expense = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        expenses.push(expense);
      });
      
      // Filter by date range if provided
      if (filters?.dateFrom || filters?.dateTo) {
        expenses = expenses.filter(expense => {
          const expenseDate = expense.date instanceof Date 
            ? expense.date 
            : new Date(expense.date);
          
          if (filters.dateFrom && filters.dateTo) {
            return expenseDate >= filters.dateFrom && expenseDate <= filters.dateTo;
          } else if (filters.dateFrom) {
            return expenseDate >= filters.dateFrom;
          } else if (filters.dateTo) {
            return expenseDate <= filters.dateTo;
          }
          
          return true;
        });
      }
      
      return {
        data: expenses,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Expense[]>(error, 'getExpensesByProject');
    }
  }
  
  /**
   * Get expenses by phase
   */
  async getExpensesByPhase(phaseId: string): Promise<ApiResponse<Expense[]>> {
    try {
      const q = query(
        this.collectionRef, 
        where('phaseId', '==', phaseId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const expense = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        expenses.push(expense);
      });
      
      return {
        data: expenses,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Expense[]>(error, 'getExpensesByPhase');
    }
  }
  
  /**
   * Get expenses for a specific vendor
   */
  async getExpensesByVendor(vendor: string): Promise<ApiResponse<Expense[]>> {
    try {
      const q = query(this.collectionRef, where('vendor', '==', vendor), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const expense = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        expenses.push(expense);
      });
      
      return {
        data: expenses,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Expense[]>(error, 'getExpensesByVendor');
    }
  }
  
  /**
   * Get expenses for a subcontractor
   */
  async getExpensesBySubcontractor(subcontractorId: string): Promise<ApiResponse<Expense[]>> {
    try {
      const q = query(
        this.collectionRef, 
        where('subcontractorId', '==', subcontractorId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const expenses: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const expense = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        expenses.push(expense);
      });
      
      return {
        data: expenses,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Expense[]>(error, 'getExpensesBySubcontractor');
    }
  }
  
  /**
   * Approve an expense
   */
  async approveExpense(expenseId: string, approvedBy: string): Promise<ApiResponse<Expense>> {
    try {
      const expenseResponse = await this.getById(expenseId);
      
      if (expenseResponse.status === 'error') {
        return expenseResponse;
      }
      
      const expense = expenseResponse.data;
      
      if (!expense) {
        return {
          status: 'error',
          error: 'Expense not found',
        };
      }
      
      expense.status = 'approved';
      expense.approvedBy = approvedBy;
      expense.updatedAt = new Date();
      
      return this.update(expenseId, expense);
    } catch (error) {
      return this.handleError<Expense>(error, 'approveExpense');
    }
  }
  
  /**
   * Recursively removes undefined values from an object and replaces them with null
   * to ensure Firestore compatibility
   */
  private deepCleanObject(obj: any): any {
    // Handle null, undefined and primitives
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCleanObject(item));
    }
    
    // Handle objects
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip the id field for Firestore docs
      if (key === 'id') continue;
      
      // Clean nested value
      const cleanedValue = this.deepCleanObject(value);
      // Only add non-undefined values
      if (cleanedValue !== undefined) {
        result[key] = cleanedValue;
      } else {
        // If somehow we still have undefined, use null instead (Firestore accepts null)
        result[key] = null;
      }
    }
    
    return result;
  }
} 
