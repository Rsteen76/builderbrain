import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LineItem } from '../types';

export const LineItemService = {
  /**
   * Get all line items for a project
   */
  getLineItems: async (userId: string, projectId: string): Promise<LineItem[]> => {
    try {
      const lineItemsRef = collection(db, `users/${userId}/projects/${projectId}/lineItems`);
      const snapshot = await getDocs(lineItemsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LineItem[];
    } catch (error) {
      console.error('Error getting line items:', error);
      throw error;
    }
  },

  /**
   * Get a specific line item
   */
  getLineItem: async (userId: string, projectId: string, lineItemId: string): Promise<LineItem | null> => {
    try {
      const lineItemRef = doc(db, `users/${userId}/projects/${projectId}/lineItems`, lineItemId);
      const snapshot = await getDoc(lineItemRef);
      
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as LineItem;
    } catch (error) {
      console.error('Error getting line item:', error);
      throw error;
    }
  },

  /**
   * Create a new line item
   */
  createLineItem: async (userId: string, projectId: string, lineItemData: Partial<LineItem>): Promise<LineItem> => {
    try {
      const lineItemsRef = collection(db, `users/${userId}/projects/${projectId}/lineItems`);
      const docRef = await addDoc(lineItemsRef, {
        ...lineItemData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return {
        id: docRef.id,
        ...lineItemData
      } as LineItem;
    } catch (error) {
      console.error('Error creating line item:', error);
      throw error;
    }
  },

  /**
   * Update an existing line item
   */
  updateLineItem: async (userId: string, projectId: string, lineItemId: string, lineItemData: Partial<LineItem>): Promise<LineItem> => {
    try {
      const lineItemRef = doc(db, `users/${userId}/projects/${projectId}/lineItems`, lineItemId);
      
      await updateDoc(lineItemRef, {
        ...lineItemData,
        updatedAt: new Date()
      });
      
      return {
        id: lineItemId,
        ...lineItemData
      } as LineItem;
    } catch (error) {
      console.error('Error updating line item:', error);
      throw error;
    }
  },

  /**
   * Delete a line item
   */
  deleteLineItem: async (userId: string, projectId: string, lineItemId: string): Promise<void> => {
    try {
      const lineItemRef = doc(db, `users/${userId}/projects/${projectId}/lineItems`, lineItemId);
      await deleteDoc(lineItemRef);
    } catch (error) {
      console.error('Error deleting line item:', error);
      throw error;
    }
  }
}; 