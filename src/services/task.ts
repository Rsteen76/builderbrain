import { db } from '../config/firebase';
import { isDevAuthBypassEnabled } from '../config/devMode';
import {
  createDevTask,
  deleteDevTask,
  getDevTask,
  listDevTasks,
  updateDevTask,
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
} from 'firebase/firestore';

// Import Task, TaskPriority, TaskStatus from the central types file
import { Task, /*TaskPriority, TaskStatus*/ } from '../types'; // Assuming Priority/Status are string unions in types/index.ts
import { logger } from '../utils/logger';

// Interface for Firestore data (handles Timestamps and userId)
interface FirestoreTask extends Omit<Task, 'id' | 'dueDate' | 'createdAt' | 'updatedAt' | 'completedAt'> {
  userId: string;
  dueDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp | null; // Add if present in imported Task type
}

// --- Task Service ---
export class TaskService {
  private static collectionRef = collection(db, 'tasks');

  // --- Convert Firestore data to IMPORTED Task type ---
  private static convertFirestoreData(docData: FirestoreTask, id: string): Task {
    return {
      ...docData, 
      id,
      userId: docData.userId, // Ensure userId is mapped
      dueDate: docData.dueDate ? docData.dueDate.toDate() : null,
      createdAt: docData.createdAt.toDate(),
      updatedAt: docData.updatedAt.toDate(),
      completedAt: docData.completedAt ? docData.completedAt.toDate() : null, 
      // Ensure all fields from imported Task type are present
      dependencies: docData.dependencies || [], 
      attachments: docData.attachments || [],
      description: docData.description || '', // Add defaults for potentially missing optional fields
      status: docData.status || 'todo', // Default status
      priority: docData.priority || 'medium', // Default priority
      assigneeType: docData.assigneeType,
      assigneeId: docData.assigneeId,
      parentTaskId: docData.parentTaskId,
      createdBy: docData.createdBy,
    } as Task; // Use assertion carefully
  }

  // --- Create Task (Uses imported Task type) ---
  static async createTask(userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (isDevAuthBypassEnabled) {
      return createDevTask(userId, taskData);
    }

    const now = new Date();
    const firestoreData: FirestoreTask = {
      ...taskData,
      userId: userId,
      dueDate: taskData.dueDate ? Timestamp.fromDate(taskData.dueDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      completedAt: taskData.completedAt ? Timestamp.fromDate(taskData.completedAt) : null,
    };
    const docRef = await addDoc(this.collectionRef, firestoreData);
    
    // Return data matching imported Task type
    return {
        ...taskData,
        id: docRef.id,
        userId: userId,
        createdAt: now, 
        updatedAt: now, 
        dueDate: taskData.dueDate || null,
        completedAt: taskData.completedAt || null,
    };
  }

  // --- Get Task by ID (Returns imported Task type) ---
  static async getTask(userId: string, id: string): Promise<Task | null> {
    if (isDevAuthBypassEnabled) {
      return getDevTask(userId, id);
    }

    const docRef = doc(this.collectionRef, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      logger.debug('TaskService: task not found', { id });
      return null;
    }

    const data = docSnap.data() as FirestoreTask;

    // *** Crucial Check ***
    if (data.userId !== userId) {
      logger.warn('TaskService: unauthorized task access attempt', {
        requestedUserId: userId,
        taskId: id,
        ownerUserId: data.userId,
      });
      return null; // Or throw an error
    }

    return this.convertFirestoreData(data, docSnap.id);
  }

  // --- Get Tasks (Filters use imported Task type fields) ---
  static async getTasks(userId: string, filters?: {
    projectId?: string;
    status?: Task['status']; // Use string union from imported type
    assigneeId?: string;
    priority?: Task['priority']; // Use string union from imported type
    sortBy?: keyof Omit<Task, 'id'>; // Sort by fields excluding id
    sortDirection?: 'asc' | 'desc';
  }): Promise<Task[]> {
    if (isDevAuthBypassEnabled) {
      return listDevTasks(userId, filters);
    }

    // Start query with the mandatory userId filter
    let q = query(this.collectionRef, where('userId', '==', userId));

    // Apply other filters
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
    // Add more filters as needed

    // Apply sorting
    const sortBy = filters?.sortBy ? String(filters.sortBy) : 'createdAt'; // Convert symbol to string if needed
    const sortDirection = filters?.sortDirection || 'desc';
    q = query(q, orderBy(sortBy, sortDirection));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => this.convertFirestoreData(doc.data() as FirestoreTask, doc.id));
  }

  // --- Update Task (Input uses imported Task type) ---
  static async updateTask(id: string, taskData: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'projectId'>>): Promise<void> {
    if (isDevAuthBypassEnabled) {
      updateDevTask(id, taskData as Partial<Task>);
      return;
    }

    const docRef = doc(this.collectionRef, id);
    // Exclude fields not allowed in update
    const { userId, projectId, createdAt, updatedAt, ...updatePayload } = taskData as any; // Also exclude updatedAt

    const firestoreUpdateData: { [key: string]: any } = {
         ...updatePayload, 
         updatedAt: Timestamp.fromDate(new Date())
     };

    // Convert dates back to Timestamps
    if (updatePayload.dueDate !== undefined) {
        firestoreUpdateData.dueDate = updatePayload.dueDate ? Timestamp.fromDate(updatePayload.dueDate) : null;
    }
    if (updatePayload.completedAt !== undefined) {
        firestoreUpdateData.completedAt = updatePayload.completedAt ? Timestamp.fromDate(updatePayload.completedAt) : null;
    }

    // Security rules should enforce ownership and projectId immutability
    await updateDoc(docRef, firestoreUpdateData);
  }

  // --- Delete Task ---
  // Rely on security rules to enforce ownership.
  static async deleteTask(id: string): Promise<void> {
    if (isDevAuthBypassEnabled) {
      deleteDevTask(id);
      return;
    }

    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
  }
} 
