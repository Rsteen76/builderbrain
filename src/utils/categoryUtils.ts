import { CONSTRUCTION_CATEGORIES } from './constructionCategories';
import { BudgetItem, CategoryMappingPreferences } from '../types/budget.types';

// No need to redefine CategoryMappingPreferences since we're importing it
// export type CategoryMappingPreferences = Record<string, string>;

/**
 * Maps a budget item to a construction category
 * This is the single source of truth for category mapping throughout the application
 */
export const mapItemToCategory = (
  item: BudgetItem, 
  userPreferences?: CategoryMappingPreferences
): string => {
  // Use the category from preferences if available
  if (userPreferences && item.id && userPreferences[item.id]) {
    return userPreferences[item.id];
  }

  // Convert to lowercase for case-insensitive matching, handle null/undefined description
  const desc = (item.description || '').toLowerCase();
  
  // Map by keywords in description
  if (desc.includes('architect') || desc.includes('design') || desc.includes('engineering')) return 'design_fees';
  if (desc.includes('permit') || desc.includes('inspection') || desc.includes('fee') && desc.includes('building')) return 'permits';
  if (desc.includes('survey') || desc.includes('soil') || desc.includes('test')) return 'surveys';
  if (desc.includes('insurance') || desc.includes('bond')) return 'insurance';
  if (desc.includes('demo') || desc.includes('demolition')) return 'demolition';
  if (desc.includes('excav') || desc.includes('grading') || desc.includes('site prep')) return 'excavation_grading';
  if (desc.includes('utilit') || desc.includes('water') || desc.includes('sewer') || desc.includes('electric service')) return 'utilities';
  if (desc.includes('foundation') || desc.includes('footer') || desc.includes('concrete')) return 'footings';
  if (desc.includes('framing') || desc.includes('frame') || desc.includes('truss')) return 'rough_framing';
  if (desc.includes('roof') && !desc.includes('truss')) return 'roofing';
  if (desc.includes('siding') || desc.includes('exterior') && desc.includes('wall')) return 'siding';
  if (desc.includes('window') && !desc.includes('cleaning')) return 'windows';
  if (desc.includes('door') && !desc.includes('hardware')) return 'exterior_doors';
  if (desc.includes('hvac') || desc.includes('heat') || desc.includes('air conditioning')) return 'hvac';
  if (desc.includes('plumb') || desc.includes('pipe') || desc.includes('water heater')) return 'plumbing';
  if (desc.includes('electr') || desc.includes('wiring') || desc.includes('panel')) return 'electrical';
  if (desc.includes('insulation') || desc.includes('insula')) return 'insulation';
  if (desc.includes('drywall') || desc.includes('sheetrock')) return 'drywall';
  if (desc.includes('flooring') || desc.includes('tile') || desc.includes('carpet')) return 'flooring';
  if (desc.includes('paint') || desc.includes('stain') || desc.includes('caulk')) return 'painting';
  if (desc.includes('trim') || desc.includes('molding') || desc.includes('baseboard')) return 'trim_carpentry';
  if (desc.includes('cabinet') || desc.includes('vanity')) return 'cabinets';
  if (desc.includes('counter') || desc.includes('countertop')) return 'countertops';
  if (desc.includes('sink') || desc.includes('faucet') || desc.includes('toilet') || desc.includes('tub') || desc.includes('shower')) return 'plumbing_fixtures';
  if (desc.includes('light') || desc.includes('fixture') && !desc.includes('plumbing')) return 'lighting_fixtures';
  if (desc.includes('appliance') || desc.includes('refrigerator') || desc.includes('stove') || desc.includes('oven') || desc.includes('dishwasher')) return 'appliances';
  if (desc.includes('hardware') || desc.includes('knob') || desc.includes('handle')) return 'hardware';
  if (desc.includes('landscap') || desc.includes('plant') || desc.includes('lawn') || desc.includes('sod')) return 'landscaping';
  if (desc.includes('deck') || desc.includes('patio')) return 'deck_patio';
  if (desc.includes('clean') || desc.includes('debris') || desc.includes('trash')) return 'cleanup';
  if (desc.includes('supervis') || desc.includes('project manage') || desc.includes('contractor fee')) return 'project_management';
  
  // If nothing else matches
  return 'uncategorized';
};

/**
 * Gets a user-friendly category name from a category ID
 */
export const getCategoryNameById = (categoryId: string): string => {
  // Search through all categories to find a matching ID
  for (const [section, categories] of Object.entries(CONSTRUCTION_CATEGORIES)) {
    const matchingCategory = categories.find(cat => cat.id === categoryId);
    if (matchingCategory) {
      return matchingCategory.name;
    }
  }
  
  // If not found, return a formatted version of the ID
  return categoryId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Gets the section (group) name for a category ID
 */
export const getCategorySectionById = (categoryId: string): string => {
  for (const [section, categories] of Object.entries(CONSTRUCTION_CATEGORIES)) {
    if (categories.some(cat => cat.id === categoryId)) {
      return section;
    }
  }
  return 'uncategorized';
};

/**
 * Gets all category IDs
 */
export const getAllCategoryIds = (): string[] => {
  return Object.values(CONSTRUCTION_CATEGORIES)
    .flat()
    .map(cat => cat.id);
};

/**
 * Checks if an expense has a recognized category
 */
export const hasRecognizedCategory = (
  item: BudgetItem, 
  userPreferences?: CategoryMappingPreferences
): boolean => {
  const categoryId = mapItemToCategory(item, userPreferences);
  return getAllCategoryIds().includes(categoryId);
}; 