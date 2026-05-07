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
  limit,
  startAfter,
  Timestamp,
  CollectionReference,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ApiResponse, FilterOptions, PaginatedResponse } from '../types';

export type FirestoreConverter<T> = {
  toFirestore: (data: T) => DocumentData;
  fromFirestore: (data: DocumentData) => T;
};

export abstract class BaseService<T extends { id?: string }> {
  protected collectionName: string;
  protected collectionRef: CollectionReference;
  protected converter?: FirestoreConverter<T>;

  constructor(collectionName: string, converter?: FirestoreConverter<T>) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
    this.converter = converter;
  }

  /**
   * Convert a Firebase Timestamp to a Date
   */
  protected timestampToDate(timestamp: Timestamp | Date | null | undefined): Date | null {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    return timestamp.toDate();
  }

  /**
   * Convert a Date to a Firebase Timestamp
   */
  protected dateToTimestamp(date: Date | null | undefined): Timestamp | null {
    if (!date) return null;
    return Timestamp.fromDate(date);
  }

  /**
   * Handle errors in a consistent way
   */
  protected handleError<R>(error: unknown, operation: string): ApiResponse<R> {
    console.error(`Error in ${this.collectionName} service during ${operation}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: `Failed to ${operation}: ${errorMessage}`,
      status: 'error',
    };
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    try {
      const docRef = await addDoc(this.collectionRef, 
        this.converter ? this.converter.toFirestore(data as T) : data);
      
      const newItem = {
        ...data,
        id: docRef.id,
      } as T;
      
      return {
        data: newItem,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<T>(error, 'create');
    }
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(this.collectionRef, id);
      const updateData = this.converter ? this.converter.toFirestore(data as T) : data;
      
      await updateDoc(docRef, updateData);
      
      return {
        status: 'success',
      };
    } catch (error) {
      return this.handleError<T>(error, 'update');
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(this.collectionRef, id);
      await deleteDoc(docRef);
      
      return {
        data: true,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<boolean>(error, 'delete');
    }
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          error: `Document with ID ${id} not found`,
          status: 'error',
        };
      }
      
      const data = {
        ...docSnap.data(),
        id: docSnap.id,
      };
      const item = this.converter 
        ? this.converter.fromFirestore(data) 
        : { ...data, id: docSnap.id } as T;
      
      return {
        data: item,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<T>(error, 'get');
    }
  }

  /**
   * Get all documents with optional filtering, sorting, and pagination
   */
  async getAll(options?: FilterOptions): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Add filters
      if (options) {
        // Handle search if provided
        if (options.search && options.searchField) {
          constraints.push(where(options.searchField, '>=', options.search));
          constraints.push(where(options.searchField, '<=', options.search + '\uf8ff'));
        }
        
        // Add other filters
        Object.entries(options).forEach(([key, value]) => {
          // Skip special filter options
          if (['sortBy', 'sortDirection', 'page', 'limit', 'search', 'searchField'].includes(key)) {
            return;
          }
          
          if (value !== undefined && value !== null) {
            constraints.push(where(key, '==', value));
          }
        });
        
        // Add sorting
        if (options.sortBy) {
          constraints.push(orderBy(options.sortBy, options.sortDirection || 'asc'));
        }
        
        // Add pagination
        const pageSize = options.limit || 10;
        constraints.push(limit(pageSize));
        
        // Add cursor for pagination
        if (options.lastVisible) {
          constraints.push(startAfter(options.lastVisible));
        }
      }
      
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const items: T[] = [];
      querySnapshot.forEach((doc) => {
        const data = {
          ...doc.data(),
          id: doc.id,
        };
        const item = this.converter 
          ? this.converter.fromFirestore(data) 
          : { ...data, id: doc.id } as T;
        items.push(item);
      });
      
      return {
        data: {
          items,
          totalCount: items.length, // Consider using proper counting for production
          page: options?.page || 1,
          limit: options?.limit || 10,
          hasMore: items.length === (options?.limit || 10),
        },
        status: 'success',
      };
    } catch (error) {
      return this.handleError<PaginatedResponse<T>>(error, 'query');
    }
  }
} 
