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

// --- Task Interface ---
export type TaskStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id?: string;
  projectId: string; // Link to Project
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeType?: 'user' | 'subcontractor'; // Type of assignee
  assigneeId?: string; // User ID or Subcontractor ID
  dueDate?: Date | null; // Allow null for no due date
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Firestore data (handles Timestamps)
interface FirestoreTask extends Omit<Task, 'dueDate' | 'createdAt' | 'updatedAt'> {
  dueDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- Task Service ---
export class TaskService {
  private static collectionRef = collection(db, 'tasks');

  // --- Convert Firestore data to Task ---
  private static convertFirestoreData(docData: DocumentData, id: string): Task {
    const data = docData as FirestoreTask;
    return {
      ...data,
      id,
      // Convert Timestamps back to Dates
      dueDate: data.dueDate ? data.dueDate.toDate() : null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }

  // --- Create Task ---
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date();
    const firestoreData: FirestoreTask = {
      ...taskData,
      dueDate: taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    const docRef = await addDoc(this.collectionRef, firestoreData);
    // Fetch the created doc to ensure data consistency including generated ID
    const newTask = await this.getTask(docRef.id);
    if (!newTask) throw new Error("Failed to retrieve created task.");
    return newTask;
  }

  // --- Get Task by ID ---
  static async getTask(id: string): Promise<Task | null> {
    const docRef = doc(this.collectionRef, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return this.convertFirestoreData(docSnap.data(), docSnap.id);
  }

  // --- Get Tasks (with Filters) ---
  static async getTasks(filters?: {
    projectId?: string;
    status?: TaskStatus;
    assigneeId?: string;
    priority?: TaskPriority;
    sortBy?: keyof Task;
    sortDirection?: 'asc' | 'desc';
  }): Promise<Task[]> {
    let q = query(this.collectionRef);

    // Apply filters
    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.assigneeId) {
      q = query(q, where('assigneeId', '==', filters.assigneeId));
    }
     if (filters?.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    // Add more filters as needed (e.g., date ranges)

    // Apply sorting
    // Handle potential sorting by ID if needed, otherwise default to createdAt
    const sortBy = filters?.sortBy && filters.sortBy !== 'id' ? filters.sortBy : 'createdAt';
    const sortDirection = filters?.sortDirection || 'desc';
    // Firestore cannot order by ID directly reliably with other filters/sorts
    // If sorting by ID is critical, it might need client-side sorting after fetch
    q = query(q, orderBy(sortBy, sortDirection)); 

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertFirestoreData(doc.data(), doc.id));
  }

  // --- Update Task ---
  // Note: Does not allow changing projectId
  static async updateTask(id: string, taskData: Partial<Omit<Task, 'id' | 'createdAt' | 'projectId'>>): Promise<void> { 
    const docRef = doc(this.collectionRef, id);
    const updatePayload: { [key: string]: any } = { ...taskData }; 
    
    updatePayload.updatedAt = Timestamp.fromDate(new Date());

    if (taskData.dueDate !== undefined) {
        updatePayload.dueDate = taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null;
    }
    
    // Explicitly handle assigneeType if it's part of the update
    if (taskData.assigneeType !== undefined) {
        updatePayload.assigneeType = taskData.assigneeType;
    } else if (taskData.assigneeId === undefined || taskData.assigneeId === '') {
         // If assigneeId is being cleared, also clear assigneeType
         updatePayload.assigneeType = null; 
    }
    // If assigneeId is set but type isn't, the form logic should handle setting both

    await updateDoc(docRef, updatePayload);
  }

  // --- Delete Task ---
  static async deleteTask(id: string): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }
} 