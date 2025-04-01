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
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Expense } from '../../types';
import { ExpenseService } from '../../services/expense';
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

interface FormErrors {
  description?: string;
  amount?: string;
  category?: string;
  date?: string;
  projectId?: string;
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    category: 'other' as Expense['category'],
    date: new Date(),
    status: 'pending',
    projectId: '',
    vendor: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      setErrors({});
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

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      date: date || new Date(),
    });

    // Clear the date error if it exists
    if (errors.date) {
      setErrors({
        ...errors,
        date: undefined,
      });
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      let finalExpense = { ...formData };
      
      // Upload receipt if there's a file
      if (receiptFile && user?.uid) {
        // This would use StorageService in a real implementation
        // const receiptUrl = await StorageService.uploadExpenseReceipt(formData.id || 'new', receiptFile);
        // finalExpense.receiptUrl = receiptUrl;
        
        // Mock implementation
        finalExpense.receiptUrl = URL.createObjectURL(receiptFile);
      }
      
      onSave(finalExpense);
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}
      >
        {isEditMode ? 'Edit Expense' : 'New Expense'}
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.category}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                name="category"
                value={formData.category}
                onChange={handleSelectChange}
                startAdornment={
                  <InputAdornment position="start">
                    <CategoryIcon color="action" />
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
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.date,
                    helperText: errors.date,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.projectId}>
              <InputLabel id="project-label">Project</InputLabel>
              <Select
                labelId="project-label"
                name="projectId"
                value={formData.projectId}
                onChange={handleSelectChange}
                startAdornment={
                  <InputAdornment position="start">
                    <ProjectIcon color="action" />
                  </InputAdornment>
                }
                label="Project"
              >
                {projects.length === 0 ? (
                  <MenuItem disabled value="">
                    No projects available
                  </MenuItem>
                ) : (
                  projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.projectId && <FormHelperText>{errors.projectId}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Vendor"
              name="vendor"
              value={formData.vendor || ''}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VendorIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              Receipt
            </Typography>
            
            {receiptPreview ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Box
                  component="img"
                  src={receiptPreview}
                  alt="Receipt"
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: 'cover',
                    borderRadius: 1,
                    mr: 2,
                  }}
                />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {receiptFile?.name || 'Receipt image'}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveReceipt}
                    sx={{ mt: 1 }}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{ mt: 1 }}
              >
                Upload Receipt
                <input
                  type="file"
                  accept="image/*,.pdf"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button 
          onClick={onClose}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ 
            backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
            }
          }}
        >
          {isEditMode ? 'Save Changes' : 'Create Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseFormModal; 