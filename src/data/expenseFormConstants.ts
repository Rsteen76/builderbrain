// In src/data/expenseFormConstants.ts
export const PHASE_EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
  "common": [
    // Administration & General
    "Project Management Fee",
    "Supervision Labor",
    "Office Supplies",
    "Plan Printing/Documents",
    "Project Software Subscription",
    "Liability Insurance Premium",
    "Workers' Comp Insurance",
    "Builder's Risk Insurance",
    "Legal Fees",
    "Accounting Services",
    "Portable Toilet Rental",
    "Temporary Power/Utilities",
    "Temporary Water Service",
    "Site Security Services",
    "Temporary Fencing Rental",
    "Jobsite Trailer Rental",
    "Debris Removal/Dumpster",
    "Final Cleaning Service",
    "Tool/Equipment Repair",
    "Vehicle/Truck Expenses",
    "Gas/Fuel for Equipment",
    "Small Tools Purchase",
    "Safety Equipment/PPE",
  ],

  "site_work": [
    // Demolition
    "Demolition Labor",
    "Structure Demolition",
    "Interior Demolition",
    "Concrete Removal",
    "Debris Hauling",

    // Excavation
    "Site Clearing Labor",
    "Tree Removal",
    "Stump Removal",
    "Excavation Equipment Rental",
    "Excavation Labor",
    "Soil Testing",
    "Backfill Material",
    "Compaction Equipment Rental",
    "Grading Equipment Rental",

    // Utilities
    "Water Line Installation",
    "Sewer Line Installation",
    "Electric Service Installation",
    "Gas Line Installation",
    "Utility Locate Service",
    "Utility Connection Fees",
    "Storm Drain Installation",

    // Other Site Work
    "Erosion Control Materials",
    "Silt Fence Installation",
    "Retaining Wall Materials",
    "Retaining Wall Labor",
    "Driveway Gravel/Base",
  ],

  "foundation": [
    // Concrete Work
    "Concrete Forms Rental",
    "Concrete Forming Labor",
    "Rebar/Steel Reinforcement",
    "Concrete Material",
    "Concrete Pumping",
    "Concrete Finishing Labor",
    "Footings Excavation",
    "Foundation Waterproofing",
    "Foundation Drainage System",
    "Termite Treatment",
    "Vapor Barrier",
    "Concrete Testing",
    "Foundation Insulation",
    "Concrete Sealer",
    "Anchor Bolts/Fasteners",
  ],

  "framing": [
    // Lumber and Materials
    "Dimensional Lumber",
    "Engineered Wood Products",
    "Wall Sheathing",
    "Roof Sheathing",
    "Hurricane Ties/Fasteners",
    "Joist Hangers/Connectors",
    "Framing Hardware",

    // Labor
    "Framing Labor - Walls",
    "Framing Labor - Floors",
    "Framing Labor - Roof",
    "Framing Inspection Fee",

    // Trusses/Roof
    "Roof Truss Package",
    "Floor Truss Package",
    "Roof Framing Labor",
    "Beam Installation",
  ],

  "rough_ins": [
    // Plumbing
    "Plumbing Rough-in Labor",
    "Plumbing Pipes/Fittings",
    "Shower/Tub Rough-in",
    "Water Heater Installation",
    "Plumbing Fixtures",
    "Plumbing Permit",
    "Plumbing Inspection",

    // Electrical
    "Electrical Rough-in Labor",
    "Electrical Panel Installation",
    "Electrical Wiring/Cables",
    "Electrical Boxes/Devices",
    "Light Fixture Rough-in",
    "Electrical Permit",
    "Electrical Inspection",

    // HVAC
    "HVAC Rough-in Labor",
    "HVAC Equipment",
    "Ductwork Installation",
    "HVAC Permit",
    "HVAC Inspection",

    // Other
    "Low Voltage Wiring",
    "Security System Rough-in",
    "Central Vacuum Rough-in",
  ],

  "exterior": [
    // Roofing
    "Roof Underlayment",
    "Roofing Materials",
    "Roofing Labor",
    "Roof Flashing",
    "Roof Vents",
    "Gutter Installation",
    "Downspout Installation",

    // Siding/Exterior Finishes
    "House Wrap/Moisture Barrier",
    "Siding Materials",
    "Siding Labor",
    "Exterior Trim Materials",
    "Exterior Trim Labor",
    "Exterior Caulking/Sealant",
    "Exterior Paint Materials",
    "Exterior Painting Labor",

    // Windows & Doors
    "Window Units",
    "Window Installation Labor",
    "Exterior Door Units",
    "Exterior Door Installation",
    "Garage Door Unit",
    "Garage Door Installation",
  ],

  "interior": [
    // Insulation and Drywall
    "Wall Insulation",
    "Ceiling Insulation",
    "Drywall Materials",
    "Drywall Hanging Labor",
    "Drywall Finishing Labor",
    "Drywall Texture",

    // Interior Framing
    "Interior Wall Framing",
    "Interior Door Framing",
    "Soffit/Bulkhead Framing",
    "Backing/Blocking Installation",

    // Other
    "Fireplace Installation",
    "Sound Insulation",
  ],

  "finishes": [
    // Flooring
    "Carpet Materials",
    "Carpet Installation",
    "Hardwood Flooring Materials",
    "Hardwood Floor Installation",
    "Tile Flooring Materials",
    "Tile Floor Installation",
    "Vinyl Flooring Materials",
    "Vinyl Floor Installation",
    "Floor Underlayment",
    "Floor Prep Labor",

    // Interior Painting
    "Interior Paint Materials",
    "Interior Painting Labor",
    "Primer Materials",
    "Wall Texture Materials",

    // Trim and Doors
    "Interior Trim Materials",
    "Interior Trim Labor",
    "Interior Door Units",
    "Interior Door Installation",
    "Door Hardware",

    // Cabinets and Countertops
    "Kitchen Cabinet Materials",
    "Cabinet Installation Labor",
    "Bathroom Vanity Cabinets",
    "Countertop Materials",
    "Countertop Installation",
    "Cabinet Hardware",

    // Fixtures and Appliances
    "Light Fixtures",
    "Light Fixture Installation",
    "Plumbing Fixtures Installation",
    "Appliance Installation",
    "Appliance Purchase",
    "Shower Door Installation",
    "Bathroom Accessories",
    "Closet Shelving/Organizers",

    // Specialty Finishes
    "Staircase Materials",
    "Staircase Installation",
    "Railing Installation",
    "Built-in Shelving",
    "Wall Paneling",
  ],

  "specialty": [
    // Home Technology/Automation
    "Home Automation System",
    "Home Theater Installation",
    "Security System Installation",
    "Smart Home Devices",
    "Network/WiFi Setup",

    // Specialty Features
    "Pool Installation",
    "Hot Tub/Spa Installation",
    "Sauna Installation",
    "Wine Cellar Construction",
    "Elevator Installation",
    "Generator Installation",
    "Solar Panel Installation",
    "EV Charging Station",

    // Custom Features
    "Custom Cabinetry",
    "Custom Millwork",
    "Custom Built-ins",
    "Custom Shelving",
  ],

  "renovation": [
    // Demolition & Preparation
    "Interior Demolition Labor",
    "Kitchen Demolition",
    "Bathroom Demolition",
    "Wall Removal Labor",
    "Asbestos/Lead Testing",
    "Mold Remediation",
    "Structure Repair Materials",
    "Subfloor Repair Materials",

    // Conservation
    "Historic Restoration Materials",
    "Custom Millwork Reproduction",
    "Period-Specific Hardware",
    "Architectural Salvage",
    "Conservation Specialist Fee",
  ],

  "maintenance": [
    // Repairs
    "Roof Repair Materials",
    "Roof Repair Labor",
    "Siding Repair Materials",
    "Siding Repair Labor",
    "Gutter Cleaning",
    "Gutter Repair",
    "Window Repair",
    "Door Repair",
    "Drywall Repair Materials",
    "Drywall Repair Labor",
    "Plumbing Repair Parts",
    "Plumbing Repair Labor",
    "Electrical Repair Materials",
    "Electrical Repair Labor",
    "HVAC Service",
    "HVAC Repair Parts",
    "Appliance Repair",
    "Flooring Repair Materials",
    "Flooring Repair Labor",

    // Scheduled Maintenance
    "HVAC Filter Replacement",
    "Water Heater Maintenance",
    "Septic System Pumping",
    "Chimney Cleaning",
    "Pressure Washing Service",
    "Duct Cleaning Service",
    "Carpet Cleaning Service",
    "Pest Control Service",
  ],
};
