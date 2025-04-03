import { Timestamp, DocumentData, where, query, getDocs, orderBy } from 'firebase/firestore';
import { BaseService } from './base.service';
import { Expense, ApiResponse } from '../types';

interface FirestoreExpense extends Omit<Expense, 'id' | 'date' | 'createdAt' | 'updatedAt'> {
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ExpenseService extends BaseService<Expense> {
  constructor() {
    super('expenses', {
      toFirestore: (expense: Expense): DocumentData => {
        const firestoreExpense: DocumentData = {
          userId: expense.userId,
          projectId: expense.projectId,
          phaseId: expense.phaseId,
          phaseName: expense.phaseName,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          vendor: expense.vendor,
          subcontractorId: expense.subcontractorId,
          subcontractorName: expense.subcontractorName,
          status: expense.status,
          receiptUrl: expense.receiptUrl,
          createdBy: expense.createdBy,
          approvedBy: expense.approvedBy,
          notes: expense.notes,
          lineItems: expense.lineItems,
          paymentDetails: expense.paymentDetails,
          tags: expense.tags,
          projectName: expense.projectName,
          
          // Convert dates to Timestamps
          date: expense.date instanceof Date 
            ? this.dateToTimestamp(expense.date) 
            : typeof expense.date === 'string' 
              ? this.dateToTimestamp(new Date(expense.date)) 
              : Timestamp.now(),
          createdAt: expense.createdAt instanceof Date 
            ? this.dateToTimestamp(expense.createdAt) 
            : typeof expense.createdAt === 'string' 
              ? this.dateToTimestamp(new Date(expense.createdAt)) 
              : Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        return firestoreExpense;
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
} 