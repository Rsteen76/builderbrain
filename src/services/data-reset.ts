import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';

/**
 * Utility service to reset data in the application
 * CAUTION: This will permanently delete data!
 */
export class DataResetService {
  /**
   * Deletes all data for a specific user from all collections
   * @param userId The user ID to delete data for
   * @returns Promise that resolves when deletion is complete
   */
  static async resetAllUserData(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('userId is required');
    }
    
    if (!window.confirm('WARNING: This will delete ALL your data. This action cannot be undone. Are you sure?')) {
      return;
    }
    
    // Extended collection list to include any potential activity logs
    const collections = [
      'projects', 
      'expenses', 
      'bids', 
      'subcontractors',
      'activity',
      'logs',
      'notifications',
      'tasks',
      'events',
      'messages',
      'comments',
      'phases',
      'documents'
    ];
    
    const deletionPromises = collections.map(collectionName => 
      this.deleteUserDocumentsInCollection(userId, collectionName)
    );
    
    try {
      await Promise.all(deletionPromises);
      console.log('All user data has been reset');
      
      // Clear any local storage that might be keeping activity data
      localStorage.removeItem('recentActivity');
      localStorage.removeItem('lastProjects');
      
      // Reload the page after deletion to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error resetting user data:', error);
      throw error;
    }
  }
  
  /**
   * Deletes all documents owned by a user in a specific collection
   * @param userId The user ID to delete data for
   * @param collectionName The name of the collection to delete from
   * @returns Promise that resolves when deletion is complete
   */
  private static async deleteUserDocumentsInCollection(userId: string, collectionName: string): Promise<void> {
    try {
      const coll = collection(db, collectionName);
      const q = query(coll, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log(`No documents found in ${collectionName} for user ${userId}`);
        return;
      }
      
      // Use batched writes for more efficient deletion
      const batchSize = 500; // Firestore limit is 500 operations per batch
      let numDeleted = 0;
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = snapshot.docs.slice(i, i + batchSize);
        
        currentBatch.forEach(document => {
          batch.delete(doc(db, collectionName, document.id));
        });
        
        await batch.commit();
        numDeleted += currentBatch.length;
      }
      
      console.log(`Deleted ${numDeleted} documents from ${collectionName}`);
    } catch (error) {
      // If collection doesn't exist, just log and continue
      console.log(`Error with collection ${collectionName}: ${error}`);
    }
  }
  
  /**
   * Deletes all documents in a specific collection for a user's project
   * @param userId The user ID
   * @param projectId The project ID to delete data for
   * @param collectionName The name of the collection 
   */
  static async deleteProjectData(userId: string, projectId: string, collectionName: string): Promise<void> {
    if (!userId || !projectId) {
      throw new Error('userId and projectId are required');
    }
    
    const coll = collection(db, collectionName);
    const q = query(
      coll, 
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`No documents found in ${collectionName} for project ${projectId}`);
      return;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(document => {
      batch.delete(doc(db, collectionName, document.id));
    });
    
    await batch.commit();
    console.log(`Deleted ${snapshot.docs.length} documents from ${collectionName} for project ${projectId}`);
  }
  
  /**
   * Clears all local storage items related to app data
   * Useful for ensuring all cached data is removed
   */
  static clearLocalStorageData(): void {
    const keysToKeep = ['darkMode', 'authUser'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('Local storage data cleared');
  }
} 