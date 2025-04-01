import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BidStatus } from '../../types/project.types';
import { Bid, Subcontractor } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { TextFieldProps } from '@mui/material/TextField';
import { BidService } from '../../services/bid';
import { SubcontractorService } from '../../services/subcontractor';

interface BidFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void | Promise<void>;
  initialData?: Bid | null;
  userId: string;
  projectId: string;
}

const bidStatuses: Bid['status'][] = ['draft', 'submitted', 'accepted', 'rejected', 'expired', 'withdrawn', 'revision_requested'];

// Define common bid categories
const commonBidCategories: string[] = [
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

// Status display names
const STATUS_DISPLAY: Record<Bid['status'], string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

const BidFormModal: React.FC<BidFormModalProps> = ({ open, onClose, onSubmit, initialData, userId, projectId }) => {
  const [bid, setBid] = useState<Partial<Bid>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contractors, setContractors] = useState<Subcontractor[]>([]);
  const [loadingContractors, setLoadingContractors] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setBid(initialData || {
        projectId,
        title: '',
        subcontractorName: '',
        scope: '',
        status: 'submitted',
        priority: 'medium',
        totalAmount: 0,
        submissionDeadline: new Date(),
        notes: '',
      });
      setErrors({});
      
      // Load real contractors data
      const loadContractors = async () => {
        setLoadingContractors(true);
        try {
          const data = await SubcontractorService.getSubcontractors(userId);
          setContractors(data);
        } catch (error) {
          console.error("Error loading contractors:", error);
        } finally {
          setLoadingContractors(false);
        }
      };
      loadContractors();
    } else {
      setBid({});
    }
  }, [open, initialData, projectId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setBid(prev => ({ ...prev, [name!]: value }));
    validateField(name!, value);
  };

  const handleAutocompleteChange = (name: string, value: string | { id: string; name: string } | null) => {
    let actualValue = '';
    if (typeof value === 'string') {
        actualValue = value; // For freeSolo entry
    } else if (value?.name) {
        actualValue = value.name;
    } else if (value) {
       actualValue = String(value); 
    }
    setBid(prev => ({ ...prev, [name]: actualValue }));
    validateField(name, actualValue);
  };

  const handleDateChange = (date: Date | null) => {
    setBid(prev => ({ ...prev, submissionDeadline: date || new Date() }));
     validateField('submissionDeadline', date);
  };

  const validateField = (name: string, value: any): boolean => {
    let error = '';
    switch (name) {
      case 'subcontractorName':
        if (!value) error = 'Contractor/Supplier name is required';
        break;
      case 'totalAmount':
        if (Number(value) <= 0) error = 'Bid Amount must be positive';
        break;
      case 'submissionDeadline':
         if (!value) error = 'Submission deadline is required';
         break;
      case 'scope':
        // if (!value) error = 'Bid scope is required'; // Example: Make it required if necessary
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const fieldsToValidate = ['subcontractorName', 'totalAmount', 'submissionDeadline', 'status'];
    fieldsToValidate.forEach(field => {
      if (!validateField(field, bid[field as keyof Bid])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Make sure totalAmount is a valid number
    const bidAmount = typeof bid.totalAmount === 'number' ? bid.totalAmount : 
                     (bid.totalAmount ? parseFloat(String(bid.totalAmount)) : 0);

    const submitPayload: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
      title: bid.title || `Bid from ${bid.subcontractorName}`,
      projectId,
      projectName: initialData?.projectName || 'Unknown Project',
      subcontractorId: initialData?.subcontractorId || '',
      subcontractorName: bid.subcontractorName || '',
      scope: bid.scope || 'N/A',
      status: (bid.status?.toLowerCase() || 'submitted') as Bid['status'],
      priority: bid.priority || 'medium',
      submissionDeadline: bid.submissionDeadline || new Date(),
      startDate: bid.startDate || null,
      completionDate: bid.completionDate || null,
      totalAmount: bidAmount, // Use the validated number value
      tags: bid.tags || [],
      createdBy: initialData?.createdBy || userId,
      updatedBy: userId,
      requiresInsurance: bid.requiresInsurance ?? false,
      requiresBond: bid.requiresBond ?? false,
      isPublic: bid.isPublic ?? false,
      isApproved: bid.isApproved ?? false,
      notes: bid.notes || '',
    };
    
    onSubmit(submitPayload);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{initialData ? 'Edit Bid' : 'Add New Bid'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={contractors}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.name;
                }}
                loading={loadingContractors}
                value={bid.subcontractorName || ''}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    handleAutocompleteChange('subcontractorName', newValue);
                  } else if (newValue && 'name' in newValue) {
                    handleAutocompleteChange('subcontractorName', newValue.name);
                    if (newValue.id) {
                      setBid(prev => ({...prev, subcontractorId: newValue.id}));
                    }
                  } else {
                    handleAutocompleteChange('subcontractorName', '');
                  }
                }}
                onInputChange={(event, newInputValue) => {
                    setBid(prev => ({...prev, subcontractorName: newInputValue}));
                    validateField('subcontractorName', newInputValue); 
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contractor / Supplier Name"
                    error={!!errors.subcontractorName}
                    helperText={errors.subcontractorName}
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingContractors ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={commonBidCategories}
                getOptionLabel={(option) => option}
                value={bid.scope || ''}
                onChange={(event, newValue) => {
                  handleAutocompleteChange('scope', newValue);
                }}
                onInputChange={(event, newInputValue) => {
                    setBid(prev => ({...prev, scope: newInputValue}));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bid Scope/Category"
                    placeholder="e.g., Plumbing, Electrical"
                    error={!!errors.scope}
                    helperText={errors.scope}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bid Amount"
                name="totalAmount"
                type="number"
                value={bid.totalAmount ?? ''}
                onChange={(e) => {
                  // Convert the input value to a number explicitly
                  const numValue = e.target.value ? parseFloat(e.target.value) : 0;
                  setBid(prev => ({ ...prev, totalAmount: numValue }));
                  validateField('totalAmount', numValue);
                }}
                error={!!errors.totalAmount}
                helperText={errors.totalAmount}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0.01, step: "0.01" }}
                required
              />
            </Grid>
             <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={bid.status || 'submitted'}
                    onChange={handleChange as any}
                    label="Status"
                    required
                  >
                    {bidStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {STATUS_DISPLAY[status]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
             <Grid item xs={12} sm={6}>
               <DatePicker
                 label="Submission Deadline"
                 value={bid.submissionDeadline instanceof Date ? bid.submissionDeadline : null}
                 onChange={handleDateChange}
                 slotProps={{ 
                   textField: {
                     fullWidth: true,
                     required: true,
                     error: !!errors.submissionDeadline,
                     helperText: errors.submissionDeadline,
                     name: 'submissionDeadline'
                   } as TextFieldProps
                 }}
               />
             </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                name="notes"
                multiline
                rows={3}
                value={bid.notes || ''}
                onChange={handleChange}
              />
            </Grid>
            {/* Add fields for attachments later if needed */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {initialData ? 'Save Changes' : 'Add Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BidFormModal; 