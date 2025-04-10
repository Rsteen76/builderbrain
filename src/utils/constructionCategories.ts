/**
 * @deprecated Use data/hierarchicalCategories.ts instead.
 * Standard construction categories for budget tracking and expense categorization.
 * This is the single source of truth for construction categories throughout the application.
 */
export const CONSTRUCTION_CATEGORIES = {
  // Add Land Purchase category
  'land': [
    { id: 'land_purchase', name: 'Land Purchase', description: 'Cost of acquiring the building lot' },
    { id: 'land_financing', name: 'Land Financing', description: 'Costs associated with land loans' },
  ],
  
  // Add Escrow/Closing category
  'escrow': [
    { id: 'closing_costs', name: 'Closing Costs', description: 'Fees paid at property closing (title, appraisal, etc.)' },
    { id: 'escrow_fees', name: 'Escrow Fees', description: 'Fees for escrow services during closing' },
    { id: 'property_taxes_prepaid', name: 'Property Taxes (Prepaid)', description: 'Prepaid property taxes at closing' },
    { id: 'insurance_prepaid', name: 'Insurance (Prepaid)', description: "Prepaid homeowner's insurance at closing" },
  ],

  // Pre-Construction
  'pre_construction': [
    { id: 'design_fees', name: 'Design Fees', description: 'Architectural and engineering design services' },
    { id: 'permits', name: 'Permits & Fees', description: 'Building permits, impact fees, connection fees' },
    { id: 'surveys', name: 'Surveys', description: 'Land surveys, soil testing, environmental studies' },
    { id: 'insurance', name: 'Insurance', description: 'Builder\'s risk insurance, liability insurance' },
  ],
  
  // Site Work
  'site_work': [
    { id: 'demolition', name: 'Demolition', description: 'Removal of existing structures' },
    { id: 'excavation_grading', name: 'Excavation & Grading', description: 'Site preparation, earth moving, grading' },
    { id: 'utilities', name: 'Utilities', description: 'Water, sewer, gas, electrical service connections' },
    { id: 'erosion_control', name: 'Erosion Control', description: 'Silt fencing, erosion mats, drainage' },
    { id: 'site_improvements', name: 'Site Improvements', description: 'Driveways, walkways, landscaping' },
  ],
  
  // Foundation
  'foundation': [
    { id: 'footings', name: 'Footings', description: 'Concrete footings and foundation support' },
    { id: 'foundation_walls', name: 'Foundation Walls', description: 'Poured concrete or block foundation walls' },
    { id: 'waterproofing', name: 'Waterproofing', description: 'Foundation waterproofing, drain tile' },
    { id: 'concrete_slab', name: 'Concrete Slab', description: 'Basement or main level concrete slab' },
  ],
  
  // Framing
  'framing': [
    { id: 'rough_framing', name: 'Rough Framing', description: 'Wall, floor and roof framing' },
    { id: 'roof_trusses', name: 'Roof Trusses', description: 'Engineered roof trusses or rafters' },
    { id: 'sheathing', name: 'Sheathing', description: 'Wall and roof sheathing materials' },
    { id: 'steel_framing', name: 'Steel Framing', description: 'Structural steel and metal framing' },
  ],
  
  // Exterior Envelope
  'exterior': [
    { id: 'roofing', name: 'Roofing', description: 'Roofing materials and installation' },
    { id: 'siding', name: 'Siding & Facade', description: 'Exterior cladding materials' },
    { id: 'windows', name: 'Windows', description: 'Windows, skylights, glass installations' },
    { id: 'exterior_doors', name: 'Exterior Doors', description: 'Entry doors, garage doors, patio doors' },
    { id: 'masonry', name: 'Masonry', description: 'Brick, stone, or block work' },
    { id: 'gutters', name: 'Gutters & Downspouts', description: 'Rainwater management systems' },
  ],
  
  // Mechanical Systems
  'mechanical': [
    { id: 'hvac', name: 'HVAC', description: 'Heating, ventilation, air conditioning systems' },
    { id: 'plumbing', name: 'Plumbing', description: 'Supply, waste and vent piping, fixtures' },
    { id: 'electrical', name: 'Electrical', description: 'Wiring, outlets, switches, panels' },
    { id: 'low_voltage', name: 'Low Voltage', description: 'Audio/video, security, networking' },
    { id: 'fire_protection', name: 'Fire Protection', description: 'Sprinklers, alarms, fire suppression' },
  ],
  
  // Insulation & Interior Walls
  'interior_rough': [
    { id: 'insulation', name: 'Insulation', description: 'Wall, ceiling, and floor insulation' },
    { id: 'drywall', name: 'Drywall/Plaster', description: 'Interior wall and ceiling finishes' },
    { id: 'interior_framing', name: 'Interior Framing', description: 'Non-load bearing walls and soffits' },
    { id: 'soundproofing', name: 'Soundproofing', description: 'Acoustic treatments and sound barriers' },
  ],
  
  // Interior Finishes
  'interior_finishes': [
    { id: 'flooring', name: 'Flooring', description: 'All flooring materials and installation' },
    { id: 'painting', name: 'Painting', description: 'Interior painting and wallcoverings' },
    { id: 'trim_carpentry', name: 'Trim Carpentry', description: 'Baseboards, crown molding, casings' },
    { id: 'cabinets', name: 'Cabinets', description: 'Kitchen and bathroom cabinetry' },
    { id: 'countertops', name: 'Countertops', description: 'Kitchen and bathroom countertops' },
    { id: 'tile', name: 'Tile Work', description: 'Ceramic, porcelain, stone tile installation' },
    { id: 'interior_doors', name: 'Interior Doors', description: 'Interior passage and closet doors' },
  ],
  
  // Fixtures & Appliances
  'fixtures': [
    { id: 'plumbing_fixtures', name: 'Plumbing Fixtures', description: 'Sinks, faucets, tubs, toilets' },
    { id: 'lighting_fixtures', name: 'Lighting Fixtures', description: 'Interior and exterior lighting' },
    { id: 'appliances', name: 'Appliances', description: 'Kitchen and laundry appliances' },
    { id: 'hardware', name: 'Hardware', description: 'Door hardware, bath accessories' },
  ],
  
  // Specialty Features
  'specialty': [
    { id: 'stairs', name: 'Stairs', description: 'Interior and exterior stairs and railings' },
    { id: 'fireplace', name: 'Fireplace', description: 'Fireplaces and chimneys' },
    { id: 'deck_patio', name: 'Deck/Patio', description: 'Outdoor living spaces' },
    { id: 'landscaping', name: 'Landscaping', description: 'Landscape design, plants, irrigation systems' },
    { id: 'pool_spa', name: 'Pool/Spa', description: 'Swimming pools, hot tubs, saunas' },
    { id: 'smart_home', name: 'Smart Home', description: 'Home automation and technology' },
    { id: 'solar', name: 'Solar/Renewable', description: 'Solar panels, renewable energy systems' },
  ],
  
  // Project Management
  'management': [
    { id: 'general_conditions', name: 'General Conditions', description: 'Job site supervision, temporary utilities' },
    { id: 'project_management', name: 'Project Management', description: 'Contractor management fees' },
    { id: 'cleanup', name: 'Cleanup', description: 'Construction cleanup and waste removal' },
    { id: 'contingency', name: 'Contingency', description: 'Budget reserve for unforeseen costs' },
  ],
  
  // Add uncategorized as a special section
  'uncategorized': [
    { id: 'uncategorized', name: 'Uncategorized Items', description: 'Items that could not be automatically assigned' },
  ]
}; 