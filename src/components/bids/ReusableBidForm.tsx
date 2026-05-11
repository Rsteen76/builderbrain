import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Project, Subcontractor, ProjectPhase } from '../../types';
import { BidFormData } from '../../types/form.types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentTerms } from '../../hooks/usePaymentTerms';
import { getProject } from '../../services/project';
import { logger } from '../../utils/logger';
import AdditionalNotesSection from './form/AdditionalNotesSection';
import BidDetailsSection from './form/BidDetailsSection';
import {
  createDefaultBidForm,
  createDefaultHookPaymentTerms,
  normalizeInitialPaymentTerms,
  validateBidForm,
} from './form/bidFormHelpers';
import PaymentTermsSection from './form/PaymentTermsSection';
import { buildPaymentTemplateTerms, PaymentTemplate } from './form/paymentTermsHelpers';
import SubcontractorFinancialSection from './form/SubcontractorFinancialSection';

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
  const defaultBidForm = createDefaultBidForm({ phases, projectId, projectName });

  // State for form
  const [bidForm, setBidForm] = useState<BidFormData>(initialBidData ? { ...defaultBidForm, ...initialBidData } : defaultBidForm);
  const [paymentTemplate, setPaymentTemplate] = useState<PaymentTemplate>('standard');
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
        const validInitialPaymentTerms = normalizeInitialPaymentTerms(
          initialBidData.paymentTerms,
          defaultBidForm.paymentTerms,
        );
        setHookPaymentTerms(validInitialPaymentTerms);
      } else {
        // If no initial payment terms from prop, initialize hook with default state based on current bid phase
        const currentPhaseDetails = currentProjectPhases.find(p => p.id === (baseFormData.phaseId || defaultBidForm.phaseId));
        setHookPaymentTerms(createDefaultHookPaymentTerms(currentPhaseDetails));
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
    const template = e.target.value as PaymentTemplate;
    setPaymentTemplate(template); // Keep local state for the Select component
    applyPaymentTemplate(template); // Call the hook function

    // Safely access phases
    const defaultPhase = (phases && phases.length > 0) ? phases[0] : null;

    // Keep the current fixed amount setting for consistency
    const useFixedAmounts = bidForm.paymentTerms.isDownPaymentFixed;

    // Update payment terms based on template
    if (template !== 'custom') {
      setBidForm(prev => ({
        ...prev,
        paymentTerms: buildPaymentTemplateTerms({
          template,
          totalAmount: prev.totalAmount,
          useFixedAmounts,
          syncInstallmentPhases: prev.paymentTerms.syncInstallmentPhases,
          defaultPhase,
        })
      }));
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
    const errors = validateBidForm(bidForm, !!projectId);
    if (errors.projectId) {
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

  // Log render values just before defining formContent
  logger.log("[Render Phase Select] value:", bidForm.phaseId || '');
  logger.log("[Render Phase Select] disabled:", !bidForm.projectId || currentProjectPhases.length === 0);
  logger.log("[Render Phase Select] options (currentProjectPhases):", currentProjectPhases);

  const formContent = (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{
        p: { xs: 1.5, md: 2.5 },
        '& .MuiGrid-item': {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        },
        '& .form-section': {
          mb: 3,
        },
        '& .MuiTextField-root': { size: 'small' },
        '& .MuiFormControl-root': { size: 'small' },
        '& .MuiAutocomplete-root': { size: 'small' },
        '& .MuiButton-root': { textTransform: 'none' },
      }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        {error && !apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {bidFormErrors.projectId && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bidFormErrors.projectId}
          </Alert>
        )}

        <BidDetailsSection
          bidForm={bidForm}
          bidFormErrors={bidFormErrors}
          contextProjectId={projectId}
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          currentProjectPhases={currentProjectPhases}
          handleChangeBidForm={handleChangeBidForm}
        />

        <SubcontractorFinancialSection
          bidForm={bidForm}
          bidFormErrors={bidFormErrors}
          subcontractors={subcontractors}
          selectedSubcontractor={selectedSubcontractor}
          isLoading={isLoading}
          onAddSubcontractor={onAddSubcontractor}
          handleChangeBidForm={handleChangeBidForm}
        />

        <PaymentTermsSection
          bidForm={bidForm}
          formPaymentTerms={formPaymentTerms}
          paymentTemplate={paymentTemplate}
          currentProjectPhases={currentProjectPhases}
          handlePaymentTemplateChange={handlePaymentTemplateChange}
          updateDownPayment={updateDownPayment}
          addInstallment={addInstallment}
          updateInstallment={updateInstallment}
          removeInstallment={removeInstallment}
          getTotalScheduledAmount={getTotalScheduledAmount}
          getTotalScheduledPercent={getTotalScheduledPercent}
          setPaymentTemplate={setPaymentTemplate}
        />

        <AdditionalNotesSection
          bidForm={bidForm}
          handleChangeBidForm={handleChangeBidForm}
        />
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
