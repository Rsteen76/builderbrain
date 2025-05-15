/**
 * Base interface for all categories
 */
export type CategoryLevel = 'main' | 'sub';

export interface Category {
  id: string;
  name: string;
  color?: string;
  description?: string;
  isActive: boolean;
  level: CategoryLevel;
  parentId?: string;
  keywords?: string[];
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
  children?: Category[]; // Optional children array
  userDefined?: boolean; // Indicates if this is a user-defined category
  budgetPercentage?: number; // Optional budget percentage for category budget tracking
}

/**
 * Interface for main categories with children
 */
export interface CategoryWithChildren extends Category {
  children: Category[];
}

/**
 * Interface for category selection in forms
 */
export interface CategoryOption {
  id: string;
  name: string;
  level: 'main' | 'sub';
  parentId?: string;
  color?: string;
  mainCategory?: string; // Used for grouping in selectors
}

/**
 * Interface for expense grouping
 */
export interface ExpenseCategoryGroup {
  id: string;
  name: string;
  value: number;
  count: number;
  color: string;
}

/**
 * Type for category grouping methods
 */
export type CategoryGroupingType = 'category' | 'contractor' | 'paymentType' | 'status';

// User preferences for category mapping
export interface CategoryMapping {
  id: string;
  itemId: string;  // Can be expense ID, bid ID, etc.
  categoryId: string;
  projectId: string;
  userId: string;
  autoAssigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Standard expense categories that users select during expense entry
export type ExpenseCategory = 
  | 'subcontractor' 
  | 'labor' 
  | 'materials' 
  | 'equipment' 
  | 'permits' 
  | 'other';

// Construction-specific categories used for detailed reporting
export type ConstructionCategory =
  | 'pre_construction'
  | 'land'
  | 'escrow'
  | 'site_work'
  | 'foundation'
  | 'framing'
  | 'exterior'
  | 'mechanical'
  | 'interior_rough'
  | 'interior_finishes'
  | 'fixtures'
  | 'specialty'
  | 'management'
  | 'uncategorized';

// Mapping between expense categories and construction categories
export const DEFAULT_CATEGORY_MAPPING: Record<ExpenseCategory, ConstructionCategory> = {
  labor: 'management',
  materials: 'interior_finishes', // Most common default
  equipment: 'site_work',
  permits: 'pre_construction',
  subcontractor: 'uncategorized', // Needs further classification based on trade
  other: 'uncategorized'
};

export interface MainCategoryWithSubcategories {
  mainCategory: Category;
  subcategories: Category[];
}

export interface CategoryFilter {
  level?: CategoryLevel;
  parentId?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export interface CategoryFormData {
  name: string;
  color?: string;
  description?: string;
  isActive: boolean;
  level: CategoryLevel;
  parentId?: string;
  keywords?: string[];
}