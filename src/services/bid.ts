import { db } from '../config/firebase';
import { devBypassAppUser, isDevAuthBypassEnabled } from '../config/devMode';
import { logger } from '../utils/logger';
import {
  createDevBid,
  createDevBidVersion,
  deleteDevBid,
  getDevBid,
  listDevBids,
  updateDevBid,
  updateDevBidPaymentStage,
} from './devDataStore';
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
  limit,
  startAfter,
  QueryConstraint,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// Import necessary types from central types file
import { 
    Bid, 
    BidVersion, 
    LineItem,
    BidPaymentStage,
    Expense
} from '../types';
import type { FirestoreBid } from './bid/types';
import {
  convertFromFirestoreFormat,
  convertToFirestoreFormat,
  convertVersionToFirestoreFormat,
  normalizeAttachments,
  normalizeCreatePaymentSchedule,
  normalizeTags,
  removeUndefined,
  serializeBidUpdatePayload,
  serializePaymentStageForScheduleUpdate,
} from './bid/serialization';
import {
  applyPaymentToSchedule,
  calculatePaymentProgress,
  calculateProgressFromScheduleState,
} from './bid/paymentSchedule';

// --- Filter/summary types (Keep local if specific to this service's queries) ---
export interface BidSummary {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string; 
  subcontractorId?: string;
  subcontractorName?: string;
  title?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'revision_requested'; 
  priority?: 'low' | 'medium' | 'high' | 'urgent'; 
  submissionDeadline?: Date;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BidFilter {
  projectId?: string;
  subcontractorId?: string;
  status?: string | string[]; // Allow single or multiple statuses
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  minAmount?: number;
  maxAmount?: number;
  submissionDeadlineFrom?: Date;
  submissionDeadlineTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  tags?: string[];
}
export type BidSortField = 
    'createdAt' 
  | 'updatedAt' 
  | 'submissionDeadline' 
  | 'totalAmount' 
  | 'status' 
  | 'priority' 
  | 'projectName' 
  | 'subcontractorName'
  | 'title'
  | 'scope';

export type SortDirection = 'asc' | 'desc';
export interface BidSort { field: BidSortField; direction: SortDirection; }

// --- Bid Service ---
export class BidService {
  private static collection = collection(db, 'bids');

  // Generate a new Line Item (Uses imported type)
  static createLineItem(category: LineItem['category'] = 'labor'): LineItem {
    return {
      id: uuidv4(),
      category,
      description: '',
      quantity: 1,
      unit: category === 'labor' ? 'hours' : 'each', // Example default unit
      unitCost: 0, 
      totalCost: 0,
      notes: '',
    };
  }

  // Create a new bid (Input uses imported Bid type)
  static async createBid(userId: string, bidData: Omit<Bid, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'>): Promise<Bid> {
    if (isDevAuthBypassEnabled) {
      return createDevBid(userId, bidData);
    }

    const now = new Date();
    const versionId = uuidv4();
    
    // Create initial version (matches imported BidVersion type)
    const initialVersion: BidVersion = {
      id: versionId,
      versionNumber: 1,
      createdAt: now,
      totalAmount: bidData.totalAmount,
      notes: 'Initial version',
      lineItems: [], // Matches LineItem[]
      attachments: [],
    };
    
    // Safely handle attachments
    if (bidData.attachments && Array.isArray(bidData.attachments)) {
      initialVersion.attachments = normalizeAttachments(bidData.attachments);
    }

    // Create the bid object with required fields (matches imported Bid type, before Firestore conversion)
    const newBid: Omit<Bid, 'id'> = {
      userId: userId,
      projectId: bidData.projectId,
      totalAmount: bidData.totalAmount || 0,
      status: bidData.status || 'draft',
      currentVersionId: versionId,
      versions: [initialVersion],
      createdAt: now,
      updatedAt: now,
    };
    
    // Add optional fields only if they exist and are valid
    if (bidData.title) newBid.title = bidData.title;
    if (bidData.subcontractorName) newBid.subcontractorName = bidData.subcontractorName;
    if (bidData.subcontractorId) newBid.subcontractorId = bidData.subcontractorId;
    if (bidData.phaseId) newBid.phaseId = bidData.phaseId;
    if (bidData.phaseName) newBid.phaseName = bidData.phaseName;
    if (bidData.projectName) newBid.projectName = bidData.projectName;
    if (bidData.scope) newBid.scope = bidData.scope;
    if (bidData.timeline) newBid.timeline = bidData.timeline;
    if (bidData.notes) newBid.notes = bidData.notes;
    if (bidData.priority) newBid.priority = bidData.priority;
    
    // Only add date fields if they're valid Date objects
    if (bidData.submissionDeadline instanceof Date) newBid.submissionDeadline = bidData.submissionDeadline;
    if (bidData.startDate instanceof Date) newBid.startDate = bidData.startDate;
    if (bidData.completionDate instanceof Date) newBid.completionDate = bidData.completionDate;
    
    // Handle boolean fields with defaults
    newBid.requiresInsurance = bidData.requiresInsurance || false;
    newBid.requiresBond = bidData.requiresBond || false;
    newBid.isPublic = bidData.isPublic || false;
    newBid.isApproved = bidData.isApproved || false;
    
    // If paymentSchedule is an object but not an array, convert to array
    const normalizedPaymentSchedule = normalizeCreatePaymentSchedule(bidData.paymentSchedule, now, uuidv4);
    if (normalizedPaymentSchedule) {
      newBid.paymentSchedule = normalizedPaymentSchedule;
    }
    
    // Add tags if they exist, ensuring it's a valid array
    if (bidData.tags) {
      newBid.tags = Array.isArray(bidData.tags) ? normalizeTags(bidData.tags) : undefined;
    } else {
      newBid.tags = [];
    }
    
    // Clean bid data one more time to ensure no undefined values
    const cleanBidData = removeUndefined(newBid) as Omit<Bid, 'id'>;
    
    // Convert to Firestore format and save
    try {
      const firestoreBid = convertToFirestoreFormat(cleanBidData);

      let docRef;
      try {
        docRef = await addDoc(this.collection, firestoreBid);
      } catch (addDocError) {
        logger.error('BidService - CRITICAL ERROR during addDoc operation:', addDocError);
        if (addDocError instanceof Error) {
          logger.error('Error message:', addDocError.message);
          logger.error('Error stack:', addDocError.stack);
        }
        throw new Error(`Failed to save bid to Firestore: ${addDocError instanceof Error ? addDocError.message : String(addDocError)}`);
      }
      
      const newBidId = docRef.id;
      
      // Fetch the complete bid from Firestore to ensure data consistency
      const createdBid = await this.getBid(userId, newBidId);
      
      // If fetching failed, construct the bid with the local data
      if (!createdBid) {
        return {
          ...cleanBidData,
          id: newBidId,
        } as Bid;
      }
      
      // Make sure payment schedule is intact
      if (!createdBid.paymentSchedule && cleanBidData.paymentSchedule) {
        createdBid.paymentSchedule = cleanBidData.paymentSchedule;
      }

      return createdBid;
    } catch (error) {
      logger.error('BidService - CRITICAL ERROR in createBid:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Create new version (Input/Output uses imported BidVersion type)
  static async createBidVersion(userId: string, bidId: string, versionData: Omit<BidVersion, 'id' | 'createdAt'>, updateBid: boolean = true): Promise<BidVersion> {
    if (isDevAuthBypassEnabled) {
      return createDevBidVersion(userId, bidId, versionData, updateBid);
    }

    // Get the bid first
    const bid = await this.getBid(userId, bidId);
    if (!bid) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const versionId = uuidv4();
    const now = new Date();
    
    // Create new version object
    const newVersion: BidVersion = {
      id: versionId,
      createdAt: now,
      lineItems: versionData.lineItems || [], // Ensure lineItems is array
      versionNumber: versionData.versionNumber || (bid.versions?.length ?? 0) + 1 || 1,
      totalAmount: versionData.totalAmount || 0,
      notes: versionData.notes || '',
      attachments: versionData.attachments || []
    };
    
    const updatedVersions = [...(bid.versions || []), newVersion];
    
    if (updateBid) {
      const firestoreVersions = updatedVersions.map(v => convertVersionToFirestoreFormat(v));
      
      await updateDoc(doc(this.collection, bidId), {
        versions: firestoreVersions,
        currentVersionId: versionId,
        totalAmount: newVersion.totalAmount,
        updatedAt: Timestamp.fromDate(now),
        status: 'revision_requested', // Example status update
      });
    }
    
    return newVersion;
  }

  // Update bid (Input uses imported Bid type)
  static async updateBid(id: string, bidData: Partial<Omit<Bid, 'id' | 'userId' | 'versions' | 'currentVersionId' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    if (isDevAuthBypassEnabled) {
      updateDevBid(id, bidData as Partial<Bid>);
      return;
    }

    const finalPayload = serializeBidUpdatePayload(bidData);

    await updateDoc(doc(this.collection, id), finalPayload);
  }

  // Update line item (Input uses imported LineItem type)
  static async updateLineItem(userId: string, bidId: string, lineItem: LineItem): Promise<void> {
    if (isDevAuthBypassEnabled) {
      const bid = getDevBid(userId, bidId);
      if (!bid) {
        throw new Error(`Bid with ID ${bidId} not found`);
      }

      const currentVersionIndex = bid.versions?.findIndex(v => v.id === bid.currentVersionId);
      if (currentVersionIndex === undefined || currentVersionIndex === -1 || !bid.versions) {
        throw new Error('Current version not found or versions array is missing');
      }

      const currentVersion = {
        ...bid.versions[currentVersionIndex],
        lineItems: [...(bid.versions[currentVersionIndex].lineItems || [])],
      };
      const lineItemIndex = currentVersion.lineItems.findIndex(li => li.id === lineItem.id);

      if (lineItemIndex !== -1) {
        currentVersion.lineItems[lineItemIndex] = lineItem;
      } else {
        currentVersion.lineItems.push(lineItem);
      }

      currentVersion.totalAmount = currentVersion.lineItems.reduce(
        (sum, li) => sum + (li.totalCost || 0),
        0
      );

      const versions = [...bid.versions];
      versions[currentVersionIndex] = currentVersion;
      updateDevBid(bidId, {
        versions,
        totalAmount: currentVersion.totalAmount,
      });
      return;
    }

    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const firestoreData = bidDoc.data() as FirestoreBid;
    if (firestoreData.userId !== userId) {
      throw new Error(`User ${userId} cannot modify bid ${bidId} owned by ${firestoreData.userId}.`);
    }
    
    const bid = convertFromFirestoreFormat(firestoreData, bidId);
    const currentVersionIndex = bid.versions?.findIndex(v => v.id === bid.currentVersionId);
    if (currentVersionIndex === undefined || currentVersionIndex === -1 || !bid.versions) { 
        throw new Error('Current version not found or versions array is missing'); 
    }
    let currentVersion = bid.versions[currentVersionIndex];

    // Ensure lineItems exists on the current version
    currentVersion.lineItems = currentVersion.lineItems || [];

    const lineItemIndex = currentVersion.lineItems.findIndex(li => li.id === lineItem.id);
    
    if (lineItemIndex !== -1) {
        // Update existing line item
        currentVersion.lineItems[lineItemIndex] = lineItem;
    } else {
        // Add new line item if it doesn't exist (though update implies existence)
        currentVersion.lineItems.push(lineItem);
    }
    
    // Recalculate total amount for the version
    currentVersion.totalAmount = currentVersion.lineItems.reduce((sum, li) => sum + (li.totalCost || 0), 0);
    
    // Update the versions array in the bid object
    bid.versions[currentVersionIndex] = currentVersion;
    
    // Prepare versions for Firestore update
    const firestoreVersions = bid.versions.map(v => convertVersionToFirestoreFormat(v));

    await updateDoc(bidRef, { 
        versions: firestoreVersions, 
        totalAmount: currentVersion.totalAmount, // Update the bid's main totalAmount as well
        updatedAt: Timestamp.fromDate(new Date()) 
    });
  }

  // Delete line item
  static async deleteLineItem(userId: string, bidId: string, lineItemId: string): Promise<void> {
    if (isDevAuthBypassEnabled) {
      const bid = getDevBid(userId, bidId);
      if (!bid) {
        throw new Error(`Bid with ID ${bidId} not found`);
      }

      const currentVersionIndex = bid.versions?.findIndex(v => v.id === bid.currentVersionId);
      if (currentVersionIndex === undefined || currentVersionIndex === -1 || !bid.versions) {
        throw new Error('Current version not found or versions array is missing');
      }

      const currentVersion = {
        ...bid.versions[currentVersionIndex],
        lineItems: [...(bid.versions[currentVersionIndex].lineItems || [])].filter(
          (li) => li.id !== lineItemId
        ),
      };
      currentVersion.totalAmount = currentVersion.lineItems.reduce(
        (sum, li) => sum + (li.totalCost || 0),
        0
      );

      const versions = [...bid.versions];
      versions[currentVersionIndex] = currentVersion;
      updateDevBid(bidId, {
        versions,
        totalAmount: currentVersion.totalAmount,
      });
      return;
    }

    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const firestoreData = bidDoc.data() as FirestoreBid;
    if (firestoreData.userId !== userId) {
      throw new Error(`User ${userId} cannot modify bid ${bidId} owned by ${firestoreData.userId}.`);
    }
    
    const bid = convertFromFirestoreFormat(firestoreData, bidId);
    const currentVersionIndex = bid.versions?.findIndex(v => v.id === bid.currentVersionId);
    if (currentVersionIndex === undefined || currentVersionIndex === -1 || !bid.versions) { 
        throw new Error('Current version not found or versions array is missing'); 
    }
    let currentVersion = bid.versions[currentVersionIndex];
    
    if (!currentVersion.lineItems) { throw new Error('Current version has no line items'); }
    
    currentVersion.lineItems = currentVersion.lineItems.filter(li => li.id !== lineItemId);
    currentVersion.totalAmount = currentVersion.lineItems.reduce((sum, li) => sum + (li.totalCost || 0), 0);
    
    bid.versions[currentVersionIndex] = currentVersion;
    const firestoreVersions = bid.versions.map(v => convertVersionToFirestoreFormat(v));
    
    await updateDoc(bidRef, { 
        versions: firestoreVersions, 
        totalAmount: currentVersion.totalAmount, 
        updatedAt: Timestamp.fromDate(new Date()) 
    });
  }

  // Delete bid - Added this method
  static async deleteBid(id: string): Promise<void> {
      if (isDevAuthBypassEnabled) {
        deleteDevBid(id);
        return;
      }

      // Ownership check should be handled by security rules
      const bidRef = doc(this.collection, id);
      await deleteDoc(bidRef);
  }

  // Get a single bid by ID
  static async getBid(userId: string, id: string): Promise<Bid | null> {
    if (isDevAuthBypassEnabled) {
      return getDevBid(userId, id);
    }

    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        logger.warn(`Bid with ID ${id} not found`);
        return null;
      }
      
      const data = docSnap.data() as FirestoreBid;
      
      // Validate ownership or public access
      if (data.userId !== userId) {
        logger.warn(`User ${userId} cannot access bid ${id} owned by ${data.userId}`);
        return null;
      }
      
      // Convert to the expected Bid type
      return convertFromFirestoreFormat(data, id);
    } catch (err) {
      logger.error(`Error getting bid ${id}:`, err);
      throw new Error(`Failed to retrieve bid: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Get bids (Returns BidSummary[], accepts BidFilter and BidSort)
  static async getBids(
    userId: string,
    filters?: BidFilter,
    sort?: BidSort,
    pageSize: number = 50,
    startAfterId?: string // Changed from startAfterDoc for simplicity
  ): Promise<Bid[]> {
    if (isDevAuthBypassEnabled) {
      const allBids = listDevBids(
        userId,
        filters,
        sort,
        Number.MAX_SAFE_INTEGER
      );
      const startIndex = startAfterId
        ? Math.max(
            allBids.findIndex((bid) => bid.id === startAfterId) + 1,
            0
          )
        : 0;
      return allBids.slice(startIndex, startIndex + pageSize);
    }

    let queryConstraints: QueryConstraint[] = [where('userId', '==', userId)];

    // Apply filters
    if (filters) {
      if (filters.projectId) {
        queryConstraints.push(where('projectId', '==', filters.projectId));
      }
      if (filters.subcontractorId) {
        queryConstraints.push(where('subcontractorId', '==', filters.subcontractorId));
      }
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          // Ensure the array is not empty before applying 'in' filter
          if (filters.status.length > 0) {
            queryConstraints.push(where('status', 'in', filters.status));
          }
        } else {
          queryConstraints.push(where('status', '==', filters.status));
        }
      }
      if (filters.priority) {
        queryConstraints.push(where('priority', '==', filters.priority));
      }
      if (filters.minAmount !== undefined) {
        queryConstraints.push(where('totalAmount', '>=', filters.minAmount));
      }
      if (filters.maxAmount !== undefined) {
        queryConstraints.push(where('totalAmount', '<=', filters.maxAmount));
      }
      if (filters.submissionDeadlineFrom) {
        queryConstraints.push(where('submissionDeadline', '>=', Timestamp.fromDate(filters.submissionDeadlineFrom)));
      }
      if (filters.submissionDeadlineTo) {
        queryConstraints.push(where('submissionDeadline', '<=', Timestamp.fromDate(filters.submissionDeadlineTo)));
      }
      if (filters.createdFrom) {
        queryConstraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.createdFrom)));
      }
      if (filters.createdTo) {
        queryConstraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.createdTo)));
      }
      if (filters.tags && filters.tags.length > 0) {
        queryConstraints.push(where('tags', 'array-contains-any', filters.tags));
      }
    }

    // Apply sorting
    if (sort) {
      queryConstraints.push(orderBy(sort.field, sort.direction));
    }

    // Apply pagination (if startAfterId is provided)
    if (startAfterId) {
      try {
        const startAfterDoc = await getDoc(doc(this.collection, startAfterId));
        if (startAfterDoc.exists()) {
          queryConstraints.push(startAfter(startAfterDoc));
        } else {
          logger.warn(`[BidService.getBids] Document with startAfterId ${startAfterId} not found. Fetching from beginning.`);
        }
      } catch (err) {
        logger.error(`[BidService.getBids] Error fetching startAfter document ${startAfterId}:`, err);
        // Proceed without pagination if startAfter doc fails
      }
    }
    
    queryConstraints.push(limit(pageSize));

    try {
      const q = query(this.collection, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const bids: Bid[] = [];
      querySnapshot.forEach((doc) => {
        try {
          bids.push(convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
        } catch (conversionError) {
          logger.error(`[BidService.getBids] Error converting bid document ${doc.id}:`, conversionError, 'Document data:', doc.data());
          // Optionally skip this bid or handle the error differently
        }
      });
      return bids;
    } catch (error) {
      // Log the specific Firestore error
      logger.error('[BidService.getBids] Firestore query failed:', error);
      // Re-throw the error so the calling component knows it failed
      throw error; 
    }
  }

  // Get recent bids (Returns BidSummary[])
  static async getRecentBids(userId: string, limitCount: number = 5): Promise<Bid[]> {
    if (isDevAuthBypassEnabled) {
      return listDevBids(
        userId,
        undefined,
        { field: 'createdAt', direction: 'desc' },
        limitCount
      );
    }

    const q = query(
      this.collection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    // Use convertFromFirestoreFormat instead of convertToSummary
    return querySnapshot.docs.map(doc => convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
  }

  // Get upcoming bids (Returns BidSummary[])
  static async getUpcomingBids(userId: string, limitCount: number = 5): Promise<Bid[]> {
    if (isDevAuthBypassEnabled) {
      const now = new Date();
      return listDevBids(userId, undefined, { field: 'submissionDeadline', direction: 'asc' }, Number.MAX_SAFE_INTEGER)
        .filter((bid) => bid.submissionDeadline instanceof Date && bid.submissionDeadline >= now)
        .slice(0, limitCount);
    }

    const now = Timestamp.now();
    const q = query(
      this.collection,
      where('userId', '==', userId),
      where('submissionDeadline', '>=', now),
      orderBy('submissionDeadline', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    // Use convertFromFirestoreFormat instead of convertToSummary
    return querySnapshot.docs.map(doc => convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
  }

  // Get subcontractor bids (Returns BidSummary[])
  static async getSubcontractorBids(userId: string, subcontractorId: string): Promise<Bid[]> {
    if (isDevAuthBypassEnabled) {
      return listDevBids(
        userId,
        { subcontractorId },
        { field: 'updatedAt', direction: 'desc' }
      );
    }

    const q = query(
      this.collection,
      where('userId', '==', userId),
      where('subcontractorId', '==', subcontractorId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    // Use convertFromFirestoreFormat instead of convertToSummary
    return querySnapshot.docs.map(doc => convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
  }

  /**
   * Create an expense from a bid payment stage
   */
  static async createExpenseFromPaymentStage(
    userId: string, 
    bidId: string, 
    paymentStageId: string
  ): Promise<string | null> {
    try {
      // Import here to avoid circular dependency
      const { ExpenseService } = await import('./expense');
      
      // Get the bid
      const bid = await this.getBid(userId, bidId);
      if (!bid) {
        logger.error(`BidService: Could not find bid with ID ${bidId}`);
        return null;
      }
      
      // Find the payment stage
      const paymentStage = bid.paymentSchedule?.find(stage => stage.id === paymentStageId);
      if (!paymentStage) {
        logger.error(`BidService: Could not find payment stage with ID ${paymentStageId}`);
        return null;
      }
      
      // Check if an expense already exists for this payment stage
      if (paymentStage.expenseId) {
        logger.warn(`BidService: Expense already exists for payment stage ${paymentStageId}`);
        return paymentStage.expenseId;
      }
      
      // Create expense description
      const stageName = paymentStage.name || 'Payment';
      const description = `${stageName} - ${bid.title || 'Bid Payment'}`;
      
      // Create the expense
      const expense = await ExpenseService.createExpense(userId, {
        projectId: bid.projectId,
        phaseId: bid.phaseId,
        phaseName: bid.phaseName,
        projectName: bid.projectName,
        category: 'subcontractor',
        description,
        amount: paymentStage.amount,
        date: new Date(),
        status: 'pending',
        bidId,
        paymentStageId,
        subcontractorId: bid.subcontractorId,
        subcontractorName: bid.subcontractorName,
        notes: `This expense is for payment stage: ${stageName} for accepted bid: ${bid.title}`,
        dueDate: paymentStage.dueDate instanceof Date ? paymentStage.dueDate : paymentStage.dueDate ? new Date(paymentStage.dueDate) : undefined,
      });
      
      // Update the payment stage with the expense ID
      await this.updateBidPaymentStage(bidId, paymentStageId, {
        expenseId: expense.id
      });
      
      return expense.id || null;
    } catch (error) {
      logger.error(`BidService: Error creating expense from payment stage:`, error);
      return null;
    }
  }
  
  /**
   * Update a payment stage within a bid
   */
  static async updateBidPaymentStage(
    bidId: string,
    stageId: string,
    stageData: Partial<Omit<BidPaymentStage, 'id'>>
  ): Promise<void> {
    try {
      if (isDevAuthBypassEnabled) {
        updateDevBidPaymentStage(devBypassAppUser.id, bidId, stageId, stageData);
        await this.updatePaymentProgress(bidId);
        return;
      }

      const bidRef = doc(this.collection, bidId);
      const bidDoc = await getDoc(bidRef);
      
      if (!bidDoc.exists()) {
        throw new Error(`Bid with ID ${bidId} not found`);
      }
      
      const bid = convertFromFirestoreFormat(bidDoc.data() as FirestoreBid, bidId);
      
      if (!bid.paymentSchedule) {
        throw new Error(`Bid ${bidId} does not have a payment schedule`);
      }
      
      // Find the index of the payment stage to update
      const stageIndex = bid.paymentSchedule.findIndex(stage => stage.id === stageId);
      if (stageIndex === -1) {
        throw new Error(`Payment stage ${stageId} not found in bid ${bidId}`);
      }
      
      // Create a copy of the payment schedule
      const updatedPaymentSchedule = [...bid.paymentSchedule];
      
      // Update the payment stage with new data
      updatedPaymentSchedule[stageIndex] = {
        ...updatedPaymentSchedule[stageIndex],
        ...stageData,
      };
      
      const firestorePaymentSchedule = updatedPaymentSchedule.map(serializePaymentStageForScheduleUpdate);
      
      // Update the bid document
      await updateDoc(bidRef, {
        paymentSchedule: firestorePaymentSchedule,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Update the payment progress
      await this.updatePaymentProgress(bidId);
    } catch (error) {
      logger.error(`BidService: Error updating payment stage:`, error);
      throw error;
    }
  }
  
  /**
   * Update payment progress for a bid
   */
  static async updatePaymentProgress(bidId: string): Promise<void> {
    try {
      if (isDevAuthBypassEnabled) {
        const bid = getDevBid(devBypassAppUser.id, bidId);
        if (!bid || !bid.paymentSchedule) {
          return;
        }

        const paymentProgress = calculatePaymentProgress(bid.paymentSchedule, bid.totalAmount);

        updateDevBid(bidId, {
          paymentProgress,
        });
        return;
      }

      const bidRef = doc(this.collection, bidId);
      const bidDoc = await getDoc(bidRef);
      
      if (!bidDoc.exists()) {
        throw new Error(`Bid with ID ${bidId} not found`);
      }
      
      const bid = convertFromFirestoreFormat(bidDoc.data() as FirestoreBid, bidId);
      
      if (!bid.paymentSchedule) {
        return; // Nothing to update
      }
      
      const paymentProgress = calculatePaymentProgress(bid.paymentSchedule, bid.totalAmount);
      
      // Update the bid document
      await updateDoc(bidRef, {
        paymentProgress,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      logger.error(`BidService: Error updating payment progress:`, error);
      throw error;
    }
  }

  /**
   * Sync a bid payment stage with its associated expense
   */
  static async syncPaymentStageWithExpense(
    userId: string, 
    bidId: string, 
    stageId: string
  ): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { ExpenseService } = await import('./expense');
      
      // Get the bid
      const bid = await this.getBid(userId, bidId);
      if (!bid) {
        throw new Error(`Bid with ID ${bidId} not found`);
      }
      
      // Find the payment stage
      const paymentStage = bid.paymentSchedule?.find(stage => stage.id === stageId);
      if (!paymentStage) {
        throw new Error(`Payment stage ${stageId} not found in bid ${bidId}`);
      }
      
      // If no expense is linked, create one
      if (!paymentStage.expenseId) {
        await this.createExpenseFromPaymentStage(userId, bidId, stageId);
        return;
      }
      
      // Get the expense
      const expense = await ExpenseService.getExpense(userId, paymentStage.expenseId);
      if (!expense) {
        // Expense not found, create a new one
        await this.createExpenseFromPaymentStage(userId, bidId, stageId);
        return;
      }
      
      // Update the payment stage based on expense
      const stageUpdate: Partial<BidPaymentStage> = {};
      
      if (expense.status === 'paid') {
        stageUpdate.status = 'paid';
        stageUpdate.paidAmount = expense.amount;
        // Convert date properly
        if (expense.lastPaymentDate) {
          stageUpdate.paymentDate = expense.lastPaymentDate instanceof Date ? 
            expense.lastPaymentDate : new Date(expense.lastPaymentDate);
        } else if (expense.updatedAt) {
          stageUpdate.paymentDate = expense.updatedAt instanceof Date ? 
            expense.updatedAt : new Date(expense.updatedAt);
        }
      } else if (expense.status === 'partially_paid' && expense.amountPaid) {
        stageUpdate.status = 'partially_paid';
        stageUpdate.paidAmount = expense.amountPaid;
        // Convert date properly
        if (expense.lastPaymentDate) {
          stageUpdate.paymentDate = expense.lastPaymentDate instanceof Date ? 
            expense.lastPaymentDate : new Date(expense.lastPaymentDate);
        }
      } else if (expense.dueDate && expense.status === 'pending') {
        const now = new Date();
        const dueDate = expense.dueDate instanceof Date ? expense.dueDate : new Date(expense.dueDate);
        stageUpdate.status = now > dueDate ? 'overdue' : 'pending';
      }
      
      // Update the payment stage
      await this.updateBidPaymentStage(bidId, stageId, stageUpdate);
      
      // Update the payment progress
      await this.updatePaymentProgress(bidId);
    } catch (error) {
      logger.error(`BidService: Error syncing payment stage with expense:`, error);
      throw error;
    }
  }
}

export const adjustBidPaymentSchedule = async (
  userId: string,
  originalExpense: Expense,
  paymentExpense: Expense,
  amountPaid: number
): Promise<void> => {
  if (!originalExpense.bidId || !originalExpense.paymentStageId) {
    return;
  }

  let bid: Bid | null;
  try {
    bid = await BidService.getBid(userId, originalExpense.bidId);
  } catch (error) {
    throw new Error(`Failed to fetch bid ${originalExpense.bidId}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!bid?.paymentSchedule || !bid.paymentProgress) {
    return;
  }

  const schedule = applyPaymentToSchedule(
    bid.paymentSchedule,
    originalExpense.paymentStageId,
    paymentExpense.id,
    amountPaid
  );
  if (!schedule) {
    return;
  }

  const paymentProgress = calculateProgressFromScheduleState(
    schedule,
    bid.totalAmount,
    bid.paymentProgress
  );

  try {
    await BidService.updateBid(bid.id, {
      paymentSchedule: schedule,
      paymentProgress,
    });
  } catch (error) {
    throw new Error(`Failed to update bid ${bid.id} after payment adjustment: ${error instanceof Error ? error.message : String(error)}`);
  }
};
