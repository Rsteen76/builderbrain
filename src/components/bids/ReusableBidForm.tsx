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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';
import { Bid, BidPaymentStage, Project, Subcontractor, Phase } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';

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

// Interface for bid form data
interface BidFormData {
  title: string;
  subcontractorName: string;
  subcontractorId?: string;
  totalAmount: number;
  phaseId?: string;
  phaseName?: string;
  scope: string;
  timeline: number;
  submissionDeadline?: Date;
  paymentTerms: {
    downPaymentPercent: number;
    installments: {
      id: string;
      name: string;
      percent: number;
      milestoneDescription: string;
      phaseId?: string;
      phaseName?: string;
    }[];
  };
  notes: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  attachments: string[];
  tags: string[];
  projectId?: string;
}

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
      downPaymentPercent: 50,
      installments: [
        {id: uuidv4(), name: 'Final Payment', percent: 50, milestoneDescription: 'Upon completion'}
      ]
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

    // If projectId prop is provided, use the directly passed phases
    if (projectId && phases) {
      console.log("[Effect Update Phases] Mode: Using phases passed via props for projectId:", projectId);
      setCurrentProjectPhases(phases);
      console.log("[Effect Update Phases] Set currentProjectPhases to (from props):", phases);
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
  }, [bidForm.projectId, bidForm.phaseId, projectId, phases, availableProjects]); 

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
      const newState = {
        ...prev,
        [field]: value
      };
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
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: [
          ...prev.paymentTerms.installments,
          {id: uuidv4(), name: `Installment ${prev.paymentTerms.installments.length + 1}`, percent: 0, milestoneDescription: ''}
        ]
      }
    }));
    setPaymentTemplate('custom');
  };

  const handleChangeInstallment = (id: string, field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.map(item => 
          item.id === id ? {...item, [field]: value} : item
        )
      }
    }));
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
    
    // Update payment terms based on template
    switch(template) {
      case 'one-time':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 100,
            installments: []
          }
        }));
        break;
      case 'standard':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 50,
            installments: [
              {
                id: uuidv4(), 
                name: 'Final Payment', 
                percent: 50, 
                milestoneDescription: 'Upon completion',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              }
            ]
          }
        }));
        break;
      case 'trades':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 30,
            installments: [
              {
                id: uuidv4(), 
                name: 'Rough-In', 
                percent: 40, 
                milestoneDescription: 'After rough-in inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              },
              {
                id: uuidv4(), 
                name: 'Final/Top-Out', 
                percent: 30, 
                milestoneDescription: 'After final inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              }
            ]
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

  // Add this helper function for getting bid title options based on phase
  const getBidTitleOptions = (phaseId: string | undefined, phases: Phase[]): string[] => {
    if (!phaseId) {
      return PHASE_BID_TITLES.common || [];
    }

    const phase = phases.find(p => p.id === phaseId);
    if (!phase) {
      return PHASE_BID_TITLES.common || [];
    }

    // Try to match phase name to a category
    const phaseName = phase.name.toLowerCase();
    let phaseKey = "common";

    if (phaseName.includes("site") || phaseName.includes("excav") || phaseName.includes("demo")) {
      phaseKey = "site_work";
    } else if (phaseName.includes("foundation") || phaseName.includes("concrete") || phaseName.includes("footings")) {
      phaseKey = "foundation";
    } else if (phaseName.includes("frame") || phaseName.includes("struct")) {
      phaseKey = "framing";
    } else if (phaseName.includes("rough") || phaseName.includes("plumb") || phaseName.includes("electr") || phaseName.includes("hvac")) {
      phaseKey = "rough_ins";
    } else if (phaseName.includes("exterior") || phaseName.includes("roof") || phaseName.includes("siding")) {
      phaseKey = "exterior";
    } else if (phaseName.includes("interior") || phaseName.includes("drywall") || phaseName.includes("paint")) {
      phaseKey = "interior";
    } else if (phaseName.includes("finish") || phaseName.includes("cabinet") || phaseName.includes("counter")) {
      phaseKey = "finishes";
    } else if (phaseName.includes("pool") || phaseName.includes("special") || phaseName.includes("custom")) {
      phaseKey = "specialty";
    }

    // Combine common options with phase-specific options
    return [...(PHASE_BID_TITLES[phaseKey] || []), ...(PHASE_BID_TITLES.common || [])];
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
                  handleChangeBidForm('title', newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bid Title"
                    placeholder="Select or type a custom title"
                    required
                    error={!!bidFormErrors.title}
                    helperText={bidFormErrors.title}
                    size="small"
                  />
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
                <TextField
                  fullWidth
                  label="Initial Payment (%)"
                  type="number"
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    sx: { borderRadius: 1 }
                  }}
                  value={bidForm.paymentTerms.downPaymentPercent}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value)));
                    handleChangePaymentTerms('downPaymentPercent', val);
                    setPaymentTemplate('custom');
                  }}
                  variant="outlined"
                />
                <FormHelperText sx={{ textAlign: 'right', mt: 0.5 }}>
                  Amount: {formatCurrency(bidForm.totalAmount * bidForm.paymentTerms.downPaymentPercent / 100)}
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

                <Grid item xs={6} sm={3} md={2}> {/* Tighter grid */}
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
                      handleChangeInstallment(installment.id, 'percent', val);
                      setPaymentTemplate('custom');
                    }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={6} sm={3} md={2}> {/* Amount display (read-only) */}
                   <TextField
                     fullWidth
                     disabled
                     label="Amount"
                     size="small"
                     value={formatCurrency(bidForm.totalAmount * installment.percent / 100)}
                     variant="outlined"
                     InputProps={{ 
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        sx: { borderRadius: 1 } 
                      }}
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
                      {currentProjectPhases.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
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

          {bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0) !== 100 && (
            <Alert 
              severity="warning" 
              variant="outlined" 
              sx={{ mt: 1, mb: 3, borderRadius: 1, py: 0.5, fontSize: '0.875rem' }} // Compact Alert
            >
              Payments must total 100%. Current: {bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)}%
            </Alert>
          )}
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