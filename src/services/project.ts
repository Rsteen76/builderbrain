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
  DocumentData,
} from 'firebase/firestore';
import { Project, LineItem, Bid, Task } from '../types';

interface FirestoreProject extends Omit<Project, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'budget' | 'location' | 'lineItems' | 'bids' | 'tasks'> {
  userId: string;
  startDate: Timestamp;
  endDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  budget: number;
  location: string;
  lineItems?: LineItem[];
  bids?: Bid[];
  tasks?: Task[];
}

export class ProjectService {
  private static collection = collection(db, 'projects');

  static async createProject(userId: string, projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    
    const budgetValue = typeof projectData.budget === 'object' && projectData.budget !== null 
                        ? projectData.budget.total 
                        : typeof projectData.budget === 'number' ? projectData.budget : 0;
    const locationValue = typeof projectData.location === 'object' && projectData.location !== null
                          ? `${projectData.location.address}, ${projectData.location.city}`
                          : typeof projectData.location === 'string' ? projectData.location : '';

    const projectToSave: Omit<FirestoreProject, 'lineItems' | 'bids' | 'tasks'> = {
      ...projectData,
      userId: userId,
      budget: budgetValue,
      location: locationValue,
      startDate: Timestamp.fromDate(projectData.startDate || new Date()),
      endDate: projectData.endDate ? Timestamp.fromDate(projectData.endDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(this.collection, projectToSave);

    return {
      ...projectData,
      id: docRef.id,
      userId: userId,
      createdAt: now,
      updatedAt: now,
      budget: typeof projectData.budget === 'number' 
              ? { total: projectData.budget, spent: 0, remaining: projectData.budget } 
              : projectData.budget,
      location: typeof projectData.location === 'string' 
                ? { address: projectData.location, city: '', state: '', zipCode: '' } 
                : projectData.location,
    } as Project;
  }

  static async updateProject(id: string, projectData: Partial<Omit<Project, 'id' | 'userId'>>): Promise<void> {
    const projectRef = doc(this.collection, id);
    const { userId, createdAt, updatedAt, ...updatePayload } = projectData as any;

    const firestoreUpdateData: Partial<FirestoreProject> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    for (const key in updatePayload) {
      if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
        const typedKey = key as keyof typeof updatePayload;
        const value = updatePayload[typedKey];

        if (typedKey === 'startDate' && value instanceof Date) {
          firestoreUpdateData.startDate = Timestamp.fromDate(value);
        } else if (typedKey === 'endDate' && value instanceof Date) {
          firestoreUpdateData.endDate = Timestamp.fromDate(value);
        } else if (typedKey === 'endDate' && value === null) {
          firestoreUpdateData.endDate = null;
        } else if (typedKey === 'budget') {
          firestoreUpdateData.budget = typeof value === 'object' && value !== null 
                                      ? (value as any).total
                                      : typeof value === 'number' ? value : 0;
        } else if (typedKey === 'location') {
            firestoreUpdateData.location = typeof value === 'object' && value !== null
                                        ? `${(value as any).address}, ${(value as any).city}`
                                        : typeof value === 'string' ? value : '';
        } else {
           (firestoreUpdateData as any)[typedKey] = value;
        }
      }
    }

    await updateDoc(projectRef, firestoreUpdateData);
  }

  static async deleteProject(id: string): Promise<void> {
    const projectRef = doc(this.collection, id);
    await deleteDoc(projectRef);
  }

  static async getProject(userId: string, id: string): Promise<Project | null> {
    const projectRef = doc(this.collection, id);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      console.log(`ProjectService: Project ${id} not found.`);
      return null;
    }

    const data = projectDoc.data() as FirestoreProject;

    if (data.userId !== userId) {
      console.warn(`ProjectService: User ${userId} attempted to access unauthorized project ${id} owned by ${data.userId}.`);
      return null;
    }

    return this.convertFirestoreData(data, id);
  }

  static async getProjects(userId: string, filters?: {
    status?: Project['status'];
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Project[]> {
    let q = query(this.collection, where('userId', '==', userId));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters?.clientId) {
      q = query(q, where('clientId', '==', filters.clientId));
    }

    if (filters?.startDate) {
      q = query(q, where('startDate', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters?.endDate) {
      q = query(q, where('endDate', '<=', Timestamp.fromDate(filters.endDate)));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreProject;
      return this.convertFirestoreData(data, doc.id);
    });
  }

  private static convertFirestoreData(data: FirestoreProject, id: string): Project {
    const project: Project = {
      ...data,
      id: id,
      userId: data.userId,
      startDate: data.startDate.toDate(),
      endDate: data.endDate ? data.endDate.toDate() : null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      budget: { 
          total: data.budget || 0, 
          spent: 0,
          remaining: data.budget || 0 
      }, 
      location: { 
          address: data.location || '',
          city: '', 
          state: '', 
          zipCode: '' 
      }, 
      lineItems: data.lineItems || [],
      bids: data.bids || [],
      tasks: data.tasks || [],
      team: data.team || [],
      phases: data.phases || [],
      keyMilestones: data.keyMilestones || [],
      requirements: data.requirements || { permits: [], inspections: [], documents: [] },
    };
    return project;
  }
} 