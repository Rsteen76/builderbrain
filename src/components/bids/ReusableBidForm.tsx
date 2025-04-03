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
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';
import { Bid, BidPaymentStage, Project, Subcontractor, Phase } from '../../types';

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
}

interface ReusableBidFormProps {
  open?: boolean;
  onClose?: () => void;
  onSubmit: (bidForm: BidFormData) => Promise<void>;
  phases: Phase[];
  subcontractors: Subcontractor[];
  initialBidData?: Partial<BidFormData>;
  editingBidId?: string | null;
  isSaving?: boolean;
  onAddSubcontractor?: () => void;
  isDialog?: boolean;
  projectId?: string;
  projectName?: string;
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
}) => {
  // Default bid form state
  const defaultBidForm: BidFormData = {
    title: '',
    subcontractorName: '',
    totalAmount: 0,
    phaseId: phases.length > 0 ? phases[0].id : '',
    phaseName: phases.length > 0 ? phases[0].name : '',
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
    tags: []
  };

  // State for form
  const [bidForm, setBidForm] = useState<BidFormData>(initialBidData ? { ...defaultBidForm, ...initialBidData } : defaultBidForm);
  const [paymentTemplate, setPaymentTemplate] = useState('standard');
  const [tagInput, setTagInput] = useState('');

  // Log initial mounting for debugging
  console.log('ReusableBidForm mounted/updated with props:', {
    initialBidData: initialBidData ? { ...initialBidData } : null,
    editingBidId,
    isDialog,
    open,
  });

  // Track initialization to prevent infinite loops
  const initialized = React.useRef(false);

  // At the beginning of the component, after hooks
  useEffect(() => {
    console.log("ReusableBidForm MOUNT - initialBidData:", initialBidData);
    console.log("ReusableBidForm MOUNT - editingBidId:", editingBidId);
    console.log("ReusableBidForm MOUNT - initialized ref:", initialized.current);
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
    
    // Get default phase for new payments
    const defaultPhase = phases.length > 0 ? phases[0] : null;
    
    // Update payment terms based on template
    switch(template) {
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
    console.log('Submitting bid form data:', JSON.stringify(bidForm, null, 2));
    
    // Validate form data
    if (!bidForm.title) {
      console.warn('Bid title is required');
      // You could add more validation handling here
    }
    
    if (!bidForm.subcontractorName) {
      console.warn('Subcontractor name is required');
      // You could add more validation handling here
    }
    
    // Ensure payment terms percentages add up to 100%
    const totalPercent = bidForm.paymentTerms.downPaymentPercent +
      bidForm.paymentTerms.installments.reduce((sum, item) => sum + item.percent, 0);
      
    if (Math.abs(totalPercent - 100) > 0.1) {
      console.warn(`Payment terms percentages don't add up to 100%: ${totalPercent}%`);
      // You could add more validation handling here
    }
    
    // Ensure all installments have valid data
    let installmentsValid = true;
    bidForm.paymentTerms.installments.forEach((item, index) => {
      if (!item.name) {
        console.warn(`Installment ${index + 1} is missing a name`);
        installmentsValid = false;
      }
      if (item.percent <= 0) {
        console.warn(`Installment ${index + 1} has an invalid percentage: ${item.percent}`);
        installmentsValid = false;
      }
    });
    
    // Create a clean copy of the form data
    const cleanFormData = {
      ...bidForm,
      totalAmount: Number(bidForm.totalAmount) || 0,
      timeline: Number(bidForm.timeline) || 30,
      paymentTerms: {
        ...bidForm.paymentTerms,
        downPaymentPercent: Number(bidForm.paymentTerms.downPaymentPercent) || 0,
        installments: bidForm.paymentTerms.installments.map(item => ({
          ...item,
          percent: Number(item.percent) || 0
        }))
      }
    };
    
    try {
      await onSubmit(cleanFormData);
    } catch (error) {
      console.error('Error submitting bid form:', error);
    }
  };

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
        {/* Bid Details Section */}
        <Box className="form-section">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}> {/* Adjusted Typography & reduced margin */}
            Bid Details
          </Typography>
          
          <Grid container spacing={2}> {/* Reduced spacing */} 
            <Grid item xs={12} md={8}> {/* Wider title field */}
              <Autocomplete
                freeSolo // Allow custom input
                fullWidth
                options={COMMON_BID_CATEGORIES} // Use predefined categories
                value={bidForm.title}
                onChange={(event, newValue) => {
                  // Handles selection or custom input blur
                  handleChangeBidForm('title', newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  // Handles typing custom input directly
                  // We might not need this if onChange handles freeSolo correctly,
                  // but kept for potential finer control if needed.
                  // Be careful not to overwrite selection with input change.
                  // Let's rely on onChange for simplicity for now.
                }}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Bid Title (Select or Type)" // Updated label
                    variant="outlined"
                    InputProps={{ 
                      ...params.InputProps,
                      sx: { borderRadius: 1 } 
                    }}
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

            <Grid item xs={12} md={8}> {/* Wider Phase field */}
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="bid-phase-select-label">Project Phase</InputLabel>
                <Select
                  labelId="bid-phase-select-label"
                  value={bidForm.phaseId || ''}
                  label="Project Phase"
                  onChange={(e) => {
                    const phaseId = e.target.value;
                    const phase = phases.find(p => p.id === phaseId);
                    handleChangeBidForm('phaseId', phaseId);
                    handleChangeBidForm('phaseName', phase?.name || '');
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  {phases.map((phase) => (
                    <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
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
                options={subcontractors}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={subcontractors.find(s => s.id === bidForm.subcontractorId) || null}
                onChange={(_, newValue) => {
                  handleChangeBidForm('subcontractorName', newValue?.name || '');
                  handleChangeBidForm('subcontractorId', newValue?.id || '');
                }}
                size="small"
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Subcontractor" 
                    required 
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      sx: { borderRadius: 1 }
                    }} 
                  />
                )}
              />
              {onAddSubcontractor && (
                <Button
                  size="small"
                  color="primary"
                  onClick={onAddSubcontractor}
                  sx={{ mt: 0.5, alignSelf: 'flex-start', borderRadius: 1, fontSize: '0.8rem' }} // Smaller button
                  startIcon={<AddIcon fontSize="small"/>}
                >
                  Add New Sub
                </Button>
              )}
            </Grid>

            <Grid item xs={6} md={3}> {/* More compact grid */}
              <TextField
                fullWidth
                required
                label="Total Amount"
                type="number"
                value={bidForm.totalAmount}
                onChange={(e) => handleChangeBidForm('totalAmount', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { borderRadius: 1 }
                }}
                variant="outlined"
                size="small"
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
                        const pName = phases.find(p => p.id === pId)?.name || '';
                        handleChangeInstallment(installment.id, 'phaseId', pId);
                        handleChangeInstallment(installment.id, 'phaseName', pName);
                      }}
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value=""><em>None</em></MenuItem> 
                      {phases.map((p) => (
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