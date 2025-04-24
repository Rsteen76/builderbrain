import { Category, CategoryWithChildren } from '../types/category.types';

/**
 * Enhanced hierarchical construction categories for detailed expense tracking and reporting
 * Follows construction sequence and industry-standard organization
 */
export const NEW_MAIN_CATEGORIES: CategoryWithChildren[] = [
  {
    id: '01-acquisition',
    name: 'Project Acquisition',
    description: 'Property acquisition and initial project costs',
    level: 'main',
    order: 1,
    isActive: true,
    color: '#1976d2', // blue
    children: [
      {
        id: '01-acquisition-purchase',
        name: 'Property Purchase',
        description: 'Property and land acquisition costs',
        level: 'sub',
        parentId: '01-acquisition',
        order: 1,
        isActive: true,
        keywords: ['property', 'land', 'purchase', 'acquisition', 'buy', 'real estate'],
        children: []
      },
      {
        id: '01-acquisition-closing',
        name: 'Closing Costs',
        description: 'Fees associated with property closing',
        level: 'sub',
        parentId: '01-acquisition',
        order: 2,
        isActive: true,
        keywords: ['closing', 'escrow', 'title', 'fees', 'taxes', 'settlement'],
        children: []
      },
      {
        id: '01-acquisition-financing',
        name: 'Financing & Fees',
        description: 'Loan costs, points, and financing fees',
        level: 'sub',
        parentId: '01-acquisition',
        order: 3,
        isActive: true,
        keywords: ['loan', 'mortgage', 'interest', 'points', 'financing', 'bank', 'lender'],
        children: []
      },
      {
        id: '01-acquisition-insurance',
        name: 'Pre-Construction Insurance',
        description: 'Insurance coverage before construction begins',
        level: 'sub',
        parentId: '01-acquisition',
        order: 4,
        isActive: true,
        keywords: ['insurance', 'policy', 'premium', 'liability', 'coverage', 'prepaid'],
        children: []
      }
    ]
  },
  {
    id: '02-professional',
    name: 'Professional Services',
    description: 'Design, engineering, and consulting services',
    level: 'main',
    order: 2,
    isActive: true,
    color: '#9c27b0', // purple
    children: [
      {
        id: '02-professional-architecture',
        name: 'Architectural Design',
        description: 'Architectural plans and design services',
        level: 'sub',
        parentId: '02-professional',
        order: 1,
        isActive: true,
        keywords: ['architect', 'design', 'plans', 'drawings', 'blueprints', 'renderings'],
        children: []
      },
      {
        id: '02-professional-engineering',
        name: 'Engineering Services',
        description: 'Engineering design and consulting',
        level: 'sub',
        parentId: '02-professional',
        order: 2,
        isActive: true,
        keywords: ['engineer', 'structural', 'civil', 'mechanical', 'electrical', 'plumbing', 'MEP'],
        children: []
      },
      {
        id: '02-professional-consulting',
        name: 'Consulting & Specialty Design',
        description: 'Specialized consultants and designers',
        level: 'sub',
        parentId: '02-professional',
        order: 3,
        isActive: true,
        keywords: ['consultant', 'specialist', 'expert', 'advisor', 'lighting', 'acoustics', 'interior design'],
        children: []
      },
      {
        id: '02-professional-permits',
        name: 'Permit Management & Expediting',
        description: 'Permit acquisition and approval process',
        level: 'sub',
        parentId: '02-professional',
        order: 4,
        isActive: true,
        keywords: ['permit', 'approval', 'fee', 'expediting', 'zoning', 'code', 'review'],
        children: []
      },
      {
        id: '02-professional-surveys',
        name: 'Surveying & Testing',
        description: 'Property surveys and site testing',
        level: 'sub',
        parentId: '02-professional',
        order: 5,
        isActive: true,
        keywords: ['survey', 'testing', 'soil', 'environmental', 'topographic', 'boundary'],
        children: []
      }
    ]
  },
  {
    id: '03-general',
    name: 'General Requirements',
    description: 'Project management, general conditions, and overhead',
    level: 'main',
    order: 3,
    isActive: true,
    color: '#ff9800', // orange
    children: [
      {
        id: '03-general-management',
        name: 'Project Management & Supervision',
        description: 'Overall project supervision and management',
        level: 'sub',
        parentId: '03-general',
        order: 1,
        isActive: true,
        keywords: ['project manager', 'supervision', 'superintendent', 'oversight', 'coordination'],
        children: []
      },
      {
        id: '03-general-conditions',
        name: 'General Conditions',
        description: 'Job site office, utilities, and administrative costs',
        level: 'sub',
        parentId: '03-general',
        order: 2,
        isActive: true,
        keywords: ['general conditions', 'job trailer', 'temporary', 'office', 'administrative', 'overhead'],
        children: []
      },
      {
        id: '03-general-temporary',
        name: 'Temporary Facilities & Controls',
        description: 'Temporary structures, utilities, and site measures',
        level: 'sub',
        parentId: '03-general',
        order: 3,
        isActive: true,
        keywords: ['temporary', 'toilet', 'fence', 'power', 'water', 'storage', 'portable'],
        children: []
      },
      {
        id: '03-general-safety',
        name: 'Safety & Compliance',
        description: 'Safety equipment, training, and compliance',
        level: 'sub',
        parentId: '03-general',
        order: 4,
        isActive: true,
        keywords: ['safety', 'OSHA', 'compliance', 'PPE', 'training', 'protection', 'guardrail'],
        children: []
      },
      {
        id: '03-general-quality',
        name: 'Quality Control & Testing',
        description: 'Quality assurance and materials testing',
        level: 'sub',
        parentId: '03-general',
        order: 5,
        isActive: true,
        keywords: ['quality', 'testing', 'inspection', 'QA/QC', 'material', 'verification'],
        children: []
      },
      {
        id: '03-general-documentation',
        name: 'Project Documentation',
        description: 'Reports, photos, and project documentation',
        level: 'sub',
        parentId: '03-general',
        order: 6,
        isActive: true,
        keywords: ['documentation', 'report', 'photo', 'record', 'log', 'submittal', 'RFI'],
        children: []
      },
      {
        id: '03-general-insurance',
        name: 'Bonds & Insurance',
        description: 'Project bonds, insurance, and warranty',
        level: 'sub',
        parentId: '03-general',
        order: 7,
        isActive: true,
        keywords: ['bond', 'insurance', 'warranty', 'liability', 'builders risk', 'performance'],
        children: []
      }
    ]
  },
  {
    id: '04-site',
    name: 'Site Development',
    description: 'Site preparation and development',
    level: 'main',
    order: 4,
    isActive: true,
    color: '#f57c00', // dark orange
    children: [
      {
        id: '04-site-demolition',
        name: 'Demolition & Removal',
        description: 'Removal of existing structures and materials',
        level: 'sub',
        parentId: '04-site',
        order: 1,
        isActive: true,
        keywords: ['demolition', 'demo', 'removal', 'tear down', 'clearing', 'disposal'],
        children: []
      },
      {
        id: '04-site-earthwork',
        name: 'Earthwork & Excavation',
        description: 'Soil excavation, grading, and earthmoving',
        level: 'sub',
        parentId: '04-site',
        order: 2,
        isActive: true,
        keywords: ['excavation', 'grading', 'soil', 'earth', 'cut', 'fill', 'digger'],
        children: []
      },
      {
        id: '04-site-utilities',
        name: 'Site Utilities & Infrastructure',
        description: 'Underground utilities and site infrastructure',
        level: 'sub',
        parentId: '04-site',
        order: 3,
        isActive: true,
        keywords: ['utilities', 'water', 'sewer', 'electric', 'gas', 'storm', 'drainage'],
        children: []
      },
      {
        id: '04-site-improvements',
        name: 'Site Improvements & Paving',
        description: 'Driveways, walkways, and site improvements',
        level: 'sub',
        parentId: '04-site',
        order: 4,
        isActive: true,
        keywords: ['paving', 'driveway', 'walkway', 'parking', 'asphalt', 'concrete', 'gravel'],
        children: []
      },
      {
        id: '04-site-environmental',
        name: 'Environmental Controls & Protection',
        description: 'Erosion control and environmental protection',
        level: 'sub',
        parentId: '04-site',
        order: 5,
        isActive: true,
        keywords: ['erosion', 'silt fence', 'control', 'environmental', 'protection', 'BMP'],
        children: []
      },
      {
        id: '04-site-concrete',
        name: 'Site Concrete',
        description: 'Exterior concrete work and flatwork',
        level: 'sub',
        parentId: '04-site',
        order: 6,
        isActive: true,
        keywords: ['concrete', 'sidewalk', 'curb', 'gutter', 'flatwork', 'slab'],
        children: []
      }
    ]
  },
  {
    id: '05-structural',
    name: 'Structural Systems',
    description: 'Building structural elements and framing',
    level: 'main',
    order: 5,
    isActive: true,
    color: '#8d6e63', // brown
    children: [
      {
        id: '05-structural-foundation',
        name: 'Foundation Systems',
        description: 'Building foundation and footings',
        level: 'sub',
        parentId: '05-structural',
        order: 1,
        isActive: true,
        keywords: ['foundation', 'footing', 'slab', 'basement', 'pier', 'stem wall'],
        children: []
      },
      {
        id: '05-structural-concrete',
        name: 'Concrete Work',
        description: 'Structural concrete elements',
        level: 'sub',
        parentId: '05-structural',
        order: 2,
        isActive: true,
        keywords: ['concrete', 'rebar', 'forming', 'pour', 'finish', 'cement'],
        children: []
      },
      {
        id: '05-structural-framing',
        name: 'Framing & Carpentry',
        description: 'Wood framing and structural carpentry',
        level: 'sub',
        parentId: '05-structural',
        order: 3,
        isActive: true,
        keywords: ['framing', 'lumber', 'carpentry', 'wood', 'joist', 'stud', 'rafter'],
        children: []
      },
      {
        id: '05-structural-steel',
        name: 'Structural Steel',
        description: 'Steel beams, columns, and connections',
        level: 'sub',
        parentId: '05-structural',
        order: 4,
        isActive: true,
        keywords: ['steel', 'beam', 'column', 'metal', 'fabrication', 'erection', 'welding'],
        children: []
      },
      {
        id: '05-structural-masonry',
        name: 'Masonry Work',
        description: 'Brick, block, and stone structural elements',
        level: 'sub',
        parentId: '05-structural',
        order: 5,
        isActive: true,
        keywords: ['masonry', 'brick', 'block', 'CMU', 'stone', 'mortar', 'mason'],
        children: []
      }
    ]
  },
  {
    id: '06-envelope',
    name: 'Building Envelope',
    description: 'Exterior enclosure and weather barrier',
    level: 'main',
    order: 6,
    isActive: true,
    color: '#43a047', // green
    children: [
      {
        id: '06-envelope-roofing',
        name: 'Roofing Systems',
        description: 'Roof materials and installation',
        level: 'sub',
        parentId: '06-envelope',
        order: 1,
        isActive: true,
        keywords: ['roof', 'shingle', 'tile', 'membrane', 'metal roof', 'flashing'],
        children: []
      },
      {
        id: '06-envelope-walls',
        name: 'Exterior Walls & Cladding',
        description: 'Exterior wall coverings and siding',
        level: 'sub',
        parentId: '06-envelope',
        order: 2,
        isActive: true,
        keywords: ['siding', 'cladding', 'facade', 'EIFS', 'stucco', 'wall system'],
        children: []
      },
      {
        id: '06-envelope-paint',
        name: 'Exterior Painting & Finishes',
        description: 'Exterior painting and finishing',
        level: 'sub',
        parentId: '06-envelope',
        order: 3,
        isActive: true,
        keywords: ['paint', 'exterior paint', 'stain', 'finish', 'coating', 'sealing'],
        children: []
      },
      {
        id: '06-envelope-windows',
        name: 'Windows & Exterior Glass',
        description: 'Windows, glazing, and exterior glass',
        level: 'sub',
        parentId: '06-envelope',
        order: 4,
        isActive: true,
        keywords: ['window', 'glass', 'glazing', 'storefront', 'curtain wall', 'skylight'],
        children: []
      },
      {
        id: '06-envelope-doors',
        name: 'Exterior Doors',
        description: 'Entry doors and exterior doors',
        level: 'sub',
        parentId: '06-envelope',
        order: 5,
        isActive: true,
        keywords: ['door', 'entry', 'exterior door', 'garage door', 'sliding door', 'french door'],
        children: []
      },
      {
        id: '06-envelope-waterproofing',
        name: 'Waterproofing & Insulation',
        description: 'Exterior waterproofing and insulation',
        level: 'sub',
        parentId: '06-envelope',
        order: 6,
        isActive: true,
        keywords: ['waterproof', 'insulation', 'air barrier', 'vapor barrier', 'weatherproofing'],
        children: []
      }
    ]
  },
  {
    id: '07-mechanical',
    name: 'Mechanical Systems',
    description: 'HVAC, plumbing, and electrical systems',
    level: 'main',
    order: 7,
    isActive: true,
    color: '#26a69a', // teal
    children: [
      {
        id: '07-mechanical-hvac',
        name: 'HVAC Systems',
        description: 'Heating, ventilation, and air conditioning',
        level: 'sub',
        parentId: '07-mechanical',
        order: 1,
        isActive: true,
        keywords: ['HVAC', 'heating', 'cooling', 'furnace', 'air conditioning', 'duct', 'ductwork'],
        children: []
      },
      {
        id: '07-mechanical-plumbing',
        name: 'Plumbing Systems',
        description: 'Water supply, drainage, and fixtures',
        level: 'sub',
        parentId: '07-mechanical',
        order: 2,
        isActive: true,
        keywords: ['plumbing', 'pipe', 'fixture', 'water', 'gas', 'bathroom', 'kitchen'],
        children: []
      },
      {
        id: '07-mechanical-electrical',
        name: 'Electrical Systems',
        description: 'Electrical wiring, devices, and service',
        level: 'sub',
        parentId: '07-mechanical',
        order: 3,
        isActive: true,
        keywords: ['electrical', 'wiring', 'panel', 'outlet', 'switch', 'circuit', 'lighting'],
        children: []
      },
      {
        id: '07-mechanical-fire',
        name: 'Fire Protection',
        description: 'Fire suppression and alarm systems',
        level: 'sub',
        parentId: '07-mechanical',
        order: 4,
        isActive: true,
        keywords: ['fire', 'sprinkler', 'alarm', 'protection', 'detection', 'extinguisher'],
        children: []
      },
      {
        id: '07-mechanical-lowvoltage',
        name: 'Low Voltage Systems',
        description: 'Data, security, and smart home systems',
        level: 'sub',
        parentId: '07-mechanical',
        order: 5,
        isActive: true,
        keywords: ['low voltage', 'data', 'network', 'security', 'smart home', 'automation'],
        children: []
      }
    ]
  },
  {
    id: '08-interior',
    name: 'Interior Construction',
    description: 'Interior finishes and systems',
    level: 'main',
    order: 8,
    isActive: true,
    color: '#7e57c2', // deep purple
    children: [
      {
        id: '08-interior-walls',
        name: 'Wall Systems',
        description: 'Interior walls, framing, and drywall',
        level: 'sub',
        parentId: '08-interior',
        order: 1,
        isActive: true,
        keywords: ['drywall', 'partition', 'wall', 'gypsum', 'sheetrock', 'wallboard'],
        children: []
      },
      {
        id: '08-interior-ceilings',
        name: 'Ceilings',
        description: 'Ceiling systems and finishes',
        level: 'sub',
        parentId: '08-interior',
        order: 2,
        isActive: true,
        keywords: ['ceiling', 'suspended', 'acoustical', 'drop ceiling', 'tray ceiling'],
        children: []
      },
      {
        id: '08-interior-flooring',
        name: 'Flooring Systems',
        description: 'All flooring materials and installation',
        level: 'sub',
        parentId: '08-interior',
        order: 3,
        isActive: true,
        keywords: ['flooring', 'carpet', 'hardwood', 'tile', 'laminate', 'vinyl', 'subfloor'],
        children: []
      },
      {
        id: '08-interior-finishes',
        name: 'Interior Finishes',
        description: 'Paint, trim, and interior finishes',
        level: 'sub',
        parentId: '08-interior',
        order: 4,
        isActive: true,
        keywords: ['paint', 'wallpaper', 'trim', 'molding', 'baseboard', 'finishing'],
        children: []
      },
      {
        id: '08-interior-cabinetry',
        name: 'Millwork & Cabinetry',
        description: 'Cabinets, countertops, and built-ins',
        level: 'sub',
        parentId: '08-interior',
        order: 5,
        isActive: true,
        keywords: ['cabinet', 'countertop', 'vanity', 'millwork', 'built-in', 'casework'],
        children: []
      },
      {
        id: '08-interior-doors',
        name: 'Interior Doors & Hardware',
        description: 'Interior doors, trim, and hardware',
        level: 'sub',
        parentId: '08-interior',
        order: 6,
        isActive: true,
        keywords: ['door', 'interior door', 'hardware', 'knob', 'hinge', 'lockset'],
        children: []
      },
      {
        id: '08-interior-stairs',
        name: 'Stairs & Railings',
        description: 'Interior stairs, railings, and banisters',
        level: 'sub',
        parentId: '08-interior',
        order: 7,
        isActive: true,
        keywords: ['stair', 'railing', 'handrail', 'baluster', 'banister', 'tread', 'riser'],
        children: []
      },
      {
        id: '08-interior-specialty',
        name: 'Specialty Interior Features',
        description: 'Custom interior elements and specialties',
        level: 'sub',
        parentId: '08-interior',
        order: 8,
        isActive: true,
        keywords: ['specialty', 'feature', 'custom', 'closet', 'shelving', 'paneling'],
        children: []
      }
    ]
  },
  {
    id: '09-specialties',
    name: 'Specialties & Equipment',
    description: 'Specialty items and equipment',
    level: 'main',
    order: 9,
    isActive: true,
    color: '#ec407a', // pink
    children: [
      {
        id: '09-specialties-appliances',
        name: 'Appliances',
        description: 'Kitchen and laundry appliances',
        level: 'sub',
        parentId: '09-specialties',
        order: 1,
        isActive: true,
        keywords: ['appliance', 'refrigerator', 'oven', 'dishwasher', 'washer', 'dryer'],
        children: []
      },
      {
        id: '09-specialties-fixtures',
        name: 'Specialty Fixtures',
        description: 'Special-purpose fixtures and elements',
        level: 'sub',
        parentId: '09-specialties',
        order: 2,
        isActive: true,
        keywords: ['fixture', 'specialty', 'fireplace', 'hearth', 'wine', 'sauna'],
        children: []
      },
      {
        id: '09-specialties-custom',
        name: 'Custom Features',
        description: 'Custom-designed specialty elements',
        level: 'sub',
        parentId: '09-specialties',
        order: 3,
        isActive: true,
        keywords: ['custom', 'unique', 'specialty', 'feature', 'bespoke', 'one-of-a-kind'],
        children: []
      },
      {
        id: '09-specialties-owner',
        name: 'Owner-Furnished Items',
        description: 'Items provided by the owner',
        level: 'sub',
        parentId: '09-specialties',
        order: 4,
        isActive: true,
        keywords: ['owner', 'furnished', 'provided', 'supplied', 'OFCI', 'OFOI'],
        children: []
      }
    ]
  },
  {
    id: '10-exterior',
    name: 'Exterior Improvements',
    description: 'Landscaping and exterior elements',
    level: 'main',
    order: 10,
    isActive: true,
    color: '#66bb6a', // light green
    children: [
      {
        id: '10-exterior-landscaping',
        name: 'Landscaping',
        description: 'Plants, trees, and living elements',
        level: 'sub',
        parentId: '10-exterior',
        order: 1,
        isActive: true,
        keywords: ['landscaping', 'plant', 'tree', 'shrub', 'sod', 'lawn', 'garden'],
        children: []
      },
      {
        id: '10-exterior-hardscaping',
        name: 'Hardscaping',
        description: 'Non-living landscape elements',
        level: 'sub',
        parentId: '10-exterior',
        order: 2,
        isActive: true,
        keywords: ['hardscape', 'patio', 'walkway', 'wall', 'stone', 'paver', 'edging'],
        children: []
      },
      {
        id: '10-exterior-structures',
        name: 'Outdoor Structures',
        description: 'Decks, pergolas, and outdoor structures',
        level: 'sub',
        parentId: '10-exterior',
        order: 3,
        isActive: true,
        keywords: ['deck', 'pergola', 'gazebo', 'shed', 'arbor', 'trellis', 'outdoor'],
        children: []
      },
      {
        id: '10-exterior-fencing',
        name: 'Fencing & Gates',
        description: 'Property boundaries and access control',
        level: 'sub',
        parentId: '10-exterior',
        order: 4,
        isActive: true,
        keywords: ['fence', 'gate', 'boundary', 'privacy', 'enclosure', 'railing'],
        children: []
      },
      {
        id: '10-exterior-irrigation',
        name: 'Irrigation & Lighting',
        description: 'Landscape irrigation and lighting',
        level: 'sub',
        parentId: '10-exterior',
        order: 5,
        isActive: true,
        keywords: ['irrigation', 'sprinkler', 'lighting', 'landscape light', 'water', 'drainage'],
        children: []
      }
    ]
  },
  {
    id: '11-completion',
    name: 'Project Completion',
    description: 'Final project steps and closeout',
    level: 'main',
    order: 11,
    isActive: true,
    color: '#78909c', // blue grey
    children: [
      {
        id: '11-completion-cleaning',
        name: 'Final Cleaning',
        description: 'Construction and finish cleaning',
        level: 'sub',
        parentId: '11-completion',
        order: 1,
        isActive: true,
        keywords: ['cleaning', 'clean-up', 'debris', 'final clean', 'janitorial', 'detail'],
        children: []
      },
      {
        id: '11-completion-punchlist',
        name: 'Punch List',
        description: 'Final corrections and touch-ups',
        level: 'sub',
        parentId: '11-completion',
        order: 2,
        isActive: true,
        keywords: ['punch list', 'correction', 'touch-up', 'fix', 'repair', 'final'],
        children: []
      },
      {
        id: '11-completion-commissioning',
        name: 'Commissioning',
        description: 'System testing and verification',
        level: 'sub',
        parentId: '11-completion',
        order: 3,
        isActive: true,
        keywords: ['commissioning', 'testing', 'startup', 'verification', 'balancing'],
        children: []
      },
      {
        id: '11-completion-documentation',
        name: 'Documentation & Training',
        description: 'Final documents and owner training',
        level: 'sub',
        parentId: '11-completion',
        order: 4,
        isActive: true,
        keywords: ['documentation', 'manual', 'as-built', 'training', 'handover', 'closeout'],
        children: []
      },
      {
        id: '11-completion-warranty',
        name: 'Warranty Program',
        description: 'Warranty setup and post-completion service',
        level: 'sub',
        parentId: '11-completion',
        order: 5,
        isActive: true,
        keywords: ['warranty', 'guarantee', 'service', 'post-completion', 'callback'],
        children: []
      }
    ]
  },
  {
    id: '12-reserves',
    name: 'Project Reserves',
    description: 'Contingency and reserve funds',
    level: 'main',
    order: 12,
    isActive: true,
    color: '#ff7043', // deep orange
    children: [
      {
        id: '12-reserves-contingency',
        name: 'General Contingency',
        description: 'General project contingency funds',
        level: 'sub',
        parentId: '12-reserves',
        order: 1,
        isActive: true,
        keywords: ['contingency', 'reserve', 'allowance', 'buffer', 'unexpected'],
        children: []
      },
      {
        id: '12-reserves-change',
        name: 'Change Order Allowance',
        description: 'Funds for approved changes and additions',
        level: 'sub',
        parentId: '12-reserves',
        order: 2,
        isActive: true,
        keywords: ['change order', 'CO', 'change', 'modification', 'addition', 'alteration'],
        children: []
      },
      {
        id: '12-reserves-escalation',
        name: 'Price Escalation Reserve',
        description: 'Reserve for material price increases',
        level: 'sub',
        parentId: '12-reserves',
        order: 3,
        isActive: true,
        keywords: ['escalation', 'inflation', 'price increase', 'material cost', 'rise'],
        children: []
      },
      {
        id: '12-reserves-value',
        name: 'Value Engineering Options',
        description: 'Cost saving alternatives and options',
        level: 'sub',
        parentId: '12-reserves',
        order: 4,
        isActive: true,
        keywords: ['value engineering', 'VE', 'savings', 'alternative', 'option', 'cost reduction'],
        children: []
      }
    ]
  }
];

/**
 * Utility functions for working with the new categories
 */

/**
 * Get all new categories (main and subcategories) as a flat array
 */
export const getAllNewCategories = (): CategoryWithChildren[] => {
  const allCategories: CategoryWithChildren[] = [];
  
  NEW_MAIN_CATEGORIES.forEach(mainCategory => {
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
 * Get a new category by ID
 */
export const getNewCategoryById = (categoryId: string): CategoryWithChildren | undefined => {
  const allCategories = getAllNewCategories();
  return allCategories.find(category => category.id === categoryId);
};

/**
 * Get subcategories for a main category
 */
export const getNewSubcategories = (mainCategoryId: string): CategoryWithChildren[] => {
  const mainCategory = NEW_MAIN_CATEGORIES.find(cat => cat.id === mainCategoryId);
  if (!mainCategory) return [];
  
  return mainCategory.children.map(subcat => ({
    ...subcat,
    children: [] // Ensure every subcategory has the children property
  }));
};

/**
 * Get parent category for a subcategory
 */
export const getNewParentCategory = (subCategoryId: string): CategoryWithChildren | undefined => {
  const allCategories = getAllNewCategories();
  const subCategory = allCategories.find(cat => cat.id === subCategoryId);
  
  if (!subCategory || !subCategory.parentId) {
    return undefined;
  }
  
  return NEW_MAIN_CATEGORIES.find(cat => cat.id === subCategory.parentId);
}; 