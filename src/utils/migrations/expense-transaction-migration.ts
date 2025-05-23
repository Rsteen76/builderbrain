import { db } from '../../config/firebase';
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';

/**
 * Migration script to update existing expenses and bids to the new transaction-based model
 * This should be run once to convert the existing data
 */
export async function migrateExpenseAndBidData(userId: string): Promise<{ success: boolean, message: string }> {
  try {
    console.log('Starting expense and bid data migration...');
    
    // Step 1: Update expenses to add amountRemaining field
    await migrateExpenses(userId);
    
    // Step 2: Update bids to sync payment stages with expenses
    await migrateBids(userId);
    
    console.log('Migration completed successfully');
    return {
      success: true,
      message: 'Migration completed successfully. All expenses and bids have been updated to the new structure.'
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Update existing expenses to add the amountRemaining field
 */
async function migrateExpenses(userId: string): Promise<void> {
  console.log('Migrating expenses...');
  
  const expensesRef = collection(db, 'expenses');
  const expensesQuery = query(expensesRef, limit(500)); // Process in batches
  const expenseSnapshots = await getDocs(expensesQuery);
  
  let batch = writeBatch(db);
  let batchCount = 0;
  let processedCount = 0;
  
  for (const expenseDoc of expenseSnapshots.docs) {
    const expenseData = expenseDoc.data();
    const amount = expenseData.amount || 0;
    const amountPaid = expenseData.amountPaid || 0;
    const amountRemaining = amount - amountPaid;
    
    // Initialize transactionIds array if not present
    const transactionIds = expenseData.transactionIds || [];
    
    // Update the document
    batch.update(expenseDoc.ref, { 
      amountRemaining, 
      transactionIds,
      updatedAt: Timestamp.fromDate(new Date())
    });
    
    batchCount++;
    processedCount++;
    
    // Commit batch every 500 operations
    if (batchCount >= 500) {
      console.log(`Committing batch of ${batchCount} expense updates...`);
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  
  // Commit any remaining updates
  if (batchCount > 0) {
    console.log(`Committing final batch of ${batchCount} expense updates...`);
    await batch.commit();
  }
  
  console.log(`Migrated ${processedCount} expenses`);
}

/**
 * Update bid payment stages to link with expenses
 */
async function migrateBids(userId: string): Promise<void> {
  console.log('Migrating bids...');
  
  const bidsRef = collection(db, 'bids');
  const bidsQuery = query(bidsRef, limit(500)); // Process in batches
  const bidSnapshots = await getDocs(bidsQuery);
  
  let batch = writeBatch(db);
  let batchCount = 0;
  let processedCount = 0;
  
  for (const bidDoc of bidSnapshots.docs) {
    const bidData = bidDoc.data();
    
    // Skip if no payment schedule
    if (!bidData.paymentSchedule || !Array.isArray(bidData.paymentSchedule) || bidData.paymentSchedule.length === 0) {
      continue;
    }
    
    // Calculate payment progress
    let paid = 0;
    let pending = 0;
    let remaining = bidData.totalAmount || 0;
    
    const updatedPaymentSchedule = bidData.paymentSchedule.map((stage: any) => {
      // Convert paid boolean to status if present
      if (stage.paid === true) {
        stage.status = 'paid';
        paid += stage.amount || 0;
      } else if (stage.status === 'paid') {
        paid += stage.amount || 0;
      } else {
        stage.status = stage.status || 'pending';
        pending += stage.amount || 0;
      }
      
      // Add paidAmount if paid
      if (stage.status === 'paid' && stage.paidAmount === undefined) {
        stage.paidAmount = stage.amount;
      }
      
      // Remove deprecated fields
      delete stage.paid;
      delete stage.isFixedAmount;
      delete stage.fixedAmount;
      
      return stage;
    });
    
    remaining -= paid;
    
    // Update the document
    batch.update(bidDoc.ref, { 
      paymentSchedule: updatedPaymentSchedule,
      paymentProgress: {
        paid,
        pending,
        remaining
      },
      updatedAt: Timestamp.fromDate(new Date())
    });
    
    batchCount++;
    processedCount++;
    
    // Commit batch every 500 operations
    if (batchCount >= 500) {
      console.log(`Committing batch of ${batchCount} bid updates...`);
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
    }
  }
  
  // Commit any remaining updates
  if (batchCount > 0) {
    console.log(`Committing final batch of ${batchCount} bid updates...`);
    await batch.commit();
  }
  
  console.log(`Migrated ${processedCount} bids`);
} 