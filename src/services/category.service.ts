import { collection, doc, getDoc, getDocs, query, setDoc, addDoc, updateDoc, where, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category, CategoryMapping } from '../types/category.types';
import { getAllCategories } from '../data/hierarchicalCategories';
import { DEFAULT_CATEGORY_MAPPINGS } from '../utils/categoryMappingUtils';

// Collection references
const CATEGORIES_COLLECTION = 'categories';
const CATEGORY_MAPPINGS_COLLECTION = 'categoryMappings';

/**
 * Initialize the categories collection with the default categories
 * This should only be run once during app setup
 */
export const initializeCategories = async (): Promise<void> => {
  // Check if categories already exist
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const categoriesSnapshot = await getDocs(categoriesRef);
  
  if (!categoriesSnapshot.empty) {
    console.log('Categories already initialized.');
    return;
  }
  
  // Get all categories from the default data
  const allCategories = getAllCategories();
  
  // Add each category to Firestore
  const batch = writeBatch(db);
  
  allCategories.forEach(category => {
    const categoryRef = doc(categoriesRef, category.id);
    batch.set(categoryRef, {
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  console.log('Categories initialized successfully.');
};

/**
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const categoriesSnapshot = await getDocs(categoriesRef);
  
  if (categoriesSnapshot.empty) {
    // If no categories in DB yet, return the default ones
    return getAllCategories();
  }
  
  return categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

/**
 * Get main categories only (first level)
 */
export const getMainCategories = async (): Promise<Category[]> => {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const mainCategoriesQuery = query(categoriesRef, where('level', '==', 'main'));
  const categoriesSnapshot = await getDocs(mainCategoriesQuery);
  
  return categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

/**
 * Get subcategories for a specific main category
 */
export const getSubcategoriesForParent = async (parentId: string): Promise<Category[]> => {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const subcategoriesQuery = query(
    categoriesRef, 
    where('parentId', '==', parentId),
    where('level', '==', 'sub')
  );
  const categoriesSnapshot = await getDocs(subcategoriesQuery);
  
  return categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

/**
 * Add a category mapping for an expense item
 */
export const addCategoryMapping = async (
  itemId: string,
  originalCategory: string,
  newCategoryId: string,
  projectId: string,
  userId?: string,
  autoAssigned: boolean = false
): Promise<string> => {
  const mappingsRef = collection(db, CATEGORY_MAPPINGS_COLLECTION);
  
  // Use the current user ID from context/auth if not provided
  const effectiveUserId = userId || 'current-user';
  
  // Check if mapping already exists
  const existingQuery = query(
    mappingsRef,
    where('itemId', '==', itemId)
  );
  
  try {
    const existingMappings = await getDocs(existingQuery);
    
    if (!existingMappings.empty) {
      // Update existing mapping
      const docRef = existingMappings.docs[0].ref;
      await updateDoc(docRef, {
        categoryId: newCategoryId,
        autoAssigned,
        updatedAt: new Date()
      });
      return existingMappings.docs[0].id;
    }
    
    // Create new mapping
    const newMapping: Omit<CategoryMapping, 'id'> = {
      itemId,
      categoryId: newCategoryId,
      projectId,
      userId: effectiveUserId,
      autoAssigned,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(mappingsRef, newMapping);
    return docRef.id;
  } catch (error) {
    console.error("Error in addCategoryMapping:", error);
    // Return a string to avoid breaking the caller
    return '';
  }
};

/**
 * Get the category for an item
 */
export const getCategoryForItem = async (
  itemId: string
): Promise<{ categoryId: string, category: Category | null, isAutoAssigned: boolean }> => {
  const mappingsRef = collection(db, CATEGORY_MAPPINGS_COLLECTION);
  const mappingQuery = query(mappingsRef, where('itemId', '==', itemId));
  const mappingSnapshot = await getDocs(mappingQuery);
  
  if (mappingSnapshot.empty) {
    return { categoryId: 'uncategorized', category: null, isAutoAssigned: true };
  }
  
  const mappingData = mappingSnapshot.docs[0].data() as CategoryMapping;
  const categoryId = mappingData.categoryId;
  
  // Get the category details
  const categoryRef = doc(db, CATEGORY_MAPPINGS_COLLECTION, categoryId);
  const categoryDoc = await getDoc(categoryRef);
  
  if (!categoryDoc.exists()) {
    return { categoryId, category: null, isAutoAssigned: mappingData.autoAssigned };
  }
  
  return { 
    categoryId, 
    category: { id: categoryDoc.id, ...categoryDoc.data() } as Category,
    isAutoAssigned: mappingData.autoAssigned
  };
};

/**
 * Get all mappings for a project
 */
export const getCategoryMappingsForProject = async (
  projectId: string
): Promise<Record<string, string>> => {
  try {
    const docRef = doc(db, 'projectSettings', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().categoryMappings) {
      return docSnap.data().categoryMappings;
    }
    
    // If no mappings exist yet, create default mappings
    await setDoc(docRef, { 
      categoryMappings: DEFAULT_CATEGORY_MAPPINGS,
      updatedAt: Timestamp.now() 
    }, { merge: true });
    
    return DEFAULT_CATEGORY_MAPPINGS;
  } catch (error) {
    console.error('Error getting category mappings:', error);
    return {};
  }
};

/**
 * Save a single category mapping for a project
 * @param projectId - Project ID
 * @param legacyCategoryId - Legacy category ID
 * @param enhancedCategoryId - Enhanced category ID
 */
export const saveCategoryMapping = async (
  projectId: string, 
  legacyCategoryId: string, 
  enhancedCategoryId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'projectSettings', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing mappings
      await updateDoc(docRef, {
        [`categoryMappings.${legacyCategoryId}`]: enhancedCategoryId,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new settings document with initial mapping
      await setDoc(docRef, {
        categoryMappings: { [legacyCategoryId]: enhancedCategoryId },
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error saving category mapping:', error);
    throw error;
  }
};

/**
 * Add multiple category mappings at once
 * @param projectId - Project ID
 * @param mappings - Record of legacy category IDs to enhanced category IDs
 */
export const addCategoryMappingBatch = async (
  projectId: string, 
  mappings: Record<string, string>
): Promise<void> => {
  try {
    const docRef = doc(db, 'projectSettings', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Get existing mappings
      const existingMappings = docSnap.data().categoryMappings || {};
      
      // Merge with new mappings
      const updatedMappings = { ...existingMappings, ...mappings };
      
      // Update document
      await updateDoc(docRef, {
        categoryMappings: updatedMappings,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new settings document with initial mappings
      await setDoc(docRef, {
        categoryMappings: mappings,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error adding category mappings:', error);
    throw error;
  }
};

/**
 * Get the category system preference for a specific project
 * @param projectId - Project ID
 * @returns 'legacy' or 'enhanced'
 */
export const getProjectCategorySystem = async (
  projectId: string
): Promise<'legacy' | 'enhanced'> => {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const data = projectDoc.data();
    // Default to legacy unless explicitly set to enhanced
    return data.categorySystem === 'enhanced' ? 'enhanced' : 'legacy';
  } catch (error) {
    console.error('Error getting project category system:', error);
    return 'legacy'; // Default to legacy on error
  }
};

/**
 * Update the category system for a project
 * @param projectId - Project ID
 * @param system - 'legacy' or 'enhanced'
 */
export const updateProjectCategorySystem = async (
  projectId: string, 
  system: 'legacy' | 'enhanced'
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      categorySystem: system,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating project category system:', error);
    throw error;
  }
};

/**
 * Auto-categorize an item based on its metadata
 */
export const autoAssignCategory = async (
  projectId: string
): Promise<void> => {
  try {
    // Get all expenses for the project
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('projectId', '==', projectId));
    const querySnapshot = await getDocs(q);
    
    // Process each expense
    const updates = [];
    for (const expenseDoc of querySnapshot.docs) {
      const expense = expenseDoc.data();
      
      // Skip if expense already has a category
      if (expense.categoryId) continue;
      
      // Add expense to updates
      updates.push({
        ref: doc(db, 'expenses', expenseDoc.id),
        data: {
          categoryId: 'CATEGORY_ID', // This is a placeholder, you would implement logic to determine the category
          updatedAt: Timestamp.now()
        }
      });
    }
    
    // Apply batch updates (limited to Firestore batch size)
    const MAX_BATCH_SIZE = 500;
    for (let i = 0; i < updates.length; i += MAX_BATCH_SIZE) {
      const batchChunk = updates.slice(i, i + MAX_BATCH_SIZE);
      
      // Create and commit a new batch for each chunk
      const batch = writeBatch(db);
      batchChunk.forEach((item: { ref: any; data: any }) => {
        batch.update(item.ref, item.data);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error auto-assigning categories:', error);
    throw error;
  }
};
