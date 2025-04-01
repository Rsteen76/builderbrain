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
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
// Import necessary types from central types file
import { 
    Bid, 
    BidVersion, 
    LineItem,
} from '../types';

// Define Firestore-specific Bid type extending the main Bid type
// Handles Timestamps and ensures userId is present
interface FirestoreBid extends Omit<Bid, 'id' | 'submissionDeadline' | 'startDate' | 'completionDate' | 'createdAt' | 'updatedAt' | 'versions'> {
  userId: string;
  submissionDeadline?: Timestamp; // Match Bid type (optional)
  startDate?: Timestamp | null;
  completionDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Firestore representation of versions might use Timestamps
  versions?: FirestoreBidVersion[]; // Use FirestoreBidVersion here
}

// Define Firestore-specific BidVersion type
interface FirestoreBidVersion extends Omit<BidVersion, 'createdAt' | 'lineItems'> {
    createdAt: Timestamp;
    lineItems?: LineItem[]; // Use LineItem here
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

    // Create initial version (matches imported BidVersion type)
    const initialVersion: BidVersion = {
      id: versionId,
      versionNumber: 1,
      createdAt: now,
      totalAmount: bidData.totalAmount,
      notes: 'Initial version',
      lineItems: [], // Matches LineItem[]
      attachments: bidData.attachments ? 
        bidData.attachments.map(att => typeof att === 'string' ? 
          att : 
          att.url) : [], // Convert complex attachments to string URLs
    };

    // Create the bid object (matches imported Bid type, before Firestore conversion)
    const newBid: Omit<Bid, 'id'> = {
      ...bidData,
      userId: userId,
      currentVersionId: versionId,
      versions: [initialVersion], 
      createdAt: now,
      updatedAt: now,
    };

    const firestoreBid = this.convertToFirestoreFormat(newBid);
    const docRef = await addDoc(this.collection, firestoreBid);
    
    // Return the created bid matching the imported Bid type
    return {
      ...newBid,
      id: docRef.id,
    };
  }

  // Create new version (Input/Output uses imported BidVersion type)
  static async createBidVersion(userId: string, bidId: string, versionData: Omit<BidVersion, 'id' | 'createdAt'>, updateBid: boolean = true): Promise<BidVersion> {
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
    const now = new Date();
    const versionId = uuidv4();
    
    const newVersion: BidVersion = {
      ...versionData,
      id: versionId,
      createdAt: now,
      lineItems: versionData.lineItems || [], // Ensure lineItems is array
    };
    
    const updatedVersions = [...(bid.versions || []), newVersion];
    
    if (updateBid) {
      const firestoreVersions = updatedVersions.map(v => this.convertVersionToFirestoreFormat(v));
      
      await updateDoc(bidRef, {
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
    // Security rules check ownership
    
    const updatePayload = { ...bidData }; 
    const firestoreUpdateData: Partial<FirestoreBid> = {
        updatedAt: Timestamp.fromDate(new Date()),
    };

    // Convert specific fields
    if (updatePayload.submissionDeadline !== undefined) firestoreUpdateData.submissionDeadline = updatePayload.submissionDeadline ? Timestamp.fromDate(updatePayload.submissionDeadline) : undefined;
    if (updatePayload.startDate !== undefined) firestoreUpdateData.startDate = updatePayload.startDate ? Timestamp.fromDate(updatePayload.startDate) : null;
    if (updatePayload.completionDate !== undefined) firestoreUpdateData.completionDate = updatePayload.completionDate ? Timestamp.fromDate(updatePayload.completionDate) : null;
    
    // Copy other allowed fields, ensure types match FirestoreBid
    if (updatePayload.status !== undefined) firestoreUpdateData.status = updatePayload.status;
    if (updatePayload.priority !== undefined) firestoreUpdateData.priority = updatePayload.priority;
    if (updatePayload.totalAmount !== undefined) firestoreUpdateData.totalAmount = updatePayload.totalAmount;
    if (updatePayload.projectName !== undefined) firestoreUpdateData.projectName = updatePayload.projectName;
    if (updatePayload.subcontractorId !== undefined) firestoreUpdateData.subcontractorId = updatePayload.subcontractorId;
    if (updatePayload.subcontractorName !== undefined) firestoreUpdateData.subcontractorName = updatePayload.subcontractorName;
    if (updatePayload.title !== undefined) firestoreUpdateData.title = updatePayload.title;
    if (updatePayload.scope !== undefined) firestoreUpdateData.scope = updatePayload.scope;
    if (updatePayload.tags !== undefined) firestoreUpdateData.tags = updatePayload.tags;
    if (updatePayload.updatedBy !== undefined) firestoreUpdateData.updatedBy = updatePayload.updatedBy;
    if (updatePayload.notes !== undefined) firestoreUpdateData.notes = updatePayload.notes;
    if (updatePayload.requiresInsurance !== undefined) firestoreUpdateData.requiresInsurance = updatePayload.requiresInsurance;
    if (updatePayload.requiresBond !== undefined) firestoreUpdateData.requiresBond = updatePayload.requiresBond;
    if (updatePayload.isPublic !== undefined) firestoreUpdateData.isPublic = updatePayload.isPublic;
    if (updatePayload.isApproved !== undefined) firestoreUpdateData.isApproved = updatePayload.isApproved;
    // Do NOT allow updating versions or currentVersionId directly here

    await updateDoc(bidRef, firestoreUpdateData);
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

  // Get bid (Returns imported Bid type)
  static async getBid(userId: string, id: string): Promise<Bid | null> {
    const bidRef = doc(this.collection, id);
    const bidDoc = await getDoc(bidRef);

    if (!bidDoc.exists()) {
      console.log(`BidService: Bid ${id} not found.`);
      return null;
    }

    const data = bidDoc.data() as FirestoreBid;

    if (data.userId !== userId) {
      console.warn(`BidService: User ${userId} attempted to access unauthorized bid ${id} owned by ${data.userId}.`);
      return null;
    }

    return this.convertFromFirestoreFormat(data, id);
  }

  // Get bids (Returns BidSummary[], accepts BidFilter and BidSort)
  static async getBids(
    userId: string,
    filters?: BidFilter,
    sort?: BidSort,
    pageSize: number = 50,
    startAfterId?: string // Changed from startAfterDoc for simplicity
  ): Promise<BidSummary[]> {
    let q = query(this.collection, where('userId', '==', userId));

    // Apply filters (using the local BidFilter type)
    if (filters) {
      if (filters.projectId) {
        q = query(q, where('projectId', '==', filters.projectId));
      }
      if (filters.subcontractorId) {
        q = query(q, where('subcontractorId', '==', filters.subcontractorId));
      }
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        // Firestore 'in' query supports up to 10 items
        if (statuses.length > 0 && statuses.length <= 10) {
           q = query(q, where('status', 'in', statuses));
         } else if (statuses.length === 1) {
            q = query(q, where('status', '==', statuses[0]));
         }
      }
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters.minAmount !== undefined) {
        q = query(q, where('totalAmount', '>=', filters.minAmount));
      }
      if (filters.maxAmount !== undefined) {
        q = query(q, where('totalAmount', '<=', filters.maxAmount));
      }
      if (filters.submissionDeadlineFrom) {
        q = query(q, where('submissionDeadline', '>=', Timestamp.fromDate(filters.submissionDeadlineFrom)));
      }
      if (filters.submissionDeadlineTo) {
        q = query(q, where('submissionDeadline', '<=', Timestamp.fromDate(filters.submissionDeadlineTo)));
      }
      if (filters.createdFrom) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.createdFrom)));
      }
      if (filters.createdTo) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.createdTo)));
      }
      if (filters.tags && filters.tags.length > 0 && filters.tags.length <= 10) {
        q = query(q, where('tags', 'array-contains-any', filters.tags));
      }
    }

    // Apply sorting (using the local BidSort type)
    const sortField = sort?.field || 'submissionDeadline'; // Default sort
    const sortDirection = sort?.direction || 'asc';
    q = query(q, orderBy(sortField, sortDirection));
    

    // Apply pagination
    if (startAfterId) {
      const startAfterDoc = await getDoc(doc(this.collection, startAfterId));
      if (startAfterDoc.exists()) {
        q = query(q, startAfter(startAfterDoc));
      }
    }
    
    q = query(q, limit(pageSize));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertToSummary(doc.data() as FirestoreBid, doc.id));
  }

  // Get recent bids (Returns BidSummary[])
  static async getRecentBids(userId: string, limitCount: number = 5): Promise<BidSummary[]> {
    const q = query(
      this.collection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertToSummary(doc.data() as FirestoreBid, doc.id));
  }

  // Get upcoming bids (Returns BidSummary[])
  static async getUpcomingBids(userId: string, limitCount: number = 5): Promise<BidSummary[]> {
    const now = Timestamp.now();
    const q = query(
      this.collection,
      where('userId', '==', userId),
      where('submissionDeadline', '>=', now),
      orderBy('submissionDeadline', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertToSummary(doc.data() as FirestoreBid, doc.id));
  }

  // Get subcontractor bids (Returns BidSummary[])
  static async getSubcontractorBids(userId: string, subcontractorId: string): Promise<BidSummary[]> {
    const q = query(
      this.collection,
      where('userId', '==', userId),
      where('subcontractorId', '==', subcontractorId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertToSummary(doc.data() as FirestoreBid, doc.id));
  }

  // --- Helper Functions --- 

  // Convert Bid (imported type) to FirestoreBid
  private static convertToFirestoreFormat(bid: Omit<Bid, 'id'>): FirestoreBid {
      const { versions, createdAt, updatedAt, submissionDeadline, startDate, completionDate, ...rest } = bid;
      return {
          ...rest, // Includes userId, etc.
          submissionDeadline: submissionDeadline ? Timestamp.fromDate(submissionDeadline) : undefined,
          startDate: startDate ? Timestamp.fromDate(startDate) : null,
          completionDate: completionDate ? Timestamp.fromDate(completionDate) : null,
          createdAt: Timestamp.fromDate(createdAt || new Date()),
          updatedAt: Timestamp.fromDate(updatedAt || new Date()),
          versions: versions ? versions.map(v => this.convertVersionToFirestoreFormat(v)) : [],
      };
  }

  // Convert FirestoreBid to Bid (imported type)
  private static convertFromFirestoreFormat(data: FirestoreBid, id: string): Bid {
    const { versions, createdAt, updatedAt, submissionDeadline, startDate, completionDate, attachments, ...rest } = data;
    return {
      ...rest, // Includes userId etc.
      id,
      submissionDeadline: submissionDeadline ? submissionDeadline.toDate() : undefined,
      startDate: startDate ? startDate.toDate() : null,
      completionDate: completionDate ? completionDate.toDate() : null,
      createdAt: createdAt.toDate(),
      updatedAt: updatedAt.toDate(),
      versions: versions ? versions.map(v => this.convertVersionFromFirestoreFormat(v)) : [],
      // Ensure optional fields are handled if not present in FirestoreBid
      attachments: attachments || [],
      tags: data.tags || [],
    } as Bid; // Use assertion carefully
  }

  // Convert BidVersion (imported type) to FirestoreBidVersion
  private static convertVersionToFirestoreFormat(version: BidVersion): FirestoreBidVersion {
      const { createdAt, lineItems, ...rest } = version;
      return {
          ...rest,
          createdAt: Timestamp.fromDate(createdAt || new Date()),
          lineItems: lineItems || [], // Ensure lineItems array exists
      };
  }

  // Convert FirestoreBidVersion to BidVersion (imported type)
  private static convertVersionFromFirestoreFormat(firestoreVersion: FirestoreBidVersion): BidVersion {
      const { createdAt, lineItems, attachments, ...rest } = firestoreVersion;
      return {
          ...rest,
          createdAt: createdAt.toDate(),
          lineItems: lineItems || [], // Ensure lineItems array exists
          attachments: attachments || [], // Ensure attachments exist
      };
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