import { collection, doc, getDoc, getDocs, query, setDoc, addDoc, updateDoc, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category, CategoryMapping } from '../types/category.types';
import { getAllCategories, getCategoryById } from '../data/hierarchicalCategories';

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
  categoryId: string,
  projectId: string,
  userId: string,
  autoAssigned: boolean = false
): Promise<string> => {
  const mappingsRef = collection(db, CATEGORY_MAPPINGS_COLLECTION);
  
  // Check if mapping already exists
  const existingQuery = query(
    mappingsRef,
    where('itemId', '==', itemId)
  );
  const existingMappings = await getDocs(existingQuery);
  
  if (!existingMappings.empty) {
    // Update existing mapping
    const docRef = existingMappings.docs[0].ref;
    await updateDoc(docRef, {
      categoryId,
      autoAssigned,
      updatedAt: new Date()
    });
    return existingMappings.docs[0].id;
  }
  
  // Create new mapping
  const newMapping: Omit<CategoryMapping, 'id'> = {
    itemId,
    categoryId,
    projectId,
    userId,
    autoAssigned,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(mappingsRef, newMapping);
  return docRef.id;
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
  const mappingsRef = collection(db, CATEGORY_MAPPINGS_COLLECTION);
  const mappingsQuery = query(mappingsRef, where('projectId', '==', projectId));
  const mappingsSnapshot = await getDocs(mappingsQuery);
  
  const mappings: Record<string, string> = {};
  
  mappingsSnapshot.forEach(doc => {
    const data = doc.data() as CategoryMapping;
    mappings[data.itemId] = data.categoryId;
  });
  
  return mappings;
};

/**
 * Auto-categorize an item based on its metadata
 */
export const autoAssignCategory = async (
  itemId: string,
  projectId: string,
  userId: string,
  itemType: string,
  vendorOrSubcontractor?: string,
  description?: string
): Promise<string> => {
  // Check if a manual mapping already exists
  const mappingsRef = collection(db, CATEGORY_MAPPINGS_COLLECTION);
  const existingQuery = query(
    mappingsRef,
    where('itemId', '==', itemId),
    where('autoAssigned', '==', false)
  );
  const existingMappings = await getDocs(existingQuery);
  
  if (!existingMappings.empty) {
    // Manual mapping exists, don't override it
    return existingMappings.docs[0].data().categoryId;
  }
  
  // Import the mapSimpleToDetailedCategory function
  const { mapSimpleToDetailedCategory } = await import('../data/hierarchicalCategories');
  
  // Map to construction category
  const constructionCategoryId = mapSimpleToDetailedCategory(
    itemType,
    vendorOrSubcontractor,
    description
  );
  
  // Save the mapping
  await addCategoryMapping(itemId, constructionCategoryId, projectId, userId, true);
  
  return constructionCategoryId;
}; 