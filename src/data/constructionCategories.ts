import { CategoryWithChildren } from '../types/category.types';

// Define a local interface that extends CategoryWithChildren to include order
interface ExtendedCategoryWithChildren extends CategoryWithChildren {
  order?: number;
}

// Define the base category data first, before using it
export const CONSTRUCTION_CATEGORIES = {
  land: [
    { id: 'land_acquisition', name: 'Land Acquisition' }
  ],
  escrow: [
    { id: 'closing_costs', name: 'Closing Costs' }
  ],
  pre_construction: [
    { id: 'architectural_plans', name: 'Architectural Plans' },
    { id: 'engineering', name: 'Engineering' },
    { id: 'permits', name: 'Permits & Fees' }
  ],
  site_work: [
    { id: 'site_preparation', name: 'Site Preparation' },
    { id: 'demolition', name: 'Demolition' }
  ],
  foundation: [
    { id: 'foundation_work', name: 'Foundation Work' }
  ],
  framing: [
    { id: 'framing_work', name: 'Framing' }
  ],
  exterior: [
    { id: 'exterior_walls', name: 'Exterior Walls' },
    { id: 'roofing', name: 'Roofing' }
  ],
  mechanical: [
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'hvac', name: 'HVAC' }
  ],
  interior_rough: [
    { id: 'drywall', name: 'Drywall' },
    { id: 'insulation', name: 'Insulation' }
  ],
  interior_finishes: [
    { id: 'flooring', name: 'Flooring' },
    { id: 'painting', name: 'Painting' }
  ],
  fixtures: [
    { id: 'cabinets', name: 'Cabinets' },
    { id: 'appliances', name: 'Appliances' }
  ],
  specialty: [
    { id: 'specialty_items', name: 'Specialty Items' }
  ],
  management: [
    { id: 'project_management', name: 'Project Management' }
  ],
  uncategorized: [
    { id: 'other', name: 'Other' }
  ]
};

// Define hierarchical structure
export const CONSTRUCTION_CATEGORY_HIERARCHY: ExtendedCategoryWithChildren[] = [
  {
    id: 'acquisition_closing',
    name: 'Acquisition & Closing',
    description: 'Costs related to property acquisition and closing',
    level: 'main',
    order: 1,
    isActive: true,
    color: '#f44336', // red
    children: [
      {
        id: 'land_acquisition',
        name: 'Land Acquisition',
        level: 'sub',
        order: 1,
        isActive: true,
        parentId: 'acquisition_closing',
        children: []
      },
      {
        id: 'closing_costs',
        name: 'Closing Costs',
        level: 'sub',
        order: 2,
        isActive: true,
        parentId: 'acquisition_closing',
        children: []
      }
    ]
  },
  {
    id: 'pre_construction',
    name: 'Pre-Construction',
    description: 'Planning and preparation before construction begins',
    level: 'main',
    order: 2,
    isActive: true,
    color: '#ff9800', // orange
    children: [
      {
        id: 'architectural_plans',
        name: 'Architectural Plans',
        level: 'sub',
        order: 1,
        isActive: true,
        parentId: 'pre_construction',
        children: []
      },
      {
        id: 'engineering',
        name: 'Engineering',
        level: 'sub',
        order: 2,
        isActive: true,
        parentId: 'pre_construction',
        children: []
      },
      {
        id: 'permits',
        name: 'Permits & Fees',
        level: 'sub',
        order: 3,
        isActive: true,
        parentId: 'pre_construction',
        children: []
      }
    ]
  },
  {
    id: 'site_work',
    name: 'Site Work',
    description: 'Preparation and improvements to the building site',
    level: 'main',
    order: 3,
    isActive: true,
    color: '#795548', // brown
    children: CONSTRUCTION_CATEGORIES.site_work.map((cat, index) => ({
      ...cat,
      level: 'sub' as const,
      order: index + 1,
      isActive: true,
      parentId: 'site_work',
      children: []
    }))
  },
  {
    id: 'structure',
    name: 'Structure',
    description: 'Main structural components of the building',
    level: 'main',
    order: 4,
    isActive: true,
    color: '#2196f3', // blue
    children: [
      ...CONSTRUCTION_CATEGORIES.foundation.map((cat, index) => ({
        ...cat,
        level: 'sub' as const,
        order: index + 1,
        isActive: true,
        parentId: 'structure',
        children: []
      })),
      ...CONSTRUCTION_CATEGORIES.framing.map((cat, index) => ({
        ...cat,
        level: 'sub' as const,
        order: CONSTRUCTION_CATEGORIES.foundation.length + index + 1,
        isActive: true,
        parentId: 'structure',
        children: []
      }))
    ]
  },
  {
    id: 'building_envelope',
    name: 'Building Envelope',
    description: 'Components that separate interior and exterior environments',
    level: 'main',
    order: 5,
    isActive: true,
    color: '#4caf50', // green
    children: CONSTRUCTION_CATEGORIES.exterior.map((cat, index) => ({
      ...cat,
      level: 'sub' as const,
      order: index + 1,
      isActive: true,
      parentId: 'building_envelope',
      children: []
    }))
  },
  {
    id: 'systems',
    name: 'Mechanical Systems',
    description: 'Electrical, plumbing, and HVAC systems',
    level: 'main',
    order: 6,
    isActive: true,
    color: '#e91e63', // pink
    children: CONSTRUCTION_CATEGORIES.mechanical.map((cat, index) => ({
      ...cat,
      level: 'sub' as const,
      order: index + 1,
      isActive: true,
      parentId: 'systems',
      children: []
    }))
  },
  {
    id: 'interior',
    name: 'Interior',
    description: 'Interior components and finishes',
    level: 'main',
    order: 7,
    isActive: true,
    color: '#673ab7', // deep purple
    children: [
      ...CONSTRUCTION_CATEGORIES.interior_rough.map((cat, index) => ({
        ...cat,
        level: 'sub' as const,
        order: index + 1,
        isActive: true,
        parentId: 'interior',
        children: []
      })),
      ...CONSTRUCTION_CATEGORIES.interior_finishes.map((cat, index) => ({
        ...cat,
        level: 'sub' as const,
        order: CONSTRUCTION_CATEGORIES.interior_rough.length + index + 1,
        isActive: true,
        parentId: 'interior',
        children: []
      })),
      ...CONSTRUCTION_CATEGORIES.fixtures.map((cat, index) => ({
        ...cat,
        level: 'sub' as const,
        order: CONSTRUCTION_CATEGORIES.interior_rough.length + CONSTRUCTION_CATEGORIES.interior_finishes.length + index + 1,
        isActive: true,
        parentId: 'interior',
        children: []
      }))
    ]
  },
  {
    id: 'specialty_features',
    name: 'Specialty Features',
    description: 'Additional specialized features and amenities',
    level: 'main',
    order: 8,
    isActive: true,
    color: '#009688', // teal
    children: CONSTRUCTION_CATEGORIES.specialty.map((cat, index) => ({
      ...cat,
      level: 'sub' as const,
      order: index + 1,
      isActive: true,
      parentId: 'specialty_features',
      children: []
    }))
  },
  {
    id: 'project_management',
    name: 'Project Management',
    description: 'Project coordination and management costs',
    level: 'main',
    order: 9,
    isActive: true,
    color: '#607d8b', // blue grey
    children: CONSTRUCTION_CATEGORIES.management.map((cat, index) => ({
      ...cat,
      level: 'sub' as const,
      order: index + 1,
      isActive: true,
      parentId: 'project_management',
      children: []
    }))
  },
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    description: 'Items without a specific category',
    level: 'main',
    order: 10,
    isActive: true,
    color: '#9e9e9e', // grey
    children: [
      {
        id: 'other',
        name: 'Other Expenses',
        level: 'sub',
        order: 1,
        isActive: true,
        parentId: 'uncategorized',
        children: []
      }
    ]
  }
];

// Helper functions

/**
 * Get a flat array of all categories (main and subcategories)
 */
export const getAllCategories = (): ExtendedCategoryWithChildren[] => {
  const categories: ExtendedCategoryWithChildren[] = [];
  
  CONSTRUCTION_CATEGORY_HIERARCHY.forEach(mainCat => {
    categories.push(mainCat);
    // Add children as individual categories
    mainCat.children.forEach(subCat => {
      categories.push({
        ...subCat,
        children: []
      } as ExtendedCategoryWithChildren);
    });
  });
  
  return categories;
};

/**
 * Get a category by its ID
 */
export const getCategoryById = (categoryId: string): ExtendedCategoryWithChildren | undefined => {
  // First check main categories
  const mainCategory = CONSTRUCTION_CATEGORY_HIERARCHY.find(cat => cat.id === categoryId);
  if (mainCategory) return mainCategory;
  
  // Then check subcategories
  for (const mainCat of CONSTRUCTION_CATEGORY_HIERARCHY) {
    const subCategory = mainCat.children.find(subCat => subCat.id === categoryId);
    if (subCategory) {
      return {
        ...subCategory,
        children: []
      } as ExtendedCategoryWithChildren;
    }
  }
  
  return undefined;
};

/**
 * Get all subcategories for a main category
 */
export const getSubcategories = (mainCategoryId: string): ExtendedCategoryWithChildren[] => {
  const mainCategory = CONSTRUCTION_CATEGORY_HIERARCHY.find(cat => cat.id === mainCategoryId);
  if (!mainCategory) return [];
  
  return mainCategory.children.map(subCat => ({
    ...subCat,
    children: []
  } as ExtendedCategoryWithChildren));
};

/**
 * Get parent category for a subcategory
 */
export const getParentCategory = (subcategoryId: string): ExtendedCategoryWithChildren | undefined => {
  for (const mainCat of CONSTRUCTION_CATEGORY_HIERARCHY) {
    const hasSubcategory = mainCat.children.some(subCat => subCat.id === subcategoryId);
    if (hasSubcategory) return mainCat;
  }
  
  return undefined;
};

/**
 * Map the flat category structure to the hierarchical structure
 */
export const mapFlatCategoryToHierarchical = (categoryId: string): { mainCategoryId: string, subcategoryId: string } => {
  // Check if it's a main category
  const isMainCategory = CONSTRUCTION_CATEGORY_HIERARCHY.some(cat => cat.id === categoryId);
  if (isMainCategory) {
    return {
      mainCategoryId: categoryId,
      subcategoryId: '' // No subcategory when it's a main category
    };
  }
  
  // Find the parent category
  for (const mainCat of CONSTRUCTION_CATEGORY_HIERARCHY) {
    const subCat = mainCat.children.find(subCat => subCat.id === categoryId);
    if (subCat) {
      return {
        mainCategoryId: mainCat.id,
        subcategoryId: categoryId
      };
    }
  }
  
  // Default to uncategorized if not found
  return {
    mainCategoryId: 'uncategorized',
    subcategoryId: 'uncategorized'
  };
}; 