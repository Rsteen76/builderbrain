import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
  FormHelperText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';
import { Bid, BidPaymentStage, Project, Subcontractor, Phase, BidFormData } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { getProject } from '../../services/project';

// Define common bid categories (Copied from BidFormShared.tsx for now)
const COMMON_BID_CATEGORIES: string[] = [
  // Site Work
  'Site Preparation',
  'Demolition',
  'Excavation',
  'Grading',
  'Erosion Control',
  'Utilities',
  'Paving',
  'Concrete',
  'Fencing',
  'Landscaping',
  
  // Structural
  'Foundation',
  'Concrete Foundation',
  'Poured Foundation',
  'Slab Foundation',
  'Basement Foundation',
  'Crawl Space Foundation',
  'Pier and Beam Foundation',
  'Pile Foundation',
  'Masonry',
  'Structural Steel',
  'Framing',
  'Rough Carpentry',
  'Finish Carpentry',
  
  // Exterior
  'Roofing',
  'Siding',
  'Windows',
  'Doors',
  'Exterior Painting',
  'Waterproofing',
  'Insulation',
  
  // Interior
  'Drywall',
  'Plaster',
  'Interior Painting',
  'Flooring',
  'Tile',
  'Cabinetry',
  'Countertops',
  'Millwork',
  'Trim Work',
  
  // Mechanical/Electrical/Plumbing
  'Plumbing',
  'HVAC',
  'Electrical',
  'Fire Protection',
  'Security Systems',
  'Low Voltage',
  'Solar/Renewable Energy',
  
  // Specialty
  'Elevator',
  'Windows & Doors',
  'Glass & Glazing',
  'Acoustical',
  'Specialty Finishes',
  'Kitchen Equipment',
  'Bathroom Fixtures',
  
  // Professional Services
  'Architecture',
  'Engineering',
  'Surveying',
  'Interior Design',
  'Consulting',
  
  // General
  'General Contractor',
  'Construction Management',
  'Labor Only',
  'Materials Only',
  'Other',
];

// Add a mapping of standard bid titles by phase after COMMON_BID_CATEGORIES
const PHASE_BID_TITLES: Record<string, string[]> = {
  // Common titles that apply to all phases
  "common": [
    "General Contracting Services",
    "Project Management",
    "Construction Services",
    "General Labor",
    "Site Supervision",
    "Equipment Rental",
    "Materials Supply",
  ],
  // Site work phase
  "site_work": [
    "Excavation and Grading",
    "Site Preparation",
    "Land Clearing",
    "Demolition",
    "Erosion Control",
    "Sitework Package",
    "Utilities Installation",
    "Drainage Systems",
    "Septic System Installation",
    "Underground Utility Work",
  ],
  // Foundation phase
  "foundation": [
    "Concrete Foundation",
    "Foundation Package",
    "Concrete Footings and Foundation",
    "Basement Waterproofing",
    "Foundation Insulation",
    "Concrete Flatwork",
    "Slab Preparation",
    "Rebar Installation",
    "Pier and Beam Foundation",
    "Foundation Drainage",
  ],
  // Framing phase
  "framing": [
    "Rough Framing",
    "Framing Package",
    "Structural Framing",
    "Roof Framing",
    "Floor Framing",
    "Wall Framing",
    "Stair Framing",
    "Deck Framing",
    "Structural Steel",
    "Timber Frame",
  ],
  // Rough-ins phase
  "rough_ins": [
    "Electrical Rough-in",
    "Plumbing Rough-in",
    "HVAC Rough-in",
    "Mechanical Rough-in",
    "Low Voltage Wiring",
    "Security System Rough-in",
    "Data/Communication Wiring",
    "Sprinkler System Rough-in",
  ],
  // Exterior phase
  "exterior": [
    "Roofing Installation",
    "Siding Installation",
    "Windows and Doors",
    "Garage Door Installation",
    "Exterior Trim",
    "Exterior Painting",
    "Stucco Application",
    "Brick/Stone Masonry",
    "Gutters and Downspouts",
    "Deck Construction",
    "Porch Construction",
  ],
  // Interior phase
  "interior": [
    "Drywall Installation",
    "Insulation Installation",
    "Interior Trim",
    "Interior Painting",
    "Flooring Installation",
    "Tile Installation",
    "Cabinet Installation",
    "Countertop Installation",
    "Interior Doors",
    "Stairs and Railings",
    "Closet Systems",
  ],
  // Finishes phase
  "finishes": [
    "Finish Carpentry",
    "Millwork Installation",
    "Appliance Installation",
    "Fixture Installation",
    "Finish Plumbing",
    "Finish Electrical",
    "Window Treatments",
    "Hardware Installation",
    "Finish HVAC",
    "Final Painting",
  ],
  // Specialty items
  "specialty": [
    "Pool Installation",
    "Outdoor Kitchen",
    "Home Theater",
    "Smart Home Systems",
    "Specialty Lighting",
    "Custom Cabinetry",
    "Fireplace Installation",
    "Elevator Installation",
    "Wine Cellar",
    "Custom Shower/Bathroom",
  ],
};

// Add a mapping of bid titles to standard scopes of work
const BID_SCOPE_TEMPLATES: Record<string, string> = {
  // Common scopes
  "General Contracting Services": "Provide overall project management, coordination, and supervision of all construction activities. Includes scheduling, quality control, safety management, and coordination with all subcontractors and suppliers.",
  "Project Management": "Oversee the entire construction project from planning through completion. Includes scheduling, budget management, communication with stakeholders, and coordination of all project activities.",
  "Construction Services": "Provide comprehensive construction services including labor, equipment, and materials as needed for the project. Includes site preparation, construction, and cleanup.",
  "General Labor": "Provide skilled and unskilled labor for various construction tasks as directed by the project manager. Includes site preparation, material handling, and general construction support.",
  "Site Supervision": "Provide on-site supervision to ensure work is performed according to specifications, safety standards, and project schedule. Includes daily reporting and coordination with other trades.",
  "Equipment Rental": "Provide construction equipment and machinery for use on the project site. Includes delivery, setup, maintenance, and removal of equipment.",
  "Materials Supply": "Supply construction materials for the project. Includes ordering, delivery, storage, and inventory management of materials.",
  
  // Site work scopes
  "Excavation and Grading": "Excavate and grade the site according to project specifications. Includes clearing, grubbing, excavation, backfilling, and final grading to prepare the site for construction.",
  "Site Preparation": "Prepare the site for construction. Includes clearing vegetation, removing debris, leveling the ground, and establishing proper drainage.",
  "Land Clearing": "Clear the land of trees, vegetation, and debris to prepare for construction. Includes tree removal, stump grinding, and disposal of cleared materials.",
  "Demolition": "Demolish existing structures and prepare the site for new construction. Includes structural demolition, debris removal, and site cleanup.",
  "Erosion Control": "Implement erosion control measures to prevent soil erosion and sediment runoff. Includes installation of silt fences, erosion control blankets, and other protective measures.",
  "Sitework Package": "Complete all site preparation work including clearing, grading, excavation, and utility installation. Includes coordination with utility companies and obtaining necessary permits.",
  "Utilities Installation": "Install underground utilities including water, sewer, gas, and electrical lines. Includes trenching, pipe installation, backfilling, and connection to existing utilities.",
  "Drainage Systems": "Design and install drainage systems to manage water flow on the site. Includes French drains, catch basins, and stormwater management systems.",
  "Septic System Installation": "Design and install a septic system according to local regulations. Includes excavation, tank installation, field line installation, and connection to the building.",
  "Underground Utility Work": "Install and connect all underground utilities required for the project. Includes water, sewer, gas, electrical, and communication lines.",
  
  // Foundation scopes
  "Concrete Foundation": "Construct the concrete foundation according to project specifications. Includes excavation, formwork, reinforcement, concrete placement, and curing.",
  "Foundation Package": "Complete all foundation work including excavation, footings, walls, and slab. Includes waterproofing, drainage, and backfilling.",
  "Concrete Footings and Foundation": "Construct concrete footings and foundation walls according to engineering specifications. Includes excavation, formwork, reinforcement, concrete placement, and curing.",
  "Basement Waterproofing": "Apply waterproofing systems to the basement walls and floor to prevent water infiltration. Includes surface preparation, application of waterproofing materials, and installation of drainage systems.",
  "Foundation Insulation": "Install insulation on the foundation walls and floor to improve energy efficiency. Includes surface preparation, installation of insulation materials, and protection from damage.",
  "Concrete Flatwork": "Construct concrete flatwork including driveways, walkways, patios, and garage floors. Includes site preparation, formwork, reinforcement, concrete placement, and finishing.",
  "Slab Preparation": "Prepare the site for concrete slab installation. Includes excavation, compaction, installation of vapor barrier, and reinforcement.",
  "Rebar Installation": "Install reinforcing steel (rebar) according to engineering specifications. Includes cutting, bending, tying, and placement of rebar in the correct locations.",
  "Pier and Beam Foundation": "Construct a pier and beam foundation system. Includes excavation, pier installation, beam installation, and floor joist installation.",
  "Foundation Drainage": "Install drainage systems around the foundation to prevent water infiltration. Includes excavation, installation of drainage pipe, gravel backfill, and connection to existing drainage systems.",
  
  // Framing scopes
  "Rough Framing": "Construct the structural framework of the building. Includes floor framing, wall framing, roof framing, and installation of structural components.",
  "Framing Package": "Complete all framing work including floors, walls, and roof. Includes installation of structural components, sheathing, and bracing.",
  "Structural Framing": "Construct the structural framework according to engineering specifications. Includes installation of beams, columns, trusses, and other structural components.",
  "Roof Framing": "Construct the roof framework including trusses, rafters, and sheathing. Includes installation of structural components and preparation for roofing materials.",
  "Floor Framing": "Construct the floor framework including joists, beams, and subfloor. Includes installation of structural components and preparation for finish flooring.",
  "Wall Framing": "Construct the wall framework including studs, plates, and headers. Includes installation of structural components and preparation for finish materials.",
  "Stair Framing": "Construct the framework for stairs including stringers, treads, and risers. Includes installation of structural components and preparation for finish materials.",
  "Deck Framing": "Construct the framework for decks including posts, beams, joists, and ledger boards. Includes installation of structural components and preparation for finish materials.",
  "Structural Steel": "Fabricate and install structural steel components according to engineering specifications. Includes cutting, welding, bolting, and installation of steel members.",
  "Timber Frame": "Construct a timber frame structure using traditional joinery techniques. Includes cutting, fitting, and assembly of timber components.",
  
  // Rough-ins scopes
  "Electrical Rough-in": "Install electrical wiring, boxes, and conduit according to electrical code. Includes installation of service panel, branch circuits, and preparation for fixtures and appliances.",
  "Plumbing Rough-in": "Install plumbing pipes, fittings, and fixtures according to plumbing code. Includes water supply lines, drain lines, vent lines, and preparation for fixtures.",
  "HVAC Rough-in": "Install HVAC ductwork, pipes, and equipment according to mechanical code. Includes installation of air handlers, ductwork, refrigerant lines, and preparation for registers and grilles.",
  "Mechanical Rough-in": "Install mechanical systems including HVAC, plumbing, and electrical according to code. Includes coordination between trades and preparation for finish work.",
  "Low Voltage Wiring": "Install low voltage wiring for security systems, data networks, and audio/video systems. Includes installation of conduit, wire, and junction boxes.",
  "Security System Rough-in": "Install wiring and components for security systems. Includes installation of sensors, cameras, control panels, and preparation for finish work.",
  "Data/Communication Wiring": "Install wiring for data and communication systems. Includes installation of conduit, wire, and junction boxes for network and phone systems.",
  "Sprinkler System Rough-in": "Install piping and components for fire sprinkler systems according to fire code. Includes installation of pipes, fittings, and preparation for sprinkler heads.",
  
  // Exterior scopes
  "Roofing Installation": "Install roofing materials according to manufacturer specifications. Includes installation of underlayment, flashing, shingles or other roofing materials, and ridge caps.",
  "Siding Installation": "Install exterior siding materials according to manufacturer specifications. Includes installation of sheathing, weather barrier, siding, and trim.",
  "Windows and Doors": "Install windows and exterior doors according to manufacturer specifications. Includes installation of frames, sills, hardware, and weatherstripping.",
  "Garage Door Installation": "Install garage door(s) and opener(s) according to manufacturer specifications. Includes tracks, springs, hardware, weather seals, and safety sensors.",
  "Exterior Trim": "Install exterior trim including fascia, soffits, corner boards, and window/door trim. Includes cutting, fitting, and installation of trim materials.",
  "Exterior Painting": "Prepare and paint exterior surfaces according to specifications. Includes surface preparation, primer application, and finish coat application.",
  "Stucco Application": "Apply stucco to exterior walls according to manufacturer specifications. Includes installation of lath, base coat, and finish coat.",
  "Brick/Stone Masonry": "Construct brick or stone walls, veneers, and accents according to specifications. Includes layout, cutting, and installation of masonry units.",
  "Gutters and Downspouts": "Install gutters and downspouts according to specifications. Includes installation of brackets, gutters, downspouts, and splash blocks.",
  "Deck Construction": "Construct exterior decks according to specifications. Includes installation of footings, posts, beams, joists, decking, and railings.",
  "Porch Construction": "Construct porches according to specifications. Includes installation of footings, posts, beams, joists, decking, and railings.",
  
  // Interior scopes
  "Drywall Installation": "Install drywall according to specifications. Includes hanging, taping, mudding, sanding, and preparation for finish work.",
  "Insulation Installation": "Install insulation according to specifications. Includes installation of insulation materials and application to building components.",
  "Interior Trim": "Install interior trim including baseboards, crown molding, window/door trim, and other decorative elements. Includes cutting, fitting, and installation of trim materials.",
  "Interior Painting": "Prepare and paint interior surfaces according to specifications. Includes surface preparation, primer application, and finish coat application.",
  "Flooring Installation": "Install flooring materials according to manufacturer specifications. Includes subfloor preparation, installation of underlayment, and installation of flooring materials.",
  "Tile Installation": "Install tile according to manufacturer specifications. Includes surface preparation, layout, cutting, and installation of tile and grout.",
  "Cabinet Installation": "Install cabinets according to manufacturer specifications. Includes layout, leveling, and installation of base and wall cabinets.",
  "Countertop Installation": "Install countertops according to manufacturer specifications. Includes measurement, cutting, and installation of countertop materials.",
  "Interior Doors": "Install interior doors according to manufacturer specifications. Includes installation of frames, doors, hardware, and trim.",
  "Stairs and Railings": "Install stairs and railings according to specifications. Includes installation of stringers, treads, risers, handrails, and balusters.",
  "Closet Systems": "Install closet organization systems according to manufacturer specifications. Includes layout, cutting, and installation of closet components.",
  
  // Finishes scopes
  "Finish Carpentry": "Complete all finish carpentry work including trim, doors, cabinets, and other decorative elements. Includes cutting, fitting, and installation of finish materials.",
  "Millwork Installation": "Install custom millwork including cabinets, built-ins, and decorative elements. Includes layout, cutting, and installation of millwork components.",
  "Appliance Installation": "Install appliances according to manufacturer specifications. Includes delivery, positioning, connection to utilities, and testing.",
  "Fixture Installation": "Install plumbing and electrical fixtures according to manufacturer specifications. Includes installation of faucets, sinks, toilets, light fixtures, and other fixtures.",
  "Finish Plumbing": "Complete all finish plumbing work including fixtures, trim, and final connections. Includes testing and adjustment of plumbing systems.",
  "Finish Electrical": "Complete all finish electrical work including fixtures, switches, outlets, and final connections. Includes testing and adjustment of electrical systems.",
  "Window Treatments": "Install window treatments including blinds, shades, curtains, and hardware. Includes measurement, cutting, and installation of window treatments.",
  "Hardware Installation": "Install hardware including door knobs, cabinet pulls, and other decorative elements. Includes layout, drilling, and installation of hardware.",
  "Finish HVAC": "Complete all finish HVAC work including registers, grilles, thermostats, and final connections. Includes testing and adjustment of HVAC systems.",
  "Final Painting": "Complete all finish painting work including touch-ups and final coats. Includes preparation, application, and cleanup.",
  
  // Specialty scopes
  "Pool Installation": "Install swimming pool according to manufacturer specifications. Includes excavation, installation of pool shell, plumbing, electrical, and finish work.",
  "Outdoor Kitchen": "Construct outdoor kitchen according to specifications. Includes installation of cabinets, countertops, appliances, and utilities.",
  "Home Theater": "Install home theater system according to specifications. Includes installation of audio/video equipment, wiring, and acoustic treatments.",
  "Smart Home Systems": "Install smart home systems including lighting, security, climate control, and entertainment. Includes installation of controllers, sensors, and programming.",
  "Specialty Lighting": "Install specialty lighting systems according to specifications. Includes installation of fixtures, controls, and programming.",
  "Custom Cabinetry": "Design and install custom cabinetry according to specifications. Includes measurement, design, fabrication, and installation of cabinets.",
  "Fireplace Installation": "Install fireplace according to manufacturer specifications. Includes installation of firebox, chimney, and finish work.",
  "Elevator Installation": "Install elevator according to manufacturer specifications. Includes installation of shaft, cab, controls, and safety systems.",
  "Wine Cellar": "Construct wine cellar according to specifications. Includes installation of cooling system, storage, lighting, and finish work.",
  "Custom Shower/Bathroom": "Construct custom shower or bathroom according to specifications. Includes installation of fixtures, tile, and specialty features.",
};

interface ReusableBidFormProps {
  open?: boolean;
  onClose?: () => void;
  onSubmit: (bidForm: BidFormData) => Promise<void>;
  phases?: Phase[]; // Optional: If projectId is provided
  subcontractors: Subcontractor[];
  initialBidData?: Partial<BidFormData>;
  editingBidId?: string | null;
  isSaving?: boolean;
  onAddSubcontractor?: () => void;
  isDialog?: boolean;
  projectId?: string; // Optional: Context project ID
  projectName?: string; // Optional: Context project name
  availableProjects?: Project[]; // Optional: Full list for standalone mode
  error?: string | null; // Optional: To display API errors from parent
}

const ReusableBidForm: React.FC<ReusableBidFormProps> = ({
  open,
  onClose,
  onSubmit,
  phases,
  subcontractors,
  initialBidData,
  editingBidId,
  isSaving = false,
  onAddSubcontractor,
  isDialog = false,
  projectId,
  projectName,
  availableProjects,
  error,
}) => {
  const { user } = useAuth();
  // Default bid form state
  const defaultBidForm: BidFormData = {
    title: '',
    subcontractorName: '',
    totalAmount: 0,
    phaseId: (phases && phases.length > 0) ? phases[0].id : '',
    phaseName: (phases && phases.length > 0) ? phases[0].name : '',
    scope: '',
    timeline: 30,
    paymentTerms: {
      downPaymentPercent: 20,
      isDownPaymentFixed: false,
      downPaymentAmount: 0,
      installments: [
        {
          id: uuidv4(),
          name: 'Final Payment',
          percent: 80,
          isFixedAmount: false,
          fixedAmount: 0,
          milestoneDescription: 'Upon completion of work',
          phaseId: '',
          phaseName: ''
        }
      ],
      syncInstallmentPhases: true
    },
    notes: '',
    status: 'submitted',
    attachments: [],
    tags: [],
    projectId: projectId,
  };

  // State for form
  const [bidForm, setBidForm] = useState<BidFormData>(initialBidData ? { ...defaultBidForm, ...initialBidData } : defaultBidForm);
  const [paymentTemplate, setPaymentTemplate] = useState('standard');
  const [tagInput, setTagInput] = useState('');
  const [bidFormErrors, setBidFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null);
  // Add projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [currentProjectPhases, setCurrentProjectPhases] = useState<Phase[]>([]);

  // Log initial mounting for debugging
  console.log('ReusableBidForm mounted/updated with props:', {
    initialBidData: initialBidData ? { ...initialBidData } : null,
    editingBidId,
    isDialog,
    open,
    subcontractorsCount: subcontractors.length,
    subcontractors: subcontractors.map(s => ({ id: s.id, name: s.name }))
  });

  // Track initialization to prevent infinite loops
  const initialized = React.useRef(false);

  // Add a useEffect to log subcontractors changes
  useEffect(() => {
    console.log('ReusableBidForm - subcontractors updated:', 
      subcontractors.map(s => ({ id: s.id, name: s.name }))
    );
  }, [subcontractors]);

  // At the beginning of the component, after hooks
  useEffect(() => {
    console.log("ReusableBidForm MOUNT - initialBidData:", initialBidData);
    console.log("ReusableBidForm MOUNT - editingBidId:", editingBidId);
    console.log("ReusableBidForm MOUNT - initialized ref:", initialized.current);
    console.log("ReusableBidForm MOUNT - subcontractors:", 
      subcontractors.map(s => ({ id: s.id, name: s.name }))
    );
  }, []);

  // At the beginning of the component add a check
  useEffect(() => {
    // Print a debug warning if editingBidId is present but initialBidData is null
    if (editingBidId && !initialBidData) {
      console.warn("ReusableBidForm WARNING: editingBidId is present but initialBidData is null", {
        editingBidId,
        initialBidData
      });
    }
  }, [editingBidId, initialBidData]);

  // Update the existing useEffect
  useEffect(() => {
    console.log("ReusableBidForm initialBidData change - initialBidData:", initialBidData);
    console.log("ReusableBidForm initialBidData change - editingBidId:", editingBidId);
    console.log("ReusableBidForm initialBidData change - initialized ref:", initialized.current);
    
    // Skip if no initialBidData
    if (!initialBidData) {
      console.log("ReusableBidForm - No initialBidData, skipping form initialization");
      return;
    }

    // Safe access to nested properties with optional chaining
    const installments = initialBidData.paymentTerms?.installments || [];
    console.log("ReusableBidForm - Installments from initialBidData:", installments);
    
    // Only update form if editingBidId exists or we haven't initialized
    if (editingBidId || !initialized.current) {
      console.log("ReusableBidForm - Updating form with initialBidData");
      
      const updatedFormData = {
        ...defaultBidForm,
        ...initialBidData,
        // Ensure nested objects are properly initialized
        paymentTerms: {
          ...defaultBidForm.paymentTerms,
          ...(initialBidData.paymentTerms || {}),
          // Ensure installments array is properly initialized
          installments: Array.isArray(initialBidData.paymentTerms?.installments) 
            ? [...(initialBidData.paymentTerms?.installments || [])]
            : [...defaultBidForm.paymentTerms.installments]
        },
        // Ensure arrays are properly initialized
        tags: Array.isArray(initialBidData.tags) ? [...initialBidData.tags] : [],
        attachments: Array.isArray(initialBidData.attachments) ? [...initialBidData.attachments] : []
      };
      
      setBidForm(updatedFormData);
      console.log("ReusableBidForm - Form updated with data:", updatedFormData);
      initialized.current = true;
    }
  }, [initialBidData, editingBidId]);

  // Add effect to update selectedSubcontractor based on bidForm.subcontractorId
  useEffect(() => {
    if (bidForm.subcontractorId && subcontractors.length > 0) {
      const subcontractor = subcontractors.find(s => s.id === bidForm.subcontractorId);
      if (subcontractor) {
        setSelectedSubcontractor(subcontractor);
      }
    } else {
      setSelectedSubcontractor(null);
    }
  }, [bidForm.subcontractorId, subcontractors]);

  // Fetch user projects if projectId is not provided
  useEffect(() => {
    const fetchProjects = async () => {
      if (!projectId && user?.uid) {
        try {
          setIsLoadingProjects(true);
          const userProjects = await ProjectService.getProjects(user.uid);
          console.log('ReusableBidForm - Fetched projects:', userProjects.length);
          setProjects(userProjects);
        } catch (error) {
          console.error('Error fetching projects:', error);
          setApiError('Failed to load projects. Please try again.');
        } finally {
          setIsLoadingProjects(false);
        }
      }
    };

    fetchProjects();
  }, [user?.uid, projectId]);

  // Add Effect to update currentProjectPhases based on selected project
  useEffect(() => {
    console.log("[Effect Update Phases] Running...");
    console.log("[Effect Update Phases] Props -> projectId:", projectId);
    console.log("[Effect Update Phases] Props -> phases:", phases);
    console.log("[Effect Update Phases] Props -> availableProjects:", availableProjects?.map(p => p.name)); // Log names for readability
    console.log("[Effect Update Phases] State -> bidForm.projectId:", bidForm.projectId);

    const fetchProjectPhases = async (id: string) => {
      try {
        console.log("[Effect Update Phases] Fetching phases for project:", id);
        // Check if user is available before fetching
        if (!user?.uid) {
          console.warn("[Effect Update Phases] User not available, cannot fetch phases");
          return;
        }
        
        // Use the exported getProject function which takes userId as a second parameter
        const project = await getProject(id, user.uid);
        if (project && project.phases) {
          console.log("[Effect Update Phases] Fetched project phases:", project.phases);
          setCurrentProjectPhases(project.phases);
        } else {
          console.log("[Effect Update Phases] Project has no phases or could not be fetched");
          setCurrentProjectPhases([]);
        }
      } catch (error) {
        console.error("[Effect Update Phases] Error fetching project:", error);
        setCurrentProjectPhases([]);
      }
    };

    // If projectId prop is provided, use the directly passed phases
    if (projectId && phases) {
      console.log("[Effect Update Phases] Mode: Using phases passed via props for projectId:", projectId);
      setCurrentProjectPhases(phases);
      console.log("[Effect Update Phases] Set currentProjectPhases to (from props):", phases);
    } 
    // If projectId is provided but phases aren't, fetch the phases
    else if (projectId && !phases) {
      console.log("[Effect Update Phases] Mode: ProjectId provided but no phases, fetching from API");
      fetchProjectPhases(projectId);
    }
    // Else if we are in standalone mode (no projectId prop) and have availableProjects
    else if (!projectId && availableProjects && bidForm.projectId) {
      console.log("[Effect Update Phases] Mode: Standalone form, project selected.");
      const selectedProject = availableProjects.find(p => p.id === bidForm.projectId);
      console.log("[Effect Update Phases] Found selected project:", selectedProject?.name);
      const newPhases = selectedProject?.phases || [];
      setCurrentProjectPhases(newPhases);
      console.log("[Effect Update Phases] Set currentProjectPhases to (from selected project):", newPhases);
      
      // Reset phase selection if selected project doesn't contain the current phaseId
      if (selectedProject && !newPhases.some(p => p.id === bidForm.phaseId)) {
        console.log("[Effect Update Phases] Resetting phaseId because it's not in the new project phases");
        // Use functional update to avoid stale state issues if needed
        setBidForm(prev => ({
          ...prev,
          phaseId: '',
          phaseName: ''
        }));
      }
    } 
    // Otherwise, clear phases (e.g., no project selected yet in standalone mode or projectId passed but no phases)
    else {
      console.log("[Effect Update Phases] Mode: Clearing phases (no project selected or missing phases prop).");
      setCurrentProjectPhases([]);
      console.log("[Effect Update Phases] Set currentProjectPhases to: []");
      // Optionally reset phaseId if it shouldn't persist when phases are cleared
      // setBidForm(prev => ({ ...prev, phaseId: '', phaseName: '' }));
    }
  // Make sure all dependencies that influence the logic are included
  }, [bidForm.projectId, bidForm.phaseId, projectId, phases, availableProjects, user?.uid]);

  // Form change handlers
  const handleChangeBidForm = (field: string, value: any) => {
    console.log(`ReusableBidForm - Changing field "${field}" to:`, value);
    console.log(`ReusableBidForm - Current form state:`, bidForm);
    
    // Ensure we're not accidentally preventing updates
    if (typeof value === 'undefined') {
      console.warn(`ReusableBidForm - Attempt to set "${field}" to undefined, using null instead`);
      value = null;
    }
    
    setBidForm(prev => {
      let newState = {
        ...prev,
        [field]: value
      };
      
      // Special handling for phaseId, also update phaseName
      if (field === 'phaseId') {
        const phaseName = currentProjectPhases.find(p => p.id === value)?.name || '';
        newState.phaseName = phaseName;
        
        // Update all installment phases that haven't been manually configured
        newState = {
          ...newState,
          paymentTerms: {
            ...newState.paymentTerms,
            installments: newState.paymentTerms.installments.map(inst => 
              // Only update phases that haven't been manually configured
              inst.manuallyConfigured ? inst : {
                ...inst,
                phaseId: value,
                phaseName: phaseName
              }
            )
          }
        };
      }
      
      console.log(`ReusableBidForm - New form state after updating ${field}:`, newState);
      return newState;
    });
  };

  const handleChangePaymentTerms = (field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        [field]: value
      }
    }));
  };

  const handleAddInstallment = () => {
    setBidForm(prev => {
      const currentInstallments = prev.paymentTerms.installments;
      const numInstallments = currentInstallments.length;
      
      // Check if we're using fixed amounts (based on down payment setting)
      const useFixedAmounts = prev.paymentTerms.isDownPaymentFixed;
      
      // Create new array of installments with updated names
      let updatedInstallments = [];
      
      if (numInstallments === 0) {
        // If this is the first installment, name it "Final Payment"
        updatedInstallments = [
          {
            id: uuidv4(), 
            name: 'Final Payment', 
            percent: 0, 
            isFixedAmount: useFixedAmounts, // Match down payment type
            fixedAmount: 0,
            milestoneDescription: '',
            phaseId: prev.phaseId || '',
            phaseName: prev.phaseName || '',
            manuallyConfigured: false
          }
        ];
      } else {
        // Rename existing installments
        updatedInstallments = currentInstallments.map((item, index) => {
          // All items except the last one are named "Installment N"
          if (index < numInstallments - 1) {
            return { ...item, name: `Installment ${index + 1}` };
          } else {
            // The previously last item becomes an installment
            return { ...item, name: `Installment ${numInstallments}` };
          }
        });
        
        // Add the new item as "Final Payment"
        updatedInstallments.push({
          id: uuidv4(), 
          name: 'Final Payment', 
          percent: 0, 
          isFixedAmount: useFixedAmounts, // Match down payment type
          fixedAmount: 0,
          milestoneDescription: '',
          phaseId: prev.phaseId || '',
          phaseName: prev.phaseName || '',
          manuallyConfigured: false
        });
      }
      
      // Return the updated state
      return {
        ...prev,
        paymentTerms: {
          ...prev.paymentTerms,
          installments: updatedInstallments
        }
      };
    });
    setPaymentTemplate('custom');
  };

  const handleChangeInstallment = (id: string, field: string, value: any) => {
    setBidForm(prev => {
      // Track if this is a phase-related change
      const isPhaseChange = field === 'phaseId' || field === 'phaseName';
      
      return {
        ...prev,
        paymentTerms: {
          ...prev.paymentTerms,
          installments: prev.paymentTerms.installments.map(item => 
            item.id === id ? {
              ...item, 
              [field]: value,
              // If changing phase, mark it as manually configured
              manuallyConfigured: isPhaseChange ? true : item.manuallyConfigured
            } : item
          )
        }
      };
    });
    setPaymentTemplate('custom');
  };

  const handleRemoveInstallment = (id: string) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.filter(item => item.id !== id)
      }
    }));
    setPaymentTemplate('custom');
  };

  const handlePaymentTemplateChange = (e: SelectChangeEvent<string>) => {
    const template = e.target.value;
    setPaymentTemplate(template);
    
    // Safely access phases
    const defaultPhase = (phases && phases.length > 0) ? phases[0] : null;
    
    // Keep the current fixed amount setting for consistency
    const useFixedAmounts = bidForm.paymentTerms.isDownPaymentFixed;
    
    // Update payment terms based on template
    switch(template) {
      case 'one-time':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 100,
            isDownPaymentFixed: useFixedAmounts,
            downPaymentAmount: prev.totalAmount,
            installments: [],
            syncInstallmentPhases: prev.paymentTerms.syncInstallmentPhases
          }
        }));
        break;
      case 'standard':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 50,
            isDownPaymentFixed: useFixedAmounts,
            downPaymentAmount: prev.totalAmount * 0.5,
            installments: [
              {
                id: uuidv4(), 
                name: 'Final Payment', 
                percent: 50,
                isFixedAmount: useFixedAmounts,
                fixedAmount: prev.totalAmount * 0.5,
                milestoneDescription: 'Upon completion',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name,
                manuallyConfigured: false
              }
            ],
            syncInstallmentPhases: prev.paymentTerms.syncInstallmentPhases
          }
        }));
        break;
      case 'trades':
        // Using parseFloat(x.toFixed(1)) to round to 1 decimal place
        const downPercent = parseFloat((30).toFixed(1));
        const roughInPercent = parseFloat((40).toFixed(1));
        const finalPercent = parseFloat((30).toFixed(1));
        
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: downPercent,
            isDownPaymentFixed: useFixedAmounts,
            downPaymentAmount: prev.totalAmount * (downPercent / 100),
            installments: [
              {
                id: uuidv4(), 
                name: 'Rough-In', 
                percent: roughInPercent,
                isFixedAmount: useFixedAmounts,
                fixedAmount: prev.totalAmount * (roughInPercent / 100),
                milestoneDescription: 'After rough-in inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name,
                manuallyConfigured: false
              },
              {
                id: uuidv4(), 
                name: 'Final/Top-Out', 
                percent: finalPercent,
                isFixedAmount: useFixedAmounts,
                fixedAmount: prev.totalAmount * (finalPercent / 100),
                milestoneDescription: 'After final inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name,
                manuallyConfigured: false
              }
            ],
            syncInstallmentPhases: prev.paymentTerms.syncInstallmentPhases
          }
        }));
        break;
      case 'custom':
        // Keep current values, user will modify manually
        break;
    }
  };

  // Tag handling
  const handleAddTag = (tag: string) => {
    if (tag && !bidForm.tags.includes(tag)) {
      setBidForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setBidForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate required fields
    const errors: Record<string, string> = {};
    if (!bidForm.title) errors.title = 'Title is required';
    if (!bidForm.subcontractorName) errors.subcontractorName = 'Subcontractor is required';
    if (!bidForm.totalAmount || bidForm.totalAmount <= 0) errors.totalAmount = 'A valid amount is required';
    
    // Ensure projectId is present
    if (!projectId && !bidForm.projectId) {
      errors.projectId = 'Project ID is required';
      console.error('Cannot create bid: Missing project ID');
    }

    if (Object.keys(errors).length > 0) {
      // There are validation errors
      console.log('Form validation errors:', errors);
      // Update form errors state
      setBidFormErrors(errors);
      return;
    }

    // Clear any previous errors
    setBidFormErrors({});
    setApiError(null);

    try {
      // Ensure projectId is included in the submitted data
      const finalBidData = {
        ...bidForm,
        projectId: projectId || bidForm.projectId
      };

      // Log data being submitted
      console.log('Submitting bid data:', finalBidData);
      
      // Call the onSubmit handler
      await onSubmit(finalBidData);
      
      // If we're in a dialog, close it
      if (isDialog && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting bid:', error);
      setApiError('Failed to save bid. Please try again.');
    }
  };

  // Modify the helper function to handle multiple keyword matches
  const getBidTitleOptions = (phaseId: string | undefined, phases: Phase[]): string[] => {
    const applicableKeys: string[] = ["common"]; // Start with common
    let phaseNameForLog = "(No Phase Selected)";

    if (phaseId && phases.length > 0) {
      const phase = phases.find(p => p.id === phaseId);
      if (phase) {
        phaseNameForLog = phase.name;
        const phaseNameLower = phase.name.toLowerCase();
        
        // Use separate `if` statements to find all applicable keys
        if (phaseNameLower.includes("site") || phaseNameLower.includes("excav") || phaseNameLower.includes("demo")) {
          applicableKeys.push("site_work");
        }
        if (phaseNameLower.includes("foundation") || phaseNameLower.includes("concrete") || phaseNameLower.includes("footings") || phaseNameLower.includes("footing")) {
          applicableKeys.push("foundation");
        }
        if (phaseNameLower.includes("frame") || phaseNameLower.includes("struct")) {
          applicableKeys.push("framing");
        }
        if (phaseNameLower.includes("rough") || phaseNameLower.includes("plumb") || phaseNameLower.includes("electr") || phaseNameLower.includes("hvac")) {
          applicableKeys.push("rough_ins");
        }
        if (phaseNameLower.includes("exterior") || phaseNameLower.includes("roof") || phaseNameLower.includes("siding")) {
          applicableKeys.push("exterior");
        }
        if (phaseNameLower.includes("interior") || phaseNameLower.includes("drywall") || phaseNameLower.includes("paint") || phaseNameLower.includes("insulat")) {
          applicableKeys.push("interior");
        }
        if (phaseNameLower.includes("finish") || phaseNameLower.includes("cabinet") || phaseNameLower.includes("counter")) {
          applicableKeys.push("finishes");
        }
        if (phaseNameLower.includes("pool") || phaseNameLower.includes("special") || phaseNameLower.includes("custom")) {
          applicableKeys.push("specialty");
        }
        // Add more checks if needed

      } else {
        console.log(`[getBidTitleOptions] Phase ID ${phaseId} provided but not found in phases list.`);
      }
    } else if (!phaseId) {
        console.log('[getBidTitleOptions] No phase selected.');
    } else { // phases.length === 0
        console.log('[getBidTitleOptions] Phase ID provided but phases list is empty.');
    }

    // Remove duplicates from applicableKeys (e.g., if common is added implicitly elsewhere)
    const uniqueKeys = Array.from(new Set(applicableKeys));
    console.log(`[getBidTitleOptions] For Phase: "${phaseNameForLog}", Applicable Category Keys:`, uniqueKeys);

    // Collect titles from all applicable keys using a Set for automatic deduplication
    const combinedTitles = new Set<string>();
    uniqueKeys.forEach(key => {
      const titles = PHASE_BID_TITLES[key] || [];
      console.log(`[getBidTitleOptions] Titles for Key "${key}":`, titles);
      titles.forEach(title => combinedTitles.add(title));
    });

    // Convert Set to sorted array
    const finalOptions = Array.from(combinedTitles).sort();
    
    console.log(`[getBidTitleOptions] Final Combined & Sorted Options (${finalOptions.length}):`, finalOptions);
    
    return finalOptions;
  };

  // Log render values just before defining formContent
  console.log("[Render Phase Select] value:", bidForm.phaseId || '');
  console.log("[Render Phase Select] disabled:", !bidForm.projectId || currentProjectPhases.length === 0);
  console.log("[Render Phase Select] options (currentProjectPhases):", currentProjectPhases);

  const formContent = (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        p: { xs: 1.5, md: 2.5 }, // Reduced padding
        '& .MuiGrid-item': { 
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'flex-start' 
        },
        '& .form-section': {
          mb: 3, // Reduced spacing between sections
        },
        // Apply size="small" globally where applicable
        '& .MuiTextField-root': { size: 'small' },
        '& .MuiFormControl-root': { size: 'small' },
        '& .MuiAutocomplete-root': { size: 'small' },
        '& .MuiButton-root': { textTransform: 'none' }, // Consistent button text
      }}>
        {/* Ensure apiError and validation errors are displayed */}
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        {error && !apiError && ( // Display error prop if passed and not already covered by apiError
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {bidFormErrors.projectId && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bidFormErrors.projectId}
          </Alert>
        )}

        {/* Bid Details Section */}
        <Box className="form-section">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
            Bid Details
          </Typography>
          
          <Grid container spacing={2}> 
            {/* Project selector - only show if projectId is not provided as prop */}
            {!projectId && (
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" size="small" error={!!bidFormErrors.projectId}>
                  <InputLabel id="bid-project-select-label">Project</InputLabel>
                  <Select
                    labelId="bid-project-select-label"
                    value={bidForm.projectId || ''}
                    label="Project"
                    required
                    onChange={(e) => {
                      const projectId = e.target.value;
                      const project = projects.find(p => p.id === projectId);
                      handleChangeBidForm('projectId', projectId);
                      // Also update project name if available
                      if (project) {
                        handleChangeBidForm('projectName', project.name);
                      }
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <BusinessIcon fontSize="small" color="primary" />
                      </InputAdornment>
                    }
                    endAdornment={
                      isLoadingProjects ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ) : null
                    }
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name || 'Unnamed Project'}
                      </MenuItem>
                    ))}
                  </Select>
                  {bidFormErrors.projectId && (
                    <FormHelperText>{bidFormErrors.projectId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            
            {/* Project Phase field - moved up to be before bid title */}
            <Grid item xs={12} md={6}> 
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="bid-phase-select-label">Project Phase</InputLabel>
                <Select
                  labelId="bid-phase-select-label"
                  value={bidForm.phaseId || ''}
                  label="Project Phase"
                  onChange={(e) => {
                    const phaseId = e.target.value;
                    console.log("Project Phase Changed. New phaseId:", phaseId);
                    console.log("Available phases (currentProjectPhases):", currentProjectPhases);
                    // Safely find phase within the CURRENTLY displayed phases state
                    const phase = currentProjectPhases.find(p => p.id === phaseId);
                    console.log("Found phase object:", phase);
                    handleChangeBidForm('phaseId', phaseId);
                    handleChangeBidForm('phaseName', phase?.name || '');
                  }}
                  sx={{ borderRadius: 1 }}
                  disabled={!bidForm.projectId || currentProjectPhases.length === 0}
                >
                  {currentProjectPhases.length === 0 && (
                    <MenuItem value="" disabled>
                      {bidForm.projectId ? 'No phases for selected project' : 'Select a project first'}
                    </MenuItem>
                  )}
                  {currentProjectPhases.map((phase) => {
                    console.log("Rendering phase option:", phase.name, phase.id);
                    return (
                      <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Status field */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={bidForm.status}
                  onChange={(e) => handleChangeBidForm('status', e.target.value as Bid['status'])}
                  label="Status"
                  sx={{ borderRadius: 1 }}
                >
                  {/* Status MenuItems with smaller dots */}
                  <MenuItem value="draft">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'grey.400', mr: 1 }} /> Draft
                    </Box>
                  </MenuItem>
                  <MenuItem value="submitted">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'info.main', mr: 1 }} /> Submitted
                    </Box>
                  </MenuItem>
                  <MenuItem value="accepted">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} /> Accepted
                    </Box>
                  </MenuItem>
                  <MenuItem value="rejected">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} /> Rejected
                    </Box>
                  </MenuItem>
                  <MenuItem value="expired">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.dark', mr: 1 }} /> Expired
                    </Box>
                  </MenuItem>
                  <MenuItem value="withdrawn">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.secondary', mr: 1 }} /> Withdrawn
                    </Box>
                  </MenuItem>
                  <MenuItem value="revision_requested">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} /> Revision Requested
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Bid Title Autocomplete - now with phase-specific options */}
            <Grid item xs={12} md={8}> 
              <Autocomplete
                fullWidth
                freeSolo
                id="bid-title"
                options={getBidTitleOptions(bidForm.phaseId, currentProjectPhases)}
                value={bidForm.title}
                onChange={(event, newValue) => {
                  // Trim the value and limit to 100 characters
                  const trimmedValue = (newValue || '').trim().slice(0, 100);
                  handleChangeBidForm('title', trimmedValue);
                  
                  // Auto-populate scope of work if a standard title is selected
                  if (newValue && BID_SCOPE_TEMPLATES[newValue]) {
                    handleChangeBidForm('scope', BID_SCOPE_TEMPLATES[newValue]);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bid Title"
                    placeholder="Select or type a custom title"
                    required
                    error={!!bidFormErrors.title}
                    helperText={bidFormErrors.title || `${bidForm.title.length}/100 characters`}
                    size="small"
                    inputProps={{
                      ...params.inputProps,
                      maxLength: 100,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Tooltip title="Click to select this title" placement="right">
                    <li {...props}>{option}</li>
                  </Tooltip>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Submission Deadline"
                value={bidForm.submissionDeadline || null}
                onChange={(date) => handleChangeBidForm('submissionDeadline', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "small",
                    InputProps: { sx: { borderRadius: 1 } }
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Subcontractor & Financial Section */}
        <Box className="form-section">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}> {/* Adjusted Typography & reduced margin */}
            Subcontractor & Financials
          </Typography>

          <Grid container spacing={2}> 
            <Grid item xs={12} md={6}> 
              <Autocomplete
                fullWidth
                id="subcontractor-selector"
                options={subcontractors || []}
                loading={isLoading}
                value={selectedSubcontractor || null}
                getOptionLabel={(option) => option.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleChangeBidForm('subcontractorId', newValue.id);
                    handleChangeBidForm('subcontractorName', newValue.name);
                  } else {
                    handleChangeBidForm('subcontractorId', '');
                    handleChangeBidForm('subcontractorName', '');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Subcontractor"
                    required
                    error={!!bidFormErrors.subcontractorName}
                    helperText={bidFormErrors.subcontractorName}
                  />
                )}
              />
              {onAddSubcontractor && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<AddIcon />} 
                  onClick={onAddSubcontractor}
                  sx={{ mt: 1 }}
                >
                  Add New Subcontractor
                </Button>
              )}
            </Grid>

            <Grid item xs={6} md={3}> {/* More compact grid */}
              <TextField
                fullWidth
                required
                id="total-amount"
                label="Total Amount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={bidForm.totalAmount}
                onChange={(e) => handleChangeBidForm('totalAmount', Number(e.target.value))}
                size="small"
                error={!!bidFormErrors.totalAmount}
                helperText={bidFormErrors.totalAmount}
              />
            </Grid>

            <Grid item xs={6} md={3}> {/* More compact grid */}
              <TextField
                fullWidth
                required
                label="Timeline (days)"
                type="number"
                value={bidForm.timeline}
                onChange={(e) => handleChangeBidForm('timeline', parseInt(e.target.value) || 0)}
                variant="outlined"
                size="small"
                InputProps={{ sx: { borderRadius: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Scope of Work"
                placeholder="Describe the scope of work..."
                value={bidForm.scope}
                onChange={(e) => handleChangeBidForm('scope', e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{ sx: { borderRadius: 1 } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Payment Terms Section */}
        <Box className="form-section">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}> {/* Reduced margin */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}> {/* Adjusted Typography */}
              Payment Terms
            </Typography>
            <FormControl size="small" variant="outlined" sx={{ minWidth: 160 }}> {/* Reduced width */}
              <InputLabel id="payment-template-label">Template</InputLabel>
              <Select
                labelId="payment-template-label"
                value={paymentTemplate}
                label="Template"
                onChange={handlePaymentTemplateChange}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="one-time">One-time Payment (100%)</MenuItem>
                <MenuItem value="standard">Standard (50/50)</MenuItem>
                <MenuItem value="trades">Trades (30/40/30)</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Down Payment & Add Installment Button */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
             <Grid item xs={12} sm={6}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Initial Payment Type</InputLabel>
                      <Select
                        value={bidForm.paymentTerms.isDownPaymentFixed ? 'amount' : 'percent'}
                        label="Initial Payment Type"
                        onChange={(e) => {
                          const isAmount = e.target.value === 'amount';
                          handleChangePaymentTerms('isDownPaymentFixed', isAmount);
                          
                          // When switching to amount, calculate from percentage
                          if (isAmount && !bidForm.paymentTerms.isDownPaymentFixed) {
                            const amount = bidForm.totalAmount * (bidForm.paymentTerms.downPaymentPercent / 100);
                            handleChangePaymentTerms('downPaymentAmount', amount);
                          }
                          // When switching to percentage, calculate from amount
                          else if (!isAmount && bidForm.paymentTerms.isDownPaymentFixed) {
                            const percent = bidForm.totalAmount > 0 ? 
                              (bidForm.paymentTerms.downPaymentAmount || 0) / bidForm.totalAmount * 100 : 0;
                            handleChangePaymentTerms('downPaymentPercent', percent);
                          }
                          
                          setPaymentTemplate('custom');
                        }}
                      >
                        <MenuItem value="percent">Percentage (%)</MenuItem>
                        <MenuItem value="amount">Fixed Amount ($)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    {bidForm.paymentTerms.isDownPaymentFixed ? (
                      <TextField
                        fullWidth
                        label="Initial Payment"
                        type="number"
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          sx: { borderRadius: 1 }
                        }}
                        value={bidForm.paymentTerms.downPaymentAmount || 0}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          handleChangePaymentTerms('downPaymentAmount', val);
                          
                          // Also update percentage for consistency
                          if (bidForm.totalAmount > 0) {
                            const percent = (val / bidForm.totalAmount) * 100;
                            handleChangePaymentTerms('downPaymentPercent', percent);
                          }
                          
                          setPaymentTemplate('custom');
                        }}
                        variant="outlined"
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label="Initial Payment"
                        type="number"
                        size="small"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          sx: { borderRadius: 1 }
                        }}
                        value={bidForm.paymentTerms.downPaymentPercent}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value)));
                          // Round to 1 decimal place
                          const roundedVal = parseFloat(val.toFixed(1));
                          handleChangePaymentTerms('downPaymentPercent', roundedVal);
                          
                          // Also update amount for consistency
                          const amount = bidForm.totalAmount * (roundedVal / 100);
                          handleChangePaymentTerms('downPaymentAmount', amount);
                          
                          setPaymentTemplate('custom');
                        }}
                        variant="outlined"
                      />
                    )}
                  </Grid>
                </Grid>
                <FormHelperText sx={{ textAlign: 'right', mt: 0.5 }}>
                  {bidForm.paymentTerms.isDownPaymentFixed ? 
                    `Equivalent: ${(bidForm.totalAmount > 0 ? 
                      (bidForm.paymentTerms.downPaymentAmount || 0) / bidForm.totalAmount * 100 : 0).toFixed(1)}%` : 
                    `Amount: ${formatCurrency(bidForm.totalAmount * bidForm.paymentTerms.downPaymentPercent / 100)}`}
                </FormHelperText>
              </Grid>
              <Grid item xs={12} sm={6}> 
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddInstallment}
                  sx={{ borderRadius: 1 }}
                >
                  Add Installment
                </Button>
              </Grid>
          </Grid>

          {/* Installments List */}
          {bidForm.paymentTerms.installments.map((installment, index) => (
            <Paper
              key={installment.id}
              elevation={0}
              variant="outlined"
              sx={{
                p: 1.5, // Reduced padding
                mb: 1.5, // Reduced spacing
                borderRadius: 1,
                borderColor: 'divider',
                position: 'relative' 
              }}
            >
              <IconButton 
                size="small" 
                onClick={() => handleRemoveInstallment(installment.id)} 
                color="inherit"
                sx={{ position: 'absolute', top: 6, right: 6, opacity: 0.5 }} // Adjusted position
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              
               <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}> {/* Smaller title */}
                 Installment {index + 1}: {installment.name}
               </Typography>

              <Grid container spacing={1.5}> {/* Reduced spacing */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Name"
                    size="small"
                    value={installment.name}
                    onChange={(e) => handleChangeInstallment(installment.id, 'name', e.target.value)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                  />
                </Grid>
                
                {/* Input Type Selector */}
                <Grid item xs={6} sm={3} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Input Type</InputLabel>
                    <Select
                      value={installment.isFixedAmount ? 'amount' : 'percent'}
                      label="Input Type"
                      onChange={(e) => {
                        const isAmount = e.target.value === 'amount';
                        handleChangeInstallment(installment.id, 'isFixedAmount', isAmount);
                        
                        // When switching to amount, calculate from percentage
                        if (isAmount && !installment.isFixedAmount) {
                          const amount = bidForm.totalAmount * (installment.percent / 100);
                          handleChangeInstallment(installment.id, 'fixedAmount', amount);
                        }
                        // When switching to percentage, calculate from amount
                        else if (!isAmount && installment.isFixedAmount) {
                          const percent = bidForm.totalAmount > 0 ? 
                            (installment.fixedAmount || 0) / bidForm.totalAmount * 100 : 0;
                          // Round to 1 decimal place
                          const roundedPercent = parseFloat(percent.toFixed(1));
                          handleChangeInstallment(installment.id, 'percent', roundedPercent);
                        }
                      }}
                    >
                      <MenuItem value="percent">Percentage (%)</MenuItem>
                      <MenuItem value="amount">Fixed Amount ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Dynamic Input Field (Amount OR Percentage) */}
                <Grid item xs={6} sm={3} md={2}>
                  {installment.isFixedAmount ? (
                    <TextField
                      fullWidth
                      required
                      label="Amount"
                      type="number"
                      size="small"
                      value={installment.fixedAmount || 0}
                      InputProps={{ 
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        sx: { borderRadius: 1 } 
                      }}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        handleChangeInstallment(installment.id, 'fixedAmount', val);
                        
                        // Also update percentage for consistency
                        if (bidForm.totalAmount > 0) {
                          const percent = (val / bidForm.totalAmount) * 100;
                          handleChangeInstallment(installment.id, 'percent', percent);
                        }
                        
                        setPaymentTemplate('custom');
                      }}
                      variant="outlined"
                    />
                  ) : (
                    <TextField
                      fullWidth
                      required
                      label="Percent"
                      type="number"
                      size="small"
                      value={installment.percent}
                      InputProps={{ 
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        sx: { borderRadius: 1 } 
                      }}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        // Round to 1 decimal place
                        const roundedVal = parseFloat(val.toFixed(1));
                        handleChangeInstallment(installment.id, 'percent', roundedVal);
                        
                        // Also update fixed amount for consistency
                        const amount = bidForm.totalAmount * (roundedVal / 100);
                        handleChangeInstallment(installment.id, 'fixedAmount', amount);
                        
                        setPaymentTemplate('custom');
                      }}
                      variant="outlined"
                    />
                  )}
                </Grid>
                
                {/* Calculated Value (read-only) - shows the other format */}
                <Grid item xs={6} sm={3} md={2}>
                  <TextField
                    fullWidth
                    disabled
                    label={installment.isFixedAmount ? "Equivalent %" : "Equivalent $"}
                    size="small"
                    value={installment.isFixedAmount ? 
                      `${(bidForm.totalAmount > 0 ? (installment.fixedAmount || 0) / bidForm.totalAmount * 100 : 0).toFixed(1)}%` : 
                      formatCurrency(bidForm.totalAmount * installment.percent / 100)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}> {/* Tighter grid */}
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Related Phase</InputLabel>
                    <Select
                      value={installment.phaseId || ''}
                      label="Related Phase"
                      onChange={(e) => {
                        const pId = e.target.value;
                        const pName = currentProjectPhases.find(p => p.id === pId)?.name || '';
                        handleChangeInstallment(installment.id, 'phaseId', pId);
                        handleChangeInstallment(installment.id, 'phaseName', pName);
                      }}
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value=""><em>None</em></MenuItem> 
                      {currentProjectPhases && currentProjectPhases.length > 0 ? (
                        currentProjectPhases.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} {p.id === bidForm.phaseId ? ' (Default)' : ''}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          <Typography variant="caption" color="textSecondary">
                            No phases available for this project
                          </Typography>
                        </MenuItem>
                      )}
                    </Select>
                    {installment.phaseId && installment.phaseId === bidForm.phaseId && (
                      <FormHelperText>Using default bid phase</FormHelperText>
                    )}
                    {installment.phaseId && installment.phaseId !== bidForm.phaseId && (
                      <FormHelperText>Custom phase selection</FormHelperText>
                    )}
                    {(!currentProjectPhases || currentProjectPhases.length === 0) && (
                      <FormHelperText>
                        This project has no phases defined
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={8}> {/* Wider milestone */}
                  <TextField
                    fullWidth
                    label="Milestone Description"
                    placeholder="Payment trigger..."
                    size="small"
                    value={installment.milestoneDescription}
                    onChange={(e) => handleChangeInstallment(installment.id, 'milestoneDescription', e.target.value)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          {/* Payment Total Summary and Warning */}
          {(() => {
            // Calculate total percentage and amount in real-time
            const downPaymentPercent = bidForm.paymentTerms.downPaymentPercent;
            const installmentPercentTotal = bidForm.paymentTerms.installments.reduce((sum, i) => sum + i.percent, 0);
            const totalPercentage = downPaymentPercent + installmentPercentTotal;
            
            // Calculate actual dollar amounts
            const downPaymentAmount = bidForm.paymentTerms.isDownPaymentFixed 
              ? (bidForm.paymentTerms.downPaymentAmount || 0)
              : (bidForm.totalAmount * downPaymentPercent / 100);
            
            const installmentAmountTotal = bidForm.paymentTerms.installments.reduce((sum, i) => 
              sum + (i.isFixedAmount ? (i.fixedAmount || 0) : (bidForm.totalAmount * i.percent / 100)), 0);
            
            const totalAmount = downPaymentAmount + installmentAmountTotal;
            
            // Create informative message based on calculations
            const exactlyOneHundred = Math.abs(totalPercentage - 100) < 0.01; // Allow tiny floating point errors
            const matchesTotalBid = Math.abs(totalAmount - bidForm.totalAmount) < 0.01;
            
            // Get final payment if exists
            const hasFinalPayment = bidForm.paymentTerms.installments.length > 0;
            const finalPayment = hasFinalPayment ? bidForm.paymentTerms.installments[bidForm.paymentTerms.installments.length - 1] : null;
            const finalPaymentAmount = finalPayment ? 
              (finalPayment.isFixedAmount ? 
                (finalPayment.fixedAmount || 0) : 
                bidForm.totalAmount * (finalPayment.percent || 0) / 100) : 0;
            const finalPaymentPercent = finalPayment ? (finalPayment.percent || 0) : 0;
            
            // Calculate what final payment should be to reach 100%
            const remainingPercent = 100 - downPaymentPercent - (hasFinalPayment ? 
              bidForm.paymentTerms.installments.slice(0, -1).reduce((sum, inst) => sum + (inst.percent || 0), 0) : 0);
            const suggestedFinalAmount = bidForm.totalAmount * (remainingPercent / 100);
            
            if (!exactlyOneHundred || !matchesTotalBid) {
              return (
                <Alert 
                  severity="warning" 
                  variant="outlined" 
                  sx={{ mt: 1, mb: 3, borderRadius: 1, py: 1 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
                      Payment Schedule Incomplete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {!exactlyOneHundred ? 
                        `Total: ${totalPercentage.toFixed(1)}% (needs to be 100%)` : 
                        `Total: ${formatCurrency(totalAmount)} (should be ${formatCurrency(bidForm.totalAmount)})`}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary">Initial Payment</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(downPaymentAmount)} ({downPaymentPercent.toFixed(1)}%)
                      </Typography>
                    </Box>
                    
                    {bidForm.paymentTerms.installments.length > 1 && (
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary">Intermediate</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(bidForm.paymentTerms.installments.slice(0, -1).reduce((sum, inst) => {
                            return sum + (inst.isFixedAmount 
                              ? (inst.fixedAmount || 0) 
                              : (bidForm.totalAmount * inst.percent / 100));
                          }, 0))} ({bidForm.paymentTerms.installments.slice(0, -1).reduce((sum, inst) => sum + inst.percent, 0).toFixed(1)}%)
                        </Typography>
                      </Box>
                    )}
                    
                    {hasFinalPayment && (
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          Final Payment
                          {!exactlyOneHundred && (
                            <Tooltip title="Needs adjustment to reach 100%">
                              <InfoIcon fontSize="small" color="warning" sx={{ ml: 0.5, opacity: 0.7, width: 16, height: 16 }} />
                            </Tooltip>
                          )}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(finalPaymentAmount)} ({finalPaymentPercent.toFixed(1)}%)
                        </Typography>
                        {!exactlyOneHundred && finalPaymentPercent !== remainingPercent && (
                          <Typography variant="caption" color="warning.main">
                            Should be: {formatCurrency(suggestedFinalAmount)} ({remainingPercent.toFixed(1)}%)
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {!exactlyOneHundred ? 
                      `To complete the schedule, the final payment should be ${formatCurrency(suggestedFinalAmount)} (${remainingPercent.toFixed(1)}%).` :
                      "Please adjust the payment amounts to match the total bid amount."}
                  </Typography>
                </Alert>
              );
            }
            
            // If both amounts and percentages match, show a success message
            return (
              <Alert 
                severity="success" 
                variant="outlined" 
                sx={{ mt: 1, mb: 3, borderRadius: 1, py: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
                    Payment Schedule Complete
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total: {formatCurrency(totalAmount)} (100%)
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">Initial Payment</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(downPaymentAmount)} ({downPaymentPercent.toFixed(1)}%)
                    </Typography>
                  </Box>
                  
                  {bidForm.paymentTerms.installments.length > 1 && (
                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary">Intermediate</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(bidForm.paymentTerms.installments.slice(0, -1).reduce((sum, inst) => {
                          return sum + (inst.isFixedAmount 
                            ? (inst.fixedAmount || 0) 
                            : (bidForm.totalAmount * inst.percent / 100));
                        }, 0))} ({bidForm.paymentTerms.installments.slice(0, -1).reduce((sum, inst) => sum + inst.percent, 0).toFixed(1)}%)
                      </Typography>
                    </Box>
                  )}
                  
                  {hasFinalPayment && (
                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary">Final Payment</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(finalPaymentAmount)} ({finalPaymentPercent.toFixed(1)}%)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Alert>
            );
          })()}
        </Box>

        {/* Notes Section */}
        <Box className="form-section" sx={{ mb: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}> {/* Ensured reduced margin */}
            Additional Notes
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3} // Reduced rows
            label="Notes / Exclusions"
            placeholder="Include any notes, exclusions, or requirements..."
            value={bidForm.notes}
            onChange={(e) => handleChangeBidForm('notes', e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{ sx: { borderRadius: 1 } }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );

  // Dialog Variant
  if (isDialog) {
    return (
      <Dialog 
        open={open || false} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }} // Adjusted rounding
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2.5, py: 1.5 }}> {/* Tighter header */}
          <Typography variant="h6" fontWeight={500}> 
            {editingBidId ? 'Edit Bid' : 'Create New Bid'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}> {/* Added top padding */} 
          {formContent}
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 1.5, // Tighter actions
            borderTop: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper', 
            justifyContent: 'space-between' 
          }}
        >
          <Button 
            onClick={onClose} 
            color="inherit" 
            variant="outlined" 
            size="medium"
            sx={{ borderRadius: 1, px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="medium"
            disabled={
              isSaving ||
              !bidForm.title ||
              !bidForm.subcontractorName ||
              !bidForm.phaseId ||
              (bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)) !== 100
            }
            sx={{ borderRadius: 1, px: 2 }}
          >
            {isSaving ? 
              <CircularProgress size={22} color="inherit"/> : // Smaller spinner
              (editingBidId ? 'Update Bid' : 'Create Bid')
            }
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Standalone Paper Variant
  return (
    <Paper 
      sx={{ 
        borderRadius: 1.5, // Adjusted rounding
        overflow: 'hidden',
        boxShadow: (theme) => theme.shadows[2] 
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: { xs: 1.5, md: 2 }, // Tighter header
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" fontWeight={500}> {/* Adjusted size/weight */}
          {editingBidId ? 'Edit Bid' : 'Create New Bid'}
        </Typography>
        <Button
          variant="contained"
          onClick={handleSubmit}
          size="medium"
          disabled={
            isSaving ||
            !bidForm.title ||
            !bidForm.subcontractorName ||
            !bidForm.phaseId ||
            (bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)) !== 100
          }
          sx={{ borderRadius: 1, px: 2 }}
        >
          {isSaving ? <CircularProgress size={22} color="inherit"/> : (editingBidId ? 'Update Bid' : 'Create Bid')}
        </Button>
      </Box>
      {formContent}
    </Paper>
  );
};

export default ReusableBidForm; 