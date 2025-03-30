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

// Bid statuses
export type BidStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'awarded'
  | 'rejected'
  | 'expired'
  | 'withdrawn'
  | 'revision_requested'
  | 'revised';

// Priority levels
export type BidPriority = 'low' | 'medium' | 'high' | 'urgent';

// Line item categories
export type LineItemCategory = 
  | 'labor'
  | 'materials'
  | 'equipment'
  | 'subcontractor'
  | 'overhead'
  | 'profit'
  | 'other';

// Line item for detailed cost breakdowns
export interface BidLineItem {
  id: string;
  category: LineItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  notes?: string;
}

// Bid version for tracking revisions
export interface BidVersion {
  id: string;
  versionNumber: number;
  createdAt: Date;
  totalAmount: number;
  notes: string;
  lineItems: BidLineItem[];
  attachments: string[]; // URLs to attachment files
}

// Main Bid interface
export interface Bid {
  id?: string;
  projectId: string;
  projectName: string;
  subcontractorId: string;
  subcontractorName: string;
  title: string;
  scope: string;
  status: BidStatus;
  priority: BidPriority;
  submissionDeadline: Date;
  startDate?: Date | null;
  completionDate?: Date | null;
  totalAmount: number;
  currentVersionId: string;
  versions: BidVersion[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  notes?: string;
  requiresInsurance: boolean;
  requiresBond: boolean;
  isPublic: boolean; // Whether subcontractor can see bid
  isApproved: boolean; // Whether bid has been approved by manager
}

// Interface for Firestore data (with Timestamp instead of Date)
interface FirestoreBid extends Omit<Bid, 'submissionDeadline' | 'startDate' | 'completionDate' | 'createdAt' | 'updatedAt' | 'versions'> {
  submissionDeadline: Timestamp;
  startDate?: Timestamp | null;
  completionDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  versions: Array<Omit<BidVersion, 'createdAt'> & { createdAt: Timestamp }>;
}

// Bid summary for lists
export interface BidSummary {
  id: string;
  projectId: string;
  projectName: string;
  subcontractorId: string;
  subcontractorName: string;
  title: string;
  status: BidStatus;
  priority: BidPriority;
  submissionDeadline: Date;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Filter for querying bids
export interface BidFilter {
  projectId?: string;
  subcontractorId?: string;
  status?: BidStatus | BidStatus[];
  priority?: BidPriority;
  minAmount?: number;
  maxAmount?: number;
  startDateFrom?: Date;
  startDateTo?: Date;
  submissionDeadlineFrom?: Date;
  submissionDeadlineTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  tags?: string[];
  searchTerm?: string;
}

// Sort options
export type BidSortField = 
  | 'submissionDeadline'
  | 'createdAt'
  | 'updatedAt'
  | 'totalAmount'
  | 'priority';

export type SortDirection = 'asc' | 'desc';

export interface BidSort {
  field: BidSortField;
  direction: SortDirection;
}

// Bid service for CRUD operations
export class BidService {
  private static collection = collection(db, 'bids');

  // Generate a new Bid Line Item with default values
  static createLineItem(category: LineItemCategory = 'labor'): BidLineItem {
    return {
      id: uuidv4(),
      category,
      description: '',
      quantity: 1,
      unit: 'hours',
      unitPrice: 0,
      total: 0,
      notes: '',
    };
  }

  // Create a new bid
  static async createBid(bidData: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'>): Promise<Bid> {
    const now = new Date();
    const versionId = uuidv4();

    // Create initial version with empty line items
    const initialVersion: BidVersion = {
      id: versionId,
      versionNumber: 1,
      createdAt: now,
      totalAmount: bidData.totalAmount,
      notes: 'Initial version',
      lineItems: [],
      attachments: [],
    };

    // Create the bid with the initial version
    const newBid: Omit<Bid, 'id'> = {
      ...bidData,
      currentVersionId: versionId,
      versions: [initialVersion],
      createdAt: now,
      updatedAt: now,
    };

    // Convert to Firestore format
    const firestoreBid = this.convertToFirestoreFormat(newBid);
    
    // Add to Firestore
    const docRef = await addDoc(this.collection, firestoreBid);
    
    return {
      ...newBid,
      id: docRef.id,
    };
  }

  // Create a new version of an existing bid
  static async createBidVersion(bidId: string, versionData: Omit<BidVersion, 'id' | 'createdAt'>, updateBid: boolean = true): Promise<BidVersion> {
    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const bid = this.convertFromFirestoreFormat(bidDoc.data() as FirestoreBid, bidId);
    const now = new Date();
    const versionId = uuidv4();
    
    // Create the new version
    const newVersion: BidVersion = {
      ...versionData,
      id: versionId,
      createdAt: now,
    };
    
    // Update the bid with the new version
    const updatedVersions = [...bid.versions, newVersion];
    
    if (updateBid) {
      await updateDoc(bidRef, {
        versions: updatedVersions.map(v => ({
          ...v,
          createdAt: v.createdAt instanceof Date ? Timestamp.fromDate(v.createdAt) : v.createdAt,
        })),
        currentVersionId: versionId,
        totalAmount: newVersion.totalAmount,
        updatedAt: Timestamp.fromDate(now),
      });
    }
    
    return newVersion;
  }

  // Update a bid
  static async updateBid(id: string, bidData: Partial<Bid>): Promise<void> {
    const bidRef = doc(this.collection, id);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Iterate through the updateable fields
    const updatableFields = [
      'title', 'scope', 'status', 'priority', 'submissionDeadline', 
      'startDate', 'completionDate', 'totalAmount', 'currentVersionId',
      'tags', 'updatedBy', 'notes', 'requiresInsurance', 'requiresBond',
      'isPublic', 'isApproved'
    ];

    for (const field of updatableFields) {
      if (field in bidData) {
        const value = bidData[field as keyof typeof bidData];
        
        // Handle undefined values - set to null instead
        if (value === undefined) {
          updateData[field] = null;
          continue;
        }
        
        // Convert Date objects to Firestore Timestamps
        if (value instanceof Date) {
          updateData[field] = Timestamp.fromDate(value);
        } else {
          updateData[field] = value;
        }
      }
    }

    // Update the bid in Firestore
    await updateDoc(bidRef, updateData);
  }

  // Update a line item in the current version
  static async updateLineItem(bidId: string, lineItem: BidLineItem): Promise<void> {
    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const bid = this.convertFromFirestoreFormat(bidDoc.data() as FirestoreBid, bidId);
    const currentVersion = bid.versions.find(v => v.id === bid.currentVersionId);
    
    if (!currentVersion) {
      throw new Error('Current version not found');
    }
    
    // Find and update the line item
    const lineItemIndex = currentVersion.lineItems.findIndex(li => li.id === lineItem.id);
    
    if (lineItemIndex >= 0) {
      // Update existing line item
      currentVersion.lineItems[lineItemIndex] = lineItem;
    } else {
      // Add new line item
      currentVersion.lineItems.push(lineItem);
    }
    
    // Recalculate the total amount
    currentVersion.totalAmount = currentVersion.lineItems.reduce((sum, li) => sum + li.total, 0);
    
    // Update the version in the bid
    const updatedVersions = bid.versions.map(v => 
      v.id === currentVersion.id ? currentVersion : v
    );
    
    await updateDoc(bidRef, {
      versions: updatedVersions.map(v => ({
        ...v,
        createdAt: v.createdAt instanceof Date ? Timestamp.fromDate(v.createdAt) : v.createdAt,
      })),
      totalAmount: currentVersion.totalAmount,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  // Delete a line item from the current version
  static async deleteLineItem(bidId: string, lineItemId: string): Promise<void> {
    const bidRef = doc(this.collection, bidId);
    const bidDoc = await getDoc(bidRef);
    
    if (!bidDoc.exists()) {
      throw new Error(`Bid with ID ${bidId} not found`);
    }
    
    const bid = this.convertFromFirestoreFormat(bidDoc.data() as FirestoreBid, bidId);
    const currentVersion = bid.versions.find(v => v.id === bid.currentVersionId);
    
    if (!currentVersion) {
      throw new Error('Current version not found');
    }
    
    // Remove the line item
    currentVersion.lineItems = currentVersion.lineItems.filter(li => li.id !== lineItemId);
    
    // Recalculate the total amount
    currentVersion.totalAmount = currentVersion.lineItems.reduce((sum, li) => sum + li.total, 0);
    
    // Update the version in the bid
    const updatedVersions = bid.versions.map(v => 
      v.id === currentVersion.id ? currentVersion : v
    );
    
    await updateDoc(bidRef, {
      versions: updatedVersions.map(v => ({
        ...v,
        createdAt: v.createdAt instanceof Date ? Timestamp.fromDate(v.createdAt) : v.createdAt,
      })),
      totalAmount: currentVersion.totalAmount,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  // Delete a bid
  static async deleteBid(id: string): Promise<void> {
    const bidRef = doc(this.collection, id);
    await deleteDoc(bidRef);
  }

  // Get a single bid by ID
  static async getBid(id: string): Promise<Bid | null> {
    const bidRef = doc(this.collection, id);
    const bidDoc = await getDoc(bidRef);

    if (!bidDoc.exists()) {
      return null;
    }

    return this.convertFromFirestoreFormat(bidDoc.data() as FirestoreBid, bidDoc.id);
  }

  // Get bids with filtering, sorting, and pagination
  static async getBids(
    filters?: BidFilter,
    sort?: BidSort,
    pageSize: number = 50,
    startAfterId?: string
  ): Promise<BidSummary[]> {
    let q = query(this.collection);

    // Apply filters
    if (filters) {
      if (filters.projectId) {
        q = query(q, where('projectId', '==', filters.projectId));
      }
      
      if (filters.subcontractorId) {
        q = query(q, where('subcontractorId', '==', filters.subcontractorId));
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          if (filters.status.length === 1) {
            q = query(q, where('status', '==', filters.status[0]));
          } else if (filters.status.length > 1) {
            q = query(q, where('status', 'in', filters.status));
          }
        } else {
          q = query(q, where('status', '==', filters.status));
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
      
      if (filters.tags && filters.tags.length > 0) {
        q = query(q, where('tags', 'array-contains-any', filters.tags));
      }
    }

    // Apply sorting
    if (sort) {
      q = query(q, orderBy(sort.field, sort.direction));
    } else {
      // Default sort by submission deadline (ascending, soonest first)
      q = query(q, orderBy('submissionDeadline', 'asc'));
    }

    // Apply pagination
    if (startAfterId) {
      const startAfterDoc = await getDoc(doc(this.collection, startAfterId));
      if (startAfterDoc.exists()) {
        q = query(q, startAfter(startAfterDoc));
      }
    }
    
    q = query(q, limit(pageSize));

    // Execute the query
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreBid;
      return this.convertToSummary(data, doc.id);
    });
  }

  // Get recent bids for dashboard
  static async getRecentBids(limitCount: number = 5): Promise<BidSummary[]> {
    const q = query(
      this.collection,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreBid;
      return this.convertToSummary(data, doc.id);
    });
  }

  // Get upcoming deadline bids
  static async getUpcomingBids(limitCount: number = 5): Promise<BidSummary[]> {
    const now = new Date();
    const q = query(
      this.collection,
      where('submissionDeadline', '>=', Timestamp.fromDate(now)),
      orderBy('submissionDeadline', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreBid;
      return this.convertToSummary(data, doc.id);
    });
  }

  // Get bids for a subcontractor (that they're allowed to see)
  static async getSubcontractorBids(subcontractorId: string): Promise<BidSummary[]> {
    const q = query(
      this.collection,
      where('subcontractorId', '==', subcontractorId),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreBid;
      return this.convertToSummary(data, doc.id);
    });
  }

  // Helper functions for Firestore data conversion
  private static convertToFirestoreFormat(bid: Omit<Bid, 'id'>): FirestoreBid {
    const {
      submissionDeadline,
      startDate,
      completionDate,
      createdAt,
      updatedAt,
      versions,
      ...rest
    } = bid;

    return {
      ...rest,
      submissionDeadline: Timestamp.fromDate(submissionDeadline),
      startDate: startDate ? Timestamp.fromDate(startDate) : null,
      completionDate: completionDate ? Timestamp.fromDate(completionDate) : null,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(updatedAt),
      versions: versions.map(v => ({
        ...v,
        createdAt: Timestamp.fromDate(v.createdAt),
      })),
    };
  }

  private static convertFromFirestoreFormat(data: FirestoreBid, id: string): Bid {
    const {
      submissionDeadline,
      startDate,
      completionDate,
      createdAt,
      updatedAt,
      versions,
      ...rest
    } = data;

    return {
      ...rest,
      id,
      submissionDeadline: submissionDeadline.toDate(),
      startDate: startDate ? startDate.toDate() : null,
      completionDate: completionDate ? completionDate.toDate() : null,
      createdAt: createdAt.toDate(),
      updatedAt: updatedAt.toDate(),
      versions: versions.map(v => ({
        ...v,
        createdAt: v.createdAt.toDate(),
      })),
    };
  }

  private static convertToSummary(data: FirestoreBid, id: string): BidSummary {
    return {
      id,
      projectId: data.projectId,
      projectName: data.projectName,
      subcontractorId: data.subcontractorId,
      subcontractorName: data.subcontractorName,
      title: data.title,
      status: data.status,
      priority: data.priority,
      submissionDeadline: data.submissionDeadline.toDate(),
      totalAmount: data.totalAmount,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
} 