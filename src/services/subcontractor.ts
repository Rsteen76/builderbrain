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
} from 'firebase/firestore';

export interface Subcontractor {
  id?: string;
  name: string;
  specialty: string;
  rating: number;
  totalProjects: number;
  lastBid?: {
    date: Date;
    amount: number;
    projectId?: string;
  };
  contact: {
    phone: string;
    email: string;
    location: string;
  };
  performance: {
    onTime: number;
    quality: number;
    communication: number;
  };
  companyInfo?: {
    website?: string;
    founded?: string;
    employees?: number;
    license?: string;
  };
  projects?: string[]; // Array of project IDs this subcontractor has worked on
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FirestoreSubcontractor extends Omit<Subcontractor, 'lastBid' | 'createdAt' | 'updatedAt'> {
  lastBid?: {
    date: Timestamp;
    amount: number;
    projectId?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface for lastBid to use in type checking
interface LastBid {
  date: Date;
  amount: number;
  projectId?: string;
}

export class SubcontractorService {
  private static collection = collection(db, 'subcontractors');

  static async createSubcontractor(subcontractorData: Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subcontractor> {
    const now = new Date();
    
    // Convert Date objects to Firestore Timestamps
    const firestoreData: any = {
      ...subcontractorData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    // Convert lastBid date if it exists
    if (subcontractorData.lastBid?.date) {
      firestoreData.lastBid = {
        ...subcontractorData.lastBid,
        date: Timestamp.fromDate(subcontractorData.lastBid.date)
      };
    }

    const docRef = await addDoc(this.collection, firestoreData);

    return {
      ...subcontractorData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async updateSubcontractor(id: string, subcontractorData: Partial<Subcontractor>): Promise<void> {
    const subcontractorRef = doc(this.collection, id);
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Copy over each field in subcontractorData to updateData
    Object.entries(subcontractorData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        if (key === 'lastBid' && value && typeof value === 'object' && 'date' in value) {
          // Handle nested lastBid with date conversion
          const lastBid = value as LastBid;
          updateData.lastBid = {
            ...lastBid,
            date: lastBid.date ? Timestamp.fromDate(lastBid.date) : null,
          };
        } else {
          updateData[key] = value;
        }
      }
    });

    await updateDoc(subcontractorRef, updateData);
  }

  static async deleteSubcontractor(id: string): Promise<void> {
    const subcontractorRef = doc(this.collection, id);
    await deleteDoc(subcontractorRef);
  }

  static async getSubcontractor(id: string): Promise<Subcontractor | null> {
    const subcontractorRef = doc(this.collection, id);
    const subcontractorDoc = await getDoc(subcontractorRef);

    if (!subcontractorDoc.exists()) {
      return null;
    }

    const data = subcontractorDoc.data() as FirestoreSubcontractor;
    return this.convertFirestoreData(data, subcontractorDoc.id);
  }

  static async getSubcontractors(filters?: {
    specialty?: string;
    minRating?: number;
    projectId?: string;
  }): Promise<Subcontractor[]> {
    let q = query(this.collection);

    if (filters?.specialty) {
      q = query(q, where('specialty', '==', filters.specialty));
    }

    if (filters?.minRating) {
      q = query(q, where('rating', '>=', filters.minRating));
    }

    if (filters?.projectId) {
      q = query(q, where('projects', 'array-contains', filters.projectId));
    }

    q = query(q, orderBy('rating', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreSubcontractor;
      return this.convertFirestoreData(data, doc.id);
    });
  }

  private static convertFirestoreData(data: FirestoreSubcontractor, id?: string): Subcontractor {
    // Create a new object without the Firestore timestamp fields
    const { lastBid, createdAt, updatedAt, ...restData } = data;
    
    // Build the result object with converted Date fields
    const result: Partial<Subcontractor> = {
      ...restData,
      createdAt: createdAt.toDate(),
      updatedAt: updatedAt.toDate(),
    };

    // Then handle the lastBid conversion if it exists
    if (lastBid?.date) {
      result.lastBid = {
        amount: lastBid.amount,
        date: lastBid.date.toDate(),
        projectId: lastBid.projectId,
      };
    }

    // Add the ID if provided
    if (id) {
      result.id = id;
    }

    return result as Subcontractor;
  }
} 