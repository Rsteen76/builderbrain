import { OLD_TO_NEW_CATEGORY_MAP, NEW_TO_OLD_CATEGORY_MAP } from './categoryMaps';

/**
 * Maps old category IDs to new category IDs
 * Used for data migration and compatibility during transition
 */
export const mapOldToNewCategory = (oldCategoryId: string): string => {
  // Check if there's a direct mapping for this category
  if (OLD_TO_NEW_CATEGORY_MAP[oldCategoryId]) {
    return OLD_TO_NEW_CATEGORY_MAP[oldCategoryId];
  }

  // Return unmapped if no match is found
  return 'unmapped';
};

/**
 * Maps new category IDs to old category IDs
 * Used for backward compatibility during transition
 */
export const mapNewToOldCategory = (newCategoryId: string): string => {
  // Check if there's a direct mapping for this category
  if (NEW_TO_OLD_CATEGORY_MAP[newCategoryId]) {
    return NEW_TO_OLD_CATEGORY_MAP[newCategoryId];
  }

  // Return unmapped if no match is found
  return 'unmapped';
};

/**
 * Determine migration status for an item based on its category
 * @param categoryId The current category ID of the item
 * @returns Migration status and recommended new category
 */
export const getMigrationStatus = (categoryId: string): { 
  status: 'migrated' | 'needs-migration' | 'unmapped', 
  recommendedCategory?: string 
} => {
  // If the ID starts with a number (new format), it's already migrated
  if (/^\d{2}-/.test(categoryId)) {
    return { status: 'migrated' };
  }
  
  // Check if there's a mapping available
  const mappedCategory = mapOldToNewCategory(categoryId);
  if (mappedCategory !== 'unmapped') {
    return { 
      status: 'needs-migration', 
      recommendedCategory: mappedCategory 
    };
  }
  
  // No mapping available
  return { status: 'unmapped' };
};

/**
 * Get all items that need migration
 * @param items Array of items with categoryId property
 * @returns Array of items that need migration with their recommended categories
 */
export const getItemsNeedingMigration = <T extends { id: string, categoryId?: string }>(
  items: T[]
): Array<T & { recommendedCategory?: string }> => {
  return items
    .filter(item => item.categoryId && getMigrationStatus(item.categoryId).status === 'needs-migration')
    .map(item => ({
      ...item,
      recommendedCategory: item.categoryId ? mapOldToNewCategory(item.categoryId) : undefined
    }));
};

/**
 * Calculate migration progress statistics
 * @param items Array of items with categoryId property
 * @returns Statistics about migration progress
 */
export const getMigrationProgress = <T extends { categoryId?: string }>(
  items: T[]
): {
  totalItems: number,
  migratedItems: number,
  needsMigrationItems: number,
  unmappedItems: number,
  progressPercentage: number
} => {
  const itemsWithCategory = items.filter(item => item.categoryId);
  const totalItems = itemsWithCategory.length;
  
  if (totalItems === 0) {
    return {
      totalItems: 0,
      migratedItems: 0,
      needsMigrationItems: 0,
      unmappedItems: 0,
      progressPercentage: 100 // Nothing to migrate
    };
  }
  
  const statusCounts = itemsWithCategory.reduce((counts, item) => {
    const status = getMigrationStatus(item.categoryId || '').status;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const migratedItems = statusCounts['migrated'] || 0;
  const needsMigrationItems = statusCounts['needs-migration'] || 0;
  const unmappedItems = statusCounts['unmapped'] || 0;
  
  return {
    totalItems,
    migratedItems,
    needsMigrationItems,
    unmappedItems,
    progressPercentage: Math.round((migratedItems / totalItems) * 100)
  };
}; 