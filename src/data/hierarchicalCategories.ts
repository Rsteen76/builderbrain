import { Category, CategoryWithChildren } from '../types/category.types';

/**
 * Hierarchical construction categories for detailed expense tracking and reporting
 */
export const MAIN_CATEGORIES: CategoryWithChildren[] = [
  {
    id: 'acquisition',
    name: 'Acquisition & Closing',
    description: 'All costs related to property acquisition and closing',
    level: 'main',
    order: 1,
    isActive: true,
    color: '#1976d2',
    children: [
      {
        id: 'acquisition-purchase',
        name: 'Purchase Price',
        description: 'Property purchase cost',
        level: 'sub',
        parentId: 'acquisition',
        order: 1,
        isActive: true,
        keywords: ['buy', 'property', 'land', 'purchase'],
        children: []
      },
      {
        id: 'acquisition-closing',
        name: 'Closing Costs',
        description: 'Fees associated with closing the property purchase',
        level: 'sub',
        parentId: 'acquisition',
        order: 2,
        isActive: true,
        keywords: ['fees', 'title', 'escrow', 'taxes'],
        children: []
      },
      {
        id: 'acquisition-legal',
        name: 'Legal Fees',
        description: 'Attorney and legal document fees',
        level: 'sub',
        parentId: 'acquisition',
        order: 3,
        isActive: true,
        keywords: ['attorney', 'lawyer', 'contract', 'legal'],
        children: []
      }
    ]
  },
  {
    id: 'pre-construction',
    name: 'Pre-Construction',
    description: 'All costs incurred before construction begins',
    level: 'main',
    order: 2,
    isActive: true,
    color: '#9c27b0',
    children: [
      {
        id: 'pre-construction-design',
        name: 'Design & Architecture',
        description: 'Architectural drawings and design services',
        level: 'sub',
        parentId: 'pre-construction',
        order: 1,
        isActive: true,
        keywords: ['architect', 'plans', 'drawings', 'blueprints'],
        children: []
      },
      {
        id: 'pre-construction-engineering',
        name: 'Engineering',
        description: 'Structural, civil, and other engineering services',
        level: 'sub',
        parentId: 'pre-construction',
        order: 2,
        isActive: true,
        keywords: ['structural', 'civil', 'mechanical', 'electrical'],
        children: []
      },
      {
        id: 'pre-construction-permits',
        name: 'Permits & Fees',
        description: 'Government permits and associated fees',
        level: 'sub',
        parentId: 'pre-construction',
        order: 3,
        isActive: true,
        keywords: ['building permit', 'inspection', 'city', 'county', 'fees'],
        children: []
      },
      {
        id: 'pre-construction-surveys',
        name: 'Surveys & Testing',
        description: 'Land surveys and environmental testing',
        level: 'sub',
        parentId: 'pre-construction',
        order: 4,
        isActive: true,
        keywords: ['land survey', 'soil', 'environmental', 'testing'],
        children: []
      }
    ]
  },
  {
    id: 'site-work',
    name: 'Site Work',
    description: 'Preparing the site for construction',
    level: 'main',
    order: 3,
    isActive: true,
    color: '#ff9800',
    children: [
      {
        id: 'site-work-demolition',
        name: 'Demolition',
        description: 'Removing existing structures',
        level: 'sub',
        parentId: 'site-work',
        order: 1,
        isActive: true,
        keywords: ['demo', 'demolish', 'tear down', 'removal'],
        children: []
      },
      {
        id: 'site-work-excavation',
        name: 'Excavation & Grading',
        description: 'Site preparation and earth moving',
        level: 'sub',
        parentId: 'site-work',
        order: 2,
        isActive: true,
        keywords: ['digging', 'grading', 'earthwork', 'leveling'],
        children: []
      },
      {
        id: 'site-work-utilities',
        name: 'Utilities & Infrastructure',
        description: 'Water, sewer, electric connections',
        level: 'sub',
        parentId: 'site-work',
        order: 3,
        isActive: true,
        keywords: ['water', 'sewer', 'electric', 'gas', 'connections'],
        children: []
      }
    ]
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Building foundation work',
    level: 'main',
    order: 4,
    isActive: true,
    color: '#8d6e63',
    children: [
      {
        id: 'foundation-concrete',
        name: 'Concrete',
        description: 'Concrete materials and pouring',
        level: 'sub',
        parentId: 'foundation',
        order: 1,
        isActive: true,
        keywords: ['concrete', 'cement', 'pour', 'footing', 'slab'],
        children: []
      },
      {
        id: 'foundation-waterproofing',
        name: 'Waterproofing',
        description: 'Foundation sealing and drainage',
        level: 'sub',
        parentId: 'foundation',
        order: 2,
        isActive: true,
        keywords: ['seal', 'waterproof', 'drainage', 'moisture'],
        children: []
      }
    ]
  },
  {
    id: 'framing',
    name: 'Framing & Rough Carpentry',
    description: 'Structural framing of the building',
    level: 'main',
    order: 5,
    isActive: true,
    color: '#43a047',
    children: [
      {
        id: 'framing-lumber',
        name: 'Lumber & Materials',
        description: 'Wood and structural materials',
        level: 'sub',
        parentId: 'framing',
        order: 1,
        isActive: true,
        keywords: ['lumber', 'wood', 'beams', 'joists', 'studs'],
        children: []
      },
      {
        id: 'framing-labor',
        name: 'Framing Labor',
        description: 'Labor costs for framing work',
        level: 'sub',
        parentId: 'framing',
        order: 2,
        isActive: true,
        keywords: ['labor', 'carpenter', 'crew', 'installation'],
        children: []
      },
      {
        id: 'framing-trusses',
        name: 'Trusses & Roof Framing',
        description: 'Roof structure components',
        level: 'sub',
        parentId: 'framing',
        order: 3,
        isActive: true,
        keywords: ['trusses', 'rafters', 'roof', 'structure'],
        children: []
      }
    ]
  },
  {
    id: 'exterior',
    name: 'Exterior Finishes',
    description: 'Exterior siding, roofing, and finishes',
    level: 'main',
    order: 6,
    isActive: true,
    color: '#ef5350',
    children: [
      {
        id: 'exterior-roofing',
        name: 'Roofing',
        description: 'Roof installation and materials',
        level: 'sub',
        parentId: 'exterior',
        order: 1,
        isActive: true,
        keywords: ['roof', 'shingles', 'tiles', 'membrane'],
        children: []
      },
      {
        id: 'exterior-siding',
        name: 'Siding & Facades',
        description: 'Exterior wall finishes',
        level: 'sub',
        parentId: 'exterior',
        order: 2,
        isActive: true,
        keywords: ['siding', 'cladding', 'facade', 'stucco', 'brick'],
        children: []
      },
      {
        id: 'exterior-windows',
        name: 'Windows & Doors',
        description: 'Exterior doors and windows',
        level: 'sub',
        parentId: 'exterior',
        order: 3,
        isActive: true,
        keywords: ['window', 'door', 'glass', 'entry'],
        children: []
      }
    ]
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'All plumbing work and fixtures',
    level: 'main',
    order: 7,
    isActive: true,
    color: '#42a5f5',
    children: [
      {
        id: 'plumbing-rough',
        name: 'Rough Plumbing',
        description: 'Initial plumbing infrastructure',
        level: 'sub',
        parentId: 'plumbing',
        order: 1,
        isActive: true,
        keywords: ['pipes', 'drains', 'vents', 'rough-in'],
        children: []
      },
      {
        id: 'plumbing-fixtures',
        name: 'Fixtures & Finishes',
        description: 'Sinks, toilets, and visible elements',
        level: 'sub',
        parentId: 'plumbing',
        order: 2,
        isActive: true,
        keywords: ['sink', 'toilet', 'faucet', 'tub', 'shower'],
        children: []
      }
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'All electrical work and systems',
    level: 'main',
    order: 8,
    isActive: true,
    color: '#fdd835',
    children: [
      {
        id: 'electrical-rough',
        name: 'Rough Electrical',
        description: 'Wiring and electrical infrastructure',
        level: 'sub',
        parentId: 'electrical',
        order: 1,
        isActive: true,
        keywords: ['wiring', 'panel', 'circuits', 'rough-in'],
        children: []
      },
      {
        id: 'electrical-fixtures',
        name: 'Fixtures & Finishes',
        description: 'Lights, switches, and outlets',
        level: 'sub',
        parentId: 'electrical',
        order: 2,
        isActive: true,
        keywords: ['lighting', 'switches', 'outlets', 'fixtures'],
        children: []
      },
      {
        id: 'electrical-systems',
        name: 'Systems & Technology',
        description: 'Smart home, security, and specialty systems',
        level: 'sub',
        parentId: 'electrical',
        order: 3,
        isActive: true,
        keywords: ['smart', 'security', 'automation', 'technology'],
        children: []
      }
    ]
  },
  {
    id: 'hvac',
    name: 'HVAC',
    description: 'Heating, ventilation, and air conditioning',
    level: 'main',
    order: 9,
    isActive: true,
    color: '#26a69a',
    children: [
      {
        id: 'hvac-equipment',
        name: 'Equipment',
        description: 'HVAC units and major components',
        level: 'sub',
        parentId: 'hvac',
        order: 1,
        isActive: true,
        keywords: ['furnace', 'AC', 'heat pump', 'equipment'],
        children: []
      },
      {
        id: 'hvac-ductwork',
        name: 'Ductwork & Ventilation',
        description: 'Air distribution systems',
        level: 'sub',
        parentId: 'hvac',
        order: 2,
        isActive: true,
        keywords: ['ducts', 'vents', 'airflow', 'distribution'],
        children: []
      }
    ]
  },
  {
    id: 'interior',
    name: 'Interior Finishes',
    description: 'All interior finishing work',
    level: 'main',
    order: 10,
    isActive: true,
    color: '#ab47bc',
    children: [
      {
        id: 'interior-drywall',
        name: 'Drywall & Insulation',
        description: 'Wall finishing and insulation',
        level: 'sub',
        parentId: 'interior',
        order: 1,
        isActive: true,
        keywords: ['drywall', 'sheetrock', 'insulation', 'walls'],
        children: []
      },
      {
        id: 'interior-flooring',
        name: 'Flooring',
        description: 'All floor covering materials',
        level: 'sub',
        parentId: 'interior',
        order: 2,
        isActive: true,
        keywords: ['flooring', 'hardwood', 'tile', 'carpet', 'vinyl'],
        children: []
      },
      {
        id: 'interior-paint',
        name: 'Paint & Wall Finishes',
        description: 'Interior painting and wall coverings',
        level: 'sub',
        parentId: 'interior',
        order: 3,
        isActive: true,
        keywords: ['paint', 'wallpaper', 'texture', 'finishing'],
        children: []
      },
      {
        id: 'interior-trim',
        name: 'Trim & Millwork',
        description: 'Baseboards, crown molding, and wood details',
        level: 'sub',
        parentId: 'interior',
        order: 4,
        isActive: true,
        keywords: ['trim', 'baseboard', 'crown', 'molding', 'millwork'],
        children: []
      },
      {
        id: 'interior-cabinets',
        name: 'Cabinets & Countertops',
        description: 'Kitchen and bathroom fixed storage',
        level: 'sub',
        parentId: 'interior',
        order: 5,
        isActive: true,
        keywords: ['cabinets', 'countertops', 'vanity', 'kitchen', 'bathroom'],
        children: []
      }
    ]
  },
  {
    id: 'specialty',
    name: 'Specialty Items',
    description: 'Unique or custom features',
    level: 'main',
    order: 11,
    isActive: true,
    color: '#ec407a',
    children: [
      {
        id: 'specialty-appliances',
        name: 'Appliances',
        description: 'Kitchen and household appliances',
        level: 'sub',
        parentId: 'specialty',
        order: 1,
        isActive: true,
        keywords: ['appliance', 'refrigerator', 'oven', 'dishwasher'],
        children: []
      },
      {
        id: 'specialty-custom',
        name: 'Custom Features',
        description: 'Special or custom elements',
        level: 'sub',
        parentId: 'specialty',
        order: 2,
        isActive: true,
        keywords: ['custom', 'special', 'unique', 'bespoke'],
        children: []
      }
    ]
  },
  {
    id: 'landscape',
    name: 'Landscaping & Outdoor',
    description: 'Exterior landscaping and outdoor spaces',
    level: 'main',
    order: 12,
    isActive: true,
    color: '#66bb6a',
    children: [
      {
        id: 'landscape-hardscape',
        name: 'Hardscaping',
        description: 'Patios, walkways, and structures',
        level: 'sub',
        parentId: 'landscape',
        order: 1,
        isActive: true,
        keywords: ['patio', 'walkway', 'driveway', 'hardscape'],
        children: []
      },
      {
        id: 'landscape-softscape',
        name: 'Softscaping',
        description: 'Plants, trees, and living elements',
        level: 'sub',
        parentId: 'landscape',
        order: 2,
        isActive: true,
        keywords: ['plants', 'trees', 'lawn', 'garden', 'softscape'],
        children: []
      },
      {
        id: 'landscape-irrigation',
        name: 'Irrigation & Drainage',
        description: 'Water systems for landscaping',
        level: 'sub',
        parentId: 'landscape',
        order: 3,
        isActive: true,
        keywords: ['sprinkler', 'irrigation', 'drainage', 'water'],
        children: []
      }
    ]
  },
  {
    id: 'cleanup',
    name: 'Cleanup & Finishing',
    description: 'Final cleanup and project completion',
    level: 'main',
    order: 13,
    isActive: true,
    color: '#78909c',
    children: [
      {
        id: 'cleanup-construction',
        name: 'Construction Cleanup',
        description: 'Removing construction debris and waste',
        level: 'sub',
        parentId: 'cleanup',
        order: 1,
        isActive: true,
        keywords: ['debris', 'waste', 'cleaning', 'removal'],
        children: []
      },
      {
        id: 'cleanup-final',
        name: 'Final Detailing',
        description: 'Finishing touches before handover',
        level: 'sub',
        parentId: 'cleanup',
        order: 2,
        isActive: true,
        keywords: ['detail', 'touch-up', 'final', 'finishing'],
        children: []
      }
    ]
  },
  {
    id: 'management',
    name: 'Project Management',
    description: 'Management and administrative costs',
    level: 'main',
    order: 14,
    isActive: true,
    color: '#7986cb',
    children: [
      {
        id: 'management-supervision',
        name: 'Supervision',
        description: 'Onsite management and oversight',
        level: 'sub',
        parentId: 'management',
        order: 1,
        isActive: true,
        keywords: ['supervisor', 'foreman', 'oversight', 'management'],
        children: []
      },
      {
        id: 'management-insurance',
        name: 'Insurance & Bonds',
        description: 'Project insurance and bonding',
        level: 'sub',
        parentId: 'management',
        order: 2,
        isActive: true,
        keywords: ['insurance', 'bond', 'liability', 'coverage'],
        children: []
      },
      {
        id: 'management-fees',
        name: 'Administrative Fees',
        description: 'General overhead and administrative costs',
        level: 'sub',
        parentId: 'management',
        order: 3,
        isActive: true,
        keywords: ['overhead', 'administration', 'fee', 'general'],
        children: []
      }
    ]
  },
  {
    id: 'contingency',
    name: 'Contingency & Reserves',
    description: 'Funds set aside for unexpected costs',
    level: 'main',
    order: 15,
    isActive: true,
    color: '#ff7043',
    children: [
      {
        id: 'contingency-general',
        name: 'General Contingency',
        description: 'Overall project contingency funds',
        level: 'sub',
        parentId: 'contingency',
        order: 1,
        isActive: true,
        keywords: ['contingency', 'reserve', 'buffer', 'unexpected'],
        children: []
      },
      {
        id: 'contingency-specific',
        name: 'Specific Reserves',
        description: 'Reserves for specific potential issues',
        level: 'sub',
        parentId: 'contingency',
        order: 2,
        isActive: true,
        keywords: ['specific', 'targeted', 'reserve', 'allocation'],
        children: []
      }
    ]
  }
];

/**
 * Export constant for use in budget components
 */
export const CONSTRUCTION_CATEGORIES = MAIN_CATEGORIES.map(category => ({
  id: category.id,
  name: category.name,
  level: category.level,
  color: category.color,
  children: [] // Add empty children array
}));

/**
 * Utility functions for working with categories
 */

/**
 * Get all categories (main and subcategories) as a flat array
 */
export const getAllCategories = (): CategoryWithChildren[] => {
  const allCategories: CategoryWithChildren[] = [];
  
  MAIN_CATEGORIES.forEach(mainCategory => {
    // Add the main category
    allCategories.push({
      id: mainCategory.id,
      name: mainCategory.name,
      description: mainCategory.description,
      level: mainCategory.level,
      order: mainCategory.order,
      isActive: mainCategory.isActive,
      color: mainCategory.color,
      children: [] // Ensure main categories have children property when copied
    });
    
    // Add all subcategories
    if (mainCategory.children) {
      mainCategory.children.forEach(subCategory => {
        allCategories.push({
          ...subCategory,
          children: [] // Ensure every subcategory has children property
        });
      });
    }
  });
  
  return allCategories;
};

/**
 * Get a category by ID
 */
export const getCategoryById = (categoryId: string): CategoryWithChildren | undefined => {
  const allCategories = getAllCategories();
  return allCategories.find(category => category.id === categoryId);
};

/**
 * Get subcategories for a main category
 */
export const getSubcategories = (mainCategoryId: string): CategoryWithChildren[] => {
  const mainCategory = MAIN_CATEGORIES.find(cat => cat.id === mainCategoryId);
  if (!mainCategory) return [];
  
  return mainCategory.children.map(subcat => ({
    ...subcat,
    children: [] // Ensure every subcategory has the children property
  }));
};

/**
 * Get parent category for a subcategory
 */
export const getParentCategory = (subCategoryId: string): CategoryWithChildren | undefined => {
  const allCategories = getAllCategories();
  const subCategory = allCategories.find(cat => cat.id === subCategoryId);
  
  if (!subCategory || !subCategory.parentId) {
    return undefined;
  }
  
  return MAIN_CATEGORIES.find(cat => cat.id === subCategory.parentId);
};

/**
 * Map an item to a construction category based on its metadata
 * @param itemType The type of item (expense, bid, etc.)
 * @param vendorOrSubcontractor The vendor or subcontractor name
 * @param description Description of the item
 * @returns The ID of the matched construction category
 */
export const mapSimpleToDetailedCategory = (
  itemType: string,
  vendorOrSubcontractor?: string,
  description?: string
): string => {
  // Convert strings to lowercase for case-insensitive matching
  const type = itemType?.toLowerCase() || '';
  const vendor = vendorOrSubcontractor?.toLowerCase() || '';
  const desc = description?.toLowerCase() || '';
  
  // Check for common keywords in description and vendor
  
  // Acquisition-related
  if (desc.includes('land') || desc.includes('purchase') || desc.includes('property acquisition')) {
    return 'acquisition-purchase';
  }
  
  if (desc.includes('closing') || desc.includes('escrow') || desc.includes('title')) {
    return 'acquisition-closing';
  }
  
  if (desc.includes('attorney') || desc.includes('lawyer') || desc.includes('legal fee')) {
    return 'acquisition-legal';
  }
  
  // Pre-construction
  if (desc.includes('architect') || desc.includes('design') || desc.includes('plans') || 
      vendor.includes('architect') || vendor.includes('design')) {
    return 'pre-construction-design';
  }
  
  if (desc.includes('engineer') || desc.includes('structural') || 
      vendor.includes('engineer')) {
    return 'pre-construction-engineering';
  }
  
  if (desc.includes('permit') || desc.includes('fee') && desc.includes('building')) {
    return 'pre-construction-permits';
  }
  
  if (desc.includes('survey') || desc.includes('soil') || desc.includes('test')) {
    return 'pre-construction-surveys';
  }
  
  // Site work
  if (desc.includes('demo') || desc.includes('demolish') || 
      vendor.includes('demo') || vendor.includes('demolition')) {
    return 'site-work-demolition';
  }
  
  if (desc.includes('excav') || desc.includes('grad') || desc.includes('dirt') || 
      vendor.includes('excav') || vendor.includes('grad')) {
    return 'site-work-excavation';
  }
  
  if (desc.includes('utilit') || desc.includes('water') || desc.includes('sewer') ||
      desc.includes('electric') || desc.includes('gas')) {
    return 'site-work-utilities';
  }
  
  // Foundation
  if (desc.includes('concrete') || desc.includes('foundation') || 
      vendor.includes('concrete')) {
    return 'foundation-concrete';
  }
  
  if (desc.includes('waterproof') || desc.includes('drainage')) {
    return 'foundation-waterproofing';
  }
  
  // Framing
  if (desc.includes('fram') || desc.includes('rough carpenter') || 
      vendor.includes('fram') || vendor.includes('carpenter')) {
    return 'framing-labor';
  }
  
  if (desc.includes('lumber') || desc.includes('wood') || desc.includes('beam')) {
    return 'framing-lumber';
  }
  
  if (desc.includes('truss') || desc.includes('rafter') || desc.includes('roof') && desc.includes('structur')) {
    return 'framing-trusses';
  }
  
  // Exterior
  if (desc.includes('roof') || desc.includes('shingle') || 
      vendor.includes('roof')) {
    return 'exterior-roofing';
  }
  
  if (desc.includes('siding') || desc.includes('facade') || desc.includes('stucco') || 
      vendor.includes('siding') || vendor.includes('stucco')) {
    return 'exterior-siding';
  }
  
  if (desc.includes('window') || desc.includes('door') || desc.includes('entry') || 
      vendor.includes('window') || vendor.includes('door')) {
    return 'exterior-windows';
  }
  
  // If no specific match is found, default to 'other'
  return 'uncategorized';
};

export default MAIN_CATEGORIES; 