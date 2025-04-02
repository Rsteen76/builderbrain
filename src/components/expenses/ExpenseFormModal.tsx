import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  BusinessCenter as VendorIcon,
  Assignment as ProjectIcon,
  Receipt as ReceiptIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as SubcontractorIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Expense, LineItem, Subcontractor } from '../../types';
import { ExpenseService } from '../../services/expense';
import { SubcontractorService } from '../../services/subcontractor';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
}

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  expense?: Partial<Expense>;
  onSave: (expense: Partial<Expense>) => void;
  projects: Project[];
}

// Interface for errors
interface FormErrors {
  [key: string]: any;
  lineItems?: {
    [id: string]: {
      description?: string;
      quantity?: string;
      unitPrice?: string;
    }
  } & { general?: string }
}

// Define form item interface (local to the component)
interface ExpenseLineItemForm {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onClose,
  expense,
  onSave,
  projects,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: 'other' as Expense['category'],
    date: new Date(),
    status: 'pending',
    projectId: '',
    vendor: '',
    notes: '',
    subcontractorId: '',
    subcontractorName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoadingSubcontractors, setIsLoadingSubcontractors] = useState(false);
  const [newSubcontractor, setNewSubcontractor] = useState<string>('');
  const [showNewSubcontractorField, setShowNewSubcontractorField] = useState(false);

  // Line items state
  const [lineItems, setLineItems] = useState<ExpenseLineItemForm[]>([]);
  const [showLineItems, setShowLineItems] = useState(false);

  const isEditMode = !!expense?.id;

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        ...formData,
        ...expense,
      });

      if (expense.receiptUrl) {
        setReceiptPreview(expense.receiptUrl);
      }

      // If expense has line items, initialize them
      if (expense.lineItems && Array.isArray(expense.lineItems) && expense.lineItems.length > 0) {
        setLineItems(expense.lineItems.map((item: LineItem) => ({
          id: item.id || crypto.randomUUID(),
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitCost || 0,
          totalPrice: item.totalCost || 0,
        } as ExpenseLineItemForm)));
        setShowLineItems(true);
      }
    } else {
      // Reset form data when creating a new expense
      setFormData({
        description: '',
        amount: 0,
        category: 'other' as Expense['category'],
        date: new Date(),
        status: 'pending',
        projectId: '',
        vendor: '',
        notes: '',
        subcontractorId: '',
        subcontractorName: '',
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      setErrors({});
      setLineItems([]);
      setShowLineItems(false);
      setNewSubcontractor('');
      setShowNewSubcontractorField(false);
    }
  }, [expense]);

  // Fetch subcontractors
  useEffect(() => {
    const fetchSubcontractors = async () => {
      if (!user?.uid || !open) return;
      
      try {
        setIsLoadingSubcontractors(true);
        const fetchedSubcontractors = await SubcontractorService.getSubcontractors(user.uid);
        setSubcontractors(fetchedSubcontractors);
      } catch (error) {
        console.error('Error fetching subcontractors:', error);
      } finally {
        setIsLoadingSubcontractors(false);
      }
    };

    fetchSubcontractors();
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    });

    // Clear the error for this field if it exists
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    // Handle subcontractor selection
    if (name === 'subcontractorId') {
      if (value === 'new') {
        setShowNewSubcontractorField(true);
        setFormData({
          ...formData,
          subcontractorId: '',
          subcontractorName: '',
        });
      } else if (value === '') {
        // Clear subcontractor
        setFormData({
          ...formData,
          subcontractorId: '',
          subcontractorName: '',
        });
        setShowNewSubcontractorField(false);
      } else {
        // Set existing subcontractor
        const selectedSubcontractor = subcontractors.find(s => s.id === value);
        setFormData({
          ...formData,
          subcontractorId: value,
          subcontractorName: selectedSubcontractor?.name || '',
        });
        setShowNewSubcontractorField(false);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear the error for this field if it exists
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  // Handle new subcontractor input
  const handleNewSubcontractorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSubcontractor(e.target.value);
    setFormData({
      ...formData,
      subcontractorName: e.target.value,
      subcontractorId: 'new', // Temporary ID to indicate this is a new subcontractor
    });
  };

  // Handle creating new subcontractor
  const handleCreateSubcontractor = async () => {
    if (!user?.uid || !newSubcontractor.trim()) return;
    
    try {
      setIsLoading(true);
      const newSubcontractorData = {
        name: newSubcontractor.trim(),
        specialty: '',
        contact: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const createdSubcontractor = await SubcontractorService.createSubcontractor(
        user.uid, 
        newSubcontractorData as any
      );
      
      // Add to subcontractors list
      setSubcontractors([...subcontractors, createdSubcontractor]);
      
      // Update form data
      setFormData({
        ...formData,
        subcontractorId: createdSubcontractor.id,
        subcontractorName: createdSubcontractor.name,
      });
      
      // Reset new subcontractor UI
      setNewSubcontractor('');
      setShowNewSubcontractorField(false);
      
    } catch (error) {
      console.error('Error creating subcontractor:', error);
      setBackendError('Failed to create subcontractor');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert string dates to Date objects correctly
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setFormData(prev => ({ ...prev, date: newDate }));
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

  // Line item handlers
  const handleAddLineItem = () => {
    const newItem: ExpenseLineItemForm = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setLineItems([...lineItems, newItem]);
    setShowLineItems(true);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    
    // If no more line items, remove any errors for them
    if (lineItems.length <= 1) {
      const { lineItems: _, ...restErrors } = errors;
      setErrors(restErrors);
    }
  };

  const handleLineItemChange = (id: string, field: keyof ExpenseLineItemForm, value: string | number) => {
    setLineItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total price if quantity or unitPrice changed
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          
          return updatedItem;
        }
        return item;
      });
    });

    // Update the formData amount to match total of line items
    setTimeout(() => {
      const totalAmount = calculateTotalFromLineItems();
      setFormData(prev => ({ ...prev, amount: totalAmount }));
    }, 0);
    
    // Clear errors for this line item field
    if (errors.lineItems && errors.lineItems[id] && errors.lineItems[id][field as keyof typeof errors.lineItems[0]]) {
      setErrors(prev => ({
        ...prev,
        lineItems: {
          ...prev.lineItems,
          [id]: {
            ...prev.lineItems?.[id],
            [field]: undefined
          }
        }
      }));
    }
  };

  const calculateTotalFromLineItems = (): number => {
    return lineItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const toggleLineItems = () => {
    setShowLineItems(!showLineItems);
    if (!showLineItems && lineItems.length === 0) {
      handleAddLineItem();
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: FormErrors = {};

    if (!formData.description?.trim()) {
      validationErrors.description = 'Description is required';
    }

    if (!formData.projectId) {
      validationErrors.projectId = 'Project is required';
    }

    if (formData.amount === undefined || formData.amount <= 0) {
      validationErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      validationErrors.date = 'Date is required';
    }

    // Validate subcontractor fields if trying to create a new one
    if (showNewSubcontractorField && !newSubcontractor.trim()) {
      validationErrors.newSubcontractor = 'Subcontractor name is required';
    }

    // Validate line items if they are shown
    if (showLineItems && lineItems.length > 0) {
      validationErrors.lineItems = {} as FormErrors['lineItems'];
      
      lineItems.forEach((item, index) => {
        const itemErrors: { description?: string; quantity?: string; unitPrice?: string } = {};
        let hasItemError = false;
        
        if (!item.description.trim()) {
          itemErrors.description = 'Description is required';
          hasItemError = true;
        }
        
        if (item.quantity <= 0) {
          itemErrors.quantity = 'Quantity must be greater than 0';
          hasItemError = true;
        }
        
        if (item.unitPrice < 0) {
          itemErrors.unitPrice = 'Unit price cannot be negative';
          hasItemError = true;
        }
        
        if (hasItemError) {
          // Ensure lineItems is properly cast to a non-undefined type
          if (!validationErrors.lineItems) {
            validationErrors.lineItems = {} as NonNullable<FormErrors['lineItems']>;
          }
          validationErrors.lineItems[item.id] = itemErrors;
        }
      });
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setBackendError(null);

    try {
      let updatedFormData = { ...formData };
      
      // Calculate final amount from line items if using line items
      if (showLineItems) {
        const totalAmount = calculateTotalFromLineItems();
        updatedFormData.amount = totalAmount;
      }
      
      // Convert line items for saving
      const formattedLineItems = showLineItems ? lineItems.map(item => ({
        id: item.id,
        description: item.description,
        category: formData.category as LineItem['category'],
        quantity: item.quantity,
        unit: 'units',
        unitCost: item.unitPrice,
        totalCost: item.totalPrice,
      })) : [];

      // Cleanup subcontractor data - if "new" was selected but no subcontractor was created
      if (updatedFormData.subcontractorId === 'new') {
        // We either need a real subcontractor ID or we clear it
        if (!newSubcontractor.trim()) {
          updatedFormData.subcontractorId = '';
          updatedFormData.subcontractorName = '';
        }
      }
      
      // Format expense data for saving
      const expenseToSave: Partial<Expense> = {
        ...updatedFormData,
        userId: user?.uid || '',
        lineItems: showLineItems ? formattedLineItems : undefined,
      };

      // If it's a new expense
      if (!isEditMode) {
        expenseToSave.createdAt = new Date();
        expenseToSave.createdBy = user?.uid || '';
      }
      
      // Add updatedAt timestamp
      expenseToSave.updatedAt = new Date();
      
      // Make sure subcontractorName is included when subcontractorId is set
      if (expenseToSave.subcontractorId && !expenseToSave.subcontractorName) {
        // Look up the name from our loaded subcontractors
        const selectedSubcontractor = subcontractors.find(s => s.id === expenseToSave.subcontractorId);
        if (selectedSubcontractor) {
          expenseToSave.subcontractorName = selectedSubcontractor.name;
          console.log('Added missing subcontractorName:', selectedSubcontractor.name);
        }
      }
      
      // Handle receipt upload if there's a file
      if (receiptFile) {
        // Upload logic would go here
        // expenseToSave.receiptUrl = uploadedUrl;
      }
      
      console.log('Saving expense:', expenseToSave);
      
      // Call the onSave callback with the updated expense data
      onSave(expenseToSave);
      
      // Close the modal after saving
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
      setBackendError(`Failed to save expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
      aria-labelledby="expense-form-title"
    >
      <DialogTitle id="expense-form-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {isEditMode ? 'Edit Expense' : 'New Expense'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Project Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.projectId}>
              <InputLabel id="project-label">Project</InputLabel>
              <Select
                labelId="project-label"
                id="projectId"
                name="projectId"
                value={formData.projectId || ''}
                onChange={handleSelectChange}
                startAdornment={
                  <InputAdornment position="start">
                    <ProjectIcon />
                  </InputAdornment>
                }
                label="Project"
              >
                <MenuItem value="" disabled>
                  Select a project
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.projectId && (
                <FormHelperText>{errors.projectId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="description"
              name="description"
              label="Description"
              value={formData.description || ''}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Category and Date */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.category}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                value={formData.category || 'other'}
                onChange={handleSelectChange}
                startAdornment={
                  <InputAdornment position="start">
                    <CategoryIcon />
                  </InputAdornment>
                }
                label="Category"
              >
                <MenuItem value="labor">Labor</MenuItem>
                <MenuItem value="materials">Materials</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="permits">Permits</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
              {errors.category && (
                <FormHelperText>{errors.category}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
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
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Toggle for Line Items */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1">
                {showLineItems ? 'Itemized Expense' : 'Single Amount'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleLineItems}
                startIcon={showLineItems ? <MoneyIcon /> : <TableContainer component="span"><Table /></TableContainer>}
              >
                {showLineItems ? 'Use Simple Amount' : 'Add Line Items'}
              </Button>
            </Box>
          </Grid>

          {/* Amount field (only shown when not using line items) */}
          {!showLineItems && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="amount"
                name="amount"
                label="Amount"
                type="number"
                value={formData.amount || ''}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {/* Line Items (only shown when enabled) */}
          {showLineItems && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Line Items</Typography>
              
              {lineItems.map((item: ExpenseLineItemForm) => (
                <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                        error={!!errors.lineItems?.[item.id]?.description}
                        helperText={errors.lineItems?.[item.id]?.description}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        error={!!errors.lineItems?.[item.id]?.quantity}
                        helperText={errors.lineItems?.[item.id]?.quantity}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        error={!!errors.lineItems?.[item.id]?.unitPrice}
                        helperText={errors.lineItems?.[item.id]?.unitPrice}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          inputProps: { min: 0, step: 0.01 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Total"
                        type="number"
                        value={item.totalPrice}
                        disabled
                        InputProps={{
                          readOnly: true,
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ textAlign: 'right' }}>
                      <IconButton onClick={() => handleRemoveLineItem(item.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleAddLineItem}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Add Line Item
              </Button>
            </Box>
          )}

          {/* Vendor */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="vendor"
              name="vendor"
              label="Vendor / Supplier"
              value={formData.vendor || ''}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VendorIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Subcontractor */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="subcontractor-label">Subcontractor</InputLabel>
              <Select
                labelId="subcontractor-label"
                name="subcontractorId"
                value={formData.subcontractorId || ''}
                onChange={handleSelectChange}
                label="Subcontractor"
                startAdornment={
                  <InputAdornment position="start">
                    <SubcontractorIcon />
                  </InputAdornment>
                }
                disabled={isLoadingSubcontractors}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {isLoadingSubcontractors ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} /> Loading...
                  </MenuItem>
                ) : (
                  subcontractors.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </MenuItem>
                  ))
                )}
                <MenuItem value="new" sx={{ color: 'primary.main' }}>
                  <AddIcon fontSize="small" sx={{ mr: 1 }} /> Add New Subcontractor
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* New Subcontractor Field */}
          {showNewSubcontractorField && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  name="newSubcontractor"
                  label="New Subcontractor Name"
                  value={newSubcontractor}
                  onChange={handleNewSubcontractorChange}
                  fullWidth
                  error={!!errors.newSubcontractor}
                  helperText={errors.newSubcontractor}
                />
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleCreateSubcontractor}
                  disabled={isLoading || !newSubcontractor.trim()}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Add'}
                </Button>
              </Box>
            </Grid>
          )}

          {/* Receipt */}
          <Grid item xs={12}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Attach Receipt (optional)
              </Typography>
              
              {receiptPreview ? (
                <Box 
                  sx={{ 
                    position: 'relative', 
                    mt: 1,
                    mb: 2,
                    display: 'inline-block'
                  }}
                >
                  <Box
                    component="img"
                    src={receiptPreview}
                    alt="Receipt preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 1,
                    }}
                  />
                  <IconButton
                    onClick={handleRemoveReceipt}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <input
                    accept="image/*,application/pdf"
                    id="receipt-file"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt-file">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      size="small"
                    >
                      Upload Receipt
                    </Button>
                  </label>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="notes"
              name="notes"
              label="Notes (optional)"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isEditMode ? 'Update Expense' : 'Save Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseFormModal;