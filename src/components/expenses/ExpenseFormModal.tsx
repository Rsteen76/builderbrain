import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
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
  AccountBalance as BankIcon,
  Payment as PaymentIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Engineering as BuildingPhaseIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SubcontractorSelector from '../common/SubcontractorSelector';

import { Expense, LineItem, Subcontractor } from '../../types';
import { ExpenseService } from '../../services/expense';
import { SubcontractorService } from '../../services/subcontractor';
import { useAuth } from '../../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';

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

const PAYMENT_METHODS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

const BUILDING_PHASES = [
  { value: 'planning', label: 'Planning' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'framing', label: 'Framing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'inspection', label: 'Inspection' },
];

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
    buildingPhase: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [backendError, setBackendError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<ExpenseLineItemForm[]>([]);
  const [showLineItems, setShowLineItems] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [duplicateExpenses, setDuplicateExpenses] = useState<Expense[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

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
        buildingPhase: '',
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      setErrors({});
      setLineItems([]);
      setShowLineItems(false);
    }
  }, [expense]);

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
    
    if (name === 'subcontractorId') {
      // This will be handled by SubcontractorSelector's onChange
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear the error for this field if it exists
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

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
      id: uuidv4(),
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

    // Only validate amount if not using line items
    if (!showLineItems && (formData.amount === undefined || formData.amount <= 0)) {
      validationErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      validationErrors.date = 'Date is required';
    }

    // Validate line items if they are shown
    if (showLineItems && lineItems.length > 0) {
      let hasLineItemErrors = false;
      const lineItemErrors: FormErrors['lineItems'] = {};
      
      lineItems.forEach(item => {
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
          lineItemErrors[item.id] = itemErrors;
          hasLineItemErrors = true;
        }
      });
      
      if (hasLineItemErrors) {
        validationErrors.lineItems = lineItemErrors;
      }
      
      // If using line items, ensure the total is greater than 0
      const totalAmount = calculateTotalFromLineItems();
      if (totalAmount <= 0) {
        if (!validationErrors.lineItems) {
          validationErrors.lineItems = {};
        }
        validationErrors.lineItems.general = 'Total amount must be greater than 0';
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
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

      // Add payment details if status is paid
      if (formData.status === 'paid') {
        updatedFormData.paymentDetails = {
          method: paymentMethod,
          date: paymentDate,
          referenceNumber: referenceNumber || undefined,
          notes: paymentNotes || undefined,
        };
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
      
      // Handle receipt upload if there's a file
      if (receiptFile) {
        // Upload logic would go here
        // expenseToSave.receiptUrl = uploadedUrl;
      }
      
      // Check for duplicates before saving
      const hasDuplicates = await checkForDuplicates();
      
      if (hasDuplicates) {
        // The duplicate warning dialog will be shown, we'll wait for user decision
        setIsLoading(false);
        return;
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

  const handleContinueSaveWithDuplicates = () => {
    setShowDuplicateWarning(false);
    
    if (!user) return;
    
    // Format expense data for saving (repeat the same logic as in handleSave)
    let updatedFormData = { ...formData };
    
    if (showLineItems) {
      updatedFormData.amount = calculateTotalFromLineItems();
    }
    
    const formattedLineItems = showLineItems ? lineItems.map(item => ({
      id: item.id,
      description: item.description,
      category: formData.category as LineItem['category'],
      quantity: item.quantity,
      unit: 'units',
      unitCost: item.unitPrice,
      totalCost: item.totalPrice,
    })) : [];

    if (formData.status === 'paid') {
      updatedFormData.paymentDetails = {
        method: paymentMethod,
        date: paymentDate,
        referenceNumber: referenceNumber || undefined,
        notes: paymentNotes || undefined,
      };
    }

    const expenseToSave: Partial<Expense> = {
      ...updatedFormData,
      userId: user.uid,
      lineItems: showLineItems ? formattedLineItems : undefined,
    };

    if (!isEditMode) {
      expenseToSave.createdAt = new Date();
      expenseToSave.createdBy = user.uid;
    }
    
    expenseToSave.updatedAt = new Date();
    
    // Call the onSave callback with the updated expense data
    onSave(expenseToSave);
    
    // Close the modal after saving
    onClose();
  };

  const handleStatusChange = (e: SelectChangeEvent<Expense['status']>) => {
    const newStatus = e.target.value as Expense['status'];
    setFormData(prev => ({
      ...prev,
      status: newStatus,
    }));
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            maxHeight: '95vh',
            background: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            position: 'relative',
            py: 1.5,
            px: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography 
            variant="h6" 
            fontWeight="600" 
          >
            {isEditMode ? 'Edit Expense' : 'New Expense'}
          </Typography>
          
          <IconButton 
            onClick={onClose} 
            aria-label="close"
            size="small"
            sx={{
              color: 'text.secondary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent 
          sx={{ 
            p: 2.5,
            overflow: 'auto',
          }}
        >
          <Grid container spacing={2}>
            {/* Project + Date Row */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                error={!!errors.projectId}
                variant="outlined"
                size="small"
              >
                <InputLabel id="project-label">Project</InputLabel>
                <Select
                  labelId="project-label"
                  id="projectId"
                  name="projectId"
                  value={formData.projectId || ''}
                  onChange={handleSelectChange}
                  label="Project"
                  displayEmpty
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
                helperText={errors.description || null}
                placeholder="What is this expense for?"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          
            {/* Building Phase + Category Row */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="building-phase-label">Building Phase</InputLabel>
                <Select
                  labelId="building-phase-label"
                  id="buildingPhase"
                  name="buildingPhase"
                  value={formData.buildingPhase || ''}
                  onChange={handleSelectChange}
                  label="Building Phase"
                  startAdornment={
                    <InputAdornment position="start">
                      <BuildingPhaseIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <Typography variant="body2" color="text.secondary">Select a phase (optional)</Typography>
                  </MenuItem>
                  {BUILDING_PHASES.map((phase) => (
                    <MenuItem key={phase.value} value={phase.value}>
                      {phase.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category} variant="outlined" size="small">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formData.category || 'other'}
                  onChange={handleSelectChange}
                  label="Category"
                  startAdornment={
                    <InputAdornment position="start">
                      <CategoryIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  }
                >
                  {[
                    { value: 'labor', icon: '👷', label: 'Labor' },
                    { value: 'materials', icon: '🧰', label: 'Materials' },
                    { value: 'equipment', icon: '🚜', label: 'Equipment' },
                    { value: 'permits', icon: '📄', label: 'Permits' },
                    { value: 'other', icon: '📎', label: 'Other' },
                  ].map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span role="img" aria-label={category.label}>
                          {category.icon}
                        </span>
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText error>{errors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="vendor"
                name="vendor"
                label="Vendor / Supplier"
                value={formData.vendor || ''}
                onChange={handleChange}
                placeholder="Who provided the goods/services?"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VendorIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Divider */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            {/* Amount Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                  Amount Details
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLineItems}
                      onChange={toggleLineItems}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">{showLineItems ? 'Itemized' : 'Simple'}</Typography>}
                  sx={{ m: 0 }}
                />
              </Box>

              {!showLineItems ? (
                <TextField
                  fullWidth
                  id="amount"
                  name="amount"
                  label="Amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  error={!!errors.amount}
                  helperText={errors.amount || null}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon fontSize="small" color="primary" />
                      </InputAdornment>
                    )
                  }}
                />
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleAddLineItem}
                      size="small"
                      sx={{ 
                        textTransform: 'none',
                      }}
                    >
                      Add Item
                    </Button>
                    
                    <Typography variant="subtitle2" fontWeight={600} color="success.main">
                      Total: ${calculateTotalFromLineItems().toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    maxHeight: 220, 
                    overflowY: 'auto',
                  }}>
                    {lineItems.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                        No line items yet. Add some!
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Qty</TableCell>
                              <TableCell align="right">Unit Price</TableCell>
                              <TableCell align="right">Total</TableCell>
                              <TableCell padding="checkbox"></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {lineItems.map((item: ExpenseLineItemForm, index) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <TextField
                                    fullWidth
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                                    error={!!errors.lineItems?.[item.id]?.description}
                                    helperText={errors.lineItems?.[item.id]?.description}
                                    variant="standard"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    error={!!errors.lineItems?.[item.id]?.quantity}
                                    inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                                    variant="standard"
                                    size="small"
                                    sx={{ width: 70 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => handleLineItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    error={!!errors.lineItems?.[item.id]?.unitPrice}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                                    variant="standard"
                                    size="small"
                                    sx={{ width: 90 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  ${item.totalPrice.toFixed(2)}
                                </TableCell>
                                <TableCell padding="checkbox">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveLineItem(item.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </Box>
              )}
            </Grid>
            
            {/* Divider */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            {/* Payment & Receipt Row */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                Payment Details
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 1.5 }} size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleStatusChange}
                  label="Status"
                  startAdornment={
                    <InputAdornment position="start">
                      <PaymentIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="pending">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      Pending
                    </Box>
                  </MenuItem>
                  <MenuItem value="paid">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                      Paid
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {formData.status === 'paid' && (
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="payment-method-label">Method</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        label="Method"
                        startAdornment={
                          <InputAdornment position="start">
                            <BankIcon fontSize="small" color="primary" />
                          </InputAdornment>
                        }
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <MenuItem key={method.value} value={method.value}>
                            {method.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Payment Date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Reference #"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Optional"
                      size="small"
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary" gutterBottom>
                Receipt
              </Typography>
              
              {receiptPreview ? (
                <Box sx={{ position: 'relative', height: 120, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  <IconButton
                    onClick={handleRemoveReceipt}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '6px',
                  p: 2,
                  height: 120,
                  backgroundColor: alpha(theme.palette.primary.main, 0.03),
                }}>
                  <input
                    accept="image/*,application/pdf"
                    id="receipt-file"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt-file" style={{ width: '100%', textAlign: 'center' }}>
                    <Button
                      component="span"
                      startIcon={<UploadIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      Upload Receipt
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Drag & drop or click to browse
                    </Typography>
                  </label>
                </Box>
              )}
            </Grid>
            
            {/* Notes (optional) */}
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
                    onChange={handleChange}
                    placeholder="Enter any additional notes here..."
                    size="small"
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            {/* Error message area */}
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
        </DialogContent>
        
        {/* Footer */}
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              borderRadius: '4px',
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ 
              borderRadius: '4px',
              textTransform: 'none',
            }}
          >
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Warning Dialog */}
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
            onClick={handleContinueSaveWithDuplicates} 
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
    </>
  );
};

export default ExpenseFormModal;