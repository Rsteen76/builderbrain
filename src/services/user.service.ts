import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  where, 
  query, 
  getDocs,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category } from '../types/category.types';
import { logger } from '../utils/logger';

/**
 * User preferences interface with custom categories and settings
 */
interface UserPreferences {
  useNewCategories?: boolean;
  customCategories?: Category[];
  dashboardPreferences?: {
    visibleWidgets: string[];
    widgetLayout: Record<string, { x: number, y: number, w: number, h: number }>;
  };
  defaultProjectId?: string;
  defaultViewMode?: 'list' | 'grid' | 'calendar';
  notificationSettings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    reminderSettings: {
      remindBeforeDueDays: number;
      dailyDigest: boolean;
    };
  };
  lastUpdated?: Date;
}

/**
 * Gets user preferences from Firestore
 * @param userId - User ID
 * @returns User preferences or null if not found
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const userPrefsSnapshot = await getDoc(userPrefsRef);
    
    if (userPrefsSnapshot.exists()) {
      const data = userPrefsSnapshot.data() as UserPreferences & { lastUpdated?: Timestamp };
      
      // Convert Firestore Timestamp to JavaScript Date if present
      return {
        ...data,
        lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : undefined
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    throw error;
  }
};

/**
 * Updates a user preference in Firestore
 * @param userId - User ID
 * @param key - Preference key to update
 * @param value - New preference value
 */
export const updateUserPreference = async <K extends keyof UserPreferences>(
  userId: string, 
  key: K, 
  value: UserPreferences[K]
): Promise<void> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const userPrefsSnapshot = await getDoc(userPrefsRef);
    
    if (userPrefsSnapshot.exists()) {
      // Update existing preferences
      await updateDoc(userPrefsRef, {
        [key]: value,
        lastUpdated: new Date()
      });
    } else {
      // Create new preferences document
      await setDoc(userPrefsRef, {
        [key]: value,
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    logger.error('Error updating user preference:', error);
    throw error;
  }
};

/**
 * Adds a custom category to the user's preferences
 * @param userId - User ID
 * @param category - Custom category to add
 */
export const addCustomCategory = async (userId: string, category: Category): Promise<void> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const userPrefsSnapshot = await getDoc(userPrefsRef);
    
    // Add metadata to category
    const categoryWithMetadata = {
      ...category,
      createdAt: new Date(),
      userId: userId
    };
    
    if (userPrefsSnapshot.exists()) {
      // Get existing custom categories
      const prefs = userPrefsSnapshot.data() as UserPreferences;
      const existingCategories = prefs.customCategories || [];
      
      // Check if category with same ID already exists
      const existingIndex = existingCategories.findIndex(cat => cat.id === category.id);
      
      if (existingIndex !== -1) {
        // Replace existing category
        existingCategories[existingIndex] = categoryWithMetadata;
        await updateDoc(userPrefsRef, {
          customCategories: existingCategories,
          lastUpdated: new Date()
        });
      } else {
        // Add new category
        await updateDoc(userPrefsRef, {
          customCategories: arrayUnion(categoryWithMetadata),
          lastUpdated: new Date()
        });
      }
    } else {
      // Create new preferences document with the custom category
      await setDoc(userPrefsRef, {
        customCategories: [categoryWithMetadata],
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    logger.error('Error adding custom category:', error);
    throw error;
  }
};

/**
 * Removes a custom category from the user's preferences
 * @param userId - User ID
 * @param categoryId - ID of the custom category to remove
 */
export const removeCustomCategory = async (userId: string, categoryId: string): Promise<void> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const userPrefsSnapshot = await getDoc(userPrefsRef);
    
    if (userPrefsSnapshot.exists()) {
      const prefs = userPrefsSnapshot.data() as UserPreferences;
      const customCategories = prefs.customCategories || [];
      
      // Find the category to remove
      const categoryToRemove = customCategories.find(cat => cat.id === categoryId);
      
      if (categoryToRemove) {
        // Remove the category
        await updateDoc(userPrefsRef, {
          customCategories: customCategories.filter(cat => cat.id !== categoryId),
          lastUpdated: new Date()
        });
      }
    }
  } catch (error) {
    logger.error('Error removing custom category:', error);
    throw error;
  }
};

/**
 * Updates a custom category in the user's preferences
 * @param userId - User ID
 * @param categoryId - ID of the custom category to update
 * @param updates - Partial category updates
 */
export const updateCustomCategory = async (
  userId: string, 
  categoryId: string, 
  updates: Partial<Category>
): Promise<void> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const userPrefsSnapshot = await getDoc(userPrefsRef);
    
    if (userPrefsSnapshot.exists()) {
      const prefs = userPrefsSnapshot.data() as UserPreferences;
      const customCategories = prefs.customCategories || [];
      
      // Find the category to update
      const categoryIndex = customCategories.findIndex(cat => cat.id === categoryId);
      
      if (categoryIndex !== -1) {
        // Update the category
        const updatedCategory = {
          ...customCategories[categoryIndex],
          ...updates,
          lastUpdated: new Date()
        };
        
        customCategories[categoryIndex] = updatedCategory;
        
        await updateDoc(userPrefsRef, {
          customCategories: customCategories,
          lastUpdated: new Date()
        });
      }
    }
  } catch (error) {
    logger.error('Error updating custom category:', error);
    throw error;
  }
};

/**
 * Creates default user preferences for a new user
 * @param userId - User ID
 */
export const createDefaultUserPreferences = async (userId: string): Promise<void> => {
  try {
    const userPrefsRef = doc(db, 'userPreferences', userId);
    const userPrefsSnapshot = await getDoc(userPrefsRef);
    
    if (!userPrefsSnapshot.exists()) {
      const defaultPreferences: UserPreferences = {
        useNewCategories: true,
        customCategories: [],
        dashboardPreferences: {
          visibleWidgets: ['recentProjects', 'upcomingDeadlines', 'budgetSummary'],
          widgetLayout: {
            recentProjects: { x: 0, y: 0, w: 6, h: 4 },
            upcomingDeadlines: { x: 6, y: 0, w: 6, h: 4 },
            budgetSummary: { x: 0, y: 4, w: 12, h: 4 }
          }
        },
        defaultViewMode: 'grid',
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          reminderSettings: {
            remindBeforeDueDays: 3,
            dailyDigest: true
          }
        },
        lastUpdated: new Date()
      };
      
      await setDoc(userPrefsRef, defaultPreferences);
    }
  } catch (error) {
    logger.error('Error creating default user preferences:', error);
    throw error;
  }
};