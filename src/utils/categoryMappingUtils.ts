import { Category } from '../types/category.types';
import { ENHANCED_MAIN_CATEGORIES, getAllCategories as getEnhancedCategories } from '../data/newHierarchicalCategories';

// Default category mappings from legacy to enhanced system
export const DEFAULT_CATEGORY_MAPPINGS: Record<string, string> = {
  'labor': 'labor',
  'general': 'general',
  'misc': 'miscellaneous',
  'other': 'other'
};

const CATEGORY_SYSTEM_PREFERENCE_KEY = 'categorySystemPreference';

/**
 * Get categories by system type (legacy or enhanced)
 */


/**
 * Convert the hierarchical category structure to a flat array
 */
export const flattenHierarchicalCategories = (
  categories: Category[],
  parentId?: string,
  parentName?: string
): Category[] => {
  const flattened: Category[] = [];
  
  categories.forEach(category => {
    const id = parentId ? `${parentId}-${category.id}` : category.id;
    const name = parentName ? `${parentName} > ${category.name}` : category.name;
    
    const result: Category = {
      ...category,
      id,
      name,
      parentId,
      level: parentId ? 'sub' : 'main'
    };
    
    flattened.push(result);
    
    if (category.children && Array.isArray(category.children)) {
      const subcategories = flattenHierarchicalCategories(
        category.children,
        id,
        name
      );
      flattened.push(...subcategories);
    }
  });

  return flattened;
};

/**
 * Get the user's category system preference
 * @returns 'legacy' or 'enhanced'
 */
export const getUserCategorySystemPreference = (): 'legacy' | 'enhanced' => {
  const preference = localStorage.getItem(CATEGORY_SYSTEM_PREFERENCE_KEY);
  return preference === 'enhanced' ? 'enhanced' : 'legacy';
};

/**
 * Save the user's category system preference
 * @param preference - 'legacy' or 'enhanced'
 */
export const saveUserCategorySystemPreference = (
  preference: 'legacy' | 'enhanced'
): void => {
  localStorage.setItem(CATEGORY_SYSTEM_PREFERENCE_KEY, preference);
};

/**
 * Get unified category system to use
 * Considers both user preference and project settings
 * @param projectSystem - The project's category system
 * @returns The category system to use ('legacy' or 'enhanced')
 */
export const getUnifiedCategorySystem = (
  projectSystem?: 'legacy' | 'enhanced'
): 'legacy' | 'enhanced' => {
  const userPreference = getUserCategorySystemPreference();
  
  // If project has a specific system, use that
  if (projectSystem) {
    return projectSystem;
  }
  
  // Otherwise use user preference
  return userPreference;
};

/**
 * Get all categories for the selected category system
 * @param system - 'legacy' or 'enhanced'
 * @returns Array of Category objects for the specified system
 */
export const getCategoriesBySystem = (system: 'legacy' | 'enhanced'): Category[] => {
  if (system === 'legacy') {
    return [
      { id: 'labor', name: 'Labor', description: 'Labor costs', parentId: undefined, isActive: true, level: 'main' },
      { id: 'general', name: 'General', description: 'General expenses', parentId: undefined, isActive: true, level: 'main' },
      { id: 'misc', name: 'Miscellaneous', description: 'Miscellaneous expenses', parentId: undefined, isActive: true, level: 'main' },
      { id: 'other', name: 'Other', description: 'Other expenses', parentId: undefined, isActive: true, level: 'main' }
    ];
  }
  return getEnhancedCategories();
};

/**
 * Get all main categories for the selected category system
 * @param system - 'legacy' or 'enhanced'
 * @returns Array of main Category objects for the specified system
 */
export const getMainCategoriesBySystem = (system: 'legacy' | 'enhanced'): Category[] => {
  if (system === 'legacy') {
    return [
      { id: 'labor', name: 'Labor', description: 'Labor costs', parentId: undefined, isActive: true, level: 'main' },
      { id: 'general', name: 'General', description: 'General expenses', parentId: undefined, isActive: true, level: 'main' },
      { id: 'misc', name: 'Miscellaneous', description: 'Miscellaneous expenses', parentId: undefined, isActive: true, level: 'main' },
      { id: 'other', name: 'Other', description: 'Other expenses', parentId: undefined, isActive: true, level: 'main' }
    ];
  }
  return ENHANCED_MAIN_CATEGORIES;
};

/**
 * Convert a category ID from one system to another
 * @param categoryId - Original category ID
 * @param from - Source category system ('legacy' or 'enhanced')
 * @param to - Target category system ('legacy' or 'enhanced')
 * @param projectMappings - Custom project-specific category mappings
 * @returns Mapped category ID in target system, or original if no mapping exists
 */
export const convertCategoryId = (
  categoryId: string,
  from: 'legacy' | 'enhanced',
  to: 'legacy' | 'enhanced',
  projectMappings: Record<string, string> = {}
): string => {
  // If systems are the same, no conversion needed
  if (from === to) return categoryId;
  
  // Check for project-specific mapping first
  if (from === 'legacy' && to === 'enhanced') {
    return projectMappings[categoryId] || DEFAULT_CATEGORY_MAPPINGS[categoryId] || categoryId;
  } 
  
  // For enhanced to legacy, need to reverse lookup
  if (from === 'enhanced' && to === 'legacy') {
    // Create reverse mappings
    const reverseMappings: Record<string, string> = {};
    Object.entries(projectMappings).forEach(([legacyId, enhancedId]) => {
      reverseMappings[enhancedId] = legacyId;
    });
    
    // Also create reverse mappings for defaults
    const reverseDefaults: Record<string, string> = {};
    Object.entries(DEFAULT_CATEGORY_MAPPINGS).forEach(([legacyId, enhancedId]) => {
      reverseDefaults[enhancedId] = legacyId;
    });
    
    return reverseMappings[categoryId] || reverseDefaults[categoryId] || categoryId;
  }
  
  return categoryId;
};

/**
 * Find the best matching category in the target system
 * @param categoryName - Name of the category
 * @param toSystem - Target category system ('legacy' or 'enhanced')
 * @returns Best matching category ID in the target system or null if no match found
 */
export const findBestMatchingCategory = (
  categoryName: string,
  toSystem: 'legacy' | 'enhanced'
): string | null => {
  const allCategories = getCategoriesBySystem(toSystem);
  const nameLower = categoryName.toLowerCase();
  
  // Try to find exact match first
  const exactMatch = allCategories.find((cat: Category) => cat.name.toLowerCase() === nameLower);
  if (exactMatch) return exactMatch.id;
  
  // Try partial matches
  const partialMatches = allCategories.filter((cat: Category) => 
    cat.name.toLowerCase().includes(nameLower) ||
    nameLower.includes(cat.name.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    // Return the first match with highest confidence
    return partialMatches[0].id;
  }
  
  return null;
};

/**
 * Get the migration status for a project's categories
 * @param projectId - The project ID
 * @param legacyCategoryIds - Array of legacy category IDs used in the project
 * @param mappings - Current category mappings for the project
 * @returns Migration status object
 */
export const getCategoryMigrationStatus = (
  projectId: string,
  legacyCategoryIds: string[],
  mappings: Record<string, string>
): { unmapped: string[]; suggested: Record<string, string> } => {
  const unmapped: string[] = [];
  const suggested: Record<string, string> = {};

  legacyCategoryIds.forEach((catId: string) => {
    if (!mappings[catId]) {
      unmapped.push(catId);
      const suggestedMapping = DEFAULT_CATEGORY_MAPPINGS[catId];
      if (suggestedMapping) {
        suggested[catId] = suggestedMapping;
      }
    }
  });

  return { unmapped, suggested };
};

/**
 * Generate suggested mappings for unmapped categories
 * @param unmappedCategoryIds - Array of unmapped category IDs
 * @param existingMappings - Existing mappings to avoid duplicates
 * @returns Record of suggested mappings
 */
export const generateSuggestedMappings = (
  unmappedCategoryIds: string[],
  existingMappings: Record<string, string>
): Record<string, string> => {
  const suggestions: Record<string, string> = {};
  
  unmappedCategoryIds.forEach(legacyCategoryId => {
    // Skip if already mapped
    if (existingMappings[legacyCategoryId]) return;
    
    // Check if we have a default mapping
    if (DEFAULT_CATEGORY_MAPPINGS[legacyCategoryId]) {
      suggestions[legacyCategoryId] = DEFAULT_CATEGORY_MAPPINGS[legacyCategoryId];
      return;
    }
    
    // Try to find a match based on category name
    const bestMatch = findBestMatchingCategory(legacyCategoryId, 'enhanced');
    if (bestMatch) {
      suggestions[legacyCategoryId] = bestMatch;
    }
  });
  
  return suggestions;
};
