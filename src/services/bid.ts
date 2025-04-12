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
  DocumentReference,
  collectionGroup,
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
    BidPaymentStage
} from '../types';

// Define Firestore-specific Bid type extending the main Bid type
// Handles Timestamps and ensures userId is present
interface FirestoreBid {
  userId: string;
  projectId: string;
  phaseId?: string;
  phaseName?: string;
  projectName?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  contractorName?: string;
  bidAmount?: number;
  title?: string;
  scope?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'revision_requested';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  submissionDeadline?: Timestamp | null;
  startDate?: Timestamp | null;
  completionDate?: Timestamp | null;
  totalAmount: number;
  timeline?: number;
  paymentTerms?: string;
  currentVersionId?: string;
  versions?: FirestoreBidVersion[];
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  notes?: string;
  requiresInsurance?: boolean;
  requiresBond?: boolean;
  isPublic?: boolean;
  isApproved?: boolean;
  attachments?: string[] | { name: string; url: string }[]; // Allow both string[] and object[] formats
  paymentSchedule?: FirestoreBidPaymentStage[];
  paymentProgress?: {
    paid: number;
    pending: number;
    remaining: number;
  };
  categoryId?: string;
}

// Define Firestore-specific BidVersion type
interface FirestoreBidVersion extends Omit<BidVersion, 'createdAt' | 'lineItems'> {
    createdAt: Timestamp;
    lineItems?: LineItem[]; // Use LineItem here
}

// Define Firestore-specific BidPaymentStage type
interface FirestoreBidPaymentStage extends Omit<BidPaymentStage, 'createdAt' | 'updatedAt' | 'dueDate' | 'paymentDate'> {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    dueDate?: Timestamp;
    paymentDate?: Timestamp;
}

// --- BidSummary (If needed, define locally or import if added to types/index.ts) ---
// For now, assume convertToSummary will construct it based on FirestoreBid
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

// --- Filter/Sort types (Keep local if specific to this service's queries) ---
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
    const now = new Date();
    const versionId = uuidv4();
    
    // Debug paymentSchedule
    console.log('paymentSchedule in createBid:', typeof bidData.paymentSchedule, 
                bidData.paymentSchedule, 
                Array.isArray(bidData.paymentSchedule));

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
    if (bidData.attachments) {
      if (Array.isArray(bidData.attachments)) {
        // Manual iteration to avoid filter/map type issues
        const cleanAttachments: string[] = [];
        
        for (const att of bidData.attachments) {
          if (!att) continue; // Skip null/undefined
          
          // Handle string or object with url
          let url: string | null = null;
          if (typeof att === 'string') {
            url = att;
          } else if (att && typeof att === 'object' && 'url' in att && typeof att.url === 'string') {
            url = att.url;
          }
          
          // Only add non-empty strings
          if (url) {
            cleanAttachments.push(url);
          }
        }
        
        initialVersion.attachments = cleanAttachments;
      }
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
    if (bidData.paymentSchedule) {
      if (typeof bidData.paymentSchedule === 'object' && !Array.isArray(bidData.paymentSchedule)) {
        console.log('Converting paymentSchedule object to array:', bidData.paymentSchedule);
        if ('0' in bidData.paymentSchedule && '1' in bidData.paymentSchedule) {
          // It looks like an object with numeric keys, likely an array-like object
          newBid.paymentSchedule = Object.values(bidData.paymentSchedule);
          console.log('Converted to array:', newBid.paymentSchedule);
        }
      } else if (Array.isArray(bidData.paymentSchedule)) {
        // Make a clean copy of the payment schedule
        newBid.paymentSchedule = bidData.paymentSchedule.map(payment => {
          const cleanPayment: BidPaymentStage = {
            id: payment.id || uuidv4(),
            name: payment.name || 'Payment',
            percentage: payment.percentage || 0,
            amount: payment.amount || 0,
            status: payment.status || 'pending',
            createdAt: payment.createdAt instanceof Date ? payment.createdAt : now,
            updatedAt: payment.updatedAt instanceof Date ? payment.updatedAt : now
          };
          
          // Add optional fields only if they exist
          if (payment.description) cleanPayment.description = payment.description;
          if (payment.phaseId) cleanPayment.phaseId = payment.phaseId;
          if (payment.phaseName) cleanPayment.phaseName = payment.phaseName;
          if (payment.completionRequirements) cleanPayment.completionRequirements = payment.completionRequirements;
          if (payment.expenseId) cleanPayment.expenseId = payment.expenseId;
          if (payment.invoiceId) cleanPayment.invoiceId = payment.invoiceId;
          if (payment.dueDate instanceof Date) cleanPayment.dueDate = payment.dueDate;
          if (payment.paymentDate instanceof Date) cleanPayment.paymentDate = payment.paymentDate;
          
          return cleanPayment;
        });
      }
    }
    
    // Add tags if they exist, ensuring it's a valid array
    if (bidData.tags) {
      if (Array.isArray(bidData.tags)) {
        newBid.tags = bidData.tags.filter(tag => typeof tag === 'string');
      }
    } else {
      newBid.tags = [];
    }
    
    // Clean bid data one more time to ensure no undefined values
    const cleanBidData = this.removeUndefined(newBid);
    
    // Convert to Firestore format and save
    try {
      console.log('BidService - DEBUG - Converting bid to Firestore format');
      const firestoreBid = this.convertToFirestoreFormat(cleanBidData);
      
      console.log('BidService - DEBUG - About to add document to Firestore collection');
      let docRef;
      try {
        docRef = await addDoc(this.collection, firestoreBid);
        console.log('BidService - DEBUG - Document added successfully with ID:', docRef.id);
      } catch (addDocError) {
        console.error('BidService - CRITICAL ERROR during addDoc operation:', addDocError);
        if (addDocError instanceof Error) {
          console.error('Error message:', addDocError.message);
          console.error('Error stack:', addDocError.stack);
        }
        throw new Error(`Failed to save bid to Firestore: ${addDocError instanceof Error ? addDocError.message : String(addDocError)}`);
      }
      
      const newBidId = docRef.id;
      
      // Fetch the complete bid from Firestore to ensure data consistency
      console.log('BidService - DEBUG - Fetching newly created bid from Firestore');
      const createdBid = await this.getBid(userId, newBidId);
      
      // If fetching failed, construct the bid with the local data
      if (!createdBid) {
        console.log('BidService - DEBUG - Failed to fetch newly created bid, constructing from local data');
        return {
          ...cleanBidData,
          id: newBidId,
        } as Bid;
      }
      
      // Make sure payment schedule is intact
      if (!createdBid.paymentSchedule && cleanBidData.paymentSchedule) {
        console.log('BidService - DEBUG - Restoring payment schedule from local data');
        createdBid.paymentSchedule = cleanBidData.paymentSchedule;
      }
      
      console.log('BidService - DEBUG - Successfully created and returned bid');
      return createdBid;
    } catch (error) {
      console.error('BidService - CRITICAL ERROR in createBid:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Create new version (Input/Output uses imported BidVersion type)
  static async createBidVersion(userId: string, bidId: string, versionData: Omit<BidVersion, 'id' | 'createdAt'>, updateBid: boolean = true): Promise<BidVersion> {
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
      const firestoreVersions = updatedVersions.map(v => this.convertVersionToFirestoreFormat(v));
      
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
    const bidRef = doc(this.collection, id);
    const updatePayload: any = { 
      ...bidData, 
      updatedAt: Timestamp.fromDate(new Date()) 
    };

    // Explicitly handle paymentSchedule conversion
    if (bidData.paymentSchedule && Array.isArray(bidData.paymentSchedule)) {
      updatePayload.paymentSchedule = bidData.paymentSchedule.map(stage => {
        // First, ensure all numeric values are properly typed
        const processedStage = {
          ...stage,
          // Convert string amounts to numbers
          amount: typeof stage.amount === 'string' ? parseFloat(stage.amount) : stage.amount,
          percentage: typeof stage.percentage === 'string' ? parseFloat(stage.percentage) : stage.percentage
        };

        const firestoreStage: any = { ...processedStage };
        
        // Convert date fields within the stage to Timestamps
        if (stage.createdAt instanceof Date) {
          firestoreStage.createdAt = Timestamp.fromDate(stage.createdAt);
        }
        if (stage.updatedAt instanceof Date) {
          firestoreStage.updatedAt = Timestamp.fromDate(stage.updatedAt);
        }
        if (stage.dueDate instanceof Date) {
          firestoreStage.dueDate = Timestamp.fromDate(stage.dueDate);
        } else if (stage.dueDate === null) {
          firestoreStage.dueDate = null; // Allow null
        } else if (stage.dueDate === undefined) {
          // Don't include undefined values
          delete firestoreStage.dueDate;
        }
        
        if (stage.paymentDate instanceof Date) {
          firestoreStage.paymentDate = Timestamp.fromDate(stage.paymentDate);
        } else if (stage.paymentDate === null) {
          firestoreStage.paymentDate = null; // Allow null
        } else if (stage.paymentDate === undefined) {
          // Don't include undefined values
          delete firestoreStage.paymentDate;
        }
        
        // Only include phaseId and phaseName if they're defined
        // This avoids adding empty strings which causes issues
        if (stage.phaseId === undefined) {
          delete firestoreStage.phaseId;
        }
        
        if (stage.phaseName === undefined) {
          delete firestoreStage.phaseName;
        }
        
        // Filter out any remaining undefined fields
        return this.removeUndefined(firestoreStage);
      });
    }

    // Handle payment progress conversion
    if (bidData.paymentProgress) {
      // Ensure all values are numbers
      updatePayload.paymentProgress = {
        paid: typeof bidData.paymentProgress.paid === 'string'
          ? parseFloat(bidData.paymentProgress.paid)
          : bidData.paymentProgress.paid,
        pending: typeof bidData.paymentProgress.pending === 'string'
          ? parseFloat(bidData.paymentProgress.pending)
          : bidData.paymentProgress.pending,
        remaining: typeof bidData.paymentProgress.remaining === 'string'
          ? parseFloat(bidData.paymentProgress.remaining)
          : bidData.paymentProgress.remaining
      };
    }

    // Convert top-level dates
    for (const key in updatePayload) {
      // Check if it's a direct property and needs conversion
      if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
        if (updatePayload[key] instanceof Date && ['submissionDeadline', 'startDate', 'completionDate'].includes(key)) {
          updatePayload[key] = Timestamp.fromDate(updatePayload[key]);
        } else if (updatePayload[key] === null && ['submissionDeadline', 'startDate', 'completionDate'].includes(key)) {
          // Ensure null dates are passed correctly
          updatePayload[key] = null;
        }
      }
    }
    
    // Remove undefined fields before updating to avoid errors
    const finalPayload = this.removeUndefined(updatePayload);

    console.log(`BidService: Updating bid ${id} with payload:`, JSON.stringify(finalPayload, null, 2));

    await updateDoc(doc(this.collection, id), finalPayload);
  }

  // Update line item (Input uses imported LineItem type)
  static async updateLineItem(userId: string, bidId: string, lineItem: LineItem): Promise<void> {
    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const firestoreData = bidDoc.data() as FirestoreBid;
    if (firestoreData.userId !== userId) {
      throw new Error(`User ${userId} cannot modify bid ${bidId} owned by ${firestoreData.userId}.`);
    }
    
    const bid = this.convertFromFirestoreFormat(firestoreData, bidId);
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
    const firestoreVersions = bid.versions.map(v => this.convertVersionToFirestoreFormat(v));

    await updateDoc(bidRef, { 
        versions: firestoreVersions, 
        totalAmount: currentVersion.totalAmount, // Update the bid's main totalAmount as well
        updatedAt: Timestamp.fromDate(new Date()) 
    });
  }

  // Delete line item
  static async deleteLineItem(userId: string, bidId: string, lineItemId: string): Promise<void> {
    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const firestoreData = bidDoc.data() as FirestoreBid;
    if (firestoreData.userId !== userId) {
      throw new Error(`User ${userId} cannot modify bid ${bidId} owned by ${firestoreData.userId}.`);
    }
    
    const bid = this.convertFromFirestoreFormat(firestoreData, bidId);
    const currentVersionIndex = bid.versions?.findIndex(v => v.id === bid.currentVersionId);
    if (currentVersionIndex === undefined || currentVersionIndex === -1 || !bid.versions) { 
        throw new Error('Current version not found or versions array is missing'); 
    }
    let currentVersion = bid.versions[currentVersionIndex];
    
    if (!currentVersion.lineItems) { throw new Error('Current version has no line items'); }
    
    currentVersion.lineItems = currentVersion.lineItems.filter(li => li.id !== lineItemId);
    currentVersion.totalAmount = currentVersion.lineItems.reduce((sum, li) => sum + (li.totalCost || 0), 0);
    
    bid.versions[currentVersionIndex] = currentVersion;
    const firestoreVersions = bid.versions.map(v => this.convertVersionToFirestoreFormat(v));
    
    await updateDoc(bidRef, { 
        versions: firestoreVersions, 
        totalAmount: currentVersion.totalAmount, 
        updatedAt: Timestamp.fromDate(new Date()) 
    });
  }

  // Delete bid - Added this method
  static async deleteBid(id: string): Promise<void> {
      // Ownership check should be handled by security rules
      const bidRef = doc(this.collection, id);
      await deleteDoc(bidRef);
  }

  // Get a single bid by ID
  static async getBid(userId: string, id: string): Promise<Bid | null> {
    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.warn(`Bid with ID ${id} not found`);
        return null;
      }
      
      const data = docSnap.data() as FirestoreBid;
      
      // Validate ownership or public access
      if (data.userId !== userId) {
        console.warn(`User ${userId} cannot access bid ${id} owned by ${data.userId}`);
        return null;
      }
      
      // Convert to the expected Bid type
      return this.convertFromFirestoreFormat(data, id);
    } catch (err) {
      console.error(`Error getting bid ${id}:`, err);
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
    console.log('[BidService.getBids] Fetching bids for user:', userId, 'Filters:', filters, 'Sort:', sort, 'PageSize:', pageSize, 'StartAfter:', startAfterId);
    let queryConstraints: QueryConstraint[] = [where('userId', '==', userId)];

    // Apply filters
    if (filters) {
      if (filters.projectId) {
        console.log('[BidService.getBids] Applying projectId filter:', filters.projectId);
        queryConstraints.push(where('projectId', '==', filters.projectId));
      }
      if (filters.subcontractorId) {
        queryConstraints.push(where('subcontractorId', '==', filters.subcontractorId));
      }
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          // Ensure the array is not empty before applying 'in' filter
          if (filters.status.length > 0) {
            console.log('[BidService.getBids] Applying status (in) filter:', filters.status);
            queryConstraints.push(where('status', 'in', filters.status));
          } else {
            console.log('[BidService.getBids] Status filter array is empty, skipping.');
          }
        } else {
          console.log('[BidService.getBids] Applying status (==) filter:', filters.status);
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
      console.log('[BidService.getBids] Applying sort:', sort);
      queryConstraints.push(orderBy(sort.field, sort.direction));
    }

    // Apply pagination (if startAfterId is provided)
    if (startAfterId) {
      try {
        const startAfterDoc = await getDoc(doc(this.collection, startAfterId));
        if (startAfterDoc.exists()) {
          queryConstraints.push(startAfter(startAfterDoc));
        } else {
          console.warn(`[BidService.getBids] Document with startAfterId ${startAfterId} not found. Fetching from beginning.`);
        }
      } catch (err) {
        console.error(`[BidService.getBids] Error fetching startAfter document ${startAfterId}:`, err);
        // Proceed without pagination if startAfter doc fails
      }
    }
    
    queryConstraints.push(limit(pageSize));

    try {
      const q = query(this.collection, ...queryConstraints);
      console.log('[BidService.getBids] Executing query...');
      const querySnapshot = await getDocs(q);
      console.log(`[BidService.getBids] Query successful. Found ${querySnapshot.docs.length} bids.`);
      const bids: Bid[] = [];
      querySnapshot.forEach((doc) => {
        try {
          bids.push(this.convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
        } catch (conversionError) {
          console.error(`[BidService.getBids] Error converting bid document ${doc.id}:`, conversionError, 'Document data:', doc.data());
          // Optionally skip this bid or handle the error differently
        }
      });
      return bids;
    } catch (error) {
      // Log the specific Firestore error
      console.error('[BidService.getBids] Firestore query failed:', error);
      // Re-throw the error so the calling component knows it failed
      throw error; 
    }
  }

  // Get recent bids (Returns BidSummary[])
  static async getRecentBids(userId: string, limitCount: number = 5): Promise<Bid[]> {
    const q = query(
      this.collection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    // Use convertFromFirestoreFormat instead of convertToSummary
    return querySnapshot.docs.map(doc => this.convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
  }

  // Get upcoming bids (Returns BidSummary[])
  static async getUpcomingBids(userId: string, limitCount: number = 5): Promise<Bid[]> {
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
    return querySnapshot.docs.map(doc => this.convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
  }

  // Get subcontractor bids (Returns BidSummary[])
  static async getSubcontractorBids(userId: string, subcontractorId: string): Promise<Bid[]> {
    const q = query(
      this.collection,
      where('userId', '==', userId),
      where('subcontractorId', '==', subcontractorId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    // Use convertFromFirestoreFormat instead of convertToSummary
    return querySnapshot.docs.map(doc => this.convertFromFirestoreFormat(doc.data() as FirestoreBid, doc.id));
  }

  // --- Helper Functions --- 

  // Convert Bid (imported type) to FirestoreBid
  private static convertToFirestoreFormat(bid: Omit<Bid, 'id'>): FirestoreBid {
      const { versions, createdAt, updatedAt, submissionDeadline, startDate, completionDate, paymentSchedule, tags, attachments, categoryId, ...rest } = bid;
      
      // Debug paymentSchedule
      console.log('paymentSchedule in convertToFirestoreFormat:', typeof paymentSchedule, 
                  paymentSchedule, 
                  Array.isArray(paymentSchedule));
      
      // Handle array-like objects for paymentSchedule
      let paymentScheduleArray = paymentSchedule;
      if (paymentSchedule && typeof paymentSchedule === 'object' && !Array.isArray(paymentSchedule)) {
        console.log('Converting paymentSchedule object to array in convertToFirestoreFormat');
        if ('0' in paymentSchedule && '1' in paymentSchedule) {
          // It looks like an object with numeric keys, likely an array-like object
          paymentScheduleArray = Object.values(paymentSchedule);
          console.log('Converted to array:', paymentScheduleArray);
        } else {
          // Not an array-like object, create an empty array
          paymentScheduleArray = [];
        }
      }
      
      // Convert payment schedule date fields - ensure it's an array first
      const convertedPaymentSchedule = paymentScheduleArray && Array.isArray(paymentScheduleArray) 
        ? paymentScheduleArray.map(payment => {
            const result: any = {
                id: payment.id,
                name: payment.name,
                percentage: payment.percentage || 0,
                amount: payment.amount || 0,
                status: payment.status || 'pending',
                createdAt: payment.createdAt instanceof Date ? Timestamp.fromDate(payment.createdAt) : Timestamp.now(),
                updatedAt: payment.updatedAt instanceof Date ? Timestamp.fromDate(payment.updatedAt) : Timestamp.now(),
            };

            // Only add optional fields if they exist and are valid
            if (payment.description) result.description = payment.description;
            if (payment.phaseId) result.phaseId = payment.phaseId;
            if (payment.phaseName) result.phaseName = payment.phaseName;
            if (payment.completionRequirements) result.completionRequirements = payment.completionRequirements;
            if (payment.expenseId) result.expenseId = payment.expenseId;
            if (payment.invoiceId) result.invoiceId = payment.invoiceId;
            if (payment.dueDate instanceof Date) result.dueDate = Timestamp.fromDate(payment.dueDate);
            if (payment.paymentDate instanceof Date) result.paymentDate = Timestamp.fromDate(payment.paymentDate);
            
            return result as FirestoreBidPaymentStage;
        }) 
        : [];
      
      // Ensure tags is a string array
      const convertedTags: string[] = Array.isArray(tags) ? tags.filter(t => typeof t === 'string') : 
                           (tags && typeof tags === 'object' ? 
                             Object.values(tags).filter(t => typeof t === 'string') as string[] : 
                             []);
      
      // Handle attachments - avoid using filter on unknown type
      let convertedAttachments: string[] = [];
      
      if (Array.isArray(attachments)) {
          for (const item of attachments) {
              if (typeof item === 'string') {
                  convertedAttachments.push(item);
              } else if (typeof item === 'object' && item !== null && 'url' in item) {
                  // Handle URL objects - convert to string URL
                  if (typeof item.url === 'string') {
                      convertedAttachments.push(item.url);
                  }
              }
          }
      } else if (attachments && typeof attachments === 'object') {
          for (const item of Object.values(attachments)) {
              if (typeof item === 'string') {
                  convertedAttachments.push(item);
              } else if (typeof item === 'object' && item !== null && 'url' in item) {
                  // Handle URL objects - convert to string URL
                  if (typeof item.url === 'string') {
                      convertedAttachments.push(item.url);
                  }
              }
          }
      }
      
      // Create the Firestore document with all required fields
      const firestoreBid: FirestoreBid = {
          ...this.removeUndefined(rest), // Remove any undefined values from rest
          userId: rest.userId,
          projectId: rest.projectId,
          totalAmount: rest.totalAmount || 0,
          status: rest.status || 'draft',
          createdAt: createdAt instanceof Date ? Timestamp.fromDate(createdAt) : Timestamp.now(),
          updatedAt: updatedAt instanceof Date ? Timestamp.fromDate(updatedAt) : Timestamp.now(),
          submissionDeadline: submissionDeadline ? (submissionDeadline instanceof Date ? Timestamp.fromDate(submissionDeadline) : null) : null,
          startDate: startDate ? (startDate instanceof Date ? Timestamp.fromDate(startDate) : null) : null,
          completionDate: completionDate ? (completionDate instanceof Date ? Timestamp.fromDate(completionDate) : null) : null,
          versions: versions ? versions.map(v => this.convertVersionToFirestoreFormat(v)) : [],
          tags: convertedTags,
          attachments: convertedAttachments,
      };
      
      // Only add payment schedule if it contains items
      if (convertedPaymentSchedule && convertedPaymentSchedule.length > 0) {
          firestoreBid.paymentSchedule = convertedPaymentSchedule;
      }
      
      // Only add categoryId if it exists and is defined
      if (categoryId) {
          firestoreBid.categoryId = categoryId;
      }
      
      return firestoreBid;
  }
  
  // Utility function to remove undefined values from an object
  private static removeUndefined(obj: any): any {
    const result: any = {};
    
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    
    return result;
  }

  // Helper function to safely convert Firestore Timestamp to Date
  private static toDate(timestamp: any): Date | undefined {
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return undefined;
  }

  // Convert from Firestore format to app format (Used by getBid, getBids)
  private static convertFromFirestoreFormat(data: FirestoreBid, id: string): Bid {
    try {
      // Extract versions first to handle special conversion
      const { versions: firestoreVersions, ...otherData } = data;
      
      // Convert each version, handling lineItems and Timestamp
      const versions = firestoreVersions?.map(v => ({
        ...v,
        createdAt: this.toDate(v.createdAt) || new Date(),
        // Ensure lineItems is an array
        lineItems: Array.isArray(v.lineItems) ? v.lineItems : [],
      })) || [];
      
      // Handle payment schedule if it exists
      let paymentSchedule: BidPaymentStage[] | undefined = undefined;
      if (data.paymentSchedule && Array.isArray(data.paymentSchedule)) {
        paymentSchedule = data.paymentSchedule.map(payment => {
          // Don't spread the entire payment object, create a new object with the correct types
          const converted: BidPaymentStage = {
            id: payment.id,
            name: payment.name,
            description: payment.description,
            percentage: payment.percentage,
            amount: payment.amount,
            status: payment.status,
            phaseId: payment.phaseId,
            phaseName: payment.phaseName,
            completionRequirements: payment.completionRequirements,
            expenseId: payment.expenseId,
            invoiceId: payment.invoiceId,
            createdAt: this.toDate(payment.createdAt) || new Date(),
            updatedAt: this.toDate(payment.updatedAt) || new Date(),
            dueDate: payment.dueDate ? this.toDate(payment.dueDate) : undefined
          };
          
          // Explicitly handle paymentDate conversion if it exists
          if (payment.paymentDate) {
            converted.paymentDate = this.toDate(payment.paymentDate);
          }
          
          return converted;
        });
      }
      
      // Handle payment progress
      const paymentProgress = data.paymentProgress || {
        paid: 0,
        pending: data.totalAmount || 0,
        remaining: data.totalAmount || 0
      };
      
      // Handle conversion of Firestore Timestamps to JS Dates
      return {
        id,
        ...otherData,
        submissionDeadline: this.toDate(data.submissionDeadline),
        startDate: this.toDate(data.startDate),
        completionDate: this.toDate(data.completionDate),
        createdAt: this.toDate(data.createdAt) || new Date(),
        updatedAt: this.toDate(data.updatedAt) || new Date(),
        versions,
        paymentSchedule,
        paymentProgress,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
        attachments: Array.isArray(data.attachments) ? data.attachments : (data.attachments ? [data.attachments] : []),
      };
    } catch (err) {
      console.error('Error converting bid from Firestore format:', err, data);
      throw new Error('Failed to process bid data');
    }
  }

  // Convert BidVersion (imported type) to FirestoreBidVersion
  private static convertVersionToFirestoreFormat(version: BidVersion): FirestoreBidVersion {
      const { createdAt, lineItems, ...rest } = version;
      
      // Create clean version object with no undefined values
      const cleanVersion: FirestoreBidVersion = {
          ...this.removeUndefined(rest),
          createdAt: Timestamp.fromDate(createdAt || new Date()),
      };
      
      // Only add lineItems if it's a valid array
      if (Array.isArray(lineItems) && lineItems.length > 0) {
          // Make sure each line item has no undefined values
          cleanVersion.lineItems = lineItems.map(item => this.removeUndefined(item));
      } else {
          cleanVersion.lineItems = [];
      }
      
      return cleanVersion;
  }

  // Convert FirestoreBid to BidSummary
  private static convertToSummary(data: FirestoreBid, id: string): BidSummary {
    return {
      id,
      userId: data.userId,
      projectId: data.projectId,
      projectName: data.projectName,
      subcontractorId: data.subcontractorId,
      subcontractorName: data.subcontractorName,
      title: data.title,
      status: data.status, // Should match the union type
      priority: data.priority, // Should match the union type
      submissionDeadline: data.submissionDeadline ? data.submissionDeadline.toDate() : undefined,
      totalAmount: data.totalAmount,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
}