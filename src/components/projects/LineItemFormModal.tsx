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
import { LineItemCategory } from '../../types/project.types';
import { LineItem } from '../../types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

interface LineItemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: LineItem) => void | Promise<void>;
  initialData?: LineItem | null; // For editing
}

const categories: string[] = ['material', 'labor', 'subcontractor', 'equipment', 'permit', 'other'];
// Define common units
const commonUnits: string[] = ['sq ft', 'ln ft', 'hr', 'day', 'each', 'lump sum', 'yd', 'ton']; 

// Define common line items with category and unit
interface CommonLineItemOption {
  label: string; // The description to show and use
  category: string;
  unit: string;
}

const commonLineItems: CommonLineItemOption[] = [
  // Site Work & Foundation
  { label: 'Site Clearing', category: 'labor', unit: 'lump sum' },
  { label: 'Excavation', category: 'labor', unit: 'yd' },
  { label: 'Foundation Concrete', category: 'material', unit: 'yd' },
  { label: 'Foundation Pour & Finish', category: 'labor', unit: 'lump sum' },
  { label: 'Foundation Waterproofing', category: 'material', unit: 'sq ft' },
  // Framing
  { label: 'Wall Framing Labor', category: 'labor', unit: 'hr' },
  { label: 'Roof Framing Labor', category: 'labor', unit: 'hr' },
  { label: 'Lumber - 2x4', category: 'material', unit: 'ln ft' },
  { label: 'Lumber - 2x6', category: 'material', unit: 'ln ft' },
  { label: 'Plywood Sheathing', category: 'material', unit: 'sheet' }, 
  { label: 'OSB Sheathing', category: 'material', unit: 'sheet' },
  // Exterior
  { label: 'House Wrap', category: 'material', unit: 'roll' },
  { label: 'Siding Installation', category: 'labor', unit: 'sq ft' },
  { label: 'Vinyl Siding', category: 'material', unit: 'sq ft' },
  { label: 'Brick/Stone Veneer', category: 'material', unit: 'sq ft' },
  { label: 'Exterior Trim', category: 'material', unit: 'ln ft' },
  { label: 'Roofing Shingles', category: 'material', unit: 'sq ft' },
  { label: 'Roofing Installation', category: 'labor', unit: 'sq ft' },
  { label: 'Windows', category: 'material', unit: 'each' },
  { label: 'Exterior Doors', category: 'material', unit: 'each' },
  // MEP
  { label: 'Rough Plumbing Labor', category: 'labor', unit: 'hr' },
  { label: 'Finish Plumbing Labor', category: 'labor', unit: 'hr' },
  { label: 'Rough Electrical Labor', category: 'labor', unit: 'hr' },
  { label: 'Finish Electrical Labor', category: 'labor', unit: 'hr' },
  { label: 'HVAC Rough-in Labor', category: 'labor', unit: 'hr' },
  { label: 'HVAC System Install', category: 'subcontractor', unit: 'lump sum' },
  { label: 'Electrical Wiring', category: 'material', unit: 'roll' },
  { label: 'Outlets & Switches', category: 'material', unit: 'each' },
  // Interior
  { label: 'Insulation - Batts', category: 'material', unit: 'sq ft' },
  { label: 'Insulation Installation', category: 'labor', unit: 'sq ft' },
  { label: 'Drywall Sheets', category: 'material', unit: 'sheet' },
  { label: 'Drywall Installation & Finish', category: 'labor', unit: 'sq ft' },
  { label: 'Interior Doors', category: 'material', unit: 'each' },
  { label: 'Interior Trim', category: 'material', unit: 'ln ft' },
  { label: 'Painting Labor', category: 'labor', unit: 'hr' },
  { label: 'Paint', category: 'material', unit: 'gallon' },
  { label: 'Flooring - Tile', category: 'material', unit: 'sq ft' },
  { label: 'Flooring - Hardwood', category: 'material', unit: 'sq ft' },
  { label: 'Flooring Installation', category: 'labor', unit: 'sq ft' },
  { label: 'Kitchen Cabinets', category: 'material', unit: 'each' },
  { label: 'Countertops', category: 'material', unit: 'sq ft' },
  // Other
  { label: 'Permit Fees', category: 'permit', unit: 'lump sum' },
  { label: 'Dumpster Rental', category: 'equipment', unit: 'each' },
  { label: 'General Labor', category: 'labor', unit: 'hr' },
];

const LineItemFormModal: React.FC<LineItemFormModalProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [item, setItem] = useState<Partial<LineItem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Reset form when initialData changes or modal opens/closes
    if (open) {
      // Convert category to lowercase if it's in uppercase format
      const normalizedInitialData = initialData ? {
        ...initialData,
        // Convert any legacy uppercase categories to lowercase
        category: initialData.category ? initialData.category.toLowerCase() as LineItem['category'] : 'material'
      } : null;

      setItem(normalizedInitialData || {
        description: '',
        category: 'material',
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
          category: value.category as LineItem['category'],
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
      category: item.category || 'other',
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