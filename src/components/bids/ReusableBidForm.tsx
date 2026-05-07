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
import { Bid, BidPaymentStage, Project, Subcontractor, ProjectPhase } from '../../types'; // BidFormData removed
import { BidFormData, BidPaymentTermsFormData, BidPaymentInstallmentFormData } from '../../types/form.types'; // Updated imports
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentTerms } from '../../hooks/usePaymentTerms'; // Import the hook
import { getProject } from '../../services/project';
import { COMMON_BID_CATEGORIES, PHASE_BID_TITLES, BID_SCOPE_TEMPLATES } from '../../data/bidFormConstants';
import { logger } from '../../utils/logger';

interface ReusableBidFormProps {
  open?: boolean;
  onClose?: () => void;
  onSubmit: (bidForm: BidFormData) => Promise<void>;
  phases?: ProjectPhase[]; // Optional: If projectId is provided
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
    subcontractorId: '', // Added: Ensures subcontractorId is part of the default state
    subcontractorName: '',
    totalAmount: 0,
    phaseId: (phases && phases.length > 0) ? phases[0].id : '',
    phaseName: (phases && phases.length > 0) ? phases[0].name : '',
    scope: '',
    timeline: 30, // Default duration in days
    paymentTerms: { // Aligned with new BidPaymentTermsFormData
      downPaymentPercent: 20,
      isDownPaymentFixed: false,
      downPaymentAmount: 0, // Will be calculated based on percent and totalAmount
      installments: [
        {
          id: uuidv4(),
          name: 'Final Payment',
          percent: 80,
          isFixedAmount: false,
          fixedAmount: 0, // Will be calculated
          milestoneDescription: 'Upon completion of work',
          phaseId: (phases && phases.length > 0) ? phases[0].id : '', // Default to first phase if available
          phaseName: (phases && phases.length > 0) ? phases[0].name : '', // Default to first phase if available
          manuallyConfigured: false, // Added: New field from BidPaymentInstallmentFormData
        }
      ],
      syncInstallmentPhases: true, // Default behavior
    },
    notes: '',
    status: 'draft', // Changed: Default status to 'draft'
    attachments: [],
    tags: [],
    projectId: projectId, // Retains context projectId if provided
    projectName: projectName, // Added: Use context projectName if provided
    submissionDeadline: null, // Added: Default to null
    // attachments and tags are already part of defaultBidForm below
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
  const [currentProjectPhases, setCurrentProjectPhases] = useState<ProjectPhase[]>(phases || []);

  // Initialize the usePaymentTerms hook
  const {
    paymentTerms: formPaymentTerms, // Renamed to avoid direct conflict with bidForm.paymentTerms
    setPaymentTerms: setHookPaymentTerms,
    applyPaymentTemplate,
    updateDownPayment,
    addInstallment,
    updateInstallment,
    removeInstallment,
    getTotalScheduledAmount,
    getTotalScheduledPercent,
  } = usePaymentTerms(bidForm.totalAmount, currentProjectPhases, bidForm.phaseId);

  // Log initial mounting for debugging
  logger.log('ReusableBidForm mounted/updated with props:', {
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
    logger.log('ReusableBidForm - subcontractors updated:',
      subcontractors.map(s => ({ id: s.id, name: s.name }))
    );
  }, [subcontractors]);

  // At the beginning of the component, after hooks
  useEffect(() => {
    logger.log("ReusableBidForm MOUNT - initialBidData:", initialBidData);
    logger.log("ReusableBidForm MOUNT - editingBidId:", editingBidId);
    logger.log("ReusableBidForm MOUNT - initialized ref:", initialized.current);
    logger.log("ReusableBidForm MOUNT - subcontractors:",
      subcontractors.map(s => ({ id: s.id, name: s.name }))
    );
  }, []);

  // At the beginning of the component add a check
  useEffect(() => {
    // Print a debug warning if editingBidId is present but initialBidData is null
    if (editingBidId && !initialBidData) {
      logger.warn("ReusableBidForm WARNING: editingBidId is present but initialBidData is null", {
        editingBidId,
        initialBidData
      });
    }
  }, [editingBidId, initialBidData]);

  // Update the existing useEffect
  useEffect(() => {
    logger.log("ReusableBidForm initialBidData change - initialBidData:", initialBidData);
    logger.log("ReusableBidForm initialBidData change - editingBidId:", editingBidId);
    logger.log("ReusableBidForm initialBidData change - initialized ref:", initialized.current);

    // Skip if no initialBidData
    if (!initialBidData) {
      logger.log("ReusableBidForm - No initialBidData, skipping form initialization");
      return;
    }

    // Safe access to nested properties with optional chaining
    const installments = initialBidData.paymentTerms?.installments || [];
    logger.log("ReusableBidForm - Installments from initialBidData:", installments);

    // Only update form if editingBidId exists or we haven't initialized
    if (editingBidId || !initialized.current) {
      logger.log("ReusableBidForm - Updating form with initialBidData");

      // Prepare the main form data, excluding paymentTerms initially
      const baseFormData: Omit<BidFormData, 'paymentTerms'> = {
        ...defaultBidForm,
        ...initialBidData,
        // Explicitly handle fields that might be objects or arrays to ensure proper merging
        tags: Array.isArray(initialBidData.tags) ? [...initialBidData.tags] : defaultBidForm.tags,
        attachments: Array.isArray(initialBidData.attachments) ? [...initialBidData.attachments] : defaultBidForm.attachments,
        // Ensure status, projectId, projectName, submissionDeadline are correctly set
        status: initialBidData.status || defaultBidForm.status,
        projectId: initialBidData.projectId || defaultBidForm.projectId,
        projectName: initialBidData.projectName || defaultBidForm.projectName,
        submissionDeadline: initialBidData.submissionDeadline !== undefined ? initialBidData.submissionDeadline : defaultBidForm.submissionDeadline,
      };

      // Set the base form data (excluding paymentTerms which are handled by the hook)
      // We spread baseFormData over prev to ensure we don't lose other fields if setBidForm is called multiple times
      setBidForm(prev => ({ ...prev, ...baseFormData, paymentTerms: prev.paymentTerms })); // Keep existing paymentTerms for a moment

      // Initialize payment terms using the hook's setter if initialBidData has them
      if (initialBidData.paymentTerms) {
        const validInitialPaymentTerms: BidPaymentTermsFormData = {
            ...defaultBidForm.paymentTerms,
            ...initialBidData.paymentTerms,
            installments: Array.isArray(initialBidData.paymentTerms.installments)
                ? initialBidData.paymentTerms.installments.map(inst => ({
                    id: inst.id || uuidv4(), name: inst.name || '', percent: inst.percent || 0,
                    isFixedAmount: inst.isFixedAmount || false, fixedAmount: inst.fixedAmount || 0,
                    milestoneDescription: inst.milestoneDescription || '', phaseId: inst.phaseId || '',
                    phaseName: inst.phaseName || '', manuallyConfigured: inst.manuallyConfigured || false,
                  }))
                : defaultBidForm.paymentTerms.installments,
        };
        setHookPaymentTerms(validInitialPaymentTerms);
      } else {
        // If no initial payment terms from prop, initialize hook with default state based on current bid phase
        const currentPhaseDetails = currentProjectPhases.find(p => p.id === (baseFormData.phaseId || defaultBidForm.phaseId));
        // The defaultPaymentTermsState function is not exported from the hook, so we rely on the hook's internal default
        // or we can replicate a similar default structure here if needed for setHookPaymentTerms.
        // For simplicity, if the hook initializes itself to a sensible default, we might not need to call setHookPaymentTerms here.
        // However, to be explicit and ensure currentBidPhaseId is considered:
        const defaultHookState: BidPaymentTermsFormData = {
            downPaymentPercent: 20, isDownPaymentFixed: false, downPaymentAmount: 0,
            installments: [{
                id: uuidv4(), name: 'Final Payment', percent: 80, isFixedAmount: false, fixedAmount: 0,
                milestoneDescription: 'Upon completion', phaseId: currentPhaseDetails?.id, phaseName: currentPhaseDetails?.name, manuallyConfigured: false,
            }],
            syncInstallmentPhases: true,
        };
        setHookPaymentTerms(defaultHookState);
      }

      logger.log("ReusableBidForm - Form updated with data (base):", baseFormData);
      initialized.current = true;
    }
  }, [initialBidData, editingBidId, defaultBidForm, setHookPaymentTerms, currentProjectPhases]);

  // Effect to sync paymentTerms from hook back to bidForm state
  useEffect(() => {
    setBidForm(prev => ({ ...prev, paymentTerms: formPaymentTerms }));
  }, [formPaymentTerms]); // Removed setBidForm from dependency array as it's a setter

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
          logger.log('ReusableBidForm - Fetched projects:', userProjects.length);
          setProjects(userProjects);
        } catch (error) {
          logger.error('Error fetching projects:', error);
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
    logger.log("[Effect Update Phases] Running...");
    logger.log("[Effect Update Phases] Props -> projectId:", projectId);
    logger.log("[Effect Update Phases] Props -> phases:", phases);
    logger.log("[Effect Update Phases] Props -> availableProjects:", availableProjects?.map(p => p.name)); // Log names for readability
    logger.log("[Effect Update Phases] State -> bidForm.projectId:", bidForm.projectId);

    const fetchProjectPhases = async (id: string) => {
      try {
        logger.log("[Effect Update Phases] Fetching phases for project:", id);
        // Check if user is available before fetching
        if (!user?.uid) {
          logger.warn("[Effect Update Phases] User not available, cannot fetch phases");
          return;
        }

        // Use the exported getProject function which takes userId as a second parameter
        const project = await getProject(id, user.uid);
        if (project && project.phases) {
          logger.log("[Effect Update Phases] Fetched project phases:", project.phases);
          setCurrentProjectPhases(project.phases);
        } else {
          logger.log("[Effect Update Phases] Project has no phases or could not be fetched");
          setCurrentProjectPhases([]);
        }
      } catch (error) {
        logger.error("[Effect Update Phases] Error fetching project:", error);
        setCurrentProjectPhases([]);
      }
    };

    // If projectId prop is provided, use the directly passed phases
    if (projectId && phases) {
      logger.log("[Effect Update Phases] Mode: Using phases passed via props for projectId:", projectId);
      setCurrentProjectPhases(phases);
      logger.log("[Effect Update Phases] Set currentProjectPhases to (from props):", phases);
    }
    // If projectId is provided but phases aren't, fetch the phases
    else if (projectId && !phases) {
      logger.log("[Effect Update Phases] Mode: ProjectId provided but no phases, fetching from API");
      fetchProjectPhases(projectId);
    }
    // Else if we are in standalone mode (no projectId prop) and have availableProjects
    else if (!projectId && availableProjects && bidForm.projectId) {
      logger.log("[Effect Update Phases] Mode: Standalone form, project selected.");
      const selectedProject = availableProjects.find(p => p.id === bidForm.projectId);
      logger.log("[Effect Update Phases] Found selected project:", selectedProject?.name);
      const newPhases = selectedProject?.phases || [];
      setCurrentProjectPhases(newPhases);
      logger.log("[Effect Update Phases] Set currentProjectPhases to (from selected project):", newPhases);

      // Reset phase selection if selected project doesn't contain the current phaseId
      if (selectedProject && !newPhases.some(p => p.id === bidForm.phaseId)) {
        logger.log("[Effect Update Phases] Resetting phaseId because it's not in the new project phases");
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
      logger.log("[Effect Update Phases] Mode: Clearing phases (no project selected or missing phases prop).");
      setCurrentProjectPhases([]);
      logger.log("[Effect Update Phases] Set currentProjectPhases to: []");
      // Optionally reset phaseId if it shouldn't persist when phases are cleared
      // setBidForm(prev => ({ ...prev, phaseId: '', phaseName: '' }));
    }
  // Make sure all dependencies that influence the logic are included
  }, [bidForm.projectId, bidForm.phaseId, projectId, phases, availableProjects, user?.uid]);

  // Form change handlers
  const handleChangeBidForm = (field: string, value: any) => {
    logger.log(`ReusableBidForm - Changing field "${field}" to:`, value);
    logger.log(`ReusableBidForm - Current form state:`, bidForm);

    // Ensure we're not accidentally preventing updates
    if (typeof value === 'undefined') {
      logger.warn(`ReusableBidForm - Attempt to set "${field}" to undefined, using null instead`);
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

      logger.log(`ReusableBidForm - New form state after updating ${field}:`, newState);
      return newState;
    });
  };

  // Payment terms handlers are now replaced by functions from usePaymentTerms hook
  // const handleChangePaymentTerms = (field: string, value: any) => { ... }; // Removed
  // const handleAddInstallment = () => { ... }; // Removed
  // const handleChangeInstallment = (id: string, field: string, value: any) => { ... }; // Removed
  // const handleRemoveInstallment = (id: string) => { ... }; // Removed

  const handlePaymentTemplateChange = (e: SelectChangeEvent<string>) => {
    const template = e.target.value as 'one-time' | 'standard' | 'trades' | 'custom';
    setPaymentTemplate(template); // Keep local state for the Select component
    applyPaymentTemplate(template); // Call the hook function

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
      logger.error('Cannot create bid: Missing project ID');
    }

    if (Object.keys(errors).length > 0) {
      // There are validation errors
      logger.log('Form validation errors:', errors);
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
      logger.log('Submitting bid data:', finalBidData);

      // Call the onSubmit handler
      await onSubmit(finalBidData);

      // If we're in a dialog, close it
      if (isDialog && onClose) {
        onClose();
      }
    } catch (error) {
      logger.error('Error submitting bid:', error);
      setApiError('Failed to save bid. Please try again.');
    }
  };

  // Modify the helper function to handle multiple keyword matches
  const getBidTitleOptions = (phaseId: string | undefined, phases: ProjectPhase[]): string[] => {
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
        logger.log(`[getBidTitleOptions] Phase ID ${phaseId} provided but not found in phases list.`);
      }
    } else if (!phaseId) {
        logger.log('[getBidTitleOptions] No phase selected.');
    } else { // phases.length === 0
        logger.log('[getBidTitleOptions] Phase ID provided but phases list is empty.');
    }

    // Remove duplicates from applicableKeys (e.g., if common is added implicitly elsewhere)
    const uniqueKeys = Array.from(new Set(applicableKeys));
    logger.log(`[getBidTitleOptions] For Phase: "${phaseNameForLog}", Applicable Category Keys:`, uniqueKeys);

    // Collect titles from all applicable keys using a Set for automatic deduplication
    const combinedTitles = new Set<string>();
    uniqueKeys.forEach(key => {
      const titles = PHASE_BID_TITLES[key] || [];
      logger.log(`[getBidTitleOptions] Titles for Key "${key}":`, titles);
      titles.forEach(title => combinedTitles.add(title));
    });

    // Convert Set to sorted array
    const finalOptions = Array.from(combinedTitles).sort();

    logger.log(`[getBidTitleOptions] Final Combined & Sorted Options (${finalOptions.length}):`, finalOptions);

    return finalOptions;
  };

  // Log render values just before defining formContent
  logger.log("[Render Phase Select] value:", bidForm.phaseId || '');
  logger.log("[Render Phase Select] disabled:", !bidForm.projectId || currentProjectPhases.length === 0);
  logger.log("[Render Phase Select] options (currentProjectPhases):", currentProjectPhases);

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
                    logger.log("Project Phase Changed. New phaseId:", phaseId);
                    logger.log("Available phases (currentProjectPhases):", currentProjectPhases);
                    // Safely find phase within the CURRENTLY displayed phases state
                    const phase = currentProjectPhases.find(p => p.id === phaseId);
                    logger.log("Found phase object:", phase);
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
                    logger.log("Rendering phase option:", phase.name, phase.id);
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
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }} /> Submitted
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
                        value={formPaymentTerms.isDownPaymentFixed ? 'amount' : 'percent'}
                        label="Initial Payment Type"
                        onChange={(e) => {
                          const isFixed = e.target.value === 'amount';
                          // Determine current value to pass based on which field is active
                          const currentValue = isFixed ? formPaymentTerms.downPaymentAmount : formPaymentTerms.downPaymentPercent;
                          updateDownPayment(currentValue, isFixed);
                          setPaymentTemplate('custom');
                        }}
                      >
                        <MenuItem value="percent">Percentage (%)</MenuItem>
                        <MenuItem value="amount">Fixed Amount ($)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    {formPaymentTerms.isDownPaymentFixed ? (
                      <TextField
                        fullWidth
                        label="Initial Payment"
                        type="number"
                        size="small"
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, sx: { borderRadius: 1 } }}
                        value={formPaymentTerms.downPaymentAmount || 0}
                        onChange={(e) => {
                          updateDownPayment(Number(e.target.value), true);
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
                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment>, sx: { borderRadius: 1 } }}
                        value={formPaymentTerms.downPaymentPercent}
                        onChange={(e) => {
                          updateDownPayment(Number(e.target.value), false);
                          setPaymentTemplate('custom');
                        }}
                        variant="outlined"
                      />
                    )}
                  </Grid>
                </Grid>
                <FormHelperText sx={{ textAlign: 'right', mt: 0.5 }}>
                  {formPaymentTerms.isDownPaymentFixed ?
                    `Equivalent: ${(bidForm.totalAmount > 0 ? (formPaymentTerms.downPaymentAmount || 0) / bidForm.totalAmount * 100 : 0).toFixed(1)}%` :
                    `Amount: ${formatCurrency(bidForm.totalAmount * formPaymentTerms.downPaymentPercent / 100)}`}
                </FormHelperText>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addInstallment} // Use from hook
                  sx={{ borderRadius: 1 }}
                >
                  Add Installment
                </Button>
              </Grid>
          </Grid>

          {/* Installments List */}
          {formPaymentTerms.installments.map((installment, index) => (
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
                onClick={() => removeInstallment(installment.id)} // Use from hook
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
                    onChange={(e) => updateInstallment(installment.id, 'name', e.target.value)} // Use from hook
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
                      onChange={(e) => updateInstallment(installment.id, 'isFixedAmount', e.target.value === 'amount')} // Use from hook
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
                      onChange={(e) => updateInstallment(installment.id, 'fixedAmount', Number(e.target.value))} // Use from hook
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
                      onChange={(e) => updateInstallment(installment.id, 'percent', Number(e.target.value))} // Use from hook
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
                      formatCurrency(bidForm.totalAmount * (installment.percent || 0) / 100)}
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
                      onChange={(e) => updateInstallment(installment.id, 'phaseId', e.target.value)} // Use from hook
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
                    onChange={(e) => updateInstallment(installment.id, 'milestoneDescription', e.target.value)} // Use from hook
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          {/* Payment Total Summary and Warning */}
          {(() => {
            const totalScheduledPercentVal = getTotalScheduledPercent(bidForm.totalAmount);
            const totalScheduledAmountVal = getTotalScheduledAmount();
            const exactlyOneHundred = Math.abs(totalScheduledPercentVal - 100) < 0.01;
            const matchesTotalBid = Math.abs(totalScheduledAmountVal - bidForm.totalAmount) < 0.01;

            // Values for display, directly from hook's state
            const downPaymentPercent = formPaymentTerms.downPaymentPercent;
            const downPaymentAmount = formPaymentTerms.isDownPaymentFixed
              ? formPaymentTerms.downPaymentAmount
              : bidForm.totalAmount * (downPaymentPercent / 100);

            const installmentsForDisplay = formPaymentTerms.installments;
            const hasFinalPayment = installmentsForDisplay.length > 0;
            const finalPayment = hasFinalPayment ? installmentsForDisplay[installmentsForDisplay.length - 1] : null;
            const finalPaymentAmount = finalPayment ? (finalPayment.isFixedAmount ? finalPayment.fixedAmount : bidForm.totalAmount * (finalPayment.percent / 100)) : 0;
            const finalPaymentPercent = finalPayment ? finalPayment.percent : 0;

            const intermediateInstallments = installmentsForDisplay.slice(0, -1);
            const intermediateAmount = intermediateInstallments.reduce((sum, inst) => sum + (inst.isFixedAmount ? inst.fixedAmount : bidForm.totalAmount * (inst.percent / 100)), 0);
            const intermediatePercent = intermediateInstallments.reduce((sum, inst) => sum + inst.percent, 0);

            // Suggestion logic (can be simplified if hook provides this directly)
            const currentTotalPercentWithoutFinal = downPaymentPercent + intermediatePercent;
            const remainingPercent = 100 - currentTotalPercentWithoutFinal;
            const suggestedFinalAmount = bidForm.totalAmount * (remainingPercent / 100);

            if (!exactlyOneHundred || !matchesTotalBid) {
              return ( <Alert severity="warning" variant="outlined" sx={{ mt: 1, mb: 3, borderRadius: 1, py: 1 }}> <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>Payment Schedule Incomplete</Typography><Typography variant="body2" color="text.secondary">{!exactlyOneHundred ? `Total: ${totalScheduledPercentVal.toFixed(1)}% (needs to be 100%)` : `Total: ${formatCurrency(totalScheduledAmountVal)} (should be ${formatCurrency(bidForm.totalAmount)})`}</Typography></Box> <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}><Box sx={{ minWidth: 120 }}><Typography variant="caption" color="text.secondary">Initial Payment</Typography><Typography variant="body2" fontWeight="medium">{formatCurrency(downPaymentAmount)} ({downPaymentPercent.toFixed(1)}%)</Typography></Box> {intermediateInstallments.length > 0 && (<Box sx={{ minWidth: 120 }}><Typography variant="caption" color="text.secondary">Intermediate</Typography><Typography variant="body2" fontWeight="medium">{formatCurrency(intermediateAmount)} ({intermediatePercent.toFixed(1)}%)</Typography></Box>)} {hasFinalPayment && (<Box sx={{ minWidth: 120 }}><Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>Final Payment{!exactlyOneHundred && (<Tooltip title="Needs adjustment"><InfoIcon fontSize="small" color="warning" sx={{ ml: 0.5, opacity: 0.7, width: 16, height: 16 }} /></Tooltip>)}</Typography><Typography variant="body2" fontWeight="medium">{formatCurrency(finalPaymentAmount)} ({finalPaymentPercent.toFixed(1)}%)</Typography>{!exactlyOneHundred && Math.abs(finalPaymentPercent - remainingPercent) > 0.01 && (<Typography variant="caption" color="warning.main">Should be: {formatCurrency(suggestedFinalAmount)} ({remainingPercent.toFixed(1)}%)</Typography>)}</Box>)} </Box> <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{!exactlyOneHundred ? `To complete, the final payment should be ${formatCurrency(suggestedFinalAmount)} (${remainingPercent.toFixed(1)}%).` : "Adjust payment amounts to match total bid."}</Typography> </Alert> );
            }
            return ( <Alert severity="success" variant="outlined" sx={{ mt: 1, mb: 3, borderRadius: 1, py: 1 }}> <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>Payment Schedule Complete</Typography><Typography variant="body2" color="text.secondary">Total: {formatCurrency(totalScheduledAmountVal)} (100%)</Typography></Box> <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}><Box sx={{ minWidth: 120 }}><Typography variant="caption" color="text.secondary">Initial Payment</Typography><Typography variant="body2" fontWeight="medium">{formatCurrency(downPaymentAmount)} ({downPaymentPercent.toFixed(1)}%)</Typography></Box> {intermediateInstallments.length > 0 && (<Box sx={{ minWidth: 120 }}><Typography variant="caption" color="text.secondary">Intermediate</Typography><Typography variant="body2" fontWeight="medium">{formatCurrency(intermediateAmount)} ({intermediatePercent.toFixed(1)}%)</Typography></Box>)} {hasFinalPayment && (<Box sx={{ minWidth: 120 }}><Typography variant="caption" color="text.secondary">Final Payment</Typography><Typography variant="body2" fontWeight="medium">{formatCurrency(finalPaymentAmount)} ({finalPaymentPercent.toFixed(1)}%)</Typography></Box>)} </Box> </Alert> );
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
              Math.abs(getTotalScheduledPercent(bidForm.totalAmount) - 100) > 0.01 // Use hook function for validation
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
              Math.abs(getTotalScheduledPercent(bidForm.totalAmount) - 100) > 0.01 // Use hook function for validation
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
