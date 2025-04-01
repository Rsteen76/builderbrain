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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BidStatus } from '../../types/project.types';
import { Bid } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { TextFieldProps } from '@mui/material/TextField';
import { BidService } from '../../services/bid';

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
  'Plumbing',
  'Electrical',
  'HVAC',
  'Framing',
  'Roofing',
  'Siding',
  'Windows & Doors',
  'Insulation',
  'Drywall',
  'Painting',
  'Flooring',
  'Cabinetry',
  'Countertops',
  'Landscaping',
  'Concrete',
  'Excavation',
  'Demolition',
  'Other',
];

// Mock data - replace with API call or context later
const mockContractors = [
  { id: 'c1', name: 'ABC Plumbing' },
  { id: 'c2', name: 'XYZ Electricians' },
  { id: 'c3', name: 'General Framers Inc.' },
  { id: 'c4', name: 'Top Roofers Ltd.' },
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
      totalAmount: Number(bid.totalAmount) || 0,
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
                options={mockContractors}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                value={bid.subcontractorName || ''}
                onChange={(event, newValue) => {
                  handleAutocompleteChange('subcontractorName', newValue);
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
                onChange={handleChange}
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