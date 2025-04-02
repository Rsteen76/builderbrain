import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';

/**
 * Utility function to migrate expenses with buildingPhase to use phaseName instead
 * This function should be called once to update existing data
 */
export const migrateExpenseBuildingPhaseToPhaseNames = async (): Promise<void> => {
  console.log('Starting migration: buildingPhase to phaseName');
  
  try {
    // Get all expenses that have buildingPhase but no phaseName
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef);
    const snapshot = await getDocs(q);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    // Process each document
    const updatePromises = snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      
      // Only migrate if there's a buildingPhase but no phaseName
      if (data.buildingPhase && !data.phaseName) {
        await updateDoc(doc(expensesRef, docSnapshot.id), {
          phaseName: data.buildingPhase,
          // Uncomment to remove the old field after migration if desired
          // buildingPhase: null,
        });
        
        migratedCount++;
        console.log(`Migrated expense ${docSnapshot.id}: buildingPhase "${data.buildingPhase}" -> phaseName`);
      } else {
        skippedCount++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`Migration complete: ${migratedCount} expenses migrated, ${skippedCount} skipped.`);
  } catch (error) {
    console.error('Error during migration:', error);
    throw new Error('Failed to migrate expenses from buildingPhase to phaseName');
  }
}; 