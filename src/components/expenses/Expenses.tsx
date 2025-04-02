import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  alpha,
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Paid as PaidIcon,
  CalendarToday as CalendarIcon,
  Business as VendorIcon,
  Assignment as ProjectIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  DeleteOutline as DeleteOutlineIcon,
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';
import { ExpenseService } from '../../services/expense';
import { ProjectService } from '../../services/project';
import { Expense, LineItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ExpenseFormModal from './ExpenseFormModal';
import PaymentFormModal from './PaymentFormModal';

// Category icons mapping
const CATEGORY_ICONS = {
  labor: <Avatar sx={{ bgcolor: '#E1F5FE', color: '#0288D1' }}><BusinessIcon /></Avatar>,
  materials: <Avatar sx={{ bgcolor: '#E8F5E9', color: '#388E3C' }}><CategoryIcon /></Avatar>,
  equipment: <Avatar sx={{ bgcolor: '#FFF8E1', color: '#FFA000' }}><CategoryIcon /></Avatar>,
  permits: <Avatar sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2' }}><ReceiptIcon /></Avatar>,
  other: <Avatar sx={{ bgcolor: '#ECEFF1', color: '#607D8B' }}><DescriptionIcon /></Avatar>,
};

// Define ProjectPhase locally or import if defined elsewhere
interface ProjectPhase {
  id: string;  // Changed from string | undefined to string
  name: string;
  // Add other relevant phase properties if needed
}

interface Project {
  id: string;
  name: string;
  phases?: ProjectPhase[]; // Add phases here
}

const Expenses: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProjectPhases, setSelectedProjectPhases] = useState<ProjectPhase[]>([]); // New state for phases
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // NEW: Grouping functionality
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'category' | 'vendor' | 'subcontractor'>('none');
  
  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
      fetchExpenses();
    }
  }, [user, tabValue, submitting]);
  
  // Calculate summary data based on expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const needsPaymentExpenses = expenses.filter(e => e.status !== 'paid').reduce((sum, e) => sum + e.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
 
  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expenseId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedExpenseId(expenseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpenseId(null);
  };

  const handleEditFromMenu = () => {
    if (selectedExpenseId) {
      const expenseToEdit = expenses.find(exp => exp.id === selectedExpenseId);
      if (expenseToEdit) {
        setSelectedExpense(expenseToEdit);
        // Find the project and its phases
        const project = projects.find(p => p.id === expenseToEdit.projectId);
        setSelectedProjectPhases(project?.phases || []); // Set phases for the modal
        setExpenseModalOpen(true);
      }
    }
    handleMenuClose();
  };

  const handlePayFromMenu = () => {
    if (selectedExpenseId) {
      const expenseToEdit = expenses.find(exp => exp.id === selectedExpenseId);
      if (expenseToEdit) {
        setSelectedExpense(expenseToEdit);
        setPaymentModalOpen(true);
      }
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedExpenseId && user?.uid) {
      setLoading(true);
      ExpenseService.deleteExpense(selectedExpenseId)
        .then(() => {
          setExpenses(expenses.filter(exp => exp.id !== selectedExpenseId));
          // Show success message if needed
          setSnackbar({
            open: true,
            message: 'Expense deleted successfully',
            severity: 'success'
          });
        })
        .catch((err: any) => {
          console.error('Error deleting expense:', err);
          setError('Failed to delete expense. Please try again.');
          setSnackbar({
            open: true,
            message: 'Failed to delete expense',
            severity: 'error'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
    handleMenuClose();
  };
  
  const fetchProjects = async () => {
    if (!user?.uid) return;
    
    try {
      const fetchedProjects = await ProjectService.getProjects(user.uid);
      setProjects(fetchedProjects.map(project => ({
        id: project.id,
        name: project.name,
        phases: (project.phases || []).map(phase => ({
          id: phase.id || '', // Ensure id is always a string
          name: phase.name
        }))
      })));
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };
  
  const fetchExpenses = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build filters based on tab and explicit filters
      const filters: any = {};
      
      // Tab filters - simplified to just paid or needs payment
      if (tabValue === 1) {
        // Needs Payment tab shows all non-paid expenses
        filters.status = ['pending', 'approved']; // Using array to match multiple statuses
      } else if (tabValue === 2) {
        // Paid tab
        filters.status = 'paid';
      }
      
      // Detailed filters (if set)
      if (categoryFilter) filters.category = categoryFilter;
      if (projectFilter) filters.projectId = projectFilter;
      
      // First get projects to ensure we have them for the expense lookup
      const fetchedProjects = await ProjectService.getProjects(user.uid);
      setProjects(fetchedProjects.map(project => ({
        id: project.id,
        name: project.name,
        phases: (project.phases || []).map(phase => ({
          id: phase.id || '', // Ensure id is always a string
          name: phase.name
        }))
      })));
      
      // Project ID to name lookup map for faster lookups
      const projectMap = fetchedProjects.reduce((map, project) => {
        map[project.id] = project.name;
        return map;
      }, {} as Record<string, string>);
      
      // Then get expenses
      const fetchedExpenses = await ExpenseService.getExpenses(user.uid, filters);
      
      // Add projectName to each expense
      const enhancedExpenses = fetchedExpenses.map((expense: Expense) => {
        // Look up project name from our map
        const projectName = projectMap[expense.projectId] || 'Unknown Project';
        
        return {
          ...expense,
          projectName,
          vendor: expense.vendor || '', // Ensure vendor is always a string
        };
      });
      
      console.log('Enhanced expenses with project names:', enhancedExpenses);
      setExpenses(enhancedExpenses);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleAddExpense = () => {
    setSelectedExpense(null); // Ensure we're creating a new expense
    setSelectedProjectPhases([]); // Reset phases for a new expense (or set based on default/context)
    setExpenseModalOpen(true);
  };
  
  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    // Find the project and its phases
    const project = projects.find(p => p.id === expense.projectId);
    setSelectedProjectPhases(project?.phases || []); // Set phases for the modal
    setExpenseModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setExpenseModalOpen(false);
    setSelectedExpense(null);
  };
  
  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
  };
  
  const handleMarkAsPaid = async (expenseId: string) => {
    if (!user?.uid) return;
    
    setSubmitting(true);
    
    try {
      // Update status to paid
      await ExpenseService.markAsPaid(expenseId);
      
      // Update local state
      setExpenses(prev => prev.map(e => 
        e.id === expenseId 
          ? { ...e, status: 'paid' } 
          : e
      ));
      
      setSnackbar({
        open: true,
        message: 'Expense marked as paid',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error marking expense as paid:', err);
      setSnackbar({
        open: true,
        message: 'Failed to mark expense as paid',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Create a properly typed expense object
  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    if (!user?.uid) return;
    
    setSubmitting(true);
    let savedExpense: Expense;
    
    try {
      if (expenseData.id) {
        // Update existing expense
        console.log('Before update - expense data:', expenseData);
        console.log('Before update - existing expense:', expenses.find(e => e.id === expenseData.id));
        
        await ExpenseService.updateExpense(expenseData.id, expenseData);
        
        // Update in local state
        setExpenses(prevExpenses => {
          const updatedExpenses = prevExpenses.map(exp => {
            if (exp.id === expenseData.id) {
              // Find the updated project name if the project has changed
              let updatedProjectName = exp.projectName;
              if (expenseData.projectId && expenseData.projectId !== exp.projectId) {
                // Project changed, get the new project name
                const newProject = projects.find(p => p.id === expenseData.projectId);
                if (newProject) {
                  updatedProjectName = newProject.name;
                }
              }
              
              // Create a complete updated expense object
              const updatedExp = {
                ...exp,              // Keep all original fields
                ...expenseData,      // Apply all updates
                projectName: updatedProjectName, // Use correct project name
              };
              
              // Ensure subcontractorName is preserved if it exists in the form data
              // This handles the case where a subcontractor was added or changed
              if (expenseData.subcontractorId && !expenseData.subcontractorName) {
                console.log('Found subcontractorId but no name, trying to look it up:', expenseData.subcontractorId);
                
                // If we have the ID but not the name, try to find it
                // The subcontractorName might be missing if only the ID was sent from the form
                // This can happen especially when selecting from a dropdown
                
                // First check if the expense being updated already has the same subcontractor
                if (exp.subcontractorId === expenseData.subcontractorId && exp.subcontractorName) {
                  updatedExp.subcontractorName = exp.subcontractorName;
                }
                // Otherwise, we need to fetch the subcontractor on the next render
                // For now, set a placeholder
                else {
                  updatedExp.subcontractorName = 'Loading...';
                  
                  // This will trigger a re-fetch of expenses which should include the correct name
                  setTimeout(() => {
                    setSubmitting(prev => !prev); // Toggle submitting to trigger a refresh
                  }, 500);
                }
              }
              
              console.log('After update - updated expense:', updatedExp);
              return updatedExp;
            }
            return exp;
          });
          
          console.log('After update - all expenses:', updatedExpenses);
          return updatedExpenses;
        });
        
        console.log('Updated expense in local state', expenseData.id);
        savedExpense = { ...expenseData } as Expense;
      } else {
        // Create new expense with required fields
        const newExpenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
          projectId: expenseData.projectId || '',
          category: expenseData.category || 'other',
          description: expenseData.description || '',
          amount: expenseData.amount || 0,
          date: expenseData.date || new Date(),
          status: expenseData.status || 'pending',
          vendor: expenseData.vendor || null,
          subcontractorId: expenseData.subcontractorId || null,
          subcontractorName: expenseData.subcontractorName || null,
          notes: expenseData.notes,
          phaseId: expenseData.phaseId || undefined,
          phaseName: expenseData.phaseName || undefined,
          tags: expenseData.tags || [],
          lineItems: expenseData.lineItems || undefined,
          paymentDetails: expenseData.paymentDetails || undefined,
        };
        
        savedExpense = await ExpenseService.createExpense(user.uid, newExpenseData);
        
        // Find project name from projects array
        const projectName = projects.find(p => p.id === savedExpense.projectId)?.name || 'Unknown Project';
        
        // Add to local state right away with project name
        const enhancedExpense = {
          ...savedExpense,
          projectName,
        };
        
        console.log('Adding new expense to local state:', enhancedExpense);
        
        // Check if the expense should be visible in the current tab view
        const shouldShowInCurrentTab = 
          tabValue === 0 || // All expenses tab
          (tabValue === 1 && savedExpense.status !== 'paid') || // Needs payment tab
          (tabValue === 2 && savedExpense.status === 'paid'); // Paid tab
        
        if (shouldShowInCurrentTab) {
          setExpenses(prevExpenses => [enhancedExpense, ...prevExpenses]);
        } else {
          // If the expense doesn't match the current tab filter, show a note to the user
          console.log('New expense added but not visible in current tab view');
          setSnackbar({
            open: true,
            message: 'Expense created successfully. Switch tabs to view it.',
            severity: 'info'
          });
          // Still update the expenses array for when the user switches tabs
          setExpenses(prevExpenses => [enhancedExpense, ...prevExpenses]);
        }
      }
      
      // Close modal
      handleCloseModal();
      
      // Show success message (only if we didn't already show the tab-specific message)
      if (!(expenseData.id === undefined && tabValue !== 0 && 
           ((tabValue === 1 && expenseData.status === 'paid') || 
            (tabValue === 2 && expenseData.status !== 'paid')))) {
        setSnackbar({
          open: true,
          message: `Expense ${expenseData.id ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error saving expense:', err);
      
      // Extract more meaningful error messages for Firebase errors
      let errorMessage = `Failed to ${expenseData.id ? 'update' : 'create'} expense`;
      
      if (err instanceof Error) {
        // Add more specific error details if available
        if (err.message.includes('invalid data')) {
          errorMessage += ': Invalid data format';
        } else if (err.message.includes('permission-denied')) {
          errorMessage += ': Permission denied';
        } else if (err.message) {
          errorMessage += `: ${err.message}`;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => {
    if (!searchTerm) return true;
    
    return (
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.subcontractorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group expenses based on selected grouping
  const groupedExpenses = React.useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Expenses': filteredExpenses };
    }
    
    const groups: Record<string, any[]> = {};
    
    filteredExpenses.forEach(expense => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'project':
          groupKey = expense.projectName || 'No Project';
          break;
        case 'category':
          groupKey = expense.category ? 
            expense.category.charAt(0).toUpperCase() + expense.category.slice(1) : 
            'Other';
          break;
        case 'vendor':
          groupKey = expense.vendor || 'No Vendor';
          break;
        case 'subcontractor':
          groupKey = expense.subcontractorName || 'No Subcontractor';
          break;
        default:
          groupKey = 'All Expenses';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(expense);
    });
    
    return groups;
  }, [filteredExpenses, groupBy, expenses]);

  // Calculate group totals
  const groupTotals = React.useMemo(() => {
    const totals: Record<string, number> = {};
    
    Object.entries(groupedExpenses).forEach(([groupName, groupExpenses]) => {
      totals[groupName] = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    });
    
    return totals;
  }, [groupedExpenses, expenses]);

  const renderExpenseRow = (expense: Expense) => {
    return (
      <TableRow 
        key={expense.id}
        hover
        onClick={() => handleViewExpense(expense)}
        sx={{ 
          cursor: 'pointer',
          '&:last-child td, &:last-child th': { border: 0 },
          ...(expense.status === 'paid' && { 
            bgcolor: alpha(theme.palette.success.light, 0.1),
          })
        }}
      >
        <TableCell component="th" scope="row">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other}
            <Typography sx={{ ml: 1.5, fontWeight: 'medium' }}>
              {expense.description}
            </Typography>
            
            {/* Display tags if they exist */}
            {expense.tags && expense.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {expense.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      '& .MuiChip-label': {
                        px: 1,
                      }
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
          {expense.lineItems && expense.lineItems.length > 0 && (
            <Chip 
              size="small" 
              label={`${expense.lineItems.length} item${expense.lineItems.length > 1 ? 's' : ''}`} 
              color="primary" 
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          )}
        </TableCell>
        <TableCell align="right">
          <Typography fontWeight="medium">
            {formatCurrency(expense.amount)}
          </Typography>
        </TableCell>
        <TableCell>{formatDate(expense.date)}</TableCell>
        <TableCell>
          <Chip 
            label={expense.status === 'paid' ? 'Paid' : 'Needs Payment'} 
            size="small"
            color={expense.status === 'paid' ? 'success' : 'warning'}
          />
        </TableCell>
        {groupBy !== 'project' && <TableCell>{expense.projectName}</TableCell>}
        {groupBy !== 'category' && (
          <TableCell>
            {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
          </TableCell>
        )}
        {groupBy !== 'vendor' && <TableCell>{expense.vendor || '-'}</TableCell>}
        {groupBy !== 'subcontractor' && <TableCell>{expense.subcontractorName || '-'}</TableCell>}
        <TableCell align="center">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExpense(expense);
                setExpenseModalOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            
            {expense.status !== 'paid' && (
              <IconButton
                size="small"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExpense(expense);
                  setPaymentModalOpen(true);
                }}
              >
                <PaidIcon fontSize="small" />
              </IconButton>
            )}
            
            <IconButton
              size="small"
              color="default"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, expense.id || '');
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Expenses & Payments
        </Typography>
        
        <Button
          variant="contained"
          size="medium"
          startIcon={<AddIcon />}
          onClick={handleAddExpense}
          sx={{ 
            backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
            }
          }}
        >
          Add Expense
        </Button>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Total Expenses</Typography>
              <MoneyIcon />
            </Box>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Typography variant="h4" fontWeight="bold">{formatCurrency(totalExpenses)}</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Needs Payment</Typography>
              <AccountBalanceIcon />
            </Box>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Typography variant="h4" fontWeight="bold">{formatCurrency(needsPaymentExpenses)}</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">Paid</Typography>
              <PaidIcon />
            </Box>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Typography variant="h4" fontWeight="bold">{formatCurrency(paidExpenses)}</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Tabs, search, and group controls */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
        <Box sx={{ flexGrow: 1 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            aria-label="expense tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Expenses" />
            <Tab label="Needs Payment" />
            <Tab label="Paid" />
          </Tabs>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, width: { xs: '100%', md: 'auto' } }}>
          <TextField
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '150px' } }}>
            <InputLabel id="group-by-label">Group By</InputLabel>
            <Select
              labelId="group-by-label"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              label="Group By"
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="none">No Grouping</MenuItem>
              <MenuItem value="project">Project</MenuItem>
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
              <MenuItem value="subcontractor">Subcontractor</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Expenses table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredExpenses.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', mt: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No expenses found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search' : 'Click "Add Expense" to create your first expense'}
          </Typography>
        </Box>
      ) : (
        <>
          {Object.entries(groupedExpenses).map(([groupName, groupItems]) => (
            <Box key={groupName} sx={{ mb: 4 }}>
              {/* Group header - only shown when grouping is enabled */}
              {groupBy !== 'none' && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h6" color="text.primary">
                    {groupName}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {formatCurrency(groupTotals[groupName])}
                  </Typography>
                </Box>
              )}
              
              {/* Table */}
              <TableContainer 
                component={Paper} 
                sx={{ 
                  boxShadow: 3,
                  ...(groupBy !== 'none' && {
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                  })
                }}
              >
                <Table aria-label="expenses table">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      {groupBy !== 'project' && <TableCell>Project</TableCell>}
                      {groupBy !== 'category' && <TableCell>Category</TableCell>}
                      {groupBy !== 'vendor' && <TableCell>Vendor</TableCell>}
                      {groupBy !== 'subcontractor' && <TableCell>Subcontractor</TableCell>}
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupItems.map((expense) => renderExpenseRow(expense))}
                    
                    {/* Group total row */}
                    {groupBy !== 'none' && (
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
                        <TableCell component="th" scope="row">
                          <Typography variant="subtitle2">Group Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">
                            {formatCurrency(groupTotals[groupName])}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={7} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Expense
        </MenuItem>
        
        {selectedExpenseId && expenses.find(e => e.id === selectedExpenseId)?.status !== 'paid' && (
          <MenuItem onClick={handlePayFromMenu}>
            <PaidIcon fontSize="small" sx={{ mr: 1 }} />
            Mark as Paid
          </MenuItem>
        )}
        
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Expense Form Modal */}
      <ExpenseFormModal
        key={`expense-form-${selectedExpense?.id || 'new'}-${selectedExpense?.updatedAt || Date.now()}`}
        open={expenseModalOpen}
        onClose={handleCloseModal}
        expense={selectedExpense}
        onSave={handleSaveExpense}
        projects={projects}
        projectPhases={selectedProjectPhases}
      />
      
      {/* Payment Modal */}
      <PaymentFormModal
        open={paymentModalOpen}
        onClose={handleClosePaymentModal}
        expense={selectedExpense}
        onSave={() => {
          if (selectedExpense?.id) {
            handleMarkAsPaid(selectedExpense.id);
          }
        }}
      />
      
      {/* Add Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Expenses;