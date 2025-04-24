/**
 * This file contains mapping tables between old and new category IDs.
 * These maps are used during the transition period to maintain compatibility
 * and assist with data migration.
 */

/**
 * Maps original category IDs to new category IDs
 * This allows looking up the new equivalent of an old category
 */
export const OLD_TO_NEW_CATEGORY_MAP: Record<string, string> = {
  // Acquisition & Closing
  'acquisition': '01-acquisition',
  'acquisition-purchase': '01-acquisition-purchase',
  'acquisition-closing': '01-acquisition-closing',
  'acquisition-legal': '01-acquisition-financing', // Legal fees now part of financing
  'acquisition-financing': '01-acquisition-financing',
  'acquisition-insurance': '01-acquisition-insurance',
  
  // Pre-Construction
  'pre-construction': '02-professional',
  'pre-construction-design': '02-professional-architecture',
  'pre-construction-engineering': '02-professional-engineering',
  'pre-construction-permits': '02-professional-permits',
  'pre-construction-surveys': '02-professional-surveys',
  'pre-construction-insurance': '01-acquisition-insurance', // Moved to acquisition
  
  // Site Work
  'site-work': '04-site',
  'site-work-demolition': '04-site-demolition',
  'site-work-excavation': '04-site-earthwork',
  'site-work-utilities': '04-site-utilities',
  'site-work-erosion': '04-site-environmental',
  'site-work-improvements': '04-site-improvements',
  
  // Foundation
  'foundation': '05-structural',
  'foundation-concrete': '05-structural-concrete',
  'foundation-waterproofing': '06-envelope-waterproofing', // Moved to envelope
  'foundation-footings': '05-structural-foundation',
  'foundation-walls': '05-structural-foundation',
  
  // Framing
  'framing': '05-structural',
  'framing-lumber': '05-structural-framing',
  'framing-labor': '05-structural-framing',
  'framing-trusses': '05-structural-framing',
  'framing-steel': '05-structural-steel',
  'framing-sheathing': '05-structural-framing',
  
  // Exterior
  'exterior': '06-envelope',
  'exterior-roofing': '06-envelope-roofing',
  'exterior-siding': '06-envelope-walls',
  'exterior-windows': '06-envelope-windows',
  'exterior-doors': '06-envelope-doors',
  'exterior-masonry': '05-structural-masonry', // Moved to structural
  'exterior-gutters': '06-envelope-roofing', // Part of roofing system
  
  // Mechanical
  'mechanical': '07-mechanical',
  'mechanical-hvac': '07-mechanical-hvac',
  'mechanical-plumbing': '07-mechanical-plumbing',
  'mechanical-electrical': '07-mechanical-electrical',
  'mechanical-low-voltage': '07-mechanical-lowvoltage',
  'mechanical-fire-protection': '07-mechanical-fire',
  'mechanical-plumbing-fixtures': '07-mechanical-plumbing',
  
  // Interior Rough
  'interior-rough': '08-interior',
  'interior-rough-insulation': '08-interior-walls',
  'interior-rough-soundproofing': '08-interior-walls',
  'interior-rough-electrical': '07-mechanical-electrical', // Moved to mechanical
  'interior-rough-plumbing': '07-mechanical-plumbing', // Moved to mechanical
  'interior-rough-hvac': '07-mechanical-hvac', // Moved to mechanical
  
  // Interior Finishes
  'interior-finishes': '08-interior',
  'interior-finishes-drywall-system': '08-interior-walls',
  'interior-finishes-flooring': '08-interior-flooring',
  'interior-finishes-tile': '08-interior-flooring',
  'interior-finishes-trim': '08-interior-finishes',
  'interior-finishes-cabinets': '08-interior-cabinetry',
  'interior-finishes-doors': '08-interior-doors',
  'interior-finishes-lighting': '07-mechanical-electrical', // Moved to mechanical
  'interior-finishes-paint': '08-interior-finishes',
  
  // Specialty
  'specialty': '09-specialties',
  'specialty-appliances': '09-specialties-appliances',
  'specialty-stairs': '08-interior-stairs', // Moved to interior
  'specialty-fireplace': '09-specialties-fixtures',
  'specialty-deck': '10-exterior-structures', // Moved to exterior improvements
  'specialty-pool': '10-exterior-structures', // Moved to exterior improvements
  'specialty-accessible': '08-interior-specialty', // Moved to interior
  
  // Project Management
  'project-management': '03-general',
  'project-management-general': '03-general-conditions',
  'project-management-fees': '03-general-management',
  'project-management-inspection': '03-general-quality',
  'project-management-safety': '03-general-safety',
  'project-management-documentation': '03-general-documentation',
  
  // Landscape
  'landscape': '10-exterior',
  'landscape-hardscape': '10-exterior-hardscaping',
  'landscape-softscape': '10-exterior-landscaping',
  'landscape-irrigation': '10-exterior-irrigation',
  
  // Cleanup
  'cleanup': '11-completion',
  'cleanup-construction': '11-completion-cleaning',
  'cleanup-final': '11-completion-cleaning',
  'cleanup-punch': '11-completion-punchlist',
  'cleanup-handover': '11-completion-documentation',
  
  // Contingency
  'contingency': '12-reserves',
  'contingency-general': '12-reserves-contingency',
  'contingency-specific': '12-reserves-change'
};

/**
 * Maps new category IDs to original category IDs
 * This allows looking up the old equivalent of a new category
 * Note: This is the inverse of the OLD_TO_NEW_CATEGORY_MAP but
 * only includes primary mappings (since many old categories may map to the same new one)
 */
export const NEW_TO_OLD_CATEGORY_MAP: Record<string, string> = {
  // Project Acquisition (01)
  '01-acquisition': 'acquisition',
  '01-acquisition-purchase': 'acquisition-purchase',
  '01-acquisition-closing': 'acquisition-closing',
  '01-acquisition-financing': 'acquisition-financing',
  '01-acquisition-insurance': 'acquisition-insurance',
  
  // Professional Services (02)
  '02-professional': 'pre-construction',
  '02-professional-architecture': 'pre-construction-design',
  '02-professional-engineering': 'pre-construction-engineering',
  '02-professional-permits': 'pre-construction-permits',
  '02-professional-surveys': 'pre-construction-surveys',
  '02-professional-consulting': 'pre-construction', // No direct equivalent
  
  // General Requirements (03)
  '03-general': 'project-management',
  '03-general-management': 'project-management-fees',
  '03-general-conditions': 'project-management-general',
  '03-general-temporary': 'project-management-general', // No direct equivalent
  '03-general-safety': 'project-management-safety',
  '03-general-quality': 'project-management-inspection',
  '03-general-documentation': 'project-management-documentation',
  '03-general-insurance': 'acquisition-insurance', // Best match
  
  // Site Development (04)
  '04-site': 'site-work',
  '04-site-demolition': 'site-work-demolition',
  '04-site-earthwork': 'site-work-excavation',
  '04-site-utilities': 'site-work-utilities',
  '04-site-improvements': 'site-work-improvements',
  '04-site-environmental': 'site-work-erosion',
  '04-site-concrete': 'foundation-concrete', // Best match
  
  // Structural Systems (05)
  '05-structural': 'foundation',
  '05-structural-foundation': 'foundation-footings',
  '05-structural-concrete': 'foundation-concrete',
  '05-structural-framing': 'framing-lumber',
  '05-structural-steel': 'framing-steel',
  '05-structural-masonry': 'exterior-masonry',
  
  // Building Envelope (06)
  '06-envelope': 'exterior',
  '06-envelope-roofing': 'exterior-roofing',
  '06-envelope-walls': 'exterior-siding',
  '06-envelope-paint': 'exterior', // No direct equivalent
  '06-envelope-windows': 'exterior-windows',
  '06-envelope-doors': 'exterior-doors',
  '06-envelope-waterproofing': 'foundation-waterproofing',
  
  // Mechanical Systems (07)
  '07-mechanical': 'mechanical',
  '07-mechanical-hvac': 'mechanical-hvac',
  '07-mechanical-plumbing': 'mechanical-plumbing',
  '07-mechanical-electrical': 'mechanical-electrical',
  '07-mechanical-fire': 'mechanical-fire-protection',
  '07-mechanical-lowvoltage': 'mechanical-low-voltage',
  
  // Interior Construction (08)
  '08-interior': 'interior-finishes',
  '08-interior-walls': 'interior-finishes-drywall-system',
  '08-interior-ceilings': 'interior-finishes-drywall-system', // Best match
  '08-interior-flooring': 'interior-finishes-flooring',
  '08-interior-finishes': 'interior-finishes-paint',
  '08-interior-cabinetry': 'interior-finishes-cabinets',
  '08-interior-doors': 'interior-finishes-doors',
  '08-interior-stairs': 'specialty-stairs',
  '08-interior-specialty': 'specialty-accessible',
  
  // Specialties & Equipment (09)
  '09-specialties': 'specialty',
  '09-specialties-appliances': 'specialty-appliances',
  '09-specialties-fixtures': 'specialty-fireplace',
  '09-specialties-custom': 'specialty', // No direct equivalent
  '09-specialties-owner': 'specialty', // No direct equivalent
  
  // Exterior Improvements (10)
  '10-exterior': 'landscape',
  '10-exterior-landscaping': 'landscape-softscape',
  '10-exterior-hardscaping': 'landscape-hardscape',
  '10-exterior-structures': 'specialty-deck',
  '10-exterior-fencing': 'landscape-hardscape', // Best match
  '10-exterior-irrigation': 'landscape-irrigation',
  
  // Project Completion (11)
  '11-completion': 'cleanup',
  '11-completion-cleaning': 'cleanup-construction',
  '11-completion-punchlist': 'cleanup-punch',
  '11-completion-commissioning': 'cleanup-handover', // Best match
  '11-completion-documentation': 'cleanup-handover',
  '11-completion-warranty': 'cleanup-handover', // Best match
  
  // Project Reserves (12)
  '12-reserves': 'contingency',
  '12-reserves-contingency': 'contingency-general',
  '12-reserves-change': 'contingency-specific',
  '12-reserves-escalation': 'contingency-general', // Best match
  '12-reserves-value': 'contingency-general' // Best match
}; 