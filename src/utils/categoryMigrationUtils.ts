import { Category } from '../types/category.types';
import { MAIN_CATEGORIES, getAllCategories as getAllLegacyCategories, getCategoryById as getLegacyCategoryById } from '../data/hierarchicalCategories';
import { getAllCategories as getAllEnhancedCategories, getCategoryById as getEnhancedCategoryById } from '../data/newHierarchicalCategories';
import { DEFAULT_CATEGORY_MAPPINGS } from './categoryMappingUtils';

// Local storage key for custom category mappings
const CUSTOM_MAPPINGS_KEY = 'app_custom_category_mappings';

// Get custom mappings from local storage
const getCustomMappings = (): Record<string, string> => {
  const saved = localStorage.getItem(CUSTOM_MAPPINGS_KEY);
  return saved ? JSON.parse(saved) : {};
};

// Set a custom category mapping
export const setCustomCategoryMapping = (
  legacyCategoryId: string,
  enhancedCategoryId: string
): void => {
  const customMappings = getCustomMappings();
  customMappings[legacyCategoryId] = enhancedCategoryId;
  localStorage.setItem(CUSTOM_MAPPINGS_KEY, JSON.stringify(customMappings));
};

// Initialize category migration system
export const initCategoryMigration = (): void => {
  // Pre-populate some initial mappings if none exist yet
  const customMappings = getCustomMappings();
  if (Object.keys(customMappings).length === 0) {
    // Use the default mappings as initial values
    localStorage.setItem(CUSTOM_MAPPINGS_KEY, JSON.stringify(DEFAULT_CATEGORY_MAPPINGS));
  }
};

// Get the best suggested category ID for a legacy category
export const getSuggestedNewCategoryId = (legacyCategoryId: string): string | null => {
  // First check custom mappings
  const customMappings = getCustomMappings();
  if (customMappings[legacyCategoryId]) {
    return customMappings[legacyCategoryId];
  }
  
  // Then check default mappings
  if (DEFAULT_CATEGORY_MAPPINGS[legacyCategoryId]) {
    return DEFAULT_CATEGORY_MAPPINGS[legacyCategoryId];
  }
  
  // Try to find a category by name similarity
  const legacyCategory = getLegacyCategoryById(legacyCategoryId);
  if (!legacyCategory) return null;
  
  const legacyCategoryName = legacyCategory.name.toLowerCase();
  const enhancedCategories = getAllEnhancedCategories();
  
  // First try exact name match
  const exactNameMatch = enhancedCategories.find(
    cat => cat.name.toLowerCase() === legacyCategoryName
  );
  if (exactNameMatch) return exactNameMatch.id;
  
  // Then try contains match
  const containsMatch = enhancedCategories.find(
    cat => cat.name.toLowerCase().includes(legacyCategoryName) || 
           legacyCategoryName.includes(cat.name.toLowerCase())
  );
  if (containsMatch) return containsMatch.id;
  
  // If no match found, return null
  return null;
};

// Migrate a category ID from legacy to enhanced system
export const migrateItemCategory = (
  item: any, 
  categoryMappings: Record<string, string>
): any => {
  if (!item || !item.categoryId) return item;
  
  const legacyCategoryId = item.categoryId;
  let enhancedCategoryId = categoryMappings[legacyCategoryId];
  // If no mapping exists, try to find a suggested one
  if (!enhancedCategoryId) {
    const suggestedId = getSuggestedNewCategoryId(legacyCategoryId);
    enhancedCategoryId = suggestedId || 'needs-review';
  }
  
  // Return updated item with both category IDs
  return {
    ...item,
    legacyCategoryId: legacyCategoryId,
    categoryId: enhancedCategoryId || legacyCategoryId
  };
};

// Check if a category ID belongs to the enhanced system
export const isEnhancedCategoryId = (categoryId: string): boolean => {
  // Enhanced categories follow the pattern "XX-name" where XX is a number
  return /^\d{2}-\w/.test(categoryId);
};

// Check if a category ID belongs to the legacy system
export const isLegacyCategoryId = (categoryId: string): boolean => {
  return !isEnhancedCategoryId(categoryId);
};

// Get all usages of categories in a dataset
export const getCategoryUsageStats = (
  items: any[], // expenses, bids, etc.
  categorySystem: 'legacy' | 'enhanced' = 'legacy'
): Record<string, number> => {
  const usageStats: Record<string, number> = {};
  
  items.forEach(item => {
    if (!item.categoryId) return;
    
    // For enhanced system, use categoryId directly
    // For legacy system, use either legacyCategoryId (if exists) or categoryId
    const categoryId = categorySystem === 'enhanced' 
      ? item.categoryId
      : item.legacyCategoryId || item.categoryId;
    
    if (categoryId) {
      usageStats[categoryId] = (usageStats[categoryId] || 0) + 1;
    }
  });
  
  return usageStats;
};

// Extract all unique category IDs used in a dataset
export const extractUsedCategoryIds = (
  items: any[], // expenses, bids, etc.
  categorySystem: 'legacy' | 'enhanced' = 'legacy'
): string[] => {
  const usageStats = getCategoryUsageStats(items, categorySystem);
  return Object.keys(usageStats);
};