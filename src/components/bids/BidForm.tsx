import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Chip,
  FormHelperText,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { 
  BidService, 
  Bid, 
  BidStatus, 
  BidPriority, 
  BidLineItem,
  LineItemCategory,
  BidVersion,
  BidSummary,
} from '../../services/bid';
import { SubcontractorService, Subcontractor } from '../../services/subcontractor';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import LineItemsTable from './LineItemsTable';
import { formatCurrency } from '../../utils/formatters';

// Mapping of statuses to display names
const STATUS_OPTIONS: { value: BidStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'revised', label: 'Revised' },
];

// Mapping of priorities to display names
const PRIORITY_OPTIONS: { value: BidPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Default form values
const DEFAULT_BID: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'> = {
  projectId: '',
  projectName: '',
  subcontractorId: '',
  subcontractorName: '',
  title: '',
  scope: '',
  status: 'draft',
  priority: 'medium',
  submissionDeadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 2 weeks from now
  startDate: null,
  completionDate: null,
  totalAmount: 0,
  tags: [],
  createdBy: '',
  updatedBy: '',
  notes: '',
  requiresInsurance: false,
  requiresBond: false,
  isPublic: false,
  isApproved: false,
};

// Steps for the stepper
const STEPS = ['Basic Information', 'Scope & Timeline', 'Line Items', 'Review'];

// Project and Subcontractor option type
interface SelectOption {
  id: string;
  name: string;
}

// Update LineItemsTable prop types
interface LineItemsTableProps {
  lineItems: BidLineItem[];
  onChange: (updatedLineItems: BidLineItem[]) => void;
  editable?: boolean;
}

const BidForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const duplicateData = location.state?.duplicate as BidSummary | undefined;
  
  // Form state
  const [formData, setFormData] = useState<Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'>>(DEFAULT_BID);
  const [lineItems, setLineItems] = useState<BidLineItem[]>([]);
  const [currentVersion, setCurrentVersion] = useState<Omit<BidVersion, 'id' | 'createdAt'>>({
    versionNumber: 1,
    totalAmount: 0,
    notes: '',
    lineItems: [],
    attachments: [],
  });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [tagInput, setTagInput] = useState<string>('');
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [subcontractors, setSubcontractors] = useState<SelectOption[]>([]);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProjects(), fetchSubcontractors()]);
        
        // If we're editing an existing bid
        if (id) {
          await fetchBid(id);
        } 
        // If we're duplicating a bid
        else if (duplicateData) {
          await fetchBidForDuplication(duplicateData.id);
        }
      } catch (err) {
        console.error('Error loading form data:', err);
        setError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, duplicateData]);

  // Calculate total amount when line items change
  useEffect(() => {
    const total = lineItems.reduce((sum, item) => sum + item.total, 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
    setCurrentVersion(prev => ({ ...prev, totalAmount: total, lineItems }));
  }, [lineItems]);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const projectsList = await ProjectService.getProjects();
      setProjects(projectsList.map(p => ({ id: p.id!, name: p.name })));
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Fetch subcontractors
  const fetchSubcontractors = async () => {
    try {
      const subcontractorsList = await SubcontractorService.getSubcontractors();
      setSubcontractors(subcontractorsList.map(s => ({ id: s.id!, name: s.name })));
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
    }
  };

  // Fetch bid details for editing
  const fetchBid = async (bidId: string) => {
    try {
      const bid = await BidService.getBid(bidId);
      
      if (!bid) {
        setError('Bid not found');
        return;
      }
      
      // Extract fields for the form
      const { 
        id: _, 
        createdAt: __, 
        updatedAt: ___, 
        currentVersionId, 
        versions, 
        ...formFields 
      } = bid;
      
      // Find the current version
      const currentVersionData = versions.find(v => v.id === currentVersionId);
      
      if (!currentVersionData) {
        setError('Error loading bid version');
        return;
      }
      
      // Set form data
      setFormData(formFields);
      setLineItems(currentVersionData.lineItems);
      
      // Set current version data (excluding id and createdAt which will be generated when saving)
      const { id: versionId, createdAt: versionCreatedAt, ...versionData } = currentVersionData;
      setCurrentVersion(versionData);
    } catch (err) {
      console.error('Error fetching bid:', err);
      setError('Failed to load bid data');
    }
  };

  // Fetch bid for duplication
  const fetchBidForDuplication = async (bidId: string) => {
    try {
      const bid = await BidService.getBid(bidId);
      
      if (!bid) {
        setError('Bid to duplicate not found');
        return;
      }
      
      // Set form data (with some fields reset)
      setFormData({
        ...bid,
        status: 'draft',
        title: `Copy of ${bid.title}`,
      });
      
      // Find the current version
      const currentVersionData = bid.versions.find(v => v.id === bid.currentVersionId);
      
      if (currentVersionData) {
        setLineItems(currentVersionData.lineItems);
        
        // Reset version data for the new bid
        setCurrentVersion({
          versionNumber: 1,
          totalAmount: currentVersionData.totalAmount,
          notes: 'Duplicated from previous bid',
          lineItems: currentVersionData.lineItems,
          attachments: [],
        });
      }
    } catch (err) {
      console.error('Error duplicating bid:', err);
      setError('Failed to load bid for duplication');
    }
  };

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  // Handle date input changes
  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, [name]: date }));
      validateField(name, date);
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  // Handle project selection
  const handleProjectChange = (event: React.SyntheticEvent, value: SelectOption | null) => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        projectId: value.id,
        projectName: value.name,
      }));
      validateField('projectId', value.id);
      setTouched(prev => ({ ...prev, projectId: true }));
    } else {
      setFormData(prev => ({
        ...prev,
        projectId: '',
        projectName: '',
      }));
      validateField('projectId', '');
      setTouched(prev => ({ ...prev, projectId: true }));
    }
  };

  // Handle subcontractor selection
  const handleSubcontractorChange = (event: React.SyntheticEvent, value: SelectOption | null) => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        subcontractorId: value.id,
        subcontractorName: value.name,
      }));
      validateField('subcontractorId', value.id);
      setTouched(prev => ({ ...prev, subcontractorId: true }));
    } else {
      setFormData(prev => ({
        ...prev,
        subcontractorId: '',
        subcontractorName: '',
      }));
      validateField('subcontractorId', '');
      setTouched(prev => ({ ...prev, subcontractorId: true }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle adding a tag
  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  // Handle deleting a tag
  const handleTagDelete = (tagToDelete: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToDelete);
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  // Handle tag input change
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // Handle tag input keydown event
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd();
    }
  };
  
  // Handle line item changes
  const handleLineItemChange = (updatedLineItems: BidLineItem[]) => {
    setLineItems(updatedLineItems);
  };

  // Handle adding a new line item
  const handleAddLineItem = (category: LineItemCategory = 'labor') => {
    const newItem = BidService.createLineItem(category);
    setLineItems([...lineItems, newItem]);
  };

  // Handle version notes change
  const handleVersionNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setCurrentVersion(prev => ({
      ...prev,
      notes: value,
    }));
  };

  // Move to next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === STEPS.length - 1) {
        // Submit form if on final step
        handleSubmit();
      } else {
        setActiveStep(prevActiveStep => prevActiveStep + 1);
      }
    }
  };

  // Move to previous step
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  // Reset form to default values
  const handleReset = () => {
    setFormData(DEFAULT_BID);
    setLineItems([]);
    setCurrentVersion({
      versionNumber: 1,
      totalAmount: 0,
      notes: '',
      lineItems: [],
      attachments: [],
    });
    setErrors({});
    setTouched({});
    setActiveStep(0);
    setError(null);
    setSuccess(null);
  };

  // Validate a single field
  const validateField = (name: string, value: any): boolean => {
    let fieldError = '';

    switch (name) {
      case 'title':
        if (!value || value.trim() === '') {
          fieldError = 'Bid title is required';
        } else if (value.length > 100) {
          fieldError = 'Bid title must be 100 characters or less';
        }
        break;
      case 'projectId':
        if (!value) {
          fieldError = 'Project is required';
        }
        break;
      case 'subcontractorId':
        if (!value) {
          fieldError = 'Subcontractor is required';
        }
        break;
      case 'scope':
        if (!value || value.trim() === '') {
          fieldError = 'Scope is required';
        }
        break;
      case 'submissionDeadline':
        if (!value) {
          fieldError = 'Submission deadline is required';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: fieldError,
    }));

    return !fieldError;
  };

  // Validate all fields for a specific step
  const validateStep = (step: number): boolean => {
    let stepIsValid = true;
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = { ...touched };

    // Step 1: Basic Information
    if (step === 0) {
      if (!formData.title || formData.title.trim() === '') {
        newErrors.title = 'Bid title is required';
        stepIsValid = false;
      }
      if (!formData.projectId) {
        newErrors.projectId = 'Project is required';
        stepIsValid = false;
      }
      if (!formData.subcontractorId) {
        newErrors.subcontractorId = 'Subcontractor is required';
        stepIsValid = false;
      }
      
      // Mark fields as touched
      newTouched.title = true;
      newTouched.projectId = true;
      newTouched.subcontractorId = true;
    }
    
    // Step 2: Scope & Timeline
    else if (step === 1) {
      if (!formData.scope || formData.scope.trim() === '') {
        newErrors.scope = 'Scope is required';
        stepIsValid = false;
      }
      if (!formData.submissionDeadline) {
        newErrors.submissionDeadline = 'Submission deadline is required';
        stepIsValid = false;
      }
      
      // Mark fields as touched
      newTouched.scope = true;
      newTouched.submissionDeadline = true;
    }
    
    // Step 3: Line Items - no required fields, just make sure total amount is calculated
    else if (step === 2) {
      // Ensure total amount is calculated from line items
      const total = lineItems.reduce((sum, item) => sum + item.total, 0);
      if (formData.totalAmount !== total) {
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }

    setErrors(newErrors);
    setTouched(newTouched);
    return stepIsValid;
  };

  // Submit the form
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Validate all steps
      if (
        !validateStep(0) || 
        !validateStep(1)
      ) {
        // If validation fails, go to the first invalid step
        if (!validateStep(0)) {
          setActiveStep(0);
        } else if (!validateStep(1)) {
          setActiveStep(1);
        }
        
        setError('Please correct the errors before submitting');
        return;
      }
      
      setSaveLoading(true);
      
      // Ensure optional date fields are not undefined
      const startDate = formData.startDate || null;
      const completionDate = formData.completionDate || null;
      
      // Update form data with user info and clean optional fields
      const updatedData = {
        ...formData,
        startDate,
        completionDate,
        createdBy: formData.createdBy || user?.uid || '',
        updatedBy: user?.uid || '',
      } as Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'>;
      
      // If editing an existing bid
      if (id) {
        // Create a new version first
        await BidService.createBidVersion(id, {
          ...currentVersion,
          versionNumber: currentVersion.versionNumber,
          lineItems,
        });
        
        // Update the bid
        await BidService.updateBid(id, updatedData);
        
        setSuccess('Bid updated successfully');
        setTimeout(() => {
          navigate(`/bids/${id}`);
        }, 1500);
      } 
      // Creating a new bid
      else {
        // Create new bid with all data
        const newBid = await BidService.createBid(updatedData);
        
        // Update the version with line items if there are any
        if (lineItems.length > 0) {
          await BidService.createBidVersion(newBid.id!, {
            ...currentVersion,
            versionNumber: 1,
            lineItems,
          });
        }
        
        setSuccess('Bid created successfully');
        setTimeout(() => {
          navigate(`/bids/${newBid.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving bid:', err);
      setError('Failed to save bid. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Cancel form submission
  const handleCancel = () => {
    navigate('/bids');
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Rest of the component rendering code
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <IconButton onClick={handleCancel} color="primary">
              <ArrowBackIcon />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">{id ? 'Edit Bid' : 'Create New Bid'}</Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<ResetIcon />} 
              onClick={handleReset}
              sx={{ mr: 1 }}
            >
              Reset
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />} 
              onClick={handleSubmit}
              disabled={saveLoading}
            >
              {saveLoading ? 'Saving...' : 'Save Bid'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2 }}>
          {/* Step 1: Basic Information */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Bid Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={touched.title && !!errors.title}
                  helperText={touched.title && errors.title}
                  sx={{ mb: 2 }}
                />

                <Autocomplete
                  options={projects}
                  getOptionLabel={(option) => option.name}
                  value={formData.projectId ? { id: formData.projectId, name: formData.projectName } : null}
                  onChange={handleProjectChange}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Project"
                      required
                      error={touched.projectId && !!errors.projectId}
                      helperText={touched.projectId && errors.projectId}
                    />
                  )}
                  sx={{ mb: 2 }}
                />

                <Autocomplete
                  options={subcontractors}
                  getOptionLabel={(option) => option.name}
                  value={formData.subcontractorId ? { id: formData.subcontractorId, name: formData.subcontractorName } : null}
                  onChange={handleSubcontractorChange}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Subcontractor"
                      required
                      error={touched.subcontractorId && !!errors.subcontractorId}
                      helperText={touched.subcontractorId && errors.subcontractorId}
                    />
                  )}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={formData.priority}
                    onChange={handleSelectChange}
                    label="Priority"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Tags</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1 }}>
                    {formData.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleTagDelete(tag)}
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <TextField
                      label="Add tag"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={handleTagAdd}
                      disabled={!tagInput.trim()}
                      sx={{ ml: 1 }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Scope & Timeline */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Scope Description"
                  name="scope"
                  value={formData.scope}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  error={touched.scope && !!errors.scope}
                  helperText={touched.scope && errors.scope}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Submission Deadline"
                  value={formData.submissionDeadline}
                  onChange={(date) => handleDateChange('submissionDeadline', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: touched.submissionDeadline && !!errors.submissionDeadline,
                      helperText: touched.submissionDeadline && errors.submissionDeadline
                    }
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.requiresInsurance}
                            onChange={handleCheckboxChange}
                            name="requiresInsurance"
                          />
                        }
                        label="Requires Insurance"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.requiresBond}
                            onChange={handleCheckboxChange}
                            name="requiresBond"
                          />
                        }
                        label="Requires Bond"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Line Items */}
          {activeStep === 2 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Line Items</Typography>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddLineItem('labor')}
                    sx={{ mr: 1 }}
                  >
                    Add Labor
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddLineItem('materials')}
                    sx={{ mr: 1 }}
                  >
                    Add Materials
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddLineItem('equipment')}
                    sx={{ mr: 1 }}
                  >
                    Add Equipment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddLineItem('other')}
                  >
                    Add Other
                  </Button>
                </Box>
              </Box>

              <LineItemsTable
                lineItems={lineItems}
                onChange={handleLineItemChange}
                editable={true}
              />

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                  Total: {formatCurrency(formData.totalAmount)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Step 4: Review */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Review Bid</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2"><strong>Title:</strong> {formData.title}</Typography>
                    <Typography variant="body2"><strong>Project:</strong> {formData.projectName}</Typography>
                    <Typography variant="body2"><strong>Subcontractor:</strong> {formData.subcontractorName}</Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {STATUS_OPTIONS.find(o => o.value === formData.status)?.label}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Priority:</strong> {PRIORITY_OPTIONS.find(o => o.value === formData.priority)?.label}
                    </Typography>
                    {formData.tags.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2"><strong>Tags:</strong></Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                          {formData.tags.map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ m: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Scope & Timeline</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom><strong>Scope:</strong></Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{formData.scope}</Typography>
                    <Typography variant="body2">
                      <strong>Submission Deadline:</strong> {formData.submissionDeadline.toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Requires Insurance:</strong> {formData.requiresInsurance ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Requires Bond:</strong> {formData.requiresBond ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>Line Items</Typography>
              {lineItems.length > 0 ? (
                <LineItemsTable
                  lineItems={lineItems}
                  onChange={handleLineItemChange}
                  editable={false}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">No line items added.</Typography>
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                  Total: {formatCurrency(formData.totalAmount)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>Version Notes</Typography>
                <TextField
                  label="Notes for this version"
                  value={currentVersion.notes}
                  onChange={handleVersionNotesChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add any notes about this bid version"
                  sx={{ mb: 2 }}
                />
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<PrevIcon />}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={activeStep === STEPS.length - 1 ? <SaveIcon /> : <NextIcon />}
            disabled={saveLoading}
          >
            {activeStep === STEPS.length - 1 ? (saveLoading ? 'Saving...' : 'Submit') : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default BidForm; 