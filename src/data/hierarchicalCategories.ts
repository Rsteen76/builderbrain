import { Category, CategoryWithChildren } from '../types/category.types';

/**
 * Hierarchical construction categories for detailed expense tracking and reporting
 * Enhanced with more comprehensive subcategories for better budget allocation
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
        keywords: ['buy', 'property', 'land', 'purchase', 'acquisition'],
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
      },
      {
        id: 'acquisition-financing',
        name: 'Financing Costs',
        description: 'Loan origination fees, points, and other financing costs',
        level: 'sub',
        parentId: 'acquisition',
        order: 4,
        isActive: true,
        keywords: ['loan', 'mortgage', 'financing', 'bank', 'interest', 'points'],
        children: []
      },
      {
        id: 'acquisition-insurance',
        name: 'Insurance (Prepaid)',
        description: 'Prepaid insurance at closing',
        level: 'sub',
        parentId: 'acquisition',
        order: 5,
        isActive: true,
        keywords: ['insurance', 'prepaid', 'policy'],
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
        keywords: ['architect', 'plans', 'drawings', 'blueprints', 'design'],
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
        keywords: ['structural', 'civil', 'mechanical', 'electrical', 'engineering'],
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
        keywords: ['building permit', 'inspection', 'city', 'county', 'fees', 'permit'],
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
        keywords: ['land survey', 'soil', 'environmental', 'testing', 'survey'],
        children: []
      },
      {
        id: 'pre-construction-insurance',
        name: 'Construction Insurance',
        description: 'Builder\'s risk and liability insurance',
        level: 'sub',
        parentId: 'pre-construction',
        order: 5,
        isActive: true,
        keywords: ['insurance', 'builders risk', 'liability', 'policy'],
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
        keywords: ['demo', 'demolish', 'tear down', 'removal', 'demolition'],
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
        keywords: ['digging', 'grading', 'earthwork', 'leveling', 'excavation'],
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
        keywords: ['water', 'sewer', 'electric', 'gas', 'connections', 'utility'],
        children: []
      },
      {
        id: 'site-work-erosion',
        name: 'Erosion Control',
        description: 'Silt fencing, erosion mats, drainage systems',
        level: 'sub',
        parentId: 'site-work',
        order: 4,
        isActive: true,
        keywords: ['erosion', 'silt fence', 'drainage', 'runoff', 'control'],
        children: []
      },
      {
        id: 'site-work-improvements',
        name: 'Site Improvements',
        description: 'Driveways, walkways, retaining walls',
        level: 'sub',
        parentId: 'site-work',
        order: 5,
        isActive: true,
        keywords: ['driveway', 'walkway', 'retaining wall', 'landscape', 'improvement'],
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
      },
      {
        id: 'foundation-footings',
        name: 'Footings',
        description: 'Structural footings and foundation support',
        level: 'sub',
        parentId: 'foundation',
        order: 3,
        isActive: true,
        keywords: ['footings', 'base', 'structural', 'support'],
        children: []
      },
      {
        id: 'foundation-walls',
        name: 'Foundation Walls',
        description: 'Block or poured foundation walls',
        level: 'sub',
        parentId: 'foundation',
        order: 4,
        isActive: true,
        keywords: ['foundation walls', 'block', 'poured walls', 'block walls'],
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
        keywords: ['lumber', 'wood', 'beams', 'joists', 'studs', 'materials'],
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
        keywords: ['labor', 'carpenter', 'crew', 'installation', 'framing labor'],
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
        keywords: ['trusses', 'rafters', 'roof', 'structure', 'roof framing'],
        children: []
      },
      {
        id: 'framing-steel',
        name: 'Steel Framing',
        description: 'Structural steel and metal framing components',
        level: 'sub',
        parentId: 'framing',
        order: 4,
        isActive: true,
        keywords: ['steel', 'metal', 'structural steel', 'steel beam', 'steel column'],
        children: []
      },
      {
        id: 'framing-sheathing',
        name: 'Sheathing',
        description: 'Wall and roof sheathing materials',
        level: 'sub',
        parentId: 'framing',
        order: 5,
        isActive: true,
        keywords: ['sheathing', 'plywood', 'osb', 'zip system', 'wall board'],
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
        keywords: ['roof', 'shingles', 'tiles', 'membrane', 'roofing'],
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
        keywords: ['siding', 'facade', 'cladding', 'stucco', 'exterior finish'],
        children: []
      },
      {
        id: 'exterior-windows',
        name: 'Windows',
        description: 'Window materials and installation',
        level: 'sub',
        parentId: 'exterior',
        order: 3,
        isActive: true,
        keywords: ['windows', 'glass', 'glazing', 'window installation'],
        children: []
      },
      {
        id: 'exterior-doors',
        name: 'Exterior Doors',
        description: 'Entry, patio, and garage doors',
        level: 'sub',
        parentId: 'exterior',
        order: 4,
        isActive: true,
        keywords: ['doors', 'entry door', 'garage door', 'patio door', 'french doors'],
        children: []
      },
      {
        id: 'exterior-masonry',
        name: 'Masonry & Stone',
        description: 'Brick, stone, and blockwork',
        level: 'sub',
        parentId: 'exterior',
        order: 5,
        isActive: true,
        keywords: ['masonry', 'brick', 'stone', 'block', 'veneer'],
        children: []
      },
      {
        id: 'exterior-gutters',
        name: 'Gutters & Downspouts',
        description: 'Rainwater management systems',
        level: 'sub',
        parentId: 'exterior',
        order: 6,
        isActive: true,
        keywords: ['gutters', 'downspouts', 'rain', 'drainage', 'water management'],
        children: []
      }
    ]
  },
  {
    id: 'mechanical',
    name: 'Mechanical Systems',
    description: 'HVAC, plumbing, and electrical systems',
    level: 'main',
    order: 7,
    isActive: true,
    color: '#26a69a',
    children: [
      {
        id: 'mechanical-hvac',
        name: 'HVAC',
        description: 'Heating, ventilation, and air conditioning',
        level: 'sub',
        parentId: 'mechanical',
        order: 1,
        isActive: true,
        keywords: ['hvac', 'heating', 'cooling', 'ventilation', 'air conditioning', 'furnace', 'ac'],
        children: []
      },
      {
        id: 'mechanical-plumbing',
        name: 'Plumbing',
        description: 'Water supply and drainage systems',
        level: 'sub',
        parentId: 'mechanical',
        order: 2,
        isActive: true,
        keywords: ['plumbing', 'pipe', 'water', 'drain', 'sewer', 'plumber'],
        children: []
      },
      {
        id: 'mechanical-electrical',
        name: 'Electrical',
        description: 'Electrical wiring and systems',
        level: 'sub',
        parentId: 'mechanical',
        order: 3,
        isActive: true,
        keywords: ['electrical', 'wiring', 'panel', 'breaker', 'outlet', 'switch', 'electrician'],
        children: []
      },
      {
        id: 'mechanical-low-voltage',
        name: 'Low Voltage & Smart Home',
        description: 'Data, audio/video, security, and home automation',
        level: 'sub',
        parentId: 'mechanical',
        order: 4,
        isActive: true,
        keywords: ['low voltage', 'smart home', 'automation', 'data', 'network', 'security', 'audio', 'video'],
        children: []
      },
      {
        id: 'mechanical-fire-protection',
        name: 'Fire Protection',
        description: 'Sprinkler systems and fire alarms',
        level: 'sub',
        parentId: 'mechanical',
        order: 5,
        isActive: true,
        keywords: ['fire', 'sprinkler', 'alarm', 'smoke detector', 'suppression'],
        children: []
      },
      {
        id: 'mechanical-plumbing-fixtures',
        name: 'Plumbing Fixtures',
        description: 'Sinks, faucets, toilets, tubs, and showers',
        level: 'sub',
        parentId: 'mechanical',
        order: 6,
        isActive: true,
        keywords: ['sink', 'faucet', 'toilet', 'tub', 'shower', 'plumbing fixture', 'bathroom fixture', 'kitchen fixture'],
        children: []
      }
    ]
  },
  {
    id: 'interior-rough',
    name: 'Interior Rough-in',
    description: 'Interior work before finishing',
    level: 'main',
    order: 8,
    isActive: true,
    color: '#7e57c2',
    children: [
      {
        id: 'interior-rough-insulation',
        name: 'Insulation',
        description: 'Thermal and acoustic insulation',
        level: 'sub',
        parentId: 'interior-rough',
        order: 1,
        isActive: true,
        keywords: ['insulation', 'thermal', 'acoustic', 'fiberglass', 'spray foam', 'blown in'],
        children: []
      },
      {
        id: 'interior-rough-soundproofing',
        name: 'Soundproofing',
        description: 'Sound isolation and acoustic treatments',
        level: 'sub',
        parentId: 'interior-rough',
        order: 2,
        isActive: true,
        keywords: ['soundproof', 'acoustic', 'sound barrier', 'sound insulation', 'resilient channel'],
        children: []
      },
      {
        id: 'interior-rough-electrical',
        name: 'Rough Electrical',
        description: 'Electrical wiring before walls are closed',
        level: 'sub',
        parentId: 'interior-rough',
        order: 3,
        isActive: true,
        keywords: ['rough electrical', 'wiring', 'electrical box', 'switch box', 'outlet box', 'rough-in electric'],
        children: []
      },
      {
        id: 'interior-rough-plumbing',
        name: 'Rough Plumbing',
        description: 'Plumbing lines before walls are closed',
        level: 'sub',
        parentId: 'interior-rough',
        order: 4,
        isActive: true,
        keywords: ['rough plumbing', 'pipe', 'drain', 'vent', 'water line', 'rough-in plumbing'],
        children: []
      },
      {
        id: 'interior-rough-hvac',
        name: 'Rough HVAC',
        description: 'Ductwork and HVAC infrastructure before walls are closed',
        level: 'sub',
        parentId: 'interior-rough',
        order: 5,
        isActive: true,
        keywords: ['rough hvac', 'duct', 'ductwork', 'air return', 'supply line', 'hvac rough-in'],
        children: []
      }
    ]
  },
  {
    id: 'interior-finishes',
    name: 'Interior Finishes',
    description: 'All interior finishing work after rough-in',
    level: 'main',
    order: 9,
    isActive: true,
    color: '#5c6bc0',
    children: [
      {
        id: 'interior-finishes-drywall-system',
        name: 'Drywall Installation & Finishing',
        description: 'Wall/ceiling board installation, taping, finishing, and texturing',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 2,
        isActive: true,
        keywords: ['drywall', 'gypsum', 'sheetrock', 'plaster', 'mud', 'tape', 'hang', 'finish', 'texture'],
        children: []
      },
      {
        id: 'interior-finishes-flooring',
        name: 'Flooring',
        description: 'All flooring materials and installation',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 3,
        isActive: true,
        keywords: ['flooring', 'carpet', 'tile', 'hardwood', 'laminate', 'vinyl', 'floor'],
        children: []
      },
      {
        id: 'interior-finishes-tile',
        name: 'Tile Work',
        description: 'Ceramic, porcelain, and stone tile installation',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 4,
        isActive: true,
        keywords: ['tile', 'ceramic', 'porcelain', 'stone', 'shower', 'backsplash', 'grout'],
        children: []
      },
      {
        id: 'interior-finishes-trim',
        name: 'Trim & Carpentry',
        description: 'Baseboards, crown molding, and finish carpentry',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 5,
        isActive: true,
        keywords: ['trim', 'baseboard', 'crown molding', 'casing', 'millwork', 'carpentry'],
        children: []
      },
      {
        id: 'interior-finishes-cabinets',
        name: 'Cabinets & Countertops',
        description: 'Kitchen and bathroom cabinetry and counters',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 6,
        isActive: true,
        keywords: ['cabinet', 'counter', 'countertop', 'vanity', 'granite', 'quartz', 'kitchen'],
        children: []
      },
      {
        id: 'interior-finishes-doors',
        name: 'Interior Doors',
        description: 'Interior passage and closet doors',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 7,
        isActive: true,
        keywords: ['door', 'interior door', 'pocket door', 'barn door', 'closet door', 'passage'],
        children: []
      },
      {
        id: 'interior-finishes-lighting',
        name: 'Lighting Fixtures',
        description: 'Interior lighting fixtures and installation',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 8,
        isActive: true,
        keywords: ['light fixture', 'lighting', 'chandelier', 'sconce', 'pendant', 'ceiling fan', 'recessed light', 'lamp'],
        children: []
      },
      {
        id: 'interior-finishes-paint',
        name: 'Painting & Wallcovering',
        description: 'Interior painting and wall finishes',
        level: 'sub',
        parentId: 'interior-finishes',
        order: 9,
        isActive: true,
        keywords: ['paint', 'primer', 'wallpaper', 'texture', 'finish', 'wall covering'],
        children: []
      }
    ]
  },
  {
    id: 'specialty',
    name: 'Specialty Items',
    description: 'Special features and custom elements',
    level: 'main',
    order: 10,
    isActive: true,
    color: '#ec407a',
    children: [
      {
        id: 'specialty-appliances',
        name: 'Appliances',
        description: 'Kitchen and laundry appliances',
        level: 'sub',
        parentId: 'specialty',
        order: 1,
        isActive: true,
        keywords: ['appliance', 'refrigerator', 'range', 'oven', 'dishwasher', 'washer', 'dryer', 'microwave'],
        children: []
      },
      {
        id: 'specialty-stairs',
        name: 'Stairs & Railings',
        description: 'Stairways, railings, and balustrades',
        level: 'sub',
        parentId: 'specialty',
        order: 2,
        isActive: true,
        keywords: ['stairs', 'staircase', 'railing', 'handrail', 'baluster', 'banister'],
        children: []
      },
      {
        id: 'specialty-fireplace',
        name: 'Fireplace & Chimney',
        description: 'Fireplace construction and finishing',
        level: 'sub',
        parentId: 'specialty',
        order: 3,
        isActive: true,
        keywords: ['fireplace', 'chimney', 'hearth', 'mantel', 'fire', 'wood burning'],
        children: []
      },
      {
        id: 'specialty-deck',
        name: 'Deck & Patio',
        description: 'Outdoor living spaces',
        level: 'sub',
        parentId: 'specialty',
        order: 4,
        isActive: true,
        keywords: ['deck', 'patio', 'porch', 'balcony', 'outdoor', 'terrace'],
        children: []
      },
      {
        id: 'specialty-pool',
        name: 'Pool & Spa',
        description: 'Swimming pools, hot tubs, and water features',
        level: 'sub',
        parentId: 'specialty',
        order: 6,
        isActive: true,
        keywords: ['pool', 'spa', 'hot tub', 'sauna', 'water feature', 'fountain'],
        children: []
      },
      {
        id: 'specialty-accessible',
        name: 'Accessibility Features',
        description: 'ADA compliant and accessibility modifications',
        level: 'sub',
        parentId: 'specialty',
        order: 7,
        isActive: true,
        keywords: ['accessible', 'ada', 'handicap', 'ramp', 'elevator', 'lift'],
        children: []
      }
    ]
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project management and oversight',
    level: 'main',
    order: 11,
    isActive: true,
    color: '#78909c',
    children: [
      {
        id: 'project-management-general',
        name: 'General Conditions',
        description: 'Site supervision, temporary utilities, and facilities',
        level: 'sub',
        parentId: 'project-management',
        order: 1,
        isActive: true,
        keywords: ['general conditions', 'supervision', 'job site', 'temporary', 'facilities'],
        children: []
      },
      {
        id: 'project-management-fees',
        name: 'Management Fees',
        description: 'Contractor and project management fees',
        level: 'sub',
        parentId: 'project-management',
        order: 2,
        isActive: true,
        keywords: ['management fee', 'overhead', 'profit', 'supervision', 'admin'],
        children: []
      },
      {
        id: 'project-management-inspection',
        name: 'Inspections & Testing',
        description: 'Building inspections and quality testing',
        level: 'sub',
        parentId: 'project-management',
        order: 3,
        isActive: true,
        keywords: ['inspection', 'testing', 'quality control', 'code', 'approval'],
        children: []
      },
      {
        id: 'project-management-safety',
        name: 'Safety Management',
        description: 'Safety equipment, training, and compliance',
        level: 'sub',
        parentId: 'project-management',
        order: 4,
        isActive: true,
        keywords: ['safety', 'osha', 'compliance', 'ppe', 'fall protection', 'safety training'],
        children: []
      },
      {
        id: 'project-management-documentation',
        name: 'Documentation & Reporting',
        description: 'Progress reports, submittals, and project documentation',
        level: 'sub',
        parentId: 'project-management',
        order: 5,
        isActive: true,
        keywords: ['documentation', 'report', 'submittal', 'rfi', 'photo', 'progress report'],
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
        keywords: ['debris', 'waste', 'cleaning', 'removal', 'dumpster', 'trash', 'disposal'],
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
      },
      {
        id: 'cleanup-punch',
        name: 'Punch List',
        description: 'Addressing final deficiencies and corrections',
        level: 'sub',
        parentId: 'cleanup',
        order: 3,
        isActive: true,
        keywords: ['punch list', 'correction', 'deficiency', 'fix', 'repair', 'final inspection'],
        children: []
      },
      {
        id: 'cleanup-handover',
        name: 'Project Handover',
        description: 'Documentation and training for the owner',
        level: 'sub',
        parentId: 'cleanup',
        order: 4,
        isActive: true,
        keywords: ['handover', 'turnover', 'warranty', 'manual', 'training', 'as-built', 'closeout'],
        children: []
      }
    ]
  },
  {
    id: 'contingency',
    name: 'Contingency & Reserves',
    description: 'Funds set aside for unexpected costs',
    level: 'main',
    order: 14,
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
  
  // Plumbing Fixtures
  if (desc.includes('sink') || desc.includes('faucet') || desc.includes('toilet') || 
      desc.includes('tub') || desc.includes('shower') || desc.includes('plumbing fixture')) {
    return 'mechanical-plumbing-fixtures';
  }
  
  // Lighting Fixtures
  if (desc.includes('light fixture') || desc.includes('lighting') || desc.includes('chandelier') || 
      desc.includes('sconce') || desc.includes('pendant') || desc.includes('ceiling fan') || 
      desc.includes('recessed light')) {
    return 'interior-lighting-fixtures';
  }
  
  // Appliances
  if (desc.includes('appliance') || desc.includes('refrigerator') || desc.includes('dishwasher') || 
      desc.includes('oven') || desc.includes('range') || desc.includes('microwave') || 
      desc.includes('washer') || desc.includes('dryer')) {
    return 'specialty-appliances';
  }
  
  // Landscaping
  if (desc.includes('landscape') || desc.includes('garden') || desc.includes('plants') || 
      desc.includes('tree') || desc.includes('shrub') || desc.includes('lawn') || 
      vendor.includes('landscape')) {
    return 'landscape-softscape';
  }
  
  if (desc.includes('irrigation') || desc.includes('sprinkler') || desc.includes('drainage') && 
      (desc.includes('landscape') || desc.includes('lawn') || desc.includes('garden'))) {
    return 'landscape-irrigation';
  }
  
  // Drywall System (Installation & Finishing)
  if (desc.includes('drywall') || desc.includes('gypsum') || desc.includes('sheetrock') || 
      desc.includes('plaster') || desc.includes('mud') || desc.includes('tape') || 
      desc.includes('hang') || desc.includes('finish') && desc.includes('wall') ||
      vendor.includes('drywall')) {
    return 'interior-finishes-drywall-system';
  }
  
  // If no specific match is found, default to 'other'
  return 'uncategorized';
};

export default MAIN_CATEGORIES;