import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';

import {
  Expense,
  ProjectPhase,
  Project,
  Bid,
} from '../../types';
import { ExpenseService } from '../../services/expense';
import { BidService } from '../../services/bid';
import { useAuth } from '../../contexts/AuthContext';
import { useExpenseLineItems } from '../../hooks/useExpenseLineItems';
import ExpenseDuplicateWarningDialog from './form/ExpenseDuplicateWarningDialog';
import ExpenseMainInfoSection from './form/ExpenseMainInfoSection';
import ExpensePaymentHistorySection from './form/ExpensePaymentHistorySection';
import {
  buildExpenseFormStateFromExpense,
  buildNewExpenseFormState,
  buildPhaseOptions,
  getProjectPhasesForExpense,
  getTodayInputValue,
} from './form/expenseFormState';
import { getExpenseDescriptionOptions } from './form/expenseFormOptions';
import { buildExpenseSavePayload } from './form/expenseFormSavePayload';
import { validateExpenseForm } from './form/expenseFormValidation';
import type { FormErrors } from './form/types';

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expense?: Partial<Expense>;
  onSave: (expense: Partial<Expense>) => void;
  projects: Project[];
  projectPhases?: ProjectPhase[];
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onClose,
  expense,
  onSave,
  projects,
  projectPhases = [],
}) => {
  const { user } = useAuth();
  
  // Restore all state variables
  const [formData, setFormData] = useState<Partial<Expense>>({});
  // const [lineItems, setLineItems] = useState<ExpenseLineItemForm[]>([]); // Replaced by useExpenseLineItems
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

  // Integrate the useExpenseLineItems hook
  const {
    lineItems,
    setLineItems: setHookLineItems,
    addLineItem,
    removeLineItem,
    handleLineItemChange,
    calculateTotalFromLineItems,
    totalLineItemsAmount
  } = useExpenseLineItems();

  // State to hold available bids for the selected project
  const [availableBids, setAvailableBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState<boolean>(false);

  const isEditMode = useMemo(() => !!expense?.id, [expense]);

  // Get phase options based on the currentProjectPhases state
  const PHASE_OPTIONS = useMemo(() => buildPhaseOptions(currentProjectPhases), [currentProjectPhases]);

  // Effect to initialize form when expense data is provided (for editing)
  useEffect(() => {
    // Add logging at the start
    console.log(`[Phase Init] Effect Run. Open: ${open}, Has Expense: ${!!expense}, Projects Count: ${projects?.length}`);

    if (open && expense) {
      // Log relevant IDs from the expense prop
      console.log(`[Phase Init] Expense Data: projectId='${expense.projectId}', phaseId='${expense.phaseId}'`);

      const nextState = buildExpenseFormStateFromExpense(expense, projects);
      setFormData(nextState.formData);
      
      // Phase list initialization
      if (expense.projectId) {
        console.log(`[Phase Init] Looking for project with ID: '${expense.projectId}'`);
        const currentProject = projects.find(p => p.id === expense.projectId);
        // Log if project was found and its phases
        console.log(`[Phase Init] Found project: ${currentProject ? `'${currentProject.name}'` : 'Not Found'}`);
        const phasesToSet = nextState.currentProjectPhases;
        console.log(`[Phase Init] Setting currentProjectPhases to:`, phasesToSet.map(p => ({ id: p.id, name: p.name }))); // Log concise phase info
        setCurrentProjectPhases(phasesToSet);
    } else {
        console.log(`[Phase Init] No expense.projectId, clearing phases.`);
        setCurrentProjectPhases(nextState.currentProjectPhases);
      }
      
      // Initialize line items if they exist using the hook's setter
      setHookLineItems(nextState.lineItems); // Use the setter from the hook
      setShowLineItems(nextState.showLineItems);
      
      // Initialize receipt preview
      setReceiptPreview(nextState.receiptPreview);
      
      // Initialize payment details if status is 'paid' or 'partially_paid'
      if ((expense.status === 'paid' || expense.status === 'partially_paid') && expense.paymentDetails) {
        setPaymentMethod(nextState.paymentMethod);
        setPaymentDate(nextState.paymentDate);
        setReferenceNumber(nextState.referenceNumber);
        setPaymentNotes(nextState.paymentNotes);
      }
    } else if (open) {
      // Reset logic
      console.log(`[Phase Init] Resetting form for new expense.`);
      const nextState = buildNewExpenseFormState(projects);
      setFormData(nextState.formData);
      setHookLineItems(nextState.lineItems); // Reset hook line items
      setShowLineItems(nextState.showLineItems);
      setReceiptPreview(nextState.receiptPreview);
      setReceiptFile(null);
      setPaymentMethod(nextState.paymentMethod);
      setPaymentDate(nextState.paymentDate);
      setReferenceNumber(nextState.referenceNumber);
      setPaymentNotes(nextState.paymentNotes);
      setCurrentProjectPhases(nextState.currentProjectPhases);
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
      setPaymentDate(getTodayInputValue());
      setPaymentNotes('');
    }
  }, [open, expense, projects, setHookLineItems]); // Added setHookLineItems to dependency array

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
        const phasesToSet = getProjectPhasesForExpense(value, projects);
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

  const handleVendorChange = (vendor: string) => {
    setFormData({
      ...formData,
      vendor,
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

  // Line item handlers (handleAddLineItem, handleRemoveLineItem, handleLineItemChange, calculateTotalFromLineItems)
  // are now replaced by functions/values from the useExpenseLineItems hook.
  // const handleAddLineItem = () => { ... }; // Removed
  // const handleRemoveLineItem = (id: string) => { ... }; // Removed
  // const handleLineItemChange = (id: string, field: keyof ExpenseLineItemForm, value: string | number) => { ... }; // Removed
  // const calculateTotalFromLineItems = useCallback(() => { ... }, [lineItems]); // Removed, use totalLineItemsAmount or hook's calculate function

  const toggleLineItems = () => {
    const newShowLineItemsState = !showLineItems;
    setShowLineItems(newShowLineItemsState);
    // If switching to show line items and there are none, add one.
    if (newShowLineItemsState && lineItems.length === 0) { // lineItems is from the hook
      addLineItem(); // addLineItem is from the hook
    }
  };

  const validateForm = (): FormErrors => {
    const validationErrors = validateExpenseForm({
      formData,
      showLineItems,
      lineItems,
      lineItemsTotal: calculateTotalFromLineItems(),
    });

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

    const finalData = buildExpenseSavePayload({
      formData,
      showLineItems,
      lineItems,
      lineItemsTotal: calculateTotalFromLineItems(),
      receiptPreview,
      tags,
      paymentMethod,
      paymentDate,
      referenceNumber,
      paymentNotes,
      expenseId: expense?.id,
      userId: user?.uid,
    });

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
    setHookLineItems([]);
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
    setPaymentDate(getTodayInputValue());
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
      aria-labelledby="expense-dialog-title"
    >
      <DialogTitle component="div" sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography 
          id="expense-dialog-title"
          variant="h6" 
          component="h2"
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
            <ExpenseMainInfoSection
              formData={formData}
              errors={errors}
              projects={projects}
              currentProjectPhases={currentProjectPhases}
              phaseOptions={PHASE_OPTIONS}
              expenseDescriptionOptions={expenseDescriptionOptions}
              tags={tags}
              availableBids={availableBids}
              loadingBids={loadingBids}
              projectSelectDisabled={!!expense?.projectId && !isEditMode}
              showLineItems={showLineItems}
              lineItems={lineItems}
              totalLineItemsAmount={totalLineItemsAmount}
              backendError={backendError}
              onSelectChange={handleSelectChange}
              onDateChange={handleDateChange}
              onPhaseChange={handlePhaseChange}
              onFieldChange={handleChange}
              onVendorChange={handleVendorChange}
              onDetailedCategoryChange={handleDetailedCategoryChange}
              onSubcontractorChange={handleSubcontractorChange}
              onToggleLineItems={toggleLineItems}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
              onLineItemChange={handleLineItemChange}
              onTagsChange={handleTagsChange}
            />
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
          <ExpensePaymentHistorySection formData={formData} />
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
      <ExpenseDuplicateWarningDialog
        open={showDuplicateWarning}
        duplicateExpenses={duplicateExpenses}
        onClose={() => setShowDuplicateWarning(false)}
        onSaveAnyway={handleSubmit}
      />
    )}
  </>
);
};

export default ExpenseFormModal;
