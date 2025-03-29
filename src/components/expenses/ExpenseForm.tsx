import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Stack,
  Chip,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Types
interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  projectId: string;
  projectName: string;
  submittedBy: string;
  receiptUrl?: string;
}

interface FormErrors {
  title?: string;
  amount?: string;
  category?: string;
  date?: string;
  projectId?: string;
}

// Mock data - replace with API calls later
const mockProjects = [
  { id: '1', name: 'Office Renovation' },
  { id: '2', name: 'New Building Construction' },
  { id: '3', name: 'Parking Lot Expansion' },
];

const categories = [
  'Materials',
  'Labor',
  'Equipment',
  'Subcontractors',
  'Permits',
  'Utilities',
  'Insurance',
  'Other',
];

const ExpenseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [expense, setExpense] = useState<Partial<Expense>>({
    title: '',
    description: '',
    amount: 0,
    category: '',
    date: new Date(),
    status: 'pending',
    projectId: '',
    projectName: '',
    submittedBy: 'John Doe', // Replace with actual user
    receiptUrl: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (id) {
      // Simulate API call to fetch expense details
      setLoading(true);
      setTimeout(() => {
        // Mock expense data
        const mockExpense: Expense = {
          id,
          title: 'Building Materials',
          description: 'Lumber and concrete for foundation',
          amount: 2500.00,
          category: 'Materials',
          date: new Date('2024-03-15'),
          status: 'pending',
          projectId: '1',
          projectName: 'Office Renovation',
          submittedBy: 'John Doe',
          receiptUrl: 'https://example.com/receipt1.pdf',
        };
        setExpense(mockExpense);
        setLoading(false);
      }, 1000);
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!expense.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!expense.amount || expense.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!expense.category) {
      newErrors.category = 'Category is required';
    }
    if (!expense.date) {
      newErrors.date = 'Date is required';
    }
    if (!expense.projectId) {
      newErrors.projectId = 'Project is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically make an API call to save the expense
      console.log('Saving expense:', expense);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/expenses');
      }, 1500);
    } catch (err) {
      setError('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/expenses');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setExpense(prev => ({ ...prev, receiptUrl: '' }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Expense' : 'New Expense'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Expense saved successfully!
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={expense.title}
                      onChange={(e) => setExpense({ ...expense, title: e.target.value })}
                      error={!!errors.title}
                      helperText={errors.title}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={expense.description}
                      onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={expense.amount}
                      onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })}
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

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.category}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={expense.category}
                        label="Category"
                        onChange={(e) => setExpense({ ...expense, category: e.target.value })}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.category && (
                        <Typography variant="caption" color="error">
                          {errors.category}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Date"
                        value={expense.date}
                        onChange={(newValue) => setExpense({ ...expense, date: newValue || new Date() })}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.date,
                            helperText: errors.date,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.projectId}>
                      <InputLabel>Project</InputLabel>
                      <Select
                        value={expense.projectId}
                        label="Project"
                        onChange={(e) => {
                          const project = mockProjects.find(p => p.id === e.target.value);
                          setExpense({
                            ...expense,
                            projectId: e.target.value,
                            projectName: project?.name || '',
                          });
                        }}
                      >
                        {mockProjects.map((project) => (
                          <MenuItem key={project.id} value={project.id}>
                            {project.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.projectId && (
                        <Typography variant="caption" color="error">
                          {errors.projectId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Receipt
                </Typography>
                
                {receiptPreview ? (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <Button
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={handleRemoveReceipt}
                      sx={{ mt: 1 }}
                    >
                      Remove Receipt
                    </Button>
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                    }}
                    component="label"
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload receipt
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      (JPG, PNG, or PDF)
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Expense'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ExpenseForm; 