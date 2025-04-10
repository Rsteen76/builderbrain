import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid,
  InputAdornment,
  Chip,
  Divider,
  IconButton,
  FormHelperText,
  CircularProgress,
  useTheme,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  alpha,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  BusinessCenter as VendorIcon,
  Assignment as ProjectIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as SubcontractorIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Engineering as BuildingPhaseIcon,
  WarningAmberRounded,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SubcontractorSelector from '../common/SubcontractorSelector';
import VendorSelector from '../common/VendorSelector';
import { addCategoryMapping } from '../../services/category.service';
import { mapSimpleToDetailedCategory } from '../../data/hierarchicalCategories';

import {
  Expense,
  LineItem as ExpenseLineItem,
  Subcontractor,
  ProjectPhase,
  Project,
  ExpenseCategory,
  ExpenseStatus,
} from '../../types';
import { LineItem as ProjectLineItem } from '../../types/project.types';
import { ExpenseService } from '../../services/expense';
import { SubcontractorService } from '../../services/subcontractor';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expense?: Partial<Expense>;
  onSave: (expense: Partial<Expense>) => void;
  projects: Project[];
  projectPhases?: ProjectPhase[];
}

// Interface for errors
interface FormErrors {
  [key: string]: any;
  lineItems?: {
    [id: string]: {
  description?: string;
      quantity?: string;
      unitPrice?: string;
    }
  } & { general?: string }
}

// Define form item interface (local to the component)
interface ExpenseLineItemForm {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

// Define the available Expense Categories manually based on the type
const availableExpenseCategories: ExpenseCategory[] = [
  'subcontractor', 
  'labor', 
  'materials', 
  'equipment', 
  'permits', 
  'other'
];

// Add this utility function at the top of the file, outside of component
const cleanForFirestore = (data: any): any => {
  // If null or primitive, return as is
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  // Handle Date objects - keep them as is for now, service will convert
  if (data instanceof Date) {
    return data; 
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    // Filter out undefined elements AND clean nested elements
    return data.filter(item => item !== undefined).map(item => cleanForFirestore(item));
  }
  
  // Handle objects
  const result: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined values entirely
    if (value === undefined) {
      return;
    }
    
    // Recursively clean nested values
    result[key] = cleanForFirestore(value);
  });
  
  return result;
};

// Define common expense descriptions by phase category
const PHASE_EXPENSE_DESCRIPTIONS: Record<string, string[]> = {
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
    // Permits & Surveys
    "Building Permit Fee",
    "Impact Fees",
    "Water/Sewer Connection Fee",
    "Utility Connection Fee",
    "Land Survey Fee",
    "Environmental Permit",
    "Soil Testing Services",
    
    // Site Preparation
    "Lot Clearing/Tree Removal",
    "Stump Removal",
    "Erosion Control Materials",
    "Silt Fence Installation",
    "Demolition Services",
    "Asbestos/Hazardous Removal",
    "Construction Entrance Materials",
    
    // Excavation & Grading
    "Excavation Services",
    "Grading/Site Leveling",
    "Topsoil Removal/Storage",
    "Fill Dirt/Gravel Delivery",
    "Compaction Equipment Rental",
    "Trenching Services",
    "Backfill Materials",
    "Drainage System Materials",
    "Site Retaining Wall Materials",
    "Earth Moving Equipment Rental",
    "Dump Truck Services",
    
    // Utilities
    "Water Line Installation",
    "Sewer Line Connection",
    "Gas Line Installation",
    "Electrical Service Connection",
    "Underground Conduit Materials",
    "Septic System Installation",
    "Well Drilling Services",
  ],
  
  "foundation": [
    // Layout & Forms
    "Batter Board Materials",
    "Form Materials/Plywood",
    "Form Rental",
    "Snap Ties/Spreader Clamps",
    "Form Oil/Release Agent",
    "Foundation Layout Labor",
    
    // Materials
    "Concrete Materials",
    "Rebar/Steel Reinforcement",
    "Wire Mesh/WWF",
    "Foundation Bolts/Hardware",
    "Concrete Pump Service",
    "Concrete Delivery",
    "Ready-Mix Concrete",
    "Vapor Barrier Materials",
    "Foundation Waterproofing",
    "Concrete Additives",
    "Termite Treatment/Barrier",
    
    // Equipment & Labor
    "Concrete Finishing Labor",
    "Concrete Vibrator Rental",
    "Concrete Testing Services",
    "Power Trowel Rental",
    "Concrete Hammer Drill Rental",
    
    // Footings & Specialty
    "Footing Drain Materials",
    "Pier Installation",
    "Caisson Drilling",
    "Slab Preparation Materials",
    "Slab Insulation",
    "ICF Block Materials",
    "Foundation Drainage System",
    "Foundation Insulation",
    "Foundation Coating/Sealant",
  ],
  
  "framing": [
    // Framing Materials
    "Dimensional Lumber Package",
    "Treated Lumber Materials",
    "Engineered Floor Joists",
    "LVL/Engineered Beams",
    "Roof Truss Package",
    "Wall Sheathing/OSB",
    "Roof Decking Materials",
    "Metal Connectors/Joist Hangers",
    "Framing Hardware/Nails",
    "Framing Gun Rental",
    "Scaffold Rental",
    "Pneumatic Tool Rental",
    "Crane Services for Trusses",
    "Weather Barrier/House Wrap",
    "Flashing Materials",
    
    // Steel & Specialty
    "Structural Steel Beams",
    "Steel Columns",
    "Steel Connectors/Plates",
    "Steel Fabrication",
    "Timber Frame Materials",
    "Timber Frame Connectors",
    "SIP Panel Materials",
    "Fastener Systems",
    
    // Labor
    "Framing Labor - Walls",
    "Framing Labor - Floors",
    "Framing Labor - Roof",
    "Framing Labor - Stairs",
    "Temporary Bracing Materials",
    "Safety Harness Rental",
  ],
  
  "rough_ins": [
    // Electrical
    "Electrical Rough Materials",
    "Electrical Wire/Romex",
    "Conduit/Cable Tray Materials",
    "Electrical Boxes",
    "Recessed Light Cans",
    "Electrical Panel/Breakers",
    "Low Voltage Wiring",
    "Generator Installation Materials",
    "Solar Pre-Wire Materials",
    "Electrical Permit Fee",
    
    // Plumbing
    "Plumbing Rough Materials",
    "PEX/Copper/PVC Pipe",
    "Pipe Fittings",
    "Pipe Insulation",
    "Plumbing Fixtures Rough-in",
    "Water Heater Installation",
    "Gas Line Materials",
    "Sewer & Drain Materials",
    "Tub/Shower Pan Install",
    "Plumbing Permit Fee",
    
    // HVAC
    "HVAC Ductwork Materials",
    "Flexible Duct Materials",
    "HVAC Equipment",
    "Furnace Installation",
    "AC Condenser/Coil",
    "Vent/Register Materials",
    "Return Air Materials",
    "HVAC Control Wiring",
    "HVAC Permit Fee",
    
    // Other Systems
    "Security System Wiring",
    "Smart Home/Automation Wiring",
    "Vacuum System Rough-in",
    "Audio/Video System Wiring",
    "Fire Suppression System",
    "Data/Network Cabling",
  ],
  
  "exterior": [
    // Roofing
    "Roofing Materials",
    "Roof Underlayment",
    "Roofing Shingles/Tiles",
    "Metal Roofing Materials",
    "Roof Flashing",
    "Roof Vents/Boots",
    "Gutter Materials",
    "Downspout Materials",
    "Soffit Materials",
    "Fascia Materials",
    "Roof Equipment Rental",
    
    // Siding & Exterior Walls
    "Exterior Siding Materials",
    "Fiber Cement Siding",
    "Vinyl Siding Materials",
    "Wood/Cedar Siding",
    "Stone Veneer Materials",
    "Brick Materials",
    "Stucco Materials",
    "EIFS/Synthetic Stucco",
    "Exterior Trim Materials",
    "Exterior Caulk/Sealant",
    
    // Windows & Doors
    "Window Package",
    "Exterior Door Package",
    "Garage Door Purchase",
    "Garage Door Opener",
    "Entry Door Hardware",
    "Window Flashing Materials",
    "Door Threshold Materials",
    "Window Installation Labor",
    "Door Installation Labor",
    
    // Exterior Features
    "Deck/Porch Materials",
    "Deck Railing Systems",
    "Exterior Stair Materials",
    "Exterior Paint/Stain",
    "Exterior Lighting Fixtures",
    "Masonry Materials",
    "Landscaping Allowance",
    "Driveway Materials",
    "Walkway Materials",
    "Landscape Wall Materials",
  ],
  
  "interior": [
    // Insulation
    "Wall Insulation Materials",
    "Ceiling/Attic Insulation",
    "Floor Insulation",
    "Spray Foam Insulation",
    "Rigid Foam Insulation",
    "Sound Insulation Materials",
    "Vapor Barrier Materials",
    "Air Sealing Materials",
    
    // Drywall & Wall Finishes
    "Drywall Materials",
    "Drywall Delivery",
    "Specialty Drywall/Cement Board",
    "Drywall Mud/Joint Compound",
    "Drywall Tape/Corner Bead",
    "Drywall Screws/Fasteners",
    "Drywall Tools Rental",
    "Wall Texture Materials",
    "Interior Wall Framing",
    "Patch & Repair Materials",
    
    // Paint & Wall Coverings
    "Interior Paint Materials",
    "Primer/Sealer",
    "Painting Equipment Rental",
    "Painting Labor",
    "Wallpaper Materials",
    "Wall Paneling Materials",
    "Decorative Wall Finishes",
    
    // Trim & Interior Doors
    "Interior Door Package",
    "Door Hardware/Hinges",
    "Door Casing Materials",
    "Baseboard Materials",
    "Crown Molding Materials",
    "Window Trim Materials",
    "Interior Columns/Posts",
    "Specialty Millwork",
    "Wood Paneling/Wainscot",
    "Closet Shelving/Organizers",
    
    // Ceilings
    "Ceiling Grid System",
    "Ceiling Tiles/Panels",
    "Ceiling Fan Installation",
    "Specialty Ceiling Materials",
  ],
  
  "finishes": [
    // Flooring
    "Hardwood Flooring Materials",
    "Engineered Wood Flooring",
    "Laminate Flooring Materials",
    "Vinyl/LVP Flooring",
    "Tile Flooring Materials",
    "Tile Setting Materials",
    "Grout/Adhesives",
    "Carpet Materials",
    "Carpet Pad/Underlayment",
    "Floor Transition Materials",
    "Floor Finish/Sealer",
    "Floor Protection Materials",
    
    // Cabinets & Countertops
    "Kitchen Cabinet Package",
    "Bathroom Vanity Cabinets",
    "Cabinet Hardware",
    "Countertop Materials",
    "Solid Surface Countertops",
    "Quartz/Granite Countertops",
    "Countertop Fabrication",
    "Countertop Installation",
    "Backsplash Materials",
    "Cabinet Installation Labor",
    
    // Plumbing Fixtures
    "Kitchen Sink Purchase",
    "Bathroom Sink(s) Purchase",
    "Faucet Package",
    "Shower System Purchase",
    "Bathtub Purchase",
    "Toilet Purchase",
    "Garbage Disposal",
    "Water Filtration System",
    "Plumbing Trim-out Materials",
    
    // Electrical Finish
    "Light Fixture Package",
    "Recessed Light Trim",
    "Ceiling Fan Purchase",
    "Electrical Outlet Covers",
    "Switch Plates",
    "Doorbell/Chime",
    "Smart Home Devices",
    "Electrical Trim-out Materials",
    
    // Appliances & HVAC Finish
    "Refrigerator Purchase",
    "Range/Oven Purchase",
    "Microwave Purchase",
    "Dishwasher Purchase",
    "Washer/Dryer Purchase",
    "Range Hood Purchase",
    "HVAC Registers/Grills",
    "Thermostat Purchase",
    
    // Miscellaneous Finish
    "Mirror Installation",
    "Shower Door/Enclosure",
    "Bathroom Accessories",
    "Closet Shelving Installation",
    "Window Treatment Materials",
    "Final Touch-up Materials",
  ],
  
  "specialty": [
    // Specialty Spaces
    "Home Theater Equipment",
    "Wine Cellar Materials",
    "Gym/Exercise Room Equipment",
    "Sauna/Steam Room Materials",
    "Pool Equipment",
    "Hot Tub/Spa Installation",
    "Outdoor Kitchen Equipment/Materials",
    "Fireplace Installation Materials",
    "Built-in Shelving Materials",
    "Smart Home System Installation",
    "Security System Equipment",
    "Central Vacuum System",
    "Elevator/Lift Installation",
    "Solar Panel System",
    "Backup Generator System",
    "Radon Mitigation System",
    "Water Treatment System",
    
    // Permits & Inspections
    "Specialty System Permit",
    "Pool Construction Permit",
    "Electrical Specialty Inspection",
    "Plumbing Specialty Inspection",
    "HVAC Specialty Inspection",
    "Final Building Inspection",
    
    // Professional Services
    "Interior Design Fee",
    "Landscape Design Fee",
    "Engineering Consultation",
    "Energy Audit Services",
    "Specialty Cleaning Services",
    "Specialty Contractor Fee",
  ],
  
  "landscape": [
    // Hardscape
    "Patio Materials",
    "Landscape Retaining Wall Materials",
    "Paver Materials",
    "Concrete Flatwork",
    "Outdoor Steps/Stairs",
    "Stone/Gravel Materials",
    "Edging Materials",
    "Landscape Curbing",
    "Outdoor Lighting Fixtures",
    "Irrigation System Materials",
    "Landscape Drainage Materials",
    
    // Softscape
    "Sod/Turf Installation",
    "Topsoil/Garden Soil",
    "Mulch/Ground Cover",
    "Tree Purchase",
    "Shrub/Plant Materials",
    "Hydroseeding Services",
    "Fertilizer/Soil Amendments",
    
    // Outdoor Features
    "Fence Materials",
    "Pergola/Arbor Materials",
    "Outdoor Fire Pit/Fireplace",
    "Water Feature Materials",
    "Outdoor Furniture",
    "Playground Equipment",
    "Garden Bed Materials",
    "Outdoor Kitchen Equipment",
  ],
  
  "renovation": [
    // Demolition & Preparation
    "Interior Demolition Services",
    "Dumpster Rental",
    "Asbestos/Lead Testing",
    "Mold Remediation",
    "Structure Repair Materials",
    "Wall Removal Labor",
    "Subfloor Repair Materials",
    "Electrical System Updates",
    "Plumbing System Updates",
    "HVAC System Updates",
    "Permit for Renovation",
    
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
    "Siding Repair Materials",
    "Gutter Cleaning/Repair",
    "Window/Door Repair",
    "Drywall Repair Materials",
    "Plumbing Repair Parts",
    "Electrical Repair Materials",
    "HVAC Service/Repair",
    "Appliance Repair",
    "Flooring Repair Materials",
    
    // Scheduled Maintenance
    "HVAC Filter Replacement",
    "Water Heater Maintenance",
    "Septic System Pumping",
    "Chimney Cleaning",
    "Pressure Washing Service",
    "Duct Cleaning Service",
    "Carpet Cleaning Service",
    "Lawn Maintenance",
    "Tree Trimming Service",
    "Pest Control Service",
  ],
};

// Helper function to map ExpenseCategory (potentially plural) to LineItem category (singular)
const mapExpenseCategoryToLineItemCategory = (expCategory: ExpenseCategory | undefined): ExpenseLineItem['category'] => {
  switch (expCategory) {
    case 'materials': return 'material'; // Convert plural
    case 'permits': return 'permit';     // Convert plural
    case 'labor': return 'labor';
    case 'equipment': return 'equipment';
    case 'subcontractor': return 'subcontractor';
    case 'other': return 'other';
    default: return 'other'; // Default for undefined or unexpected
  }
};

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onClose,
  expense,
  onSave,
  projects,
  projectPhases = [],
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // Restore all state variables
  const [formData, setFormData] = useState<Partial<Expense>>({});
  const [lineItems, setLineItems] = useState<ExpenseLineItemForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [showLineItems, setShowLineItems] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [duplicateExpenses, setDuplicateExpenses] = useState<Expense[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [detailedCategoryId, setDetailedCategoryId] = useState<string | null>(null);
  const [expenseDescriptionOptions, setExpenseDescriptionOptions] = useState<string[]>([]);
  const [currentProjectPhases, setCurrentProjectPhases] = useState<ProjectPhase[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [duplicateCheckDone, setDuplicateCheckDone] = useState(false);

  const isEditMode = useMemo(() => !!expense?.id, [expense]);

  // Get phase options based on the currentProjectPhases state
  const PHASE_OPTIONS = useMemo(() => {
    return currentProjectPhases.map(phase => ({
      value: phase.id || '',
      label: phase.name || 'Unnamed Phase'
    }));
  }, [currentProjectPhases]);

  // Define getExpenseDescriptionOptions *before* the useEffect that uses it
  const getExpenseDescriptionOptions = useCallback((phaseId: string | undefined, phases: ProjectPhase[]): string[] => {
    const applicableKeys: string[] = ["common"];
    let phaseNameForLog = "(No Phase)";

    if (phaseId && phases.length > 0) {
      const phase = phases.find(p => p.id === phaseId);
      if (phase) {
        phaseNameForLog = phase.name;
        const phaseNameLower = phase.name.toLowerCase();
        
        console.log(`[getExpenseDescOptions] Analyzing phase: "${phase.name}" (ID: ${phase.id})`);

        // Detect phase category based on name keywords
        // Site work and excavation
        if (phaseNameLower.includes("site") || 
            phaseNameLower.includes("excav") || 
            phaseNameLower.includes("demo") || 
            phaseNameLower.includes("prep") || 
            phaseNameLower.includes("clear")) {
          applicableKeys.push("site_work");
        }
        
        // Foundation work
        if (phaseNameLower.includes("foundation") || 
            phaseNameLower.includes("concrete") || 
            phaseNameLower.includes("foot") || // catches footings/footing
            phaseNameLower.includes("slab")) {
          applicableKeys.push("foundation");
        }
        
        // Framing
        if (phaseNameLower.includes("frame") || 
            phaseNameLower.includes("struct") || 
            phaseNameLower.includes("joist") || 
            phaseNameLower.includes("beam") || 
            phaseNameLower.includes("truss")) {
          applicableKeys.push("framing");
        }
        
        // Rough-ins
        if (phaseNameLower.includes("rough") || 
            phaseNameLower.includes("plumb") || 
            phaseNameLower.includes("electr") || 
            phaseNameLower.includes("hvac") || 
            phaseNameLower.includes("mechanic")) {
          applicableKeys.push("rough_ins");
        }
        
        // Exterior work
        if (phaseNameLower.includes("exterior") || 
            phaseNameLower.includes("roof") || 
            phaseNameLower.includes("siding") || 
            phaseNameLower.includes("window") || 
            phaseNameLower.includes("door") || 
            phaseNameLower.includes("flash")) {
          applicableKeys.push("exterior");
        }
        
        // Interior work
        if (phaseNameLower.includes("interior") || 
            phaseNameLower.includes("drywall") || 
            phaseNameLower.includes("paint") || 
            phaseNameLower.includes("wall") || 
            phaseNameLower.includes("insul")) {
          applicableKeys.push("interior");
        }
        
        // Finishes
        if (phaseNameLower.includes("finish") || 
            phaseNameLower.includes("cabinet") || 
            phaseNameLower.includes("counter") ||
            phaseNameLower.includes("tile") || 
            phaseNameLower.includes("floor") || 
            phaseNameLower.includes("trim") || 
            phaseNameLower.includes("paint")) {
          applicableKeys.push("finishes");
        }
        
        // Specialty items
        if (phaseNameLower.includes("pool") || 
            phaseNameLower.includes("special") || 
            phaseNameLower.includes("custom") || 
            phaseNameLower.includes("home theater") || 
            phaseNameLower.includes("smart") || 
            phaseNameLower.includes("automation")) {
          applicableKeys.push("specialty");
        }
        
        // Landscaping
        if (phaseNameLower.includes("landscape") || 
            phaseNameLower.includes("yard") || 
            phaseNameLower.includes("garden") || 
            phaseNameLower.includes("outdoor") || 
            phaseNameLower.includes("patio") || 
            phaseNameLower.includes("lawn")) {
          applicableKeys.push("landscape");
        }
        
        // Renovation
        if (phaseNameLower.includes("renovat") || 
            phaseNameLower.includes("remodel") || 
            phaseNameLower.includes("restor") || 
            phaseNameLower.includes("repair") || 
            phaseNameLower.includes("updat")) {
          applicableKeys.push("renovation");
        }
        
        // Maintenance
        if (phaseNameLower.includes("maint") || 
            phaseNameLower.includes("repair") || 
            phaseNameLower.includes("fix") || 
            phaseNameLower.includes("service") || 
            phaseNameLower.includes("clean")) {
          applicableKeys.push("maintenance");
        }
      } else {
        console.log(`[getExpenseDescOptions] Phase ID ${phaseId} provided but not found in phases list.`);
      }
    } else if (!phaseId) {
        console.log('[getExpenseDescOptions] No phase selected.');
    } else { // projectPhases.length === 0
        console.log('[getExpenseDescOptions] Phase ID provided but phases list is empty.');
    }

    // Remove duplicates from applicableKeys
    const uniqueKeys = Array.from(new Set(applicableKeys));
    console.log(`[getExpenseDescOptions] For Phase: "${phaseNameForLog}", Applicable Keys:`, uniqueKeys);

    // Collect descriptions from all applicable keys using a Set for automatic deduplication
    const combinedDescriptions = new Set<string>();
    uniqueKeys.forEach(key => {
      const descriptions = PHASE_EXPENSE_DESCRIPTIONS[key] || [];
      console.log(`[getExpenseDescOptions] Adding ${descriptions.length} descriptions from category "${key}"`);
      descriptions.forEach(desc => combinedDescriptions.add(desc));
    });

    // Convert Set to sorted array
    const finalOptions = Array.from(combinedDescriptions).sort();
    
    console.log(`[getExpenseDescOptions] Final Combined & Sorted Options: ${finalOptions.length} descriptions available`);
    
    return finalOptions;
  }, []);

  // Effect to initialize form and phases when opening/editing
  useEffect(() => {
    if (open) {
      let initialPhases: ProjectPhase[] = [];
      let initialFormData: Partial<Expense> = {
        description: '',
        amount: 0,
        category: 'other' as Expense['category'],
        date: new Date(),
        status: 'pending',
        projectId: '',
        phaseId: '',
        phaseName: '',
        vendor: '',
        notes: '',
        subcontractorId: '',
        subcontractorName: '',
      };

      if (expense) {
        initialFormData = {
          ...initialFormData,
          ...expense,
          date: expense.date ? new Date(expense.date) : new Date(),
        };
        
        if (expense.projectId) {
          const projectSource = projectPhases && projectPhases.length > 0 
            ? { phases: projectPhases } 
            : projects.find(p => p.id === expense.projectId);
            
          initialPhases = (projectSource?.phases || []).filter((p): p is ProjectPhase => typeof p.id === 'string' && p.id !== '');
        }
        
        if (expense.paymentDetails) {
          setPaymentMethod(expense.paymentDetails.method || '');
          setReferenceNumber(expense.paymentDetails.referenceNumber || '');
          setPaymentDate(expense.paymentDetails.date || new Date().toISOString().split('T')[0]);
          setPaymentNotes(expense.paymentDetails.notes || '');
        }
        
        if (expense.category === 'subcontractor' && expense.subcontractorId && expense.subcontractorName) {
          initialFormData.subcontractorId = expense.subcontractorId;
          initialFormData.subcontractorName = expense.subcontractorName;
        }
      } else {
        if (projects.length === 1) {
          initialFormData.projectId = projects[0].id;
          initialPhases = (projects[0].phases || []).filter((p): p is ProjectPhase => typeof p.id === 'string' && p.id !== '');
          if (initialPhases.length === 1 && initialPhases[0].id) {
            initialFormData.phaseId = initialPhases[0].id;
            initialFormData.phaseName = initialPhases[0].name;
          }
        }
      }
      
      setFormData(initialFormData);
      setCurrentProjectPhases(initialPhases);
      setTags(initialFormData.tags || []);
      setErrors({});
      setBackendError(null);
      setReceiptFile(null);
      setReceiptPreview(initialFormData.receiptUrl || null);
      const initialLineItems: ExpenseLineItemForm[] = (expense?.lineItems || []).map(item => ({
        id: item.id || uuidv4(),
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: typeof item.unitCost === 'number' ? item.unitCost : 0,
        totalPrice: (item.quantity || 1) * (typeof item.unitCost === 'number' ? item.unitCost : 0),
      }));
      setLineItems(initialLineItems);
      setShowLineItems(!!initialFormData.lineItems && initialFormData.lineItems.length > 0);
      setPaymentMethod(expense?.paymentDetails?.method || '');
      setReferenceNumber(expense?.paymentDetails?.referenceNumber || '');
      setPaymentDate(expense?.paymentDetails?.date || new Date().toISOString().split('T')[0]);
      setPaymentNotes(expense?.paymentDetails?.notes || '');
      setDuplicateCheckDone(false);
      setShowDuplicateWarning(false);
      setDuplicateExpenses([]);
      setTabValue(0);
      setDetailedCategoryId(null);
    }
  }, [open, expense, isEditMode, projects, projectPhases]);

  // useEffect for description options (now uses the defined function)
  useEffect(() => {
    const options = getExpenseDescriptionOptions(formData.phaseId, currentProjectPhases);
    setExpenseDescriptionOptions(options);
  }, [formData.phaseId, currentProjectPhases, getExpenseDescriptionOptions]);

  // Handle basic form input changes
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific errors when field changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Reset duplicate check if relevant fields change
    if (['amount', 'date', 'vendor', 'subcontractorId'].includes(name)) {
      setDuplicateCheckDone(false);
    }
  };

  // Handle changes for Select components
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  // ADD handler for hierarchical category change
  const handleDetailedCategoryChange = (categoryId: string) => {
      setDetailedCategoryId(categoryId);
      // Clear category error if present
      if (errors.detailedCategoryId) {
          setErrors(prev => ({ ...prev, detailedCategoryId: undefined }));
      }
      // Assign a default simple category based on the detailed one if needed for other logic
      // This might be unnecessary if we fully remove reliance on simple category
      // For now, let's default it to 'other' when a detailed one is selected
      handleChange('category', 'other'); 
  };

  const handlePhaseChange = (event: SelectChangeEvent<string>) => {
    const phaseId = event.target.value;
    // Find selected phase from currentProjectPhases state
    const selectedPhase = currentProjectPhases.find(phase => phase.id === phaseId);
    setFormData(prev => ({
      ...prev,
      phaseId: phaseId || undefined,
      phaseName: selectedPhase?.name || undefined, // Set name based on selected ID
    }));
  };

  const handleSubcontractorChange = (subcontractorId: string, subcontractorName: string) => {
    setFormData({
      ...formData,
      subcontractorId,
      subcontractorName,
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date: date,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setFormData({
      ...formData,
      receiptUrl: undefined,
    });
  };

  // Line item handlers
  const handleAddLineItem = () => {
    const newItem: ExpenseLineItemForm = {
      id: uuidv4(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setLineItems([...lineItems, newItem]);
    setShowLineItems(true);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    
    // If no more line items, remove any errors for them
    if (lineItems.length <= 1) {
      const { lineItems: _, ...restErrors } = errors;
      setErrors(restErrors);
    }
  };

  const handleLineItemChange = (id: string, field: keyof ExpenseLineItemForm, value: string | number) => {
    setLineItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total price if quantity or unitPrice changed
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          
          return updatedItem;
        }
        return item;
      });
    });

    // Update the formData amount to match total of line items
    setTimeout(() => {
      const totalAmount = calculateTotalFromLineItems();
      setFormData(prev => ({ ...prev, amount: totalAmount }));
    }, 0);
    
    // Clear errors for this line item field
    if (errors.lineItems && errors.lineItems[id] && errors.lineItems[id][field as keyof typeof errors.lineItems[0]]) {
      setErrors(prev => ({
        ...prev,
        lineItems: {
          ...prev.lineItems,
          [id]: {
            ...prev.lineItems?.[id],
            [field]: undefined
          }
        }
      }));
    }
  };

  const calculateTotalFromLineItems = useCallback(() => {
    return lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [lineItems]);

  const toggleLineItems = () => {
    setShowLineItems(!showLineItems);
    if (!showLineItems && lineItems.length === 0) {
      handleAddLineItem();
    }
  };

  const validateForm = (): FormErrors => {
    const validationErrors: FormErrors = {};

    if (!formData.description?.trim()) {
      validationErrors.description = 'Description is required';
    }

    if (!formData.projectId) {
      validationErrors.projectId = 'Project is required';
    }

    // Only validate amount if not using line items
    if (!showLineItems && (formData.amount === undefined || formData.amount <= 0)) {
      validationErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      validationErrors.date = 'Date is required';
    }
    
    // Validate subcontractor is selected when category is 'subcontractor'
    if (formData.category === 'subcontractor' && !formData.subcontractorId) {
      validationErrors.subcontractorId = 'Subcontractor is required';
    }

    // Validate line items if they are shown
    if (showLineItems && lineItems.length > 0) {
      let hasLineItemErrors = false;
      const lineItemErrors: FormErrors['lineItems'] = {};
      
      lineItems.forEach(item => {
        const itemErrors: { description?: string; quantity?: string; unitPrice?: string } = {};
        let hasItemError = false;
        
        if (!item.description.trim()) {
          itemErrors.description = 'Description is required';
          hasItemError = true;
        }
        
        if (item.quantity <= 0) {
          itemErrors.quantity = 'Quantity must be greater than 0';
          hasItemError = true;
        }
        
        if (item.unitPrice < 0) {
          itemErrors.unitPrice = 'Unit price cannot be negative';
          hasItemError = true;
        }
        
        if (hasItemError) {
          lineItemErrors[item.id] = itemErrors;
          hasLineItemErrors = true;
        }
      });
      
      if (hasLineItemErrors) {
        validationErrors.lineItems = lineItemErrors;
      }
      
      // If using line items, ensure the total is greater than 0
      const totalAmount = calculateTotalFromLineItems();
      if (totalAmount <= 0) {
        if (!validationErrors.lineItems) {
          validationErrors.lineItems = {};
        }
        validationErrors.lineItems.general = 'Total amount must be greater than 0';
      }
    }

    setErrors(validationErrors);
    return validationErrors;
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const potentialDuplicates = await ExpenseService.checkForDuplicates(
        user.uid,
        formData,
        1 // 1 day threshold
      );
      
      if (potentialDuplicates.length > 0) {
        setDuplicateExpenses(potentialDuplicates);
        setShowDuplicateWarning(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setBackendError(null);
    
    // Correctly call validateForm and use the result
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
       // ... (rest of handleSubmit logic as corrected in previous step) ...
       const calculatedTotal = showLineItems 
        ? calculateTotalFromLineItems() // Use the useCallback version
        : formData.amount || 0;

      // Corrected mapping logic using the helper function
      const finalLineItems: ExpenseLineItem[] = showLineItems 
        ? lineItems.map((li): ExpenseLineItem => {
            let itemCategory: ExpenseLineItem['category'];

            // Determine the category, prioritizing specific keywords then mapping the form category
            if (formData.category === 'subcontractor') {
              itemCategory = 'subcontractor';
            } else if (li.description.toLowerCase().includes('material')) {
              itemCategory = 'material'; // Keyword match
            } else {
              // Fallback: Map the main expense category to the line item category type
              itemCategory = mapExpenseCategoryToLineItemCategory(formData.category);
            }

            return {
              id: li.id,
              description: li.description,
              quantity: li.quantity,
              unit: '', // Adjust as needed
              unitCost: li.unitPrice > 0 ? li.unitPrice : undefined,
              totalCost: li.totalPrice,
              category: itemCategory, // Assign the correctly mapped category
            };
          })
        : [];

      const finalData: Partial<Expense> = cleanForFirestore({
        ...formData,
        amount: calculatedTotal,
        date: formData.date instanceof Date ? formData.date : new Date(formData.date || Date.now()),
        lineItems: finalLineItems,
        projectId: formData.projectId || null,
        phaseId: formData.phaseId || null,
        receiptUrl: receiptPreview || null,
        status: formData.status || 'pending',
        subcontractorId: formData.category === 'subcontractor' ? (formData.subcontractorId || null) : null,
        vendor: formData.category !== 'subcontractor' ? (formData.vendor || null) : null,
        tags: tags, // Include tags
        paymentDetails: formData.status === 'paid' ? {
          method: paymentMethod,
          date: paymentDate,
          referenceNumber: referenceNumber,
          notes: paymentNotes
        } : null,
      });
      
      if (user?.uid) {
        finalData.userId = user.uid;
      }

      try {
        await onSave(finalData);
        handleCloseModal();
      } catch (error) {
        console.error("Error saving expense:", error);
        setBackendError(`Failed to save expense: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log('Form is invalid:', formErrors);
      setBackendError('Please fix the validation errors before saving.');
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (e: SelectChangeEvent<Expense['status']>) => {
    const newStatus = e.target.value as Expense['status'];
    setFormData(prev => ({
      ...prev,
      status: newStatus,
    }));
  };

  const handleTagsChange = (_event: React.SyntheticEvent, newTags: string[]) => {
    setTags(newTags);
  };

  const handleCloseModal = () => {
    setFormData({});
    setLineItems([]);
    setIsSubmitting(false);
    setErrors({});
    setBackendError(null);
    setShowLineItems(false);
    setReceiptFile(null);
    setReceiptPreview(null);
    setSelectedProject(null);
    setTags([]);
    setDuplicateExpenses([]);
    setShowDuplicateWarning(false);
    setTabValue(0);
    setDetailedCategoryId(null);
    setExpenseDescriptionOptions([]);
    setCurrentProjectPhases([]);
    setPaymentMethod('');
    setReferenceNumber('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setDuplicateCheckDone(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        disableScrollLock
      >
        <DialogTitle sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h6" 
            fontWeight="600" 
          >
            {isEditMode ? 'Edit Expense' : 'New Expense'}
          </Typography>
          
          <IconButton 
            onClick={handleCloseModal} 
            aria-label="close"
            size="small"
            sx={{
              color: 'text.secondary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            p: 2.5,
            overflow: 'auto',
          }}
        >
          <Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)}>
            <Tab label="Main Info" />
            <Tab label="Line Items" />
            <Tab label="Receipt" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ display: 'block', p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.projectId} variant="outlined" size="small">
                    <InputLabel id="project-label">Project</InputLabel>
                    <Select
                      labelId="project-label"
                      id="projectId"
                      name="projectId"
                      value={formData.projectId || ''}
                      onChange={handleSelectChange}
                      label="Project"
                      disabled={!!expense?.projectId && !isEditMode}
                      startAdornment={
                        <InputAdornment position="start">
                            <ProjectIcon fontSize="small" color="primary" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="" disabled>
                        <Typography variant="body2" color="text.secondary">Select a project</Typography>
                      </MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.projectId && (
                      <FormHelperText error>{errors.projectId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={typeof formData.date === 'string' ? new Date(formData.date) : formData.date || null}
                      onChange={handleDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.date,
                          helperText: errors.date,
                              size: "small",
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                  <CalendarIcon fontSize="small" color="primary" />
                              </InputAdornment>
                            )
                          }
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!errors.phaseId}>
                    <InputLabel id="phase-label">Phase</InputLabel>
                    <Select
                      labelId="phase-label"
                      id="phaseId"
                      name="phaseId"
                      value={formData.phaseId || ''}
                      onChange={handlePhaseChange}
                      label="Phase"
                      startAdornment={
                        <InputAdornment position="start">
                          <BuildingPhaseIcon fontSize="small" color="action" />
                        </InputAdornment>
                      }
                      disabled={!formData.projectId || currentProjectPhases.length === 0}
                    >
                      <MenuItem value="">
                        <em>{formData.projectId ? (currentProjectPhases.length > 0 ? 'Select Phase' : 'No Phases Available') : 'Select Project First'}</em>
                      </MenuItem>
                      {PHASE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.phaseId && <FormHelperText>{errors.phaseId}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!errors.category}>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value as Expense['category'])}
                      label="Category"
                      startAdornment={
                        <InputAdornment position="start">
                          <CategoryIcon fontSize="small" color="primary" />
                        </InputAdornment>
                      }
                    >
                      {availableExpenseCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && <FormHelperText error>{errors.category}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    fullWidth
                    freeSolo
                    id="expense-description"
                    options={expenseDescriptionOptions}
                    value={formData.description || ''}
                    onChange={(event, newValue) => {
                      // Directly update the form data state
                      setFormData(prev => ({...prev, description: newValue || ''}));
                      // Clear potential error for description
                      if (errors.description) {
                         setErrors(prev => ({...prev, description: undefined}));
                      }
                    }}
                    inputValue={formData.description || ''} // Keep controlled input value if needed for freeSolo interaction
                    onInputChange={(event, newInputValue) => {
                      // Update description as user types
                      setFormData(prev => ({...prev, description: newInputValue || ''}));
                       // Clear potential error for description while typing
                       if (errors.description) {
                          setErrors(prev => ({...prev, description: undefined}));
                       }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Description"
                        required
                        size="small"
                        placeholder="Select or type a description..."
                        error={!!errors.description}
                        helperText={errors.description}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <VendorSelector
                    value={formData.vendor || ''}
                    onChange={(vendor) => {
                      setFormData({
                        ...formData,
                        vendor: vendor,
                      });
                    }}
                    error={!!errors.vendor}
                    helperText={errors.vendor}
                  />
                </Grid>
               
                {formData.category === 'subcontractor' && (
                  <Grid item xs={12} sm={6}>
                    <SubcontractorSelector
                      value={formData.subcontractorId || ''}
                      onChange={handleSubcontractorChange}
                      error={!!errors.subcontractorId}
                      helperText={errors.subcontractorId}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                      Amount Details
                    </Typography>
               
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showLineItems}
                          onChange={toggleLineItems}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="caption">{showLineItems ? 'Itemized' : 'Simple'}</Typography>}
                      sx={{ m: 0 }}
                    />
                  </Box>

                  {!showLineItems ? (
                    <TextField
                      fullWidth
                      id="amount"
                      name="amount"
                      label="Amount"
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                      error={!!errors.amount}
                      helperText={errors.amount || null}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        )
                      }}
                    />
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleAddLineItem}
                          size="small"
                          sx={{ 
                            textTransform: 'none',
                          }}
                        >
                          Add Item
                        </Button>
                        
                        <Typography variant="subtitle2" fontWeight={600} color="success.main">
                          Total: ${calculateTotalFromLineItems().toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        maxHeight: 220, 
                        overflowY: 'auto',
                      }}>
                        {lineItems.length === 0 ? (
                          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                            No line items yet. Add some!
                          </Typography>
                        ) : (
                          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Description</TableCell>
                                  <TableCell align="right">Qty</TableCell>
                                  <TableCell align="right">Unit Price</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                  <TableCell padding="checkbox"></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {lineItems.map((item: ExpenseLineItemForm, index) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <TextField
                                        fullWidth
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                                        error={!!errors.lineItems?.[item.id]?.description}
                                        helperText={errors.lineItems?.[item.id]?.description}
                                        variant="standard"
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      <TextField
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        error={!!errors.lineItems?.[item.id]?.quantity}
                                        inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                                        variant="standard"
                                        size="small"
                                        sx={{ width: 70 }}
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      <TextField
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        error={!!errors.lineItems?.[item.id]?.unitPrice}
                                        inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                                        variant="standard"
                                        size="small"
                                        sx={{ width: 90 }}
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      ${item.totalPrice.toFixed(2)}
                                    </TableCell>
                                    <TableCell padding="checkbox">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveLineItem(item.id)}
                                        color="error"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                      Amount
                    </Typography>
               
                    <Typography variant="subtitle2" fontWeight={600} color="success.main">
                      ${formData.amount?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ mb: 1.5 }} size="small">
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={formData.status || 'pending'}
                      onChange={handleStatusChange}
                      label="Status"
                      startAdornment={
                        <InputAdornment position="start">
                          <PaymentIcon fontSize="small" color="primary" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="pending">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                          Pending
                        </Box>
                      </MenuItem>
                      <MenuItem value="paid">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                          Paid
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                    Receipt
                  </Typography>
                 
                  {receiptPreview ? (
                    <Box sx={{ position: 'relative', height: 120, display: 'flex', justifyContent: 'center' }}>
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                      <IconButton
                        onClick={handleRemoveReceipt}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed',
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: '6px',
                      p: 2,
                      height: 120,
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                    }}>
                    <input
                        accept="image/*,application/pdf"
                        id="receipt-file"
                      type="file"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    <label htmlFor="receipt-file" style={{ width: '100%', textAlign: 'center' }}>
                      <Button
                        component="span"
                        startIcon={<UploadIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        Upload Receipt
                      </Button>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Drag & drop or click to browse
                      </Typography>
                    </label>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{ 
                    '&:before': { display: 'none' },
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mt: 1
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Additional Notes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      id="notes"
                      name="notes"
                      multiline
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Enter any additional notes here..."
                      size="small"
                    />
                  </AccordionDetails>
                </Accordion>
              </Grid>
             
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Autocomplete
                  multiple
                  id="tags"
                  options={[]} // Use empty array instead of suggestedTags
                  value={tags}
                  onChange={handleTagsChange}
                  freeSolo
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        sx={{
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      size="small"
                      placeholder="Add tags (press Enter after each tag)"
                      fullWidth
                    />
                  )}
                />
                <Typography variant="caption" color="text.secondary">
                  Add tags to categorize this expense
                </Typography>
              </Grid>
             
              {backendError && (
                <Grid item xs={12}>
                  <Typography 
                    variant="body2" 
                    color="error" 
                    sx={{ 
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    {backendError}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ display: 'block', p: 3 }}>
            {/* ... Line Items Tab Content ... */}
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ display: 'block', p: 3 }}>
            {/* ... Receipt Tab Content ... */}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Button 
        onClick={handleCloseModal}
          variant="outlined"
          sx={{ 
            borderRadius: '4px',
            textTransform: 'none',
          }}
      >
        Cancel
      </Button>
        
      <Button
          onClick={handleSubmit}
        variant="contained"
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        sx={{ 
            borderRadius: '4px',
            textTransform: 'none',
          }}
        >
          {isEditMode ? 'Update' : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>

    {showDuplicateWarning && (
      <Dialog
        open={showDuplicateWarning}
        onClose={() => setShowDuplicateWarning(false)}
        aria-labelledby="duplicate-warning-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="duplicate-warning-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color="#f59e0b">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <Typography variant="h6">Potential Duplicate Expense</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            We found {duplicateExpenses.length} similar expense{duplicateExpenses.length > 1 ? 's' : ''} that might be duplicates:
          </DialogContentText>
          
          <List sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            mb: 2,
          }}>
            {duplicateExpenses.map((expense) => (
              <ListItem key={expense.id} divider>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2">{expense.description}</Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {new Date(expense.date).toLocaleDateString()} • {formatCurrency(expense.amount)}
                      </Typography>
                      {expense.vendor && (
                        <Typography variant="body2" color="text.secondary" component="span">
                          {' • '}{expense.vendor}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          <DialogContentText>
            Do you still want to save this expense? If this is not a duplicate, please continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setShowDuplicateWarning(false)} 
            variant="outlined"
          >
            Go Back and Edit
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            }
          >
            Save Anyway
          </Button>
        </DialogActions>
      </Dialog>
    )}
  </>
);
};

export default ExpenseFormModal;