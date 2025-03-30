import { db, auth } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// Define user roles
export type UserRole = 'admin' | 'project_manager' | 'team_member' | 'client';

export interface User {
  id: string; // This will be the Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  jobTitle?: string;
  phone?: string;
  companyName?: string;
  projects?: string[]; // Array of project IDs
  createdAt: Date;
  updatedAt: Date;
}

interface FirestoreUser extends Omit<User, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class UserService {
  private static collection = collection(db, 'users');

  /**
   * Create a user document in Firestore after user signs up
   */
  static async createUser(user: FirebaseUser, additionalData?: Partial<User>): Promise<User> {
    const now = new Date();
    
    const userData: FirestoreUser = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || undefined,
      role: 'team_member', // Default role
      ...(additionalData || {}),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    // Using setDoc with user UID as the document ID to ensure consistency
    const userRef = doc(this.collection, user.uid);
    await setDoc(userRef, userData);

    return {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update an existing user's data
   */
  static async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(this.collection, userId);
    const updateData: Partial<FirestoreUser> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Only include fields that are present in userData
    if (userData.displayName) updateData.displayName = userData.displayName;
    if (userData.photoURL) updateData.photoURL = userData.photoURL;
    if (userData.role) updateData.role = userData.role;
    if (userData.jobTitle) updateData.jobTitle = userData.jobTitle;
    if (userData.phone) updateData.phone = userData.phone;
    if (userData.companyName) updateData.companyName = userData.companyName;
    if (userData.projects) updateData.projects = userData.projects;

    await updateDoc(userRef, updateData);
  }

  /**
   * Get a user by their ID
   */
  static async getUser(userId: string): Promise<User | null> {
    const userRef = doc(this.collection, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data() as FirestoreUser;
    return this.convertFirestoreData(data);
  }

  /**
   * Get current authenticated user's data
   */
  static async getCurrentUser(): Promise<User | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    return this.getUser(currentUser.uid);
  }

  /**
   * Get users with optional filtering
   */
  static async getUsers(filters?: {
    role?: UserRole;
    companyName?: string;
    projectId?: string;
  }): Promise<User[]> {
    let q = query(this.collection);

    if (filters?.role) {
      q = query(q, where('role', '==', filters.role));
    }

    if (filters?.companyName) {
      q = query(q, where('companyName', '==', filters.companyName));
    }

    if (filters?.projectId) {
      q = query(q, where('projects', 'array-contains', filters.projectId));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreUser;
      return this.convertFirestoreData(data);
    });
  }

  /**
   * Convert Firestore document data to User object
   */
  private static convertFirestoreData(data: FirestoreUser): User {
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }
} 