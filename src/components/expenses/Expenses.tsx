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

interface Project {
  id: string;
  name: string;
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
      fetchExpenses();
    }
  }, [user, tabValue]);
  
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
        name: project.name
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
        name: project.name
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
          vendor: expense.vendor || '' // Ensure vendor is always a string
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
    setExpenseModalOpen(true);
  };
  
  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
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
        await ExpenseService.updateExpense(expenseData.id, expenseData);
        
        // Update in local state
        setExpenses(prevExpenses => prevExpenses.map(exp => 
          exp.id === expenseData.id 
            ? {
                ...exp,
                ...expenseData,
                // Make sure we don't lose the project name
                projectName: exp.projectName
              }
            : exp
        ));
        
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
          notes: expenseData.notes
        };
        
        savedExpense = await ExpenseService.createExpense(user.uid, newExpenseData);
        
        // Find project name from projects array
        const projectName = projects.find(p => p.id === savedExpense.projectId)?.name || 'Unknown Project';
        
        // Add to local state right away with project name
        const enhancedExpense = {
          ...savedExpense,
          projectName
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
      setSnackbar({
        open: true,
        message: `Failed to ${expenseData.id ? 'update' : 'create'} expense`,
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
      
      {/* Tabs and search */}
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
        
        <TextField
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ width: { xs: '100%', md: '300px' } }}
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
      </Box>
      
      {/* Expenses list */}
      {loading ? (
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <CircularProgress size={20} />
                      <CircularProgress size={20} />
                    </Box>
                    <Box sx={{ bgcolor: 'grey.100', height: 80, borderRadius: 1 }} />
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <CircularProgress size={20} />
                      <CircularProgress size={20} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {filteredExpenses.map((expense) => (
            <Grid item xs={12} md={6} lg={4} key={expense.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                  },
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {expense.status === 'paid' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      bgcolor: 'success.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 1
                    }}
                  >
                    <PaidIcon />
                  </Box>
                )}
                
                <CardContent onClick={() => handleViewExpense(expense)}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.other}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6" sx={{ mb: 0 }}>
                          {formatCurrency(expense.amount)}
                        </Typography>
                        <Chip 
                          label={expense.status === 'paid' ? 'Paid' : 'Needs Payment'} 
                          size="small"
                          color={expense.status === 'paid' ? 'success' : 'warning'}
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, expense.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography sx={{ mb: 2, fontWeight: 'medium' }}>
                    {expense.description}
                  </Typography>
                  
                  {/* Line items section */}
                  {expense.lineItems && expense.lineItems.length > 0 && (
                    <Box sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Line Items
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1 }}>
                        {expense.lineItems.map((item: LineItem, index: number) => (
                          <Box key={item.id || index} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            py: 0.5,
                            ...(index !== 0 && { borderTop: `1px solid ${theme.palette.divider}`, mt: 0.5 })
                          }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                                {item.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.quantity} x {formatCurrency(item.unitCost || 0)}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(item.totalCost || 0)}
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{formatDate(expense.date)}</Typography>
                    </Box>
                    
                    {expense.vendor && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VendorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{expense.vendor}</Typography>
                      </Box>
                    )}
                    
                    {expense.subcontractorName && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EngineeringIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{expense.subcontractorName}</Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ProjectIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">{expense.projectName}</Typography>
                    </Box>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', borderTop: `1px solid ${theme.palette.divider}`, px: 2 }}>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedExpense(expense);
                      setExpenseModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  
                  {expense.status !== 'paid' && (
                    <Button 
                      size="small" 
                      color="success"
                      startIcon={<PaidIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpense(expense);
                        setPaymentModalOpen(true);
                      }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
        open={expenseModalOpen}
        onClose={handleCloseModal}
        expense={selectedExpense}
        onSave={handleSaveExpense}
        projects={projects}
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