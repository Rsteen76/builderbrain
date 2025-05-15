import { Category } from '../types/category.types';

/**
 * Enhanced hierarchical category structure based on industry-standard CSI divisions
 * This structure provides more detailed categorization while maintaining user editability
 */

// Main top-level categories
export const ENHANCED_MAIN_CATEGORIES: Category[] = [
  { id: '01-general', name: 'General Requirements', description: 'Project requirements, general conditions, temporary facilities', isActive: true, level: 'main' },
  { id: '02-professional', name: 'Professional Services', description: 'Design, engineering, permits, and other professional services', isActive: true, level: 'main' },
  { id: '03-general', name: 'General Conditions', description: 'Construction management, supervision, and overhead costs', isActive: true, level: 'main' },
  { id: '04-site', name: 'Site Work', description: 'Site preparation, excavation, utilities, and site improvements', isActive: true, level: 'main' },
  { id: '05-structural', name: 'Structural', description: 'Foundation, framing, and structural elements', isActive: true, level: 'main' },
  { id: '06-envelope', name: 'Building Envelope', description: 'Exterior walls, roofing, windows, and waterproofing', isActive: true, level: 'main' },
  { id: '07-systems', name: 'Building Systems', description: 'MEP systems including plumbing, HVAC, and electrical', isActive: true, level: 'main' },
  { id: '08-interior', name: 'Interior Construction', description: 'Interior walls, finishes, flooring, and fixtures', isActive: true, level: 'main' },
  { id: '09-specialties', name: 'Specialties', description: 'Specialty items, fixtures, equipment, and furnishings', isActive: true, level: 'main' },
  { id: '10-exterior', name: 'Exterior Improvements', description: 'Landscaping, hardscaping, irrigation, and site features', isActive: true, level: 'main' },
  { id: '11-completion', name: 'Project Completion', description: 'Cleaning, punch list, and closeout items', isActive: true, level: 'main' },
  { id: '12-reserves', name: 'Project Reserves', description: 'Contingency, allowances, and change order reserves', isActive: true, level: 'main' }
];

// Sub-categories organized by parent category ID
const SUB_CATEGORIES: Record<string, Category[]> = {
  // 01 - General Requirements
  '01-general': [
    { id: '01-general-mobilization', name: 'Mobilization', description: 'Site setup, equipment delivery and setup', isActive: true, level: 'sub', parentId: '01-general' },
    { id: '01-general-temp-facilities', name: 'Temporary Facilities', description: 'Construction trailer, portable toilets, temporary utilities', isActive: true, level: 'sub', parentId: '01-general' },
    { id: '01-general-safety', name: 'Safety & Protection', description: 'Site safety, security, protective measures', isActive: true, level: 'sub', parentId: '01-general' },
    { id: '01-general-waste', name: 'Waste Management', description: 'Dumpsters, debris removal, recycling', isActive: true, level: 'sub', parentId: '01-general' }
  ],
  
  // 02 - Professional Services
  '02-professional': [
    { id: '02-professional-architecture', name: 'Architectural', description: 'Architectural design and services', isActive: true, level: 'sub', parentId: '02-professional' },
    { id: '02-professional-engineering', name: 'Engineering', description: 'Structural, civil, mechanical engineering', isActive: true, level: 'sub', parentId: '02-professional' },
    { id: '02-professional-permits', name: 'Permits & Fees', description: 'Building permits, impact fees, inspection fees', isActive: true, level: 'sub', parentId: '02-professional' },
    { id: '02-professional-surveys', name: 'Surveys', description: 'Land surveys, as-built surveys', isActive: true, level: 'sub', parentId: '02-professional' },
    { id: '02-professional-testing', name: 'Testing & Inspection', description: 'Special inspections, material testing', isActive: true, level: 'sub', parentId: '02-professional' },
    { id: '02-professional-environmental', name: 'Environmental', description: 'Environmental assessments, remediation', isActive: true, level: 'sub', parentId: '02-professional' },
    { id: '02-professional-legal', name: 'Legal & Insurance', description: 'Legal services, builder\'s risk, liability insurance', isActive: true, level: 'sub', parentId: '02-professional' }
  ],
  
  // 03 - General Conditions
  '03-general': [
    { id: '03-general-management', name: 'Project Management', description: 'Project coordination and oversight', isActive: true, level: 'sub', parentId: '03-general' },
    { id: '03-general-supervision', name: 'Supervision', description: 'On-site supervision and coordination', isActive: true, level: 'sub', parentId: '03-general' },
    { id: '03-general-conditions', name: 'General Conditions', description: 'General requirements of the contract', isActive: true, level: 'sub', parentId: '03-general' },
    { id: '03-general-overhead', name: 'Overhead & Profit', description: 'Contractor overhead and profit', isActive: true, level: 'sub', parentId: '03-general' }
  ],
  
  // 04 - Site Work
  '04-site': [
    { id: '04-site-clearing', name: 'Site Clearing', description: 'Tree removal, clearing vegetation', isActive: true, level: 'sub', parentId: '04-site' },
    { id: '04-site-demolition', name: 'Demolition', description: 'Demolition of existing structures', isActive: true, level: 'sub', parentId: '04-site' },
    { id: '04-site-earthwork', name: 'Earthwork', description: 'Excavation, grading, fill, compaction', isActive: true, level: 'sub', parentId: '04-site' },
    { id: '04-site-utilities', name: 'Site Utilities', description: 'Water, sewer, gas, electrical services', isActive: true, level: 'sub', parentId: '04-site' },
    { id: '04-site-paving', name: 'Paving', description: 'Driveways, walkways, curbs, parking', isActive: true, level: 'sub', parentId: '04-site' },
    { id: '04-site-drainage', name: 'Drainage', description: 'Stormwater systems, drainage solutions', isActive: true, level: 'sub', parentId: '04-site' }
  ],
  
  // 05 - Structural
  '05-structural': [
    { id: '05-structural-foundation', name: 'Foundation', description: 'Footings, foundation walls, slabs', isActive: true, level: 'sub', parentId: '05-structural' },
    { id: '05-structural-framing', name: 'Framing', description: 'Structural framing, wood/steel framing', isActive: true, level: 'sub', parentId: '05-structural' },
    { id: '05-structural-concrete', name: 'Concrete', description: 'Cast-in-place concrete work', isActive: true, level: 'sub', parentId: '05-structural' },
    { id: '05-structural-masonry', name: 'Masonry', description: 'Brick, block, stone masonry work', isActive: true, level: 'sub', parentId: '05-structural' },
    { id: '05-structural-metals', name: 'Structural Metals', description: 'Structural steel, miscellaneous metals', isActive: true, level: 'sub', parentId: '05-structural' }
  ],
  
  // 06 - Building Envelope
  '06-envelope': [
    { id: '06-envelope-walls', name: 'Exterior Walls', description: 'Exterior walls, siding, façade', isActive: true, level: 'sub', parentId: '06-envelope' },
    { id: '06-envelope-roofing', name: 'Roofing', description: 'Roof systems, gutters, downspouts', isActive: true, level: 'sub', parentId: '06-envelope' },
    { id: '06-envelope-insulation', name: 'Insulation', description: 'Building insulation and vapor barriers', isActive: true, level: 'sub', parentId: '06-envelope' },
    { id: '06-envelope-windows', name: 'Windows', description: 'Windows and skylights', isActive: true, level: 'sub', parentId: '06-envelope' },
    { id: '06-envelope-doors', name: 'Exterior Doors', description: 'Entry and garage doors', isActive: true, level: 'sub', parentId: '06-envelope' },
    { id: '06-envelope-waterproofing', name: 'Waterproofing', description: 'Building waterproofing and dampproofing', isActive: true, level: 'sub', parentId: '06-envelope' }
  ],
  
  // 07 - Building Systems
  '07-systems': [
    { id: '07-systems-plumbing', name: 'Plumbing', description: 'Plumbing fixtures, piping, water heaters', isActive: true, level: 'sub', parentId: '07-systems' },
    { id: '07-systems-hvac', name: 'HVAC', description: 'Heating, ventilation, air conditioning', isActive: true, level: 'sub', parentId: '07-systems' },
    { id: '07-systems-electrical', name: 'Electrical', description: 'Electrical wiring, panels, fixtures', isActive: true, level: 'sub', parentId: '07-systems' },
    { id: '07-systems-low-voltage', name: 'Low Voltage', description: 'Data, security, audiovisual systems', isActive: true, level: 'sub', parentId: '07-systems' },
    { id: '07-systems-fire', name: 'Fire Protection', description: 'Fire sprinkler, alarm systems', isActive: true, level: 'sub', parentId: '07-systems' },
    { id: '07-systems-renewable', name: 'Renewable Energy', description: 'Solar, geothermal, alternative energy', isActive: true, level: 'sub', parentId: '07-systems' }
  ],
  
  // 08 - Interior Construction
  '08-interior': [
    { id: '08-interior-framing', name: 'Interior Framing', description: 'Interior wall framing, soffits, backing', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-drywall', name: 'Drywall', description: 'Gypsum board, taping, texturing', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-doors', name: 'Interior Doors', description: 'Interior doors and trim', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-flooring', name: 'Flooring', description: 'All floor finishes and underlayment', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-finishes', name: 'Interior Finishes', description: 'Painting, wall coverings, finishing', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-tile', name: 'Tile & Stone', description: 'Ceramic tile, stone finishes', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-cabinetry', name: 'Cabinetry', description: 'Cabinets and built-ins', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-countertops', name: 'Countertops', description: 'Kitchen, bathroom countertops', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-bathroom', name: 'Bathroom Finishes', description: 'Bathroom fixtures and specialties', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-lighting', name: 'Lighting Fixtures', description: 'Interior lighting and fixtures', isActive: true, level: 'sub', parentId: '08-interior' },
    { id: '08-interior-millwork', name: 'Millwork', description: 'Custom woodwork and trim', isActive: true, level: 'sub', parentId: '08-interior' }
  ],
  
  // 09 - Specialties
  '09-specialties': [
    { id: '09-specialties-appliances', name: 'Appliances', description: 'Kitchen and laundry appliances', isActive: true, level: 'sub', parentId: '09-specialties' },
    { id: '09-specialties-fixtures', name: 'Specialty Fixtures', description: 'Specialty fixtures and equipment', isActive: true, level: 'sub', parentId: '09-specialties' },
    { id: '09-specialties-equipment', name: 'Equipment', description: 'Special equipment and machinery', isActive: true, level: 'sub', parentId: '09-specialties' },
    { id: '09-specialties-furnishings', name: 'Furnishings', description: 'Window treatments, built-in furniture', isActive: true, level: 'sub', parentId: '09-specialties' }
  ],
  
  // 10 - Exterior Improvements
  '10-exterior': [
    { id: '10-exterior-landscaping', name: 'Landscaping', description: 'Plants, trees, soil, mulch', isActive: true, level: 'sub', parentId: '10-exterior' },
    { id: '10-exterior-hardscaping', name: 'Hardscaping', description: 'Patios, retaining walls, outdoor features', isActive: true, level: 'sub', parentId: '10-exterior' },
    { id: '10-exterior-irrigation', name: 'Irrigation', description: 'Irrigation systems, sprinklers', isActive: true, level: 'sub', parentId: '10-exterior' },
    { id: '10-exterior-fencing', name: 'Fencing', description: 'Fences, gates, exterior railings', isActive: true, level: 'sub', parentId: '10-exterior' },
    { id: '10-exterior-recreation', name: 'Recreation', description: 'Pools, spas, outdoor recreation', isActive: true, level: 'sub', parentId: '10-exterior' }
  ],
  
  // 11 - Project Completion
  '11-completion': [
    { id: '11-completion-cleaning', name: 'Final Cleaning', description: 'Final construction cleaning', isActive: true, level: 'sub', parentId: '11-completion' },
    { id: '11-completion-punchlist', name: 'Punch List', description: 'Punch list work and corrections', isActive: true, level: 'sub', parentId: '11-completion' },
    { id: '11-completion-closeout', name: 'Project Closeout', description: 'Final documentation and closeout', isActive: true, level: 'sub', parentId: '11-completion' },
    { id: '11-completion-warranty', name: 'Warranty Items', description: 'Warranty work and repairs', isActive: true, level: 'sub', parentId: '11-completion' }
  ],
  
  // 12 - Project Reserves
  '12-reserves': [
    { id: '12-reserves-contingency', name: 'Contingency', description: 'Project contingency funds', isActive: true, level: 'sub', parentId: '12-reserves' },
    { id: '12-reserves-allowances', name: 'Allowances', description: 'Allowance items and budgets', isActive: true, level: 'sub', parentId: '12-reserves' },
    { id: '12-reserves-change', name: 'Change Orders', description: 'Reserved funds for change orders', isActive: true, level: 'sub', parentId: '12-reserves' }
  ]
};

// Helper function to get all categories flattened into a single array
export const getAllCategories = (): Category[] => {
  const allCategories = [...ENHANCED_MAIN_CATEGORIES];
  
  // Add all subcategories
  Object.values(SUB_CATEGORIES).forEach(categoryGroup => {
    allCategories.push(...categoryGroup);
  });
  
  return allCategories;
};

// Helper function to get subcategories for a specific parent category
export const getSubCategories = (parentCategoryId: string): Category[] => {
  return SUB_CATEGORIES[parentCategoryId] || [];
};

// Helper function to check if a category has children
export const hasChildren = (categoryId: string): boolean => {
  return Boolean(SUB_CATEGORIES[categoryId] && SUB_CATEGORIES[categoryId].length > 0);
};

// Helper function to get category by ID
export const getCategoryById = (categoryId: string): Category | undefined => {
  return getAllCategories().find(category => category.id === categoryId);
};

// Helper function to get parent category of a subcategory
export const getParentCategory = (categoryId: string): Category | undefined => {
  // If it's a main category, it has no parent
  if (ENHANCED_MAIN_CATEGORIES.some(cat => cat.id === categoryId)) {
    return undefined;
  }
  
  // Find parent of subcategory
  for (const [parentId, subcategories] of Object.entries(SUB_CATEGORIES)) {
    if (subcategories.some(cat => cat.id === categoryId)) {
      return getCategoryById(parentId);
    }
  }
  
  return undefined;
};

// Helper to get full category path (parent > child)
export const getCategoryPath = (categoryId: string): string => {
  const category = getCategoryById(categoryId);
  if (!category) return '';
  
  const parent = getParentCategory(categoryId);
  if (!parent) return category.name;
  
  return `${parent.name} > ${category.name}`;
};