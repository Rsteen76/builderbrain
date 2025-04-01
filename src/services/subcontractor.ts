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
import { Subcontractor } from '../types';

interface FirestoreSubcontractor extends Omit<Subcontractor, 'id' | 'lastBid' | 'createdAt' | 'updatedAt'> {
  userId: string;
  lastBid?: {
    date: Timestamp;
    amount: number;
    projectId?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class SubcontractorService {
  private static collection = collection(db, 'subcontractors');

  static async createSubcontractor(userId: string, subcontractorData: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Subcontractor> {
    const now = new Date();
    
    const firestoreData: FirestoreSubcontractor = {
      ...subcontractorData,
      userId: userId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      lastBid: subcontractorData.lastBid?.date 
        ? { ...subcontractorData.lastBid, date: Timestamp.fromDate(subcontractorData.lastBid.date) } 
        : undefined,
    };
    
    const docRef = await addDoc(this.collection, firestoreData);

    return {
      ...subcontractorData,
      userId: userId,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
      lastBid: subcontractorData.lastBid?.date 
        ? { ...subcontractorData.lastBid, date: new Date(subcontractorData.lastBid.date) }
        : undefined,
    };
  }

  static async updateSubcontractor(id: string, subcontractorData: Partial<Omit<Subcontractor, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    const subcontractorRef = doc(this.collection, id);
    const { userId, createdAt, ...updatePayload } = subcontractorData as any;
    const firestoreUpdateData: Partial<FirestoreSubcontractor> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    for (const key in updatePayload) {
      if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
        const typedKey = key as keyof typeof updatePayload;
        const value = updatePayload[typedKey];

        if (typedKey === 'lastBid' && value && typeof value === 'object' && 'date' in value && value.date instanceof Date) {
          firestoreUpdateData.lastBid = {
            ...(value as any),
            date: Timestamp.fromDate(value.date),
          };
        } else {
          (firestoreUpdateData as any)[typedKey] = value;
        }
      }
    }

    await updateDoc(subcontractorRef, firestoreUpdateData);
  }

  static async deleteSubcontractor(id: string): Promise<void> {
    const subcontractorRef = doc(this.collection, id);
    await deleteDoc(subcontractorRef);
  }

  static async getSubcontractor(userId: string, id: string): Promise<Subcontractor | null> {
    const subcontractorRef = doc(this.collection, id);
    const subcontractorDoc = await getDoc(subcontractorRef);

    if (!subcontractorDoc.exists()) {
      console.log(`SubcontractorService: Subcontractor ${id} not found.`);
      return null;
    }

    const data = subcontractorDoc.data() as FirestoreSubcontractor;

    if (data.userId !== userId) {
      console.warn(`SubcontractorService: User ${userId} attempted to access unauthorized subcontractor ${id} owned by ${data.userId}.`);
      return null;
    }

    return this.convertFirestoreData(data, subcontractorDoc.id);
  }

  static async getSubcontractors(userId: string, filters?: {
    specialty?: string;
    minRating?: number;
    projectId?: string;
  }): Promise<Subcontractor[]> {
    let q = query(this.collection, where('userId', '==', userId));

    if (filters?.specialty) {
      q = query(q, where('specialty', '==', filters.specialty));
    }

    if (filters?.minRating) {
      q = query(q, where('rating', '>=', filters.minRating));
    }

    if (filters?.projectId) {
      q = query(q, where('projects', 'array-contains', filters.projectId));
    }

    q = query(q, orderBy('name', 'asc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreSubcontractor;
      return this.convertFirestoreData(data, doc.id);
    });
  }

  private static convertFirestoreData(data: FirestoreSubcontractor, id: string): Subcontractor {
    const { lastBid, createdAt, updatedAt, ...restData } = data;
    
    const result: Subcontractor = {
      ...restData,
      id: id,
      userId: data.userId,
      createdAt: createdAt.toDate(),
      updatedAt: updatedAt.toDate(),
      lastBid: lastBid?.date 
        ? { ...lastBid, date: lastBid.date.toDate() } 
        : undefined,
      rating: data.rating ?? 0,
      totalProjects: data.totalProjects ?? 0,
      contact: data.contact ?? {},
      performance: data.performance ?? {},
      companyInfo: data.companyInfo ?? {},
      projects: data.projects ?? [],
      notes: data.notes ?? '',
    };

    return result;
  }
} 