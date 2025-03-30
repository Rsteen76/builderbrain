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

export interface Project {
  id?: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: Date;
  endDate: Date;
  budget: number;
  clientId: string;
  team: string[];
  location: string;
  projectType: string;
  estimatedDuration: string;
  phases: {
    name: string;
    duration: string;
    description: string;
    dependencies: string[];
  }[];
  keyMilestones: {
    name: string;
    date: string;
    description: string;
  }[];
  requirements: {
    permits: string[];
    inspections: string[];
    documents: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface FirestoreProject extends Omit<Project, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ProjectService {
  private static collection = collection(db, 'projects');

  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const project: FirestoreProject = {
      ...projectData,
      startDate: Timestamp.fromDate(projectData.startDate),
      endDate: Timestamp.fromDate(projectData.endDate),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(this.collection, project);

    return {
      ...projectData,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
  }

  static async updateProject(id: string, projectData: Partial<Project>): Promise<void> {
    const projectRef = doc(this.collection, id);
    const updateData: Partial<FirestoreProject> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Only include fields that are present in projectData
    if (projectData.name) updateData.name = projectData.name;
    if (projectData.description) updateData.description = projectData.description;
    if (projectData.status) updateData.status = projectData.status;
    if (projectData.startDate) updateData.startDate = Timestamp.fromDate(projectData.startDate);
    if (projectData.endDate) updateData.endDate = Timestamp.fromDate(projectData.endDate);
    if (projectData.budget) updateData.budget = projectData.budget;
    if (projectData.clientId) updateData.clientId = projectData.clientId;
    if (projectData.team) updateData.team = projectData.team;
    if (projectData.location) updateData.location = projectData.location;
    if (projectData.projectType) updateData.projectType = projectData.projectType;
    if (projectData.estimatedDuration) updateData.estimatedDuration = projectData.estimatedDuration;
    if (projectData.phases) updateData.phases = projectData.phases;
    if (projectData.keyMilestones) updateData.keyMilestones = projectData.keyMilestones;
    if (projectData.requirements) updateData.requirements = projectData.requirements;

    await updateDoc(projectRef, updateData);
  }

  static async deleteProject(id: string): Promise<void> {
    const projectRef = doc(this.collection, id);
    await deleteDoc(projectRef);
  }

  static async getProject(id: string): Promise<Project | null> {
    const projectRef = doc(this.collection, id);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return null;
    }

    const data = projectDoc.data() as FirestoreProject;
    return {
      ...this.convertFirestoreData(data),
      id: projectDoc.id
    };
  }

  static async getProjects(filters?: {
    status?: Project['status'];
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Project[]> {
    let q = query(this.collection);

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
      return {
        ...this.convertFirestoreData(data),
        id: doc.id
      };
    });
  }

  private static convertFirestoreData(data: FirestoreProject): Project {
    return {
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
} 