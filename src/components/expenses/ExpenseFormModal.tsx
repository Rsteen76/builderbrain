import React, { useState, useEffect, useMemo } from 'react';
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
  Paper,
  Autocomplete,
  Tabs,
  Tab,
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
  Category as CategoryIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  BusinessCenter as VendorIcon,
  Assignment as ProjectIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon,
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
import { cleanForFirestore } from '../../utils/firestoreUtils';
import { useExpenseLineItems, ExpenseLineItemFormData } from '../../hooks/useExpenseLineItems';
import ExpenseLineItemsSection from './form/ExpenseLineItemsSection';
import { availableExpenseCategories, formatCategoryName, getExpenseDescriptionOptions } from './form/expenseFormOptions';
import { buildExpenseLineItems } from './form/expenseLineItems';
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
  const theme = useTheme();
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
  const PHASE_OPTIONS = useMemo(() => {
    return currentProjectPhases.map(phase => ({
      value: phase.id || '',
      label: phase.name || 'Unnamed Phase'
    }));
  }, [currentProjectPhases]);

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
        const phasesToSet = (currentProject?.phases || []).filter(p => typeof p.id === 'string' && p.id !== '');
        console.log(`[Phase Init] Setting currentProjectPhases to:`, phasesToSet.map(p => ({ id: p.id, name: p.name }))); // Log concise phase info
        setCurrentProjectPhases(phasesToSet as ProjectPhase[]);
    } else {
        console.log(`[Phase Init] No expense.projectId, clearing phases.`);
        setCurrentProjectPhases([]);
      }
      
      // Initialize line items if they exist using the hook's setter
      if (expense.lineItems && expense.lineItems.length > 0) {
        const initialItemsForHook: ExpenseLineItemFormData[] = expense.lineItems.map(li => ({
          id: li.id || uuidv4(),
          description: li.description || '',
          quantity: li.quantity || 1,
          unitCost: li.unitCost || 0,
          totalPrice: (li.quantity || 1) * (li.unitCost || 0) // Ensure totalPrice is calculated
        }));
        setHookLineItems(initialItemsForHook); // Use the setter from the hook
        setShowLineItems(true);
      } else {
        setHookLineItems([]); // Reset for new or expense without line items
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
      setHookLineItems([]); // Reset hook line items
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
        const phasesToSet = (selectedProject.phases || []).filter(p => 
          typeof p.id === 'string' && p.id !== '');
        console.log(`[Project Changed] Setting phases: `, phasesToSet.map(p => ({ id: p.id, name: p.name })));
        setCurrentProjectPhases(phasesToSet as ProjectPhase[]);
        
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

    const calculatedTotal = showLineItems 
      ? calculateTotalFromLineItems() // Use the useCallback version
      : formData.amount || 0;

    const finalLineItems: ExpenseLineItem[] = showLineItems 
      ? buildExpenseLineItems(lineItems, formData.category)
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
                    phaseId={formData.phaseId}
                    projectPhases={currentProjectPhases}
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
            <ExpenseLineItemsSection
              amount={formData.amount}
              amountPaid={formData.amountPaid}
              status={formData.status}
              showLineItems={showLineItems}
              amountError={errors.amount}
              lineItemErrors={errors.lineItems}
              lineItems={lineItems}
              totalLineItemsAmount={totalLineItemsAmount}
              onToggleLineItems={toggleLineItems}
              onAmountChange={(amount) => handleChange('amount', amount)}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
              onLineItemChange={handleLineItemChange}
            />
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
