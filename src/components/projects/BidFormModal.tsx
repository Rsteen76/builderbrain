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
import { Bid, BidStatus } from '../../types/project.types';
import { v4 as uuidv4 } from 'uuid';
import { TextFieldProps } from '@mui/material/TextField';

interface BidFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Bid) => void;
  initialData?: Bid | null;
}

const bidStatuses: BidStatus[] = ['Submitted', 'Accepted', 'Rejected', 'Pending', 'Needs Revision'];

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

const BidFormModal: React.FC<BidFormModalProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [bid, setBid] = useState<Partial<Bid>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setBid(initialData || {
        contractorName: '',
        category: '',
        bidAmount: 0,
        status: 'Submitted',
        submittedDate: new Date(),
        notes: '',
      });
      setErrors({});
    } else {
      setBid({});
    }
  }, [open, initialData]);

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
    setBid(prev => ({ ...prev, submittedDate: date || new Date() }));
     validateField('submittedDate', date);
  };

  const validateField = (name: string, value: any): boolean => {
    let error = '';
    switch (name) {
      case 'contractorName':
        if (!value) error = 'Contractor/Supplier name is required';
        break;
      case 'bidAmount':
        if (Number(value) <= 0) error = 'Bid Amount must be positive';
        break;
      case 'submittedDate':
         if (!value) error = 'Submitted date is required';
         break;
      case 'category':
        // if (!value) error = 'Bid category is required'; // Example: Make it required if necessary
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const fieldsToValidate = ['contractorName', 'bidAmount', 'submittedDate', 'status'];
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

    const finalBid: Bid = {
      id: initialData?.id || uuidv4(),
      contractorName: bid.contractorName || '',
      category: bid.category || 'Other',
      bidAmount: Number(bid.bidAmount) || 0,
      status: bid.status || 'Submitted',
      submittedDate: bid.submittedDate || new Date(),
      notes: bid.notes || '',
      // contractorId, costCategoryId, attachments can be added later
    };
    onSubmit(finalBid);
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
                value={bid.contractorName || ''}
                onChange={(event, newValue) => {
                  handleAutocompleteChange('contractorName', newValue);
                }}
                onInputChange={(event, newInputValue) => {
                    setBid(prev => ({...prev, contractorName: newInputValue}));
                    validateField('contractorName', newInputValue); 
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contractor / Supplier Name"
                    error={!!errors.contractorName}
                    helperText={errors.contractorName}
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
                value={bid.category || ''}
                onChange={(event, newValue) => {
                  handleAutocompleteChange('category', newValue);
                }}
                onInputChange={(event, newInputValue) => {
                    setBid(prev => ({...prev, category: newInputValue}));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bid Category"
                    placeholder="e.g., Plumbing, Electrical"
                    error={!!errors.category}
                    helperText={errors.category}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bid Amount"
                name="bidAmount"
                type="number"
                value={bid.bidAmount ?? ''}
                onChange={handleChange}
                error={!!errors.bidAmount}
                helperText={errors.bidAmount}
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
                    label="Status"
                    value={bid.status || ''}
                    onChange={handleChange as any}
                  >
                    {bidStatuses.map(stat => (
                      <MenuItem key={stat} value={stat}>{stat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
             <Grid item xs={12} sm={6}>
               <DatePicker
                 label="Submitted Date"
                 value={bid.submittedDate instanceof Date ? bid.submittedDate : null}
                 onChange={handleDateChange}
                 slotProps={{ 
                   textField: {
                     fullWidth: true,
                     required: true,
                     error: !!errors.submittedDate,
                     helperText: errors.submittedDate,
                     name: 'submittedDate'
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