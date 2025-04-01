import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  Skeleton,
  Tooltip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  ShowChart as ShowChartIcon,
  Description as DescriptionIcon,
  FileDownload as FileDownloadIcon,
  Category as CategoryIcon,
  ListAlt as ListAltIcon,
  Paid as PaidIcon,
  PendingActions as PendingIcon,
  ThumbUpAlt as ApprovedIcon,
  Cancel as RejectedIcon,
  EventNote as DateRangeIcon,
  Business as VendorIcon,
  Assignment as ProjectIcon,
  Person as PersonIcon,
  Construction as ConstructionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ExpenseService } from '../../services/expense';
import { ProjectService } from '../../services/project';
import { Expense } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ExpenseFormModal from './ExpenseFormModal';

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  paid: '#2196f3',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  materials: <ConstructionIcon fontSize="small" />,
  equipment: <CategoryIcon fontSize="small" />,
  labor: <PersonIcon fontSize="small" />,
  permits: <ListAltIcon fontSize="small" />,
  other: <DescriptionIcon fontSize="small" />,
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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.uid) {
      fetchProjects();
      fetchExpenses();
    }
  }, [user, tabValue]);
  
  // Calculate summary data based on expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const approvedExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
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
        setModalOpen(true);
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
        })
        .catch(err => {
          console.error('Error deleting expense:', err);
          setError('Failed to delete expense. Please try again.');
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
      
      // Tab filters (high-level status groupings)
      if (tabValue === 1) filters.status = 'pending';
      else if (tabValue === 2) filters.status = 'approved';
      else if (tabValue === 3) filters.status = 'rejected';
      else if (tabValue === 4) filters.status = 'paid';
      
      // Detailed filters (if set)
      if (categoryFilter) filters.category = categoryFilter;
      if (statusFilter && tabValue === 0) filters.status = statusFilter;
      if (projectFilter) filters.projectId = projectFilter;
      if (dateRange.start) filters.startDate = dateRange.start;
      if (dateRange.end) filters.endDate = dateRange.end;
      
      const fetchedExpenses = await ExpenseService.getExpenses(user.uid, filters);
      
      // Add projectName to each expense
      const enhancedExpenses = fetchedExpenses.map(expense => ({
        ...expense,
        projectName: projects.find(p => p.id === expense.projectId)?.name || 'Unknown Project',
        vendor: expense.vendor || '' // Ensure vendor is always a string
      }));
      
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
    setSelectedExpense(null);  // Ensure we're creating a new expense
    setModalOpen(true);
  };
  
  const handleViewExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setSelectedExpense(expense);
      setModalOpen(true);
    }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedExpense(null);
  };
  
  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    if (!user?.uid) return;
    
    try {
      let savedExpense: Partial<Expense> & { id: string; projectId: string };
      
      if (expenseData.id) {
        // Update existing expense
        await ExpenseService.updateExpense(expenseData.id, expenseData);
        
        // Update local state
        setExpenses(prev => prev.map(e => 
          e.id === expenseData.id ? { ...e, ...expenseData } : e
        ));
        
        savedExpense = { ...expenseData } as Partial<Expense> & { id: string; projectId: string };
      } else {
        // Create new expense
        savedExpense = await ExpenseService.createExpense(user.uid, expenseData as any);
        
        // Add to local state with project name
        const projectName = projects.find(p => p.id === savedExpense.projectId)?.name || 'Unknown Project';
        setExpenses(prev => [...prev, { ...savedExpense, projectName }]);
      }
      
      // Success notification could be added here
    } catch (error) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense. Please try again.');
    }
  };
  
  // Filter expenses based on search term and other filters
  const filterExpenses = () => {
    if (!searchTerm) return expenses;
    
    return expenses.filter(expense => 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  const displayExpenses = filterExpenses();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Expenses
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
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            borderRadius: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="medium">
                  Total Expenses
                </Typography>
                <MoneyIcon color="primary" />
              </Box>
              
              {loading ? (
                <Skeleton variant="rectangular" width={100} height={40} />
              ) : (
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalExpenses)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            borderRadius: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="medium">
                  Pending Approval
                </Typography>
                <PendingIcon sx={{ color: STATUS_COLORS.pending }} />
              </Box>
              
              {loading ? (
                <Skeleton variant="rectangular" width={100} height={40} />
              ) : (
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(pendingExpenses)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            borderRadius: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="medium">
                  Approved
                </Typography>
                <ApprovedIcon sx={{ color: STATUS_COLORS.approved }} />
              </Box>
              
              {loading ? (
                <Skeleton variant="rectangular" width={100} height={40} />
              ) : (
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(approvedExpenses)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            borderRadius: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': { 
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="medium">
                  Paid
                </Typography>
                <PaidIcon sx={{ color: STATUS_COLORS.paid }} />
              </Box>
              
              {loading ? (
                <Skeleton variant="rectangular" width={100} height={40} />
              ) : (
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(paidExpenses)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs and search */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ px: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            aria-label="expense tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" />
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
            <Tab label="Paid" />
          </Tabs>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <RejectedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2 }
            }}
          />
        </Box>
      </Paper>
      
      {/* Expenses list */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ mb: 2, p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" height={30} />
                    <Skeleton variant="text" width="40%" height={20} />
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={30} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="text" width="30%" height={20} />
                  <Skeleton variant="text" width="20%" height={20} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : displayExpenses.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No expenses found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try adjusting your search or filters' : 'Click "Add Expense" to create your first expense'}
            </Typography>
          </Box>
        ) : (
          <Box>
            {displayExpenses.map((expense) => (
              <Box
                key={expense.id}
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => handleViewExpense(expense.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: `${STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS]}20`,
                      color: STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS],
                      p: 1,
                      borderRadius: '50%',
                      mr: 2,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {expense.status === 'pending' && <PendingIcon />}
                    {expense.status === 'approved' && <ApprovedIcon />}
                    {expense.status === 'rejected' && <RejectedIcon />}
                    {expense.status === 'paid' && <PaidIcon />}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 'medium' }}>
                        {expense.description}
                      </Typography>
                      <Chip
                        size="small"
                        label={expense.status.toUpperCase()}
                        sx={{
                          height: 20, 
                          fontSize: '0.7rem',
                          backgroundColor: `${STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS]}20`,
                          color: STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS],
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'text.secondary' }}>
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <DateRangeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        {formatDate(expense.date)}
                      </Box>
                      
                      {expense.vendor && (
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <VendorIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                          {expense.vendor}
                        </Box>
                      )}
                      
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        <ProjectIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                        {expense.projectName}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'medium', 
                    color: 'text.primary', 
                    mr: 1, 
                    whiteSpace: 'nowrap' 
                  }}
                >
                  {formatCurrency(expense.amount)}
                </Typography>
                
                <IconButton size="small" onClick={(e) => handleMenuOpen(e, expense.id)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Expense Form Modal */}
      <ExpenseFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        expense={selectedExpense}
        onSave={handleSaveExpense}
        projects={projects}
      />
    </Box>
  );
};

export default Expenses; 