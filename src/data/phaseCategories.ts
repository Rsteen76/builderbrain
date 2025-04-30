import { MAIN_CATEGORIES } from './hierarchicalCategories';

/**
 * Maps standard construction phases to relevant expense categories
 * This helps with automatically categorizing expenses based on the current phase of construction
 */
export const PHASE_CATEGORY_MAPPING = [
  {
    phaseKey: 'acquisition',
    phaseName: 'Acquisition & Closing',
    description: 'Property purchase and closing processes',
    suggestedCategories: ['acquisition']
  },
  {
    phaseKey: 'planning',
    phaseName: 'Planning & Design',
    description: 'Project planning, design, and pre-construction activities',
    suggestedCategories: ['pre-construction']
  },
  {
    phaseKey: 'permits',
    phaseName: 'Permits & Approvals',
    description: 'Obtaining necessary permits and approvals',
    suggestedCategories: ['pre-construction']
  },
  {
    phaseKey: 'site-prep',
    phaseName: 'Site Preparation',
    description: 'Preparing the site for construction',
    suggestedCategories: ['site-work']
  },
  {
    phaseKey: 'foundation',
    phaseName: 'Foundation',
    description: 'Construction of the building foundation',
    suggestedCategories: ['foundation']
  },
  {
    phaseKey: 'framing',
    phaseName: 'Framing',
    description: 'Structural framing of the building',
    suggestedCategories: ['framing']
  },
  {
    phaseKey: 'rough-in',
    phaseName: 'Mechanical Rough-In',
    description: 'Installation of electrical, plumbing, and HVAC systems before walls are closed',
    suggestedCategories: ['mechanical', 'interior-rough']
  },
  {
    phaseKey: 'exterior',
    phaseName: 'Exterior Finishes',
    description: 'Exterior siding, roofing, and finishes',
    suggestedCategories: ['exterior']
  },
  {
    phaseKey: 'insulation',
    phaseName: 'Insulation & Drywall',
    description: 'Insulation and drywall installation',
    suggestedCategories: ['interior-rough', 'interior-finishes']
  },
  {
    phaseKey: 'interior',
    phaseName: 'Interior Finishes',
    description: 'Interior finishes including flooring, trim, and painting',
    suggestedCategories: ['interior-finishes']
  },
  {
    phaseKey: 'fixtures',
    phaseName: 'Fixtures & Appliances',
    description: 'Installation of fixtures, cabinetry, and appliances',
    suggestedCategories: ['interior-finishes', 'specialty']
  },
  {
    phaseKey: 'landscape',
    phaseName: 'Landscaping',
    description: 'Exterior landscaping and outdoor spaces',
    suggestedCategories: ['landscape']
  },
  {
    phaseKey: 'final',
    phaseName: 'Final Inspections & Cleanup',
    description: 'Final inspections, cleanup, and project completion',
    suggestedCategories: ['cleanup', 'project-management']
  }
];

/**
 * Get suggested categories for a specific construction phase
 * @param phaseKey The key of the construction phase
 * @returns Array of category IDs recommended for the phase
 */
export const getSuggestedCategoriesForPhase = (phaseKey: string): string[] => {
  const phaseMapping = PHASE_CATEGORY_MAPPING.find(phase => phase.phaseKey === phaseKey);
  if (!phaseMapping) return [];
  
  return phaseMapping.suggestedCategories;
};

/**
 * Get suggested subcategories for a specific construction phase
 * @param phaseKey The key of the construction phase
 * @returns Array of subcategory objects with IDs and names relevant to the phase
 */
export const getSuggestedSubcategoriesForPhase = (phaseKey: string) => {
  const mainCategoryIds = getSuggestedCategoriesForPhase(phaseKey);
  if (!mainCategoryIds.length) return [];
  
  const relevantSubcategories: Array<{id: string, name: string, parentName: string}> = [];
  
  mainCategoryIds.forEach(mainCatId => {
    const mainCategory = MAIN_CATEGORIES.find(cat => cat.id === mainCatId);
    if (!mainCategory) return;
    
    mainCategory.children.forEach(subcat => {
      relevantSubcategories.push({
        id: subcat.id,
        name: subcat.name,
        parentName: mainCategory.name
      });
    });
  });
  
  return relevantSubcategories;
};

/**
 * Get complete information about a construction phase including name, description and categories
 * @param phaseKey The key of the construction phase
 */
export const getPhaseInfo = (phaseKey: string) => {
  return PHASE_CATEGORY_MAPPING.find(phase => phase.phaseKey === phaseKey);
};

/**
 * Check if a category is typically associated with a specific construction phase
 * @param categoryId The ID of the category to check
 * @param phaseKey The key of the construction phase
 */
export const isCategoryRelevantToPhase = (categoryId: string, phaseKey: string): boolean => {
  // Get main category ID if this is a subcategory
  let mainCategoryId = categoryId;
  const allCategories = MAIN_CATEGORIES.flatMap(cat => cat.children);
  const subcategory = allCategories.find(sub => sub.id === categoryId);
  
  if (subcategory?.parentId) {
    mainCategoryId = subcategory.parentId;
  }
  
  // Check if the main category is suggested for this phase
  const suggestedCategories = getSuggestedCategoriesForPhase(phaseKey);
  return suggestedCategories.includes(mainCategoryId);
};