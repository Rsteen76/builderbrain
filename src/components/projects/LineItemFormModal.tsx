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
  Box,
  Typography,
} from '@mui/material';
import { LineItem, LineItemCategory } from '../../types/project.types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

interface LineItemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: LineItem) => void;
  initialData?: LineItem | null; // For editing
}

const categories: LineItemCategory[] = ['Material', 'Labor', 'Subcontractor', 'Equipment', 'Permit', 'Other'];
// Define common units
const commonUnits: string[] = ['sq ft', 'ln ft', 'hr', 'day', 'each', 'lump sum', 'yd', 'ton']; 

// Define common line items with category and unit
interface CommonLineItemOption {
  label: string; // The description to show and use
  category: LineItemCategory;
  unit: string;
}

const commonLineItems: CommonLineItemOption[] = [
  // Site Work & Foundation
  { label: 'Site Clearing', category: 'Labor', unit: 'lump sum' },
  { label: 'Excavation', category: 'Labor', unit: 'yd' },
  { label: 'Foundation Concrete', category: 'Material', unit: 'yd' },
  { label: 'Foundation Pour & Finish', category: 'Labor', unit: 'lump sum' },
  { label: 'Foundation Waterproofing', category: 'Material', unit: 'sq ft' },
  // Framing
  { label: 'Wall Framing Labor', category: 'Labor', unit: 'hr' },
  { label: 'Roof Framing Labor', category: 'Labor', unit: 'hr' },
  { label: 'Lumber - 2x4', category: 'Material', unit: 'ln ft' },
  { label: 'Lumber - 2x6', category: 'Material', unit: 'ln ft' },
  { label: 'Plywood Sheathing', category: 'Material', unit: 'sheet' }, 
  { label: 'OSB Sheathing', category: 'Material', unit: 'sheet' },
  // Exterior
  { label: 'House Wrap', category: 'Material', unit: 'roll' },
  { label: 'Siding Installation', category: 'Labor', unit: 'sq ft' },
  { label: 'Vinyl Siding', category: 'Material', unit: 'sq ft' },
  { label: 'Brick/Stone Veneer', category: 'Material', unit: 'sq ft' },
  { label: 'Exterior Trim', category: 'Material', unit: 'ln ft' },
  { label: 'Roofing Shingles', category: 'Material', unit: 'sq ft' },
  { label: 'Roofing Installation', category: 'Labor', unit: 'sq ft' },
  { label: 'Windows', category: 'Material', unit: 'each' },
  { label: 'Exterior Doors', category: 'Material', unit: 'each' },
  // MEP
  { label: 'Rough Plumbing Labor', category: 'Labor', unit: 'hr' },
  { label: 'Finish Plumbing Labor', category: 'Labor', unit: 'hr' },
  { label: 'Rough Electrical Labor', category: 'Labor', unit: 'hr' },
  { label: 'Finish Electrical Labor', category: 'Labor', unit: 'hr' },
  { label: 'HVAC Rough-in Labor', category: 'Labor', unit: 'hr' },
  { label: 'HVAC System Install', category: 'Subcontractor', unit: 'lump sum' },
  { label: 'Electrical Wiring', category: 'Material', unit: 'roll' },
  { label: 'Outlets & Switches', category: 'Material', unit: 'each' },
  // Interior
  { label: 'Insulation - Batts', category: 'Material', unit: 'sq ft' },
  { label: 'Insulation Installation', category: 'Labor', unit: 'sq ft' },
  { label: 'Drywall Sheets', category: 'Material', unit: 'sheet' },
  { label: 'Drywall Installation & Finish', category: 'Labor', unit: 'sq ft' },
  { label: 'Interior Doors', category: 'Material', unit: 'each' },
  { label: 'Interior Trim', category: 'Material', unit: 'ln ft' },
  { label: 'Painting Labor', category: 'Labor', unit: 'hr' },
  { label: 'Paint', category: 'Material', unit: 'gallon' },
  { label: 'Flooring - Tile', category: 'Material', unit: 'sq ft' },
  { label: 'Flooring - Hardwood', category: 'Material', unit: 'sq ft' },
  { label: 'Flooring Installation', category: 'Labor', unit: 'sq ft' },
  { label: 'Kitchen Cabinets', category: 'Material', unit: 'each' },
  { label: 'Countertops', category: 'Material', unit: 'sq ft' },
  // Other
  { label: 'Permit Fees', category: 'Permit', unit: 'lump sum' },
  { label: 'Dumpster Rental', category: 'Equipment', unit: 'each' },
  { label: 'General Labor', category: 'Labor', unit: 'hr' },
];

const LineItemFormModal: React.FC<LineItemFormModalProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [item, setItem] = useState<Partial<LineItem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset form when initialData changes or modal opens/closes
    if (open) {
      setItem(initialData || {
        description: '',
        category: 'Material',
        quantity: 1,
        unit: '',
        unitCost: 0,
        totalCost: 0,
        notes: '',
      });
      setErrors({});
    } else {
      setItem({}); // Clear state when closed
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    let updatedItem = { ...item, [name!]: value };

    // Recalculate total cost if quantity or unit cost changes
    if (name === 'quantity' || name === 'unitCost') {
      const qty = name === 'quantity' ? Number(value) : Number(item.quantity) || 0;
      const cost = name === 'unitCost' ? Number(value) : Number(item.unitCost) || 0;
      updatedItem.totalCost = qty * cost;
    }

    setItem(updatedItem);

    // Basic validation on change (optional)
    validateField(name!, value);
  };

  // Combined handler for regular inputs
  const handleAutocompleteChange = (name: string, value: string | CommonLineItemOption | null) => {
    let updates: Partial<LineItem> = {};

    if (name === 'description') {
      if (typeof value === 'string') {
        updates = { description: value }; // User typed custom description
      } else if (value?.label) {
        // User selected a common item - update description, category, and unit
        updates = { 
          description: value.label,
          category: value.category,
          unit: value.unit
        };
      } else {
        updates = { description: '' }; // Cleared
      }
    } else { // Handle category or unit autocomplete if needed separately
        updates = { [name]: value || '' };
    }
    
    setItem(prev => ({ ...prev, ...updates }));

    // Re-validate potentially changed fields
    Object.keys(updates).forEach(key => validateField(key, updates[key as keyof LineItem]));
  };

  const validateField = (name: string, value: any): boolean => {
    let error = '';
    switch (name) {
      case 'description':
        if (!value) error = 'Description is required';
        break;
      case 'quantity':
        if (Number(value) <= 0) error = 'Quantity must be positive';
        break;
      case 'unit':
        if (!value) error = 'Unit is required';
        break;
      case 'unitCost':
        if (Number(value) < 0) error = 'Unit Cost cannot be negative';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const fieldsToValidate = ['description', 'quantity', 'unit', 'unitCost', 'category'];
    fieldsToValidate.forEach(field => {
      if (!validateField(field, item[field as keyof LineItem])) {
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const finalItem: LineItem = {
      id: initialData?.id || uuidv4(), // Generate new ID or use existing one
      description: item.description || '',
      category: item.category || 'Other',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || '',
      unitCost: Number(item.unitCost) || 0,
      totalCost: Number(item.totalCost) || 0,
      notes: item.notes || '',
    };
    onSubmit(finalItem);
    onClose(); // Close modal after submission
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Line Item' : 'Add New Line Item'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={commonLineItems}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
              value={commonLineItems.find(opt => opt.label === item.description) ?? item.description ?? null} 
              onChange={(event, newValue) => {
                handleAutocompleteChange('description', newValue);
              }}
              onInputChange={(event, newInputValue, reason) => {
                 if (reason === 'input') {
                   setItem(prev => ({ ...prev, description: newInputValue }));
                   validateField('description', newInputValue);
                 }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Description"
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  {option.label} 
                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    ({option.category} - {option.unit})
                  </Typography>
                </Box>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={categories} 
              getOptionLabel={(option) => option}
              value={item.category || null} 
              onChange={(event, newValue) => {
                handleAutocompleteChange('category', newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  error={!!errors.category}
                  helperText={errors.category} 
                  required
                />
              )}
            />
          </Grid>
           <Grid item xs={6} sm={3}>
             <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={item.quantity ?? ''}
              onChange={handleChange}
              error={!!errors.quantity}
              helperText={errors.quantity}
              inputProps={{ min: 0.01, step: "any" }}
              required
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Autocomplete
              freeSolo
              options={commonUnits}
              getOptionLabel={(option) => option}
              value={item.unit || ''} 
              onChange={(event, newValue) => {
                handleAutocompleteChange('unit', newValue);
              }}
              onInputChange={(event, newInputValue) => {
                  setItem(prev => ({...prev, unit: newInputValue}));
                  validateField('unit', newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Unit"
                  placeholder="e.g., sq ft, hr"
                  error={!!errors.unit}
                  helperText={errors.unit}
                  required
                />
              )}
            />
          </Grid>
           <Grid item xs={12} sm={6}>
             <TextField
              fullWidth
              label="Unit Cost"
              name="unitCost"
              type="number"
              value={item.unitCost ?? ''}
              onChange={handleChange}
              error={!!errors.unitCost}
              helperText={errors.unitCost}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: "0.01" }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Total Cost"
              name="totalCost"
              type="number"
              value={item.totalCost?.toFixed(2) || '0.00'}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes (Optional)"
              name="notes"
              multiline
              rows={3}
              value={item.notes || ''}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialData ? 'Save Changes' : 'Add Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LineItemFormModal; 