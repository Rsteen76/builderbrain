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
  Gavel as BidIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SubcontractorSelector from '../common/SubcontractorSelector';
import VendorSelector from '../common/VendorSelector';
import CategorySelector from '../common/CategorySelector';
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
  Bid,
} from '../../types';
import { LineItem as ProjectLineItem } from '../../types/project.types';
import { ExpenseService } from '../../services/expense';
import { SubcontractorService } from '../../services/subcontractor';
import { BidService } from '../../services/bid';
import { createExtraBidExpense } from '../../utils/bidOperations';
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
      unitCost?: string;
    }
  } & { general?: string }
}

// Define form item interface (local to the component)
interface ExpenseLineItemForm {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
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

// Helper function to format category names for display
const formatCategoryName = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

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
  const [expenseDescriptionOptions, setExpenseDescriptionOptions] = useState<string[]>([]);
  const [currentProjectPhases, setCurrentProjectPhases] = useState<ProjectPhase[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [duplicateCheckDone, setDuplicateCheckDone] = useState(false);

  // State to hold available bids for the selected project
  const [availableBids, setAvailableBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState<boolean>(false);

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

        // More targeted category matching with fewer overlaps
        // Site work - only match if explicitly site-related
        if (phaseNameLower.includes("site work") || 
            phaseNameLower.includes("excavation") || 
            phaseNameLower.includes("demolition") || 
            phaseNameLower.includes("clearing")) {
          applicableKeys.push("site_work");
        }
        
        // Foundation - more explicit matching
        else if (phaseNameLower.includes("foundation") || 
            phaseNameLower.includes("concrete") || 
            phaseNameLower.includes("footings")) {
          applicableKeys.push("foundation");
        }
        
        // Framing - more explicit matching
        else if (phaseNameLower.includes("framing") || 
            phaseNameLower.includes("structural") ||
            (phaseNameLower.includes("frame") && !phaseNameLower.includes("window"))) {
          applicableKeys.push("framing");
        }
        
        // Rough-ins - more explicit matching
        else if (phaseNameLower.includes("rough") || 
            phaseNameLower.includes("mech") || 
            phaseNameLower.includes("electrical rough") ||
            phaseNameLower.includes("plumbing rough")) {
          applicableKeys.push("rough_ins");
        }
        
        // Exterior - more explicit matching
        else if (phaseNameLower.includes("exterior") || 
            phaseNameLower.includes("siding") || 
            phaseNameLower.includes("roofing")) {
          applicableKeys.push("exterior");
        }
        
        // Interior - more explicit matching
        else if (phaseNameLower.includes("interior") &&
            !phaseNameLower.includes("finish")) {
          applicableKeys.push("interior");
        }
        
        // Finishes - more explicit matching
        else if (phaseNameLower.includes("finish") || 
            phaseNameLower.includes("paint") ||
            phaseNameLower.includes("flooring") ||
            phaseNameLower.includes("trim")) {
          applicableKeys.push("finishes");
        }
        
        // Specialty items
        else if (phaseNameLower.includes("special") || 
            phaseNameLower.includes("pool") || 
            phaseNameLower.includes("theater") || 
            phaseNameLower.includes("automation")) {
          applicableKeys.push("specialty");
        }
        
        // Renovation
        else if (phaseNameLower.includes("renovat") || 
            phaseNameLower.includes("remodel")) {
          applicableKeys.push("renovation");
        }
        
        // Maintenance
        else if (phaseNameLower.includes("maint") || 
            phaseNameLower.includes("repair")) {
          applicableKeys.push("maintenance");
        }
        
        console.log(`[getExpenseDescOptions] Applicable categories for "${phase.name}": ${applicableKeys.join(', ')}`);
      }
    }
    
    // Create a Map to track seen descriptions (for case-insensitive deduplication)
    const seenDescriptions = new Map<string, string>();
    
    // Gather all descriptions from applicable categories and deduplicate
    for (const key of applicableKeys) {
      const descriptions = PHASE_EXPENSE_DESCRIPTIONS[key] || [];
      for (const desc of descriptions) {
        // Use lowercase version as the key for deduplication, but keep original case for display
        const lowerDesc = desc.toLowerCase().trim();
        if (!seenDescriptions.has(lowerDesc)) {
          seenDescriptions.set(lowerDesc, desc);
        }
      }
    }
    
    // Get unique descriptions (preserving original casing)
    const uniqueDescriptions = Array.from(seenDescriptions.values());
    
    // Sort alphabetically
    return uniqueDescriptions.sort();
  }, []);

  // Effect to initialize form when expense data is provided (for editing)
  useEffect(() => {
    // Add logging at the start
    console.log(`[Phase Init] Effect Run. Open: ${open}, Has Expense: ${!!expense}, Projects Count: ${projects?.length}`);

    if (open && expense) {
      // Log relevant IDs from the expense prop
      console.log(`[Phase Init] Expense Data: projectId='${expense.projectId}', phaseId='${expense.phaseId}'`);

      setFormData({
        projectId: expense.projectId || projects[0]?.id || 'undefined', // Ensure projectId is always set
        description: expense.description || '',
        amount: expense.amount || 0,
        date: expense.date ? new Date(expense.date) : new Date(),
        category: expense.category || 'other',
        categoryId: expense.categoryId || '',
        vendor: expense.vendor || '',
        subcontractorId: expense.subcontractorId || '',
        subcontractorName: expense.subcontractorName || '',
        phaseId: expense.phaseId || '',
        status: expense.status || 'pending',
        notes: expense.notes || '',
        tags: expense.tags || [],
        // Preserve payment information
        amountPaid: expense.amountPaid || 0,
        paymentDetails: expense.paymentDetails || null,
        // Preserve bid information
        bidId: expense.bidId || '',
        paymentStageId: expense.paymentStageId || '',
      });
      
      // Phase list initialization
      if (expense.projectId) {
        console.log(`[Phase Init] Looking for project with ID: '${expense.projectId}'`);
        const currentProject = projects.find(p => p.id === expense.projectId);
        // Log if project was found and its phases
        console.log(`[Phase Init] Found project: ${currentProject ? `'${currentProject.name}'` : 'Not Found'}`);
        const phasesToSet = (currentProject?.phases || []).filter((p): p is ProjectPhase => typeof p.id === 'string' && p.id !== '');
        console.log(`[Phase Init] Setting currentProjectPhases to:`, phasesToSet.map(p => ({ id: p.id, name: p.name }))); // Log concise phase info
        setCurrentProjectPhases(phasesToSet);
    } else {
        console.log(`[Phase Init] No expense.projectId, clearing phases.`);
        setCurrentProjectPhases([]);
      }
      
      // Initialize line items if they exist
      if (expense.lineItems && expense.lineItems.length > 0) {
        setLineItems(expense.lineItems.map(li => ({
          id: li.id || uuidv4(),
          description: li.description || '',
          quantity: li.quantity || 1,
          unitCost: li.unitCost || 0,
          totalPrice: (li.quantity || 1) * (li.unitCost || 0)
        })));
        setShowLineItems(true);
      } else {
        setLineItems([]);
        setShowLineItems(false);
      }
      
      // Initialize receipt preview
      setReceiptPreview(expense.receiptUrl || null);
      
      // Initialize payment details if status is 'paid' or 'partially_paid'
      if ((expense.status === 'paid' || expense.status === 'partially_paid') && expense.paymentDetails) {
        setPaymentMethod(expense.paymentDetails.method || 'other');
        const paymentDateObj = expense.paymentDetails.date ? new Date(expense.paymentDetails.date) : new Date();
        setPaymentDate(paymentDateObj.toISOString().split('T')[0]);
        setReferenceNumber(expense.paymentDetails.referenceNumber || '');
        setPaymentNotes(expense.paymentDetails.notes || '');
      }
    } else if (open) {
      // Reset logic
      console.log(`[Phase Init] Resetting form for new expense.`);
       setFormData({
        projectId: projects[0]?.id || 'undefined',
        description: '',
        amount: 0,
        date: new Date(),
        category: 'other',
        categoryId: '',
        vendor: '',
        subcontractorId: '',
        subcontractorName: '',
        phaseId: '',
        status: 'pending',
        notes: '',
        tags: [],
        amountPaid: 0,
        bidId: '',
        paymentStageId: '',
      });
      setLineItems([]);
      setShowLineItems(false);
      setReceiptPreview(null);
      setReceiptFile(null);
      setPaymentMethod('other');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setReferenceNumber('');
      setPaymentNotes('');
      setCurrentProjectPhases([]);
    }
    // Reset errors and saving state whenever modal opens or expense changes
    setErrors({});
    setBackendError(null); // Reset backend error
    setIsSubmitting(false); // Ensure submit button is enabled
    setDuplicateCheckDone(false);
    setShowDuplicateWarning(false);
    setDuplicateExpenses([]);
    setTabValue(0);
    setExpenseDescriptionOptions([]);
    if (!(expense?.status === 'paid' || expense?.status === 'partially_paid')) {
      setPaymentMethod('');
      setReferenceNumber('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNotes('');
    }
  }, [open, expense, projects]);

  // Effect to fetch available bids when projectId changes
  useEffect(() => {
    const fetchProjectBids = async () => {
      if (!formData.projectId || !user?.uid) {
        setAvailableBids([]);
        setLoadingBids(false);
        return;
      }

      try {
        setLoadingBids(true);
        const bidFilters = { projectId: formData.projectId };
        const projectBids = await BidService.getBids(user.uid, bidFilters);
        
        // Filter to only show accepted bids
        const acceptedBids = projectBids.filter(bid => bid.status === 'accepted');
        setAvailableBids(acceptedBids);
        
        console.log(`[ExpenseFormModal] Fetched ${acceptedBids.length} accepted bids for project ${formData.projectId}`);
      } catch (error) {
        console.error('Error fetching bids for project:', error);
        setAvailableBids([]);
      } finally {
        setLoadingBids(false);
      }
    };

    fetchProjectBids();
  }, [formData.projectId, user?.uid]);

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
    
    // When project changes, update the project phases
    if (name === 'projectId' && value) {
      const selectedProject = projects.find(p => p.id === value);
      console.log(`[Project Changed] Selected Project: ${selectedProject?.name}, with ${selectedProject?.phases?.length || 0} phases`);
      
      if (selectedProject?.phases) {
        const phasesToSet = (selectedProject.phases || []).filter((p): p is ProjectPhase => 
          typeof p.id === 'string' && p.id !== '');
        console.log(`[Project Changed] Setting phases: `, phasesToSet.map(p => ({ id: p.id, name: p.name })));
        setCurrentProjectPhases(phasesToSet);
        
        // Reset phase selection when project changes
        setFormData(prev => ({
          ...prev,
          phaseId: '',
          phaseName: ''
        }));
      } else {
        setCurrentProjectPhases([]);
      }
    }
  };

  // ADD handler for hierarchical category change
  const handleDetailedCategoryChange = (categoryId: string) => {
    // Only update the detailed categoryId, preserve the general category
    setFormData(prev => ({
      ...prev,
      categoryId: categoryId,
      // REMOVED: category: 'other', // Don't automatically set general category here
    }));
    // Clear potential category error if user selects a valid one
    setErrors(prev => ({ ...prev, categoryId: undefined }));
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
      unitCost: 0,
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
          if (field === 'quantity' || field === 'unitCost') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitCost;
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
        const itemErrors: { description?: string; quantity?: string; unitCost?: string } = {};
        let hasItemError = false;
        
        if (!item.description.trim()) {
          itemErrors.description = 'Description is required';
          hasItemError = true;
        }
        
        if (item.quantity <= 0) {
          itemErrors.quantity = 'Quantity must be greater than 0';
          hasItemError = true;
        }
        
        if (item.unitCost < 0) {
          itemErrors.unitCost = 'Unit cost cannot be negative';
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
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      console.log("Form Validation Errors:", formErrors);
      return;
    }

    setIsSubmitting(true);
    setBackendError(null);

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
            unitCost: li.unitCost > 0 ? li.unitCost : undefined,
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
      categoryId: formData.categoryId || undefined,
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
      ...(expense?.id && { id: expense.id }),
      bidId: formData.bidId || null, // Include bidId if selected
    });
    
    if (user?.uid) {
      finalData.userId = user.uid;
    }

    try {
      // Always check for duplicates before saving, unless it's an edit
      if (!expense?.id && await checkForDuplicates()) {
        setIsSubmitting(false);
        return; // Stop submission if duplicate warning is shown
      }
      
      await onSave(finalData);
      handleCloseModal();
    } catch (error) {
      console.error("Error saving expense:", error);
      setBackendError(`Failed to save expense: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
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
            {(formData.status === 'paid' || formData.status === 'partially_paid' || (formData.amountPaid ?? 0) > 0) && (
              <Tab label="Payment Info" />
            )}
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
                    <InputLabel id="category-label">General Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                      value={formData.category || ''}
                      onChange={(e) => handleChange('category', e.target.value as Expense['category'])}
                      label="General Category"
                startAdornment={
                  <InputAdornment position="start">
                    <CategoryIcon fontSize="small" color="primary" />
                  </InputAdornment>
                }
              >
                      {availableExpenseCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {formatCategoryName(category)}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText error>{errors.category}</FormHelperText>}
            </FormControl>
          </Grid>
       
                <Grid item xs={12} sm={6}>
                  <CategorySelector
                    value={formData.categoryId || ''} 
                    onCategorySelected={handleDetailedCategoryChange}
                    label="Specific Construction Category"
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Select a construction-specific classification
                  </Typography>
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

            {/* Amount summary - clearer distinction between original and remaining */}
            {(formData.amountPaid ?? 0) > 0 && (
              <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Original Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold">${(formData.amount ?? 0).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">${(formData.amountPaid ?? 0).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight="bold">Remaining:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    ${((formData.amount ?? 0) - (formData.amountPaid ?? 0)).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {!showLineItems ? (
              <Box>
                <TextField
                  fullWidth
                  id="amount"
                  name="amount"
                  label={(formData.amountPaid ?? 0) > 0 ? "Original Total Amount" : "Amount"}
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
                  error={!!errors.amount}
                  helperText={(formData.amountPaid ?? 0) > 0 
                    ? "Original amount cannot be changed after payments are recorded" 
                    : errors.amount || null}
                  size="small"
                  disabled={(formData.amountPaid ?? 0) > 0} // Disable if partly paid
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon fontSize="small" color="primary" />
                      </InputAdornment>
                    ),
                    readOnly: (formData.amountPaid ?? 0) > 0, // Make it read-only if partly paid
                  }}
                />
                
                {/* Show payment status if paid or partially paid */}
                {(formData.amountPaid ?? 0) > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon 
                        fontSize="small" 
                        color={formData.status === 'paid' ? 'success' : 'info'} 
                        sx={{ mr: 0.5 }}
                      />
                      <Typography variant="body2" color={formData.status === 'paid' ? 'success.main' : 'info.main'}>
                        {formData.status === 'paid' ? 'Fully Paid' : 'Partially Paid'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                </Box>
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
                                  <TableCell align="right">Unit Cost</TableCell>
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
                                        value={item.unitCost}
                                        onChange={(e) => handleLineItemChange(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                        error={!!errors.lineItems?.[item.id]?.unitCost}
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

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" error={!!errors.bidId}>
              <InputLabel id="bid-label">Link to Bid</InputLabel>
              <Select
                labelId="bid-label"
                id="bidId"
                name="bidId"
                value={formData.bidId || ''}
                onChange={(e) => handleChange('bidId', e.target.value)}
                label="Link to Bid"
                startAdornment={
                  <InputAdornment position="start">
                    <BidIcon fontSize="small" color="primary" />
                  </InputAdornment>
                }
                disabled={!formData.projectId || availableBids.length === 0 || loadingBids}
              >
                <MenuItem value="">
                  <em>{loadingBids ? 'Loading bids...' : 
                      formData.projectId ? 
                      (availableBids.length > 0 ? 'Select a Bid (Optional)' : 'No Accepted Bids Available') : 
                      'Select Project First'}</em>
                </MenuItem>
                {availableBids.map((bid) => (
                  <MenuItem key={bid.id} value={bid.id}>
                    {bid.title || 'Bid'} - {bid.subcontractorName || 'Unknown'} (${bid.totalAmount?.toFixed(2)})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {formData.bidId ? 'This expense will be linked to the selected bid' : 'Linking to a bid will update its payment progress'}
              </FormHelperText>
            </FormControl>
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

        {tabValue === 3 && (
          <Box sx={{ display: 'block', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            
            {(formData.amountPaid ?? 0) > 0 ? (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">Amount Paid:</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                          ${(formData.amountPaid ?? 0).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Original Amount:</Typography>
                        <Typography variant="body2">
                          ${(formData.amount ?? 0).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      {((formData.amount ?? 0) > (formData.amountPaid ?? 0)) && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2">Remaining:</Typography>
                          <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                            ${((formData.amount ?? 0) - (formData.amountPaid ?? 0)).toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">Status:</Typography>
                        <Chip
                          label={formData.status === 'paid' ? 'Paid' : formData.status === 'partially_paid' ? 'Partially Paid' : formData.status}
                          color={formData.status === 'paid' ? 'success' : formData.status === 'partially_paid' ? 'info' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>Payment Details:</Typography>
                      
                      {formData.paymentDetails ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Method:</Typography>
                            <Typography variant="body2">
                              {formData.paymentDetails.method?.charAt(0).toUpperCase() + formData.paymentDetails.method?.slice(1) || 'Not specified'}
                            </Typography>
                          </Box>
                          
                          {formData.paymentDetails.date && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">Date:</Typography>
                              <Typography variant="body2">
                                {new Date(formData.paymentDetails.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                          
                          {formData.paymentDetails.referenceNumber && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">Reference:</Typography>
                              <Typography variant="body2">
                                {formData.paymentDetails.referenceNumber}
                              </Typography>
                            </Box>
                          )}
                          
                          {formData.paymentDetails.notes && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">Notes:</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {formData.paymentDetails.notes}
                              </Typography>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No detailed payment information available
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Note: To record additional payments, use the "Mark as Paid" action from the expense list. This payment information is read-only in the edit form.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No payments have been recorded for this expense yet.
              </Typography>
            )}
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