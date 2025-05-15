import { MAIN_CATEGORIES } from '../data/hierarchicalCategories';
import { ENHANCED_MAIN_CATEGORIES as NEW_MAIN_CATEGORIES } from '../data/newHierarchicalCategories';
import { Category, CategoryWithChildren } from '../types/category.types';

/**
 * Maps categories from the old system to the new system or vice versa
 * @param categoryId - Source category ID to map
 * @param sourceIsOld - Whether the source is from the old category system
 * @returns Best matching category ID in the target system
 */
export const mapCategoryBetweenSystems = (
  categoryId: string,
  sourceIsOld: boolean = true
): string => {
  // Define category mapping from old to new system
  const oldToNewMapping: Record<string, string> = {
    // Main categories mapping
    'general-requirements': 'division-01-general-requirements',
    'sitework': 'division-31-earthwork',
    'concrete': 'division-03-concrete',
    'masonry': 'division-04-masonry',
    'metals': 'division-05-metals',
    'wood-plastics': 'division-06-wood-plastics-composites',
    'thermal-moisture': 'division-07-thermal-and-moisture-protection',
    'doors-windows': 'division-08-openings',
    'finishes': 'division-09-finishes',
    'specialties': 'division-10-specialties',
    'equipment': 'division-11-equipment',
    'furnishings': 'division-12-furnishings',
    'special-construction': 'division-13-special-construction',
    'conveying-systems': 'division-14-conveying-equipment',
    'mechanical': 'division-22-plumbing',
    'electrical': 'division-26-electrical',
    'specialty-items': 'division-10-specialties',
    
    // Subcategories mapping (examples)
    'sitework-excavation': 'division-31-10-site-clearing',
    'sitework-utilities': 'division-33-utility-services',
    'concrete-forming': 'division-03-10-concrete-forming',
    'concrete-reinforcing': 'division-03-20-concrete-reinforcing',
    'concrete-finishes': 'division-03-30-cast-in-place-concrete',
    'masonry-brick': 'division-04-20-unit-masonry',
    'masonry-concrete': 'division-04-22-concrete-unit-masonry',
    'masonry-stone': 'division-04-40-stone-assemblies',
    'metals-structural': 'division-05-12-structural-steel',
    'metals-joists': 'division-05-21-steel-joists',
    'metals-deck': 'division-05-30-steel-deck',
    'metals-fabrications': 'division-05-50-metal-fabrications',
    'wood-framing': 'division-06-10-rough-carpentry',
    'wood-finish': 'division-06-20-finish-carpentry',
    'wood-trusses': 'division-06-17-prefabricated-trusses',
    'thermal-insulation': 'division-07-21-thermal-insulation',
    'thermal-roofing': 'division-07-30-roofing',
    'thermal-siding': 'division-07-46-siding',
    'doors-wood': 'division-08-14-wood-doors',
    'doors-metal': 'division-08-11-metal-doors',
    'doors-specialty': 'division-08-30-specialty-doors',
    'windows-residential': 'division-08-50-windows',
    'windows-commercial': 'division-08-40-entrances-storefronts-curtain-walls',
    'finishes-drywall': 'division-09-20-plaster-gypsum-board',
    'finishes-tile': 'division-09-30-tiling',
    'finishes-ceiling': 'division-09-50-ceilings',
    'finishes-flooring': 'division-09-60-flooring',
    'finishes-painting': 'division-09-90-painting-coating',
    'specialties-signage': 'division-10-14-signage',
    'specialties-partitions': 'division-10-20-interior-specialties',
    'specialties-accessories': 'division-10-28-toilet-bath-accessories',
    'equipment-appliances': 'division-11-30-residential-equipment',
    'equipment-commercial': 'division-11-40-foodservice-equipment',
    'furnishings-cabinets': 'division-12-30-casework',
    'furnishings-countertops': 'division-12-36-countertops',
    'furnishings-window': 'division-12-20-window-treatments',
    'special-construction-pools': 'division-13-11-swimming-pools',
    'conveying-systems-elevators': 'division-14-20-elevators',
    'mechanical-plumbing': 'division-22-plumbing',
    'mechanical-hvac': 'division-23-hvac',
    'electrical-service': 'division-26-10-medium-voltage-electrical-distribution',
    'electrical-lighting': 'division-26-50-lighting',
    'electrical-systems': 'division-26-electrical',
    'specialty-items-custom': 'division-10-specialties',
  };

  // Reverse mapping from new to old
  const newToOldMapping: Record<string, string> = {};
  Object.entries(oldToNewMapping).forEach(([oldId, newId]) => {
    newToOldMapping[newId] = oldId;
  });

  // Check if it's a custom category
  if (categoryId.startsWith('custom-')) {
    if (sourceIsOld && !categoryId.includes('new-')) {
      // Old custom category, create equivalent new custom category
      return `custom-new-${categoryId.substring(7)}`;
    } else if (!sourceIsOld && categoryId.includes('new-')) {
      // New custom category, create equivalent old custom category
      return `custom-${categoryId.substring(11)}`;
    }
    // Return as is if it already matches the target system
    return categoryId;
  }

  // Use appropriate mapping based on direction
  const mapping = sourceIsOld ? oldToNewMapping : newToOldMapping;
  
  return mapping[categoryId] || findClosestCategoryMatch(categoryId, sourceIsOld);
};

/**
 * Finds the closest matching category when direct mapping is not available
 * @param categoryId - Category ID to match
 * @param sourceIsOld - Whether the source is from the old category system
 * @returns Best matching category ID or a default category
 */
const findClosestCategoryMatch = (categoryId: string, sourceIsOld: boolean): string => {
  const sourceCategories = sourceIsOld ? MAIN_CATEGORIES : NEW_MAIN_CATEGORIES;
  const targetCategories = sourceIsOld ? NEW_MAIN_CATEGORIES : MAIN_CATEGORIES;
  
  // Try to find the source category
  let sourceCategory: Category | undefined;
  
  for (const mainCat of sourceCategories) {
    if (mainCat.id === categoryId) {
      sourceCategory = mainCat;
      break;
    }
    
    // Check subcategories if available
    if (mainCat.children && Array.isArray(mainCat.children)) {
      const subCat = mainCat.children.find((child: Category) => child.id === categoryId);
      if (subCat) {
        sourceCategory = subCat;
        break;
      }
    }
  }
  
  if (sourceCategory) {
    // Try to find exact match in target system
    for (const targetCat of targetCategories) {
      if (targetCat.name.toLowerCase() === sourceCategory.name.toLowerCase()) {
        return targetCat.id;
      }
    }
    
    // Check subcategories if available
    for (const targetCat of targetCategories) {
      if (targetCat.children && Array.isArray(targetCat.children)) {
        for (const subCat of targetCat.children) {
          const subNameSimilarity = calculateSimilarity(sourceCategory.name.toLowerCase(), subCat.name.toLowerCase());
          const subDescSimilarity = subCat.description ? 
            calculateSimilarity(sourceCategory.description?.toLowerCase() || '', subCat.description.toLowerCase()) : 0;
          
          const subScore = subNameSimilarity * 0.7 + subDescSimilarity * 0.3;
          
          if (subScore > 0) {
            return subCat.id;
          }
        }
      }
    }
  }
  
  // Return a default category if source category not found
  return sourceIsOld ? 'division-10-specialties' : 'specialty-items';
};

/**
 * Intelligently maps a category from old to new system using more advanced heuristics
 * @param categoryId - Source category ID to map
 * @param itemName - Optional name of the item being categorized to improve matching
 * @param itemDescription - Optional description to help with category matching
 * @returns Best matching category ID in the new system
 */
export const intelligentCategoryMapping = (
  categoryId: string,
  itemName?: string,
  itemDescription?: string
): string => {
  // Check if it's already a new category format
  if (categoryId.startsWith('division-') || categoryId.includes('new-')) {
    return categoryId;
  }
  
  // First try direct mapping
  const directMapping = mapCategoryBetweenSystems(categoryId, true);
  
  // If we have a direct mapping and no additional context, use it
  if (directMapping && (!itemName && !itemDescription)) {
    return directMapping;
  }
  
  // If we have item name or description, try to find a better match
  if (itemName || itemDescription) {
    const searchText = [
      itemName || '', 
      itemDescription || '', 
      MAIN_CATEGORIES.find(c => c.id === categoryId)?.name || '',
      MAIN_CATEGORIES.find(c => c.id === categoryId)?.description || ''
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (searchText.length > 10) {
      // Build a list of keywords to match against
      const divisionKeywords: Record<string, string[]> = {
        'division-01': ['general', 'requirements', 'permits', 'temporary', 'administrative'],
        'division-02': ['existing', 'conditions', 'demolition', 'disposal'],
        'division-03': ['concrete', 'cement', 'foundation', 'slab', 'forming', 'reinforcing'],
        'division-04': ['masonry', 'brick', 'block', 'stone', 'veneer'],
        'division-05': ['metal', 'steel', 'structural', 'joists', 'deck', 'ornamental'],
        'division-06': ['wood', 'plastic', 'framing', 'carpentry', 'millwork', 'truss'],
        'division-07': ['thermal', 'moisture', 'roof', 'insulation', 'waterproof', 'siding'],
        'division-08': ['openings', 'doors', 'windows', 'hardware', 'glazing', 'skylight'],
        'division-09': ['finishes', 'drywall', 'plaster', 'tile', 'ceiling', 'flooring', 'paint'],
        'division-10': ['specialties', 'signage', 'partition', 'accessories', 'lockers'],
        'division-11': ['equipment', 'appliances', 'commercial', 'kitchen', 'audiovisual'],
        'division-12': ['furnishings', 'cabinets', 'countertops', 'furniture', 'window treatments'],
        'division-13': ['special construction', 'pools', 'aquatic', 'pre-engineered'],
        'division-14': ['conveying', 'elevator', 'lift', 'escalator', 'dumbwaiter'],
        'division-21': ['fire suppression', 'sprinkler', 'standpipe'],
        'division-22': ['plumbing', 'pipe', 'fixture', 'water', 'sewer', 'drainage'],
        'division-23': ['hvac', 'heating', 'ventilation', 'air conditioning', 'duct'],
        'division-26': ['electrical', 'power', 'lighting', 'wiring', 'generator'],
        'division-27': ['communications', 'voice', 'data', 'audio', 'video', 'security'],
        'division-28': ['electronic safety', 'access control', 'detection', 'alarm'],
        'division-31': ['earthwork', 'clearing', 'grading', 'excavation', 'fill'],
        'division-32': ['exterior improvements', 'paving', 'landscaping', 'fencing'],
        'division-33': ['utilities', 'water', 'sewer', 'storm', 'gas', 'electric']
      };
      
      // Find the best matching division based on keywords
      let bestDivisionMatch = '';
      let bestScore = 0;
      
      Object.entries(divisionKeywords).forEach(([division, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => {
          if (searchText.includes(keyword)) {
            score += 1;
          }
        });
        
        if (score > bestScore) {
          bestScore = score;
          bestDivisionMatch = division;
        }
      });
      
      if (bestDivisionMatch && bestScore > 1) {
        // Find all categories in this division
        const divisionCategories = NEW_MAIN_CATEGORIES.flatMap((category: Category) => {
          if (category.id.startsWith(bestDivisionMatch)) {
            return [category, ...(category.children || [])];
          }
          return [];
        });
        
        if (divisionCategories.length > 0) {
          // Find best matching category within division
          let bestCategoryMatch = divisionCategories[0].id;
          let bestCategoryScore = 0;
          
          divisionCategories.forEach((category: Category) => {
            const categoryText = [
              category.name,
              category.description || '',
              ...(category.keywords || [])
            ].join(' ').toLowerCase();
            
            let score = 0;
            const searchWords = searchText.split(/\s+/).filter(word => word.length > 3);
            const categoryWords = categoryText.split(/\s+/).filter(word => word.length > 3);
            
            searchWords.forEach(searchWord => {
              categoryWords.forEach(categoryWord => {
                if (categoryWord.includes(searchWord) || searchWord.includes(categoryWord)) {
                  score += 1;
                }
              });
            });
            
            if (score > bestCategoryScore) {
              bestCategoryScore = score;
              bestCategoryMatch = category.id;
            }
          });
          
          if (bestCategoryScore > 0) {
            return bestCategoryMatch;
          }
          
          // If no specific match found, return the main division category
          return divisionCategories[0].id;
        }
      }
    }
  }
  
  // Fall back to direct mapping
  return directMapping;
};

/**
 * Get all available categories for the active category system
 * @param useNewCategories - Whether to use new or old category system
 * @returns Array of all available categories
 */
export const getAllCategoriesForActiveSystem = (useNewCategories: boolean): Category[] => {
  const categorySystem = useNewCategories ? NEW_MAIN_CATEGORIES : MAIN_CATEGORIES;
  
  return categorySystem.flatMap((category) => [
    category,
    ...(category.children || [])
  ]);
};

/**
 * Find the best matching category based on search text
 * @param searchText - Text to search for matching categories
 * @param useNewCategories - Whether to use new or old category system
 * @returns Best matching category ID or 'needs-review' if confidence is low
 */
export const findBestMatchingCategory = (
  searchText: string,
  useNewCategories: boolean = true
): string | null => {
  if (!searchText || searchText.length < 3) {
    return null;
  }
  
  const searchLower = searchText.toLowerCase();
  const allCategories = getAllCategoriesForActiveSystem(useNewCategories);
  
  // First pass: look for exact or near-exact matches
  for (const category of allCategories) {
    // Exact match of category name
    if (category.name.toLowerCase() === searchLower) {
      return category.id;
    }
    
    // Exact match of keywords
    const keywords = (category as any).keywords;
    if (keywords && Array.isArray(keywords)) {
      if (keywords.some(kw => kw.toLowerCase() === searchLower)) {
        return category.id;
      }
    }
  }
  
  // Second pass: look for partial matches
  let bestMatch = { id: '', score: 0 };
  
  for (const category of allCategories) {
    let score = 0;
    
    // Check name contains search or search contains name
    const nameLower = category.name.toLowerCase();
    if (nameLower.includes(searchLower)) {
      score += 10;
    } else if (searchLower.includes(nameLower)) {
      score += 8;
    }
    
    // Check for word-by-word match
    const similarity = calculateSimilarity(searchLower, nameLower);
    score += similarity * 10;
    
    // Check description
    if (category.description) {
      const descLower = category.description.toLowerCase();
      if (descLower.includes(searchLower)) {
        score += 5;
      }
      
      const descSimilarity = calculateSimilarity(searchLower, descLower);
      score += descSimilarity * 5;
    }
    
    // Check keywords
    const keywords = (category as any).keywords;
    if (keywords && Array.isArray(keywords)) {
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        if (keywordLower.includes(searchLower) || searchLower.includes(keywordLower)) {
          score += 2;
        }
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { id: category.id, score };
    }
  }
  
  // Return best match only if score is high enough
  return bestMatch.score >= 5 ? bestMatch.id : 'needs-review';
};

const calculateSimilarity = (a: string, b: string): number => {
  const words1 = a.split(/\s+/);
  const words2 = b.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    if (word1.length < 3) continue; // Skip short words
    
    for (const word2 of words2) {
      if (word2.length < 3) continue;
      
      if (word1 === word2 || word2.includes(word1) || word1.includes(word2)) {
        matchCount += 1;
        break;
      }
    }
  }
  
  return matchCount / Math.max(words1.length, words2.length, 1);
};