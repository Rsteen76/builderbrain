import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Divider,
  Stack,
  useTheme,
  alpha,
  Card,
  CardContent,
  Tooltip,
  Alert,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputLabel,
  FormControl,
  Select,
  SelectChangeEvent,
  TextField,
  InputAdornment,
  Snackbar,
  Slider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AccessTime as TimelineIcon,
  AttachMoney as ExpensesIcon,
  Assignment as TasksIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Engineering as EngineeringIcon,
  FileDownload as DownloadIcon,
  Share as ShareIcon,
  Description as DocumentIcon,
  BarChart as ChartIcon,
  Numbers as BudgetIcon,
  LocationOn as LocationIcon,
  Gavel as BidsIcon,
  Update as UpdateIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarTodayIcon,
  Storefront as StorefrontIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService } from '../services/project';
import { ExpenseService } from '../services/expense';
import { BidService } from '../services/bid';
import { SubcontractorService } from '../services/subcontractor';
import { formatCurrency, formatDate } from '../utils/formatters';
import PageLayout from '../components/layout/PageLayout';
import ProjectTaskManager from '../components/projects/ProjectTaskManager';
import { Project, Task, Phase, Expense, Bid, Subcontractor } from '../types';

// Import recharts components
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

// Type definitions for phases and progress tracking
interface ProjectPhase extends Phase {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  budget: number;
  actualCost: number;
  tasks: Task[];
}

// Enhanced status indicators
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'planning': '#3f51b5',       // Indigo
    'in_progress': '#ff9800',    // Orange
    'completed': '#4caf50',      // Green
    'on_hold': '#f44336',        // Red
    'not_started': '#9e9e9e',    // Grey
    'delayed': '#d32f2f',        // Dark Red
  };
  
  return statusColors[status.toLowerCase()] || '#9e9e9e';
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return <CheckCircleIcon fontSize="small" />;
    case 'in_progress': return <TimelineIcon fontSize="small" />;
    case 'planning': return <ScheduleIcon fontSize="small" />;
    case 'on_hold': return <FlagIcon fontSize="small" />;
    case 'delayed': return <FlagIcon fontSize="small" color="error" />;
    default: return <ScheduleIcon fontSize="small" />;
  }
};

// Add the interface for QuickBid if not already defined
interface QuickBid {
  phaseId: string;
  contractorName: string;
  amount: number;
  description: string;
}

// Add interface for quick expense creation
interface QuickExpense {
  phaseId: string;
  category: 'materials' | 'labor' | 'equipment' | 'permits' | 'other';
  amount: number;
  description: string;
  date: string;
  subcontractorId?: string;
  subcontractorName?: string;
  vendor?: string;
}

// Project detail page with phases, progress tracking, and expense breakdowns
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Auth context for user information
  const { user } = useAuth();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [phasesBeingUpdated, setPhasesBeingUpdated] = useState<{ [id: string]: ProjectPhase }>({});
  const [bids, setBids] = useState<Bid[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesData, setExpensesData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [quickUpdateMode, setQuickUpdateMode] = useState(false);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  
  // State for quick bid and expense dialogs
  const [newBidDialogOpen, setNewBidDialogOpen] = useState(false);
  const [newExpenseDialogOpen, setNewExpenseDialogOpen] = useState(false);
  const [currentPhaseForBid, setCurrentPhaseForBid] = useState<string | null>(null);
  const [quickBid, setQuickBid] = useState<QuickBid>({
    phaseId: '',
    contractorName: '',
    amount: 0,
    description: '',
  });
  const [quickExpense, setQuickExpense] = useState<QuickExpense>({
    phaseId: '',
    category: 'other',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Function to fetch expenses
  const fetchExpenses = async (projectId: string) => {
    if (!user?.uid) return;
    
    try {
      const expenseData = await ExpenseService.getProjectExpenses(user.uid, projectId);
      setExpenses(expenseData);
      
      // Process expense data for charts - group by category
      const expensesByCategory = expenseData.reduce((acc, expense) => {
        const category = expense.category;
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Convert to chart format
      const chartData = Object.entries(expensesByCategory).map(([name, value], index) => {
        // Define a set of colors for categories
        const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#795548'];
        return {
          name,
          value,
          color: colors[index % colors.length]
        };
      });
      
      setExpensesData(chartData);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };
  
  // Function to fetch subcontractors
  const fetchSubcontractors = async (userId: string) => {
    try {
      const data = await SubcontractorService.getSubcontractors(userId);
      setSubcontractors(data);
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
    }
  };
  
  // Function to fetch phases
  const fetchPhases = async (projectId: string) => {
    if (!user?.uid) return;
    
    try {
      // Fetch the project to get phases from it
      const projectData = await ProjectService.getProject(projectId, user.uid);
      if (projectData && projectData.phases && projectData.phases.length > 0) {
        setPhases(projectData.phases as ProjectPhase[]);
        
        // Also initialize the phases being updated if in quick update mode
        if (quickUpdateMode) {
          const phasesMap: { [id: string]: ProjectPhase } = {};
          projectData.phases.forEach((phase) => {
            if (phase.id) {
              phasesMap[phase.id] = phase as ProjectPhase;
            }
          });
          setPhasesBeingUpdated(phasesMap);
        }
      } else {
        setPhases([]);
      }
    } catch (err) {
      console.error('Error fetching phases:', err);
    }
  };
  
  // Function to fetch bids
  const fetchBids = async (projectId: string) => {
    if (!user?.uid) return;
    
    try {
      const bidFilters = { projectId };
      const bidData = await BidService.getBids(user.uid, bidFilters);
      setBids(bidData);
    } catch (err) {
      console.error('Error fetching bids:', err);
    }
  };
  
  // Fetch project data
  useEffect(() => {
    // Fetch project and related data when projectId changes
    const fetchProject = async () => {
      if (!projectId || !user?.uid) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const projectData = await ProjectService.getProject(projectId, user.uid);
        if (!projectData) {
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        setProject(projectData);
        
        // Fetch project phases
        await fetchPhases(projectId);
        
        // Fetch project bids
        await fetchBids(projectId);
        
        // Fetch project expenses
        await fetchExpenses(projectId);
        
        // Fetch subcontractors
        if (user?.uid) {
          await fetchSubcontractors(user.uid);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, user?.uid]);
  
  // Add a useEffect to ensure data is refreshed when tabs change or when entering/exiting quick update mode
  useEffect(() => {
    if (project?.id && user?.uid) {
      fetchExpenses(project.id);
      fetchPhases(project.id);
      fetchBids(project.id);
    }
  }, [tabValue, quickUpdateMode, project?.id, user?.uid]);
  
  // Add a function to refresh all project data
  const refreshAllProjectData = useCallback(async () => {
    if (!project?.id || !user?.uid) return;
    
    setLoading(true);
    
    try {
      await Promise.all([
        fetchPhases(project.id),
        fetchExpenses(project.id),
        fetchBids(project.id),
        fetchSubcontractors(user.uid)
      ]);
    } catch (error) {
      console.error('Error refreshing project data:', error);
    } finally {
      setLoading(false);
    }
  }, [project?.id, user?.uid]);
  
  // Refresh data when component is mounted/re-mounted
  useEffect(() => {
    if (project?.id && user?.uid) {
      refreshAllProjectData();
    }
  }, [refreshAllProjectData]);
  
  // Update handleTabChange to refresh data when switching to expenses tab
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Tab index 3 is Expenses, so we'll ensure data is up-to-date
    if (newValue === 3 && project?.id) {
      fetchExpenses(project.id);
    }
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleEdit = () => {
    if (projectId) navigate(`/projects/${projectId}/edit`);
    handleMenuClose();
  };
  
  const handleDelete = async () => {
    if (!projectId || !window.confirm('Are you sure you want to delete this project?')) {
      handleMenuClose();
      return;
    }
    
    try {
      await ProjectService.deleteProject(projectId);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
    
    handleMenuClose();
  };
  
  const handleAddPhase = () => {
    // Navigate to phase creation or open modal
    handleMenuClose();
  };
  
  const handleUpdatePhase = (phaseId: string) => {
    // Navigate to phase edit or open modal
    console.log(`Edit phase: ${phaseId}`);
  };
  
  const handleDeletePhase = (phaseId: string) => {
    // Delete phase
    if (window.confirm('Are you sure you want to delete this phase?')) {
      setPhases(phases.filter(p => p.id !== phaseId));
    }
  };

  const handleAddBid = () => {
    // Navigate to bid creation or open modal
    handleMenuClose();
  };
  
  const handleEditBid = (bidId: string) => {
    // Navigate to bid edit or open modal
    console.log(`Edit bid: ${bidId}`);
  };
  
  const handleDeleteBid = (bidId: string) => {
    // Delete bid
    if (window.confirm('Are you sure you want to delete this bid?')) {
      setBids(bids.filter(b => b.id !== bidId));
    }
  };

  // Cancel quick updates
  const handleCancelQuickUpdates = () => {
    setQuickUpdateMode(false);
    setPhasesBeingUpdated({});
    
    // Force refresh data when exiting quick update mode
    if (project?.id && user?.uid) {
      fetchPhases(project.id);
      fetchExpenses(project.id);
    }
  };
  
  // Initialize phases for quick update
  const handleEnterQuickUpdateMode = () => {
    // Reset and re-fetch expenses before entering quick update mode
    if (project?.id && user?.uid) {
      console.log('Refreshing expenses before entering quick update mode');
      fetchExpenses(project.id).then(() => {
        console.log('Expenses refreshed, now entering quick update mode');
        
        // Initialize phase updates after expenses are refreshed
        const phaseUpdates = phases.reduce((acc, phase) => {
          acc[phase.id] = { ...phase };
          return acc;
        }, {} as { [id: string]: ProjectPhase });
        
        setPhasesBeingUpdated(phaseUpdates);
        setQuickUpdateMode(true);
      });
    } else {
      // Fallback if project or user isn't available
      const phaseUpdates = phases.reduce((acc, phase) => {
        acc[phase.id] = { ...phase };
        return acc;
      }, {} as { [id: string]: ProjectPhase });
      
      setPhasesBeingUpdated(phaseUpdates);
      setQuickUpdateMode(true);
    }
  };
  
  // Add a useEffect to refresh expenses when quick update mode is activated
  useEffect(() => {
    if (quickUpdateMode && project) {
      // Force a re-render of expenses in the phase cards
      console.log('Quick update mode active, refreshing phase expenses');
      const expensesByPhase = expenses.reduce((acc, expense) => {
        if (expense.phaseId) {
          if (!acc[expense.phaseId]) {
            acc[expense.phaseId] = [];
          }
          acc[expense.phaseId].push(expense);
        }
        return acc;
      }, {} as Record<string, Expense[]>);
      
      // Log how many expenses are associated with each phase
      Object.entries(expensesByPhase).forEach(([phaseId, phaseExpenses]) => {
        console.log(`Phase ${phaseId} has ${phaseExpenses.length} expenses`);
      });
    }
  }, [quickUpdateMode, expenses, project]);

  // Save all phase updates at once
  const handleSaveQuickUpdates = () => {
    // Convert back to array format
    const updatedPhases = Object.values(phasesBeingUpdated);
    setPhases(updatedPhases);
    setQuickUpdateMode(false);
    
    // Here you would normally save to backend
    // ProjectService.updateProjectPhases(projectId, updatedPhases);
  };

  // Update a specific phase in the quick update mode
  const handleQuickUpdatePhase = (phaseId: string, field: string, value: any) => {
    setPhasesBeingUpdated(prev => ({
      ...prev,
      [phaseId]: {
        ...prev[phaseId],
        [field]: value
      }
    }));
  };

  // Add this function to handle opening the bid dialog for a specific phase
  const handleOpenQuickBidDialog = (phaseId: string) => {
    setCurrentPhaseForBid(phaseId);
    setQuickBid({
      phaseId,
      contractorName: '',
      amount: 0,
      description: '',
    });
    setNewBidDialogOpen(true);
  };

  // Add this function to handle bid input changes
  const handleQuickBidChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setQuickBid(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value as string) || 0 : value
    }));
  };

  // Add this function to handle adding the bid and updating the phase
  const handleAddQuickBid = () => {
    // Only proceed if we have a valid phase ID and project
    if (!currentPhaseForBid || !project) return;
    
    // Create a new bid
    const newBid: Bid = {
      id: crypto.randomUUID(),
      userId: user?.uid || '',
      projectId: project.id || '',
      phaseId: currentPhaseForBid,
      contractorName: quickBid.contractorName,
      bidAmount: quickBid.amount,
      totalAmount: quickBid.amount, // Set totalAmount to match bidAmount
      notes: quickBid.description, // Use notes instead of description
      status: 'accepted', // lowercase to match the enum type
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add the bid to the project bids
    setBids(prev => [...prev, newBid]);
    
    // Update the phase actual cost to reflect the new bid
    setPhasesBeingUpdated(prev => {
      // Add the bid amount to the current actual cost of the phase
      const updatedPhase = {
        ...prev[currentPhaseForBid],
        actualCost: (prev[currentPhaseForBid].actualCost || 0) + quickBid.amount
      };
      
      return {
        ...prev,
        [currentPhaseForBid]: updatedPhase
      };
    });
    
    // Close the dialog
    setNewBidDialogOpen(false);
    setCurrentPhaseForBid(null);
    
    // Show a success message or toast (if you have a toast system)
    alert(`Bid from ${quickBid.contractorName} added successfully and phase cost updated.`);
  };

  // Add this function to handle opening the expense dialog for a specific phase
  const handleOpenQuickExpenseDialog = (phaseId: string) => {
    setQuickExpense({
      phaseId,
      category: 'materials',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      subcontractorId: '',
      subcontractorName: '',
      vendor: ''
    });
    setNewExpenseDialogOpen(true);
  };

  // Add this function to handle expense input changes
  const handleQuickExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setQuickExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value as string) || 0 : value
    }));
  };

  // Add this helper function for notifications
  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fix the handleAddQuickExpense function to update phases and project
  const handleAddQuickExpense = async (phaseId?: string) => {
    if (!project || !user?.uid) return;
    
    try {
      const newExpense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        projectId: project.id,
        phaseId: phaseId || quickExpense.phaseId,
        phaseName: phases.find(p => p.id === (phaseId || quickExpense.phaseId))?.name || '',
        category: quickExpense.category || 'other', // Default to 'other' if empty
        amount: quickExpense.amount,
        description: quickExpense.description,
        date: quickExpense.date,
        subcontractorId: quickExpense.subcontractorId || null,
        subcontractorName: quickExpense.subcontractorName || null,
        vendor: quickExpense.vendor || null,
        status: 'pending'
      };
      
      console.log('Adding new expense:', newExpense);
      
      const savedExpense = await ExpenseService.createExpense(user.uid, newExpense);
      
      // Update the expenses state
      setExpenses(prevExpenses => [...prevExpenses, savedExpense]);
      
      // Find and update the phase with the new expense
      if (quickExpense.phaseId) {
        const phaseToUpdate = phases.find(p => p.id === quickExpense.phaseId);
        if (phaseToUpdate) {
          const newTotalActualCost = (phaseToUpdate.actualCost || 0) + quickExpense.amount;
          
          // Update phases in the project object
          const updatedPhases = phases.map(phase => {
            if (phase.id === quickExpense.phaseId) {
              return { ...phase, actualCost: newTotalActualCost };
            }
            return phase;
          });
          
          setPhases(updatedPhases);
          
          // Update project with the new phases
          if (project) {
            const updatedProject = { 
              ...project,
              phases: updatedPhases 
            };
            
            // Update project in the database
            await ProjectService.updateProject(project.id, {
              phases: updatedPhases
            });
            
            setProject(updatedProject);
          }
        }
      }
      
      // Also update the project actual cost in the database
      if (project) {
        const newProjectActualCost = (project.actualCost || 0) + quickExpense.amount;
        
        // Update project in database
        await ProjectService.updateProject(project.id, {
          actualCost: newProjectActualCost
        });
        
        // Update local state while preserving type safety
        setProject(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            actualCost: newProjectActualCost
          };
        });
      }
      
      // Fetch updated expense data
      await fetchExpenses(project.id);
      
      // Reset the form and close dialog
      setQuickExpense({
        category: 'other', // Set a valid default category
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        phaseId: '',
        subcontractorId: '',
        subcontractorName: '',
        vendor: ''
      });
      setNewExpenseDialogOpen(false);
      
      showNotification('Expense added successfully', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('Failed to add expense', 'error');
    }
  };

  // Add a useEffect to reset and refresh expenses when toggling quick update mode
  useEffect(() => {
    // Whenever quick update mode changes, ensure expenses are fresh
    if (quickUpdateMode && project?.id && user?.uid) {
      console.log('Quick update mode toggled, refreshing expense data');
      
      // Debug: Log all expenses and their phaseIds
      console.log('All expenses:', expenses);
      console.log('Expense phaseIds:', expenses.map(e => ({ id: e.id, phaseId: e.phaseId })));
      console.log('All phase IDs:', phases.map(p => p.id));
      
      // Check for phase ID mismatches
      const phaseIdsSet = new Set(phases.map(p => p.id));
      const orphanedExpenses = expenses.filter(e => e.phaseId && !phaseIdsSet.has(e.phaseId));
      if (orphanedExpenses.length > 0) {
        console.warn('Found expenses with phaseIds that don\'t match any phases:', orphanedExpenses);
      }
      
      // Force a re-render by making a new array
      setExpenses(prevExpenses => [...prevExpenses]);
    }
  }, [quickUpdateMode, project?.id, user?.uid, expenses, phases]);
  
  // Add rendering key to phase cards to force re-render when quick update mode changes
  const renderingKey = useMemo(() => {
    // Generate a new key when quick update mode changes to force component re-rendering
    return `quick-update-${quickUpdateMode}-${Date.now()}`;
  }, [quickUpdateMode]);

  // Handle project update
  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };
  
  // Calculate overall project progress based on phases
  const projectProgress = useMemo(() => {
    if (!phases.length) return 0;
    
    const totalWeight = phases.reduce((sum, phase) => sum + phase.budget, 0);
    if (totalWeight === 0) return 0;
    
    const weightedProgress = phases.reduce((sum, phase) => {
      const weight = phase.budget / totalWeight;
      return sum + (phase.progress * weight);
    }, 0);
    
    return Math.round(weightedProgress);
  }, [phases]);
  
  // Calculate budget vs actual costs
  const budgetData = useMemo(() => {
    // Use the project's original budget if available, otherwise sum the phase budgets
    let totalBudget = 0;
    
    if (project?.budget) {
      if (typeof project.budget === 'number') {
        totalBudget = project.budget;
      } else if (typeof project.budget === 'object' && 'total' in project.budget) {
        totalBudget = project.budget.total;
      }
    }
    
    // If budget wasn't found or is 0, calculate from phases
    if (totalBudget === 0) {
      totalBudget = phases.reduce((sum, phase) => sum + phase.budget, 0);
    }
    
    const totalActual = phases.reduce((sum, phase) => sum + phase.actualCost, 0);
    
    return {
      totalBudget,
      totalActual,
      difference: totalBudget - totalActual,
      percentUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    };
  }, [phases, project?.budget]);

  // Generate combined expenses for charts
  const combinedExpenses = useMemo(() => {
    return phases.map(phase => ({
      name: phase.name,
      budget: phase.budget,
      actual: phase.actualCost,
    }));
  }, [phases]);

  // Calculate timeline and progress
  const timeline = useMemo(() => {
    // If we have a project with dates, use those directly
    if (project?.startDate && project?.endDate) {
      // Ensure dates are actual Date objects
      const projectStartDate = project.startDate instanceof Date 
        ? project.startDate 
        : new Date(project.startDate);
      
      const projectEndDate = project.endDate instanceof Date 
        ? project.endDate 
        : new Date(project.endDate);
      
      const today = new Date();
      
      const totalDuration = projectEndDate.getTime() - projectStartDate.getTime();
      const elapsedDuration = today.getTime() - projectStartDate.getTime();
      
      let percentComplete = 0;
      if (totalDuration > 0) {
        percentComplete = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
      }
      
      return {
        startDate: projectStartDate,
        endDate: projectEndDate,
        elapsedDays: Math.floor(elapsedDuration / (1000 * 60 * 60 * 24)),
        totalDays: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
        percentComplete: Math.round(percentComplete),
      };
    }
    
    // Fallback to phase-based calculation if project dates aren't available or valid
    if (!phases.length) return { 
      startDate: new Date(), 
      endDate: new Date(), 
      elapsedDays: 0, 
      totalDays: 0, 
      percentComplete: 0 
    };
    
    // Safely parse dates and filter out invalid ones
    const parseDates = (dateString: string | Date): number => {
      if (!dateString) return Date.now();
      try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        const timestamp = date.getTime();
        return isNaN(timestamp) ? Date.now() : timestamp;
      } catch (e) {
        console.warn('Invalid date found:', dateString);
        return Date.now();
      }
    };
    
    const startDates = phases.map(p => parseDates(p.startDate));
    const endDates = phases.map(p => parseDates(p.endDate));
    
    const phaseBasedStartDate = new Date(Math.min(...startDates));
    const phaseBasedEndDate = new Date(Math.max(...endDates));
    const today = new Date();
    
    const totalDuration = phaseBasedEndDate.getTime() - phaseBasedStartDate.getTime();
    const elapsedDuration = today.getTime() - phaseBasedStartDate.getTime();
    
    let percentComplete = 0;
    if (totalDuration > 0) {
      percentComplete = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
    }
    
    return {
      startDate: phaseBasedStartDate,
      endDate: phaseBasedEndDate,
      elapsedDays: Math.floor(elapsedDuration / (1000 * 60 * 60 * 24)),
      totalDays: Math.ceil(totalDuration / (1000 * 60 * 60 * 24)),
      percentComplete: Math.round(percentComplete),
    };
  }, [project?.startDate, project?.endDate, phases]);

  if (loading) {
    return (
      <PageLayout title="Loading Project" icon={BusinessIcon}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout title="Project Not Found" icon={BusinessIcon}>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        title={project.name}
        subtitle={`Project #${project.id?.substr(-6) || ''}`}
        icon={BusinessIcon}
        actions={
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
            {!quickUpdateMode && (
              <>
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  startIcon={!isSmall && <UpdateIcon />}
                  onClick={handleEnterQuickUpdateMode}
                  sx={{ 
                    display: { xs: 'none', sm: 'flex' },
                    borderRadius: 1.5,
                  }}
                >
                  {isSmall ? <UpdateIcon /> : "Quick Update"}
                </Button>
                
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  startIcon={!isSmall && <DownloadIcon />}
                  sx={{ 
                    display: { xs: 'none', sm: 'flex' },
                    borderRadius: 1.5,
                  }}
                >
                  {isSmall ? <DownloadIcon /> : "Export"}
                </Button>
                
                <Button
                  variant="contained"
                  size={isMobile ? "small" : "medium"}
                  startIcon={!isSmall && <EditIcon />}
                  onClick={handleEdit}
                  sx={{ 
                    borderRadius: 1.5,
                    minWidth: isSmall ? 40 : undefined
                  }}
                >
                  {isSmall ? <EditIcon /> : "Edit Project"}
                </Button>
                
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 1.5,
                    p: '6px',
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </>
            )}
            
            {quickUpdateMode && (
              <>
                <Button
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  startIcon={<CloseIcon />}
                  onClick={handleCancelQuickUpdates}
                  sx={{ 
                    borderRadius: 1.5,
                  }}
                >
                  Cancel
                </Button>
                
                <Button
                  variant="contained"
                  size={isMobile ? "small" : "medium"}
                  startIcon={<SaveIcon />}
                  onClick={handleSaveQuickUpdates}
                  sx={{ 
                    borderRadius: 1.5,
                  }}
                >
                  Save Updates
                </Button>
              </>
            )}
            
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 2,
                sx: {
                  minWidth: 200,
                  borderRadius: 1.5,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              <MenuItem onClick={handleEdit}>
                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                Edit Project
              </MenuItem>
              <MenuItem onClick={handleAddPhase}>
                <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                Add Phase
              </MenuItem>
              <MenuItem onClick={handleAddBid}>
                <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                Add Bid
              </MenuItem>
              <MenuItem onClick={handleEnterQuickUpdateMode}>
                <ListItemIcon><UpdateIcon fontSize="small" /></ListItemIcon>
                Quick Update Mode
              </MenuItem>
              <MenuItem onClick={() => console.log('Share project')}>
                <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                Share Project
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                Delete Project
              </MenuItem>
            </Menu>
          </Stack>
        }
      >
        {/* Quick Update Interface */}
        {quickUpdateMode && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight={600} color="primary">Quick Update Mode</Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              Make multiple updates across phases to catch up on project progress quickly. Update status, progress, and actual costs for each phase.
            </Typography>
            
            <Grid container spacing={3}>
              {Object.values(phasesBeingUpdated).map((phase) => (
                <Grid item xs={12} sm={6} md={6} lg={4} key={`${renderingKey}-phase-${phase.id}`}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      p: 0, 
                      borderRadius: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      },
                      overflow: 'hidden',
                    }}
                  >
                    <Box 
                      sx={{ 
                        p: 2.5,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: alpha(getStatusColor(phase.status), 0.05),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {phase.name}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(phase.status)}
                        label={phase.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: alpha(getStatusColor(phase.status), 0.15),
                          color: getStatusColor(phase.status),
                          borderRadius: '12px',
                          '& .MuiChip-icon': {
                            color: getStatusColor(phase.status)
                          }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="body2" color="text.primary">
                            {phasesBeingUpdated[phase.id].progress}% Complete
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {['not_started', 'in_progress', 'completed', 'delayed'].map((status) => (
                            <Chip
                              key={status}
                              label={status.replace('_', ' ')}
                              clickable
                              size="small"
                              onClick={() => handleQuickUpdatePhase(phase.id, 'status', status)}
                              sx={{
                                height: 24,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: phase.status === status 
                                  ? alpha(getStatusColor(status), 0.15)
                                  : alpha(theme.palette.background.default, 0.6),
                                color: phase.status === status 
                                  ? getStatusColor(status)
                                  : theme.palette.text.secondary,
                                borderRadius: '12px',
                                border: `1px solid ${alpha(getStatusColor(status), phase.status === status ? 0.5 : 0.1)}`,
                                '&:hover': {
                                  bgcolor: alpha(getStatusColor(status), 0.1),
                                }
                              }}
                            />
                          ))}
                        </Box>
                        
                        <Box sx={{ width: '100%', height: 6, bgcolor: alpha(theme.palette.divider, 0.1), borderRadius: 3, mb: 1, overflow: 'hidden' }}>
                          <Box
                            sx={{
                              height: '100%',
                              width: `${phase.status === 'completed' ? 100 : phase.status === 'in_progress' ? 50 : phase.status === 'delayed' ? 25 : 0}%`,
                              bgcolor: getStatusColor(phase.status),
                              borderRadius: 3,
                              transition: 'width 0.5s ease-in-out',
                            }}
                          />
                        </Box>
                        
                        {/* Remove the Slider component and its container */}
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Budget Status
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {phasesBeingUpdated[phase.id].actualCost > phase.budget && (
                              <Chip 
                                label="Over Budget" 
                                size="small" 
                                color="error" 
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                              />
                            )}
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Budget:</Typography>
                          <Typography variant="body2" fontWeight={600}>{formatCurrency(phase.budget)}</Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          mb: 1,
                          p: 1.5,
                          bgcolor: alpha(
                            phasesBeingUpdated[phase.id].actualCost > phase.budget ? 
                              theme.palette.error.main : 
                              theme.palette.success.main, 
                            0.05
                          ),
                          borderRadius: 1.5,
                          border: `1px solid ${alpha(
                            phasesBeingUpdated[phase.id].actualCost > phase.budget ? 
                              theme.palette.error.main : 
                              theme.palette.success.main, 
                            0.1
                          )}`,
                        }}>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">Actual Cost:</Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight={700}
                            color={phasesBeingUpdated[phase.id].actualCost > phase.budget ? 'error.main' : 'success.main'}
                          >
                            {formatCurrency(phasesBeingUpdated[phase.id].actualCost)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 1, flex: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          mb: 1.5,
                          px: 0.5
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                              Expenses
                            </Typography>
                            <Chip
                              label={expenses.filter(e => e.phaseId === phase.id).length}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                color: theme.palette.primary.main
                              }}
                            />
                          </Box>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddQuickExpense(phase.id)}
                            sx={{
                              height: 28,
                              px: 1.5,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Add Expense
                          </Button>
                        </Box>
                        
                        {expenses.filter(e => e.phaseId === phase.id).length > 0 ? (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 1,
                            maxHeight: 160,
                            overflow: 'auto',
                            px: 0.5,
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: alpha(theme.palette.divider, 0.2),
                              borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-track': {
                              backgroundColor: 'transparent',
                            },
                          }}>
                            {expenses
                              .filter(e => e.phaseId === phase.id)
                              .map(expense => (
                                <Paper
                                  key={expense.id}
                                  elevation={0}
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    bgcolor: alpha(theme.palette.background.default, 0.5),
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.background.default, 0.8),
                                      borderColor: alpha(theme.palette.primary.main, 0.2),
                                      transform: 'translateY(-1px)',
                                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`
                                    }
                                  }}
                                >
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 1
                                  }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1, 
                                        mb: 0.5,
                                        flexWrap: 'wrap'
                                      }}>
                                        <Chip
                                          label={expense.category}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            bgcolor: expense.category === 'materials' ? alpha(theme.palette.primary.main, 0.15) :
                                                    expense.category === 'labor' ? alpha(theme.palette.warning.main, 0.15) :
                                                    expense.category === 'permits' ? alpha(theme.palette.info.main, 0.15) :
                                                    expense.category === 'equipment' ? alpha(theme.palette.secondary.main, 0.15) :
                                                    alpha(theme.palette.grey[500], 0.15),
                                            color: expense.category === 'materials' ? theme.palette.primary.main :
                                                  expense.category === 'labor' ? theme.palette.warning.main :
                                                  expense.category === 'permits' ? theme.palette.info.main :
                                                  expense.category === 'equipment' ? theme.palette.secondary.main :
                                                  theme.palette.grey[700]
                                          }}
                                        />
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontWeight: 600,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1
                                          }}
                                        >
                                          {expense.description}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1.5,
                                        flexWrap: 'wrap',
                                        fontSize: '0.75rem',
                                        color: 'text.secondary'
                                      }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <CalendarTodayIcon sx={{ fontSize: '0.75rem' }} />
                                          {expense.date instanceof Date 
                                            ? expense.date.toLocaleDateString() 
                                            : new Date(expense.date).toLocaleDateString()}
                                        </Box>
                                        {expense.vendor && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <StorefrontIcon sx={{ fontSize: '0.75rem' }} />
                                            {expense.vendor}
                                          </Box>
                                        )}
                                        {expense.status && (
                                          <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 0.5,
                                            color: expense.status === 'paid' ? 'success.main' :
                                                   expense.status === 'pending' ? 'warning.main' :
                                                   'error.main'
                                          }}>
                                            <CircleIcon sx={{ fontSize: '0.5rem' }} />
                                            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                                          </Box>
                                        )}
                                      </Box>
                                    </Box>
                                    <Typography 
                                      variant="body2" 
                                      fontWeight={700}
                                      sx={{ 
                                        color: expense.amount > 1000 ? 'error.main' : 'text.primary',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {formatCurrency(expense.amount)}
                                    </Typography>
                                  </Box>
                                </Paper>
                              ))
                            }
                          </Box>
                        ) : (
                          <Box sx={{ 
                            py: 2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: 80,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 2,
                            border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.background.default, 0.8),
                              borderColor: alpha(theme.palette.primary.main, 0.3)
                            }
                          }}
                          onClick={() => handleAddQuickExpense(phase.id)}
                          >
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontStyle: 'italic',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <AddIcon sx={{ fontSize: '1rem' }} />
                              Add your first expense
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      p: 1.5, 
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1
                    }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<ExpensesIcon fontSize="small" />}
                        onClick={() => handleOpenQuickExpenseDialog(phase.id)}
                        sx={{ 
                          fontSize: '0.75rem',
                          borderRadius: 2,
                          height: 36
                        }}
                      >
                        Add Expense
                      </Button>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon fontSize="small" />}
                        onClick={() => handleOpenQuickBidDialog(phase.id)}
                        sx={{ 
                          fontSize: '0.75rem',
                          borderRadius: 2,
                          height: 36
                        }}
                      >
                        Add Bid
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Recent Expenses in Quick Update Mode */}
        {quickUpdateMode && expenses.length > 0 && (
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                backgroundColor: 'success.main',
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600} color="success.main">Recent Expenses</Typography>
              <Chip 
                label={`${expenses.length} Total`} 
                color="success" 
                size="small" 
                sx={{ fontWeight: 600 }} 
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                {expenses.slice(-6).reverse().map((expense) => {
                  const phaseName = phases.find(p => p.id === expense.phaseId)?.name || 'Unknown Phase';
                  
                  return (
                    <Grid item xs={12} sm={6} md={6} lg={4} key={expense.id}>
                      <Card elevation={2} sx={{ 
                        p: 0, 
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                        overflow: 'hidden',
                      }}>
                        <Box sx={{ 
                          p: 2, 
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          bgcolor: alpha(
                            expense.category === 'materials' ? theme.palette.primary.main :
                            expense.category === 'labor' ? theme.palette.warning.main :
                            expense.category === 'permits' ? theme.palette.info.main :
                            expense.category === 'equipment' ? theme.palette.secondary.main :
                            theme.palette.grey[500],
                            0.05
                          ),
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={expense.category} 
                              size="small" 
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                borderRadius: '12px',
                                height: 24,
                                bgcolor: expense.category === 'materials' ? alpha(theme.palette.primary.main, 0.15) :
                                        expense.category === 'labor' ? alpha(theme.palette.warning.main, 0.15) :
                                        expense.category === 'permits' ? alpha(theme.palette.info.main, 0.15) :
                                        expense.category === 'equipment' ? alpha(theme.palette.secondary.main, 0.15) :
                                        alpha(theme.palette.grey[500], 0.15),
                                color: expense.category === 'materials' ? theme.palette.primary.main :
                                      expense.category === 'labor' ? theme.palette.warning.main :
                                      expense.category === 'permits' ? theme.palette.info.main :
                                      expense.category === 'equipment' ? theme.palette.secondary.main :
                                      theme.palette.grey[700]
                              }}
                            />
                            <Typography variant="h6" fontWeight={700}>
                              {formatCurrency(expense.amount)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ p: 2, flex: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 1,
                              fontWeight: 500,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              minHeight: '40px',
                            }}
                          >
                            {expense.description || 'No description'}
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mt: 1, 
                            p: 1,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 1.5
                          }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Phase
                              </Typography>
                              <Typography variant="body2" fontWeight={500} noWrap>
                                {phaseName}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Date
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {expense.date instanceof Date 
                                  ? expense.date.toLocaleDateString() 
                                  : new Date(expense.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Paper>
        )}

        {/* Project Overview and Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Project Status Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label={project.status.replace('_', ' ').toUpperCase()}
                    icon={getStatusIcon(project.status)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: alpha(getStatusColor(project.status), 0.1),
                      color: getStatusColor(project.status),
                      borderRadius: 1,
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Overall Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={projectProgress} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }} 
                    />
                  </Box>
                  <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" fontWeight="bold" color="text.primary">
                      {projectProgress}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Budget Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Budget
                </Typography>
                <Typography variant="h6" component="div" fontWeight="bold">
                  {formatCurrency(budgetData.totalBudget)}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Spent
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(budgetData.totalActual)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" align="right" display="block">
                      Remaining
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      color={budgetData.difference < 0 ? 'error' : 'success.main'}
                    >
                      {formatCurrency(budgetData.difference)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={budgetData.percentUsed} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: budgetData.percentUsed > 100 
                          ? theme.palette.error.main 
                          : budgetData.percentUsed > 90 
                          ? theme.palette.warning.main 
                          : theme.palette.success.main
                      }
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {budgetData.percentUsed.toFixed(0)}% of budget used
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Timeline Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h6" component="div" fontWeight="bold" sx={{ mr: 1 }}>
                    {timeline.elapsedDays} <Typography variant="body2" component="span">days elapsed</Typography>
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Start
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {timeline.startDate && !isNaN(timeline.startDate.getTime()) 
                        ? timeline.startDate.toLocaleDateString() 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      End
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {timeline.endDate && !isNaN(timeline.endDate.getTime()) 
                        ? timeline.endDate.toLocaleDateString() 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {timeline.totalDays} days
                    </Typography>
                  </Box>
                </Stack>
                
                <Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={timeline.percentComplete} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {timeline.percentComplete}% of timeline elapsed
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Team Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Team
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" component="div" fontWeight="bold">
                    {project.team?.length || 0} Members
                  </Typography>
                </Box>
                
                <Stack direction="row" spacing={-1} sx={{ mb: 2 }}>
                  {(project.team || []).slice(0, 5).map((member, index) => {
                    // Handle team member display - project.team can be array of strings or objects
                    const memberName = typeof member === 'string' ? member : (member as any)?.name || '';
                    
                    return (
                      <Tooltip key={index} title={memberName || `Team Member ${index + 1}`}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: theme.palette.primary.main,
                            border: `2px solid ${theme.palette.background.paper}`
                          }}
                        >
                          {(memberName || 'U').charAt(0)}
                        </Avatar>
                      </Tooltip>
                    );
                  })}
                  
                  {(project.team?.length || 0) > 5 && (
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: theme.palette.grey[300],
                      border: `2px solid ${theme.palette.background.paper}`
                    }}>
                      <Typography variant="caption">+{project.team!.length - 5}</Typography>
                    </Avatar>
                  )}
                </Stack>
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<PersonIcon />} 
                  sx={{ borderRadius: 1.5 }}
                >
                  Manage Team
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Project Detail Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minHeight: 48,
                fontSize: '0.9rem',
              }
            }}
          >
            <Tab label="Overview" icon={<BusinessIcon />} iconPosition="start" />
            <Tab label="Phases" icon={<TimelineIcon />} iconPosition="start" />
            <Tab label="Bids" icon={<BidsIcon />} iconPosition="start" />
            <Tab label="Expenses" icon={<ExpensesIcon />} iconPosition="start" />
            <Tab label="Tasks" icon={<TasksIcon />} iconPosition="start" />
            <Tab label="Documents" icon={<DocumentIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {/* Overview Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              {/* Project Summary */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} /> Project Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Project Type
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {project.projectType || 'Not specified'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Client
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {project.clientId ? 'Client ID: ' + project.clientId : 'Not assigned'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }} />
                        {typeof project.location === 'string' 
                          ? project.location 
                          : project.location
                            ? `${project.location?.address || ''}, ${project.location?.city || ''}, ${project.location?.state || ''}`
                            : 'No location specified'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {project.description || 'No description provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Progress Chart */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ChartIcon sx={{ mr: 1 }} /> Progress Overview
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {phases.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={phases}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={80} 
                            style={{ fontSize: '0.75rem' }}
                          />
                          <RechartsTooltip 
                            formatter={(value: number, name: string) => [`${value}%`, name]} 
                            labelFormatter={(label: string) => `Phase: ${label}`}
                          />
                          <Legend />
                          <Bar 
                            dataKey="progress" 
                            name="Progress" 
                            fill={theme.palette.primary.main}
                            barSize={15}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      height: 300, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
                      <TimelineIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" align="center">
                        No phases available to show progress
                      </Typography>
                      <Button 
                        variant="text" 
                        size="small" 
                        startIcon={<AddIcon />} 
                        onClick={handleAddPhase}
                        sx={{ mt: 1 }}
                      >
                        Add Project Phases
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Budget & Expenses */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BudgetIcon sx={{ mr: 1 }} /> Budget vs Actuals
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {combinedExpenses.length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={combinedExpenses}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                          <Legend />
                          <Bar 
                            dataKey="budget" 
                            name="Budget" 
                            fill={theme.palette.primary.main}
                            opacity={0.8}
                            barSize={20} 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="actual" 
                            name="Actual" 
                            fill={theme.palette.success.main}
                            opacity={0.8} 
                            barSize={20}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      height: 300, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
                      <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" align="center">
                        No budget data available
                      </Typography>
                      <Button 
                        variant="text" 
                        size="small" 
                        startIcon={<AddIcon />} 
                        onClick={handleAddPhase}
                        sx={{ mt: 1 }}
                      >
                        Add Project Phases
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Expense Categories */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ExpensesIcon sx={{ mr: 1 }} /> Expense Distribution
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {expensesData.length > 0 ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            innerRadius={40}
                            dataKey="value"
                            nameKey="name"
                            label={(entry: any) => `${entry.name}: ${((entry.value / expensesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                          >
                            {expensesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      height: 300, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'center', 
                      alignItems: 'center'
                    }}>
                      <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" align="center">
                        No expense data available
                      </Typography>
                      <Button 
                        variant="text" 
                        size="small" 
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                      >
                        Add Expenses
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Phases Tab */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Project Phases ({phases.length})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={handleAddPhase}
                  sx={{ borderRadius: 1.5 }}
                >
                  Add Phase
                </Button>
              </Box>
              
              {/* Phase List */}
              {phases.length > 0 ? (
                <Stack spacing={2}>
                  {phases.map((phase, index) => (
                    <Paper 
                      key={phase.id} 
                      elevation={0}
                      sx={{ 
                        p: 0, 
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexGrow: 1,
                          width: { xs: '100%', sm: 'auto' },
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: alpha(getStatusColor(phase.status), 0.1),
                                color: getStatusColor(phase.status),
                                width: 28,
                                height: 28,
                                mr: 1.5,
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </Avatar>
                            
                            <Box>
                              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                                {phase.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: { xs: 'flex', sm: 'none' }, mt: { xs: 1, sm: 0 } }}>
                            <Chip
                              label={phase.status.replace('_', ' ').toUpperCase()}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: alpha(getStatusColor(phase.status), 0.1),
                                color: getStatusColor(phase.status),
                                borderRadius: 1
                              }}
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          mt: { xs: 2, sm: 0 },
                          gap: 2,
                          width: { xs: '100%', sm: 'auto' },
                          justifyContent: { xs: 'space-between', sm: 'flex-end' }
                        }}>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Chip
                              label={phase.status.replace('_', ' ').toUpperCase()}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: alpha(getStatusColor(phase.status), 0.1),
                                color: getStatusColor(phase.status),
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                          
                          <Stack direction="row" spacing={1}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleUpdatePhase(phase.id)}
                              sx={{ 
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                borderRadius: 1,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeletePhase(phase.id)}
                              sx={{ 
                                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                                color: theme.palette.error.main,
                                borderRadius: 1,
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Box>
                      </Box>
                      
                      <Box sx={{ p: 2 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={8}>
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Progress ({phase.progress}%)
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={phase.progress} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  mb: 1,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                }} 
                              />
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Box>
                                  <Typography variant="body2" color="text.secondary">Tasks</Typography>
                                  <Typography variant="body1" fontWeight="medium">
                                    {phase.tasks?.length || 0} tasks
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="body2" color="text.secondary" align="right">Budget</Typography>
                                  <Typography variant="body1" fontWeight="medium" align="right">
                                    {formatCurrency(phase.budget)}
                                  </Typography>
                                </Box>
                                
                                <Box>
                                  <Typography variant="body2" color="text.secondary" align="right">Actual Cost</Typography>
                                  <Typography 
                                    variant="body1" 
                                    fontWeight="medium" 
                                    align="right"
                                    color={phase.actualCost > phase.budget ? 'error' : 'inherit'}
                                  >
                                    {formatCurrency(phase.actualCost)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ 
                              height: { xs: 100, sm: '100%' },
                              minHeight: { sm: 100 },
                              width: '100%'
                            }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                                      { name: 'Actual', value: phase.actualCost, color: theme.palette.success.main }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={40}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {[
                                      { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                                      { name: 'Actual', value: phase.actualCost, color: theme.palette.success.main }
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                                </PieChart>
                              </ResponsiveContainer>
                            </Box>
                          </Grid>
                        </Grid>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            sx={{ borderRadius: 1.5 }}
                          >
                            View Phase Details
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 6 
                }}>
                  <TimelineIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No phases defined</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start by adding project phases to track progress
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddPhase}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Add Phase
                  </Button>
                </Box>
              )}
            </Box>
          )}
          
          {/* Bids Tab */}
          {tabValue === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>Project Bids</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddBid}
                  sx={{ borderRadius: 1.5 }}
                >
                  Add New Bid
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {bids.map((bid) => (
                  <Grid item xs={12} md={6} lg={4} key={bid.id}>
                    <Card elevation={0} sx={{ 
                      borderRadius: 2, 
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        borderColor: 'transparent',
                      }
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" fontWeight={600}>{bid.title}</Typography>
                          <Chip
                            label={bid.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha(
                                bid.status === 'accepted' ? theme.palette.success.main : 
                                bid.status === 'rejected' ? theme.palette.error.main : 
                                bid.status === 'draft' ? theme.palette.grey[500] :
                                bid.status === 'submitted' ? theme.palette.info.main : 
                                theme.palette.warning.main, 0.1
                              ),
                              color: bid.status === 'accepted' ? theme.palette.success.main : 
                                     bid.status === 'rejected' ? theme.palette.error.main : 
                                     bid.status === 'draft' ? theme.palette.grey[700] :
                                     bid.status === 'submitted' ? theme.palette.info.main : 
                                     theme.palette.warning.main,
                              borderRadius: 1,
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Contractor</Typography>
                          <Typography variant="body1">{bid.subcontractorName || 'Not assigned'}</Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Bid Amount</Typography>
                          <Typography variant="body1" fontWeight={600}>{formatCurrency(bid.totalAmount)}</Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Submission Date</Typography>
                          <Typography variant="body1" fontWeight={600}>{formatDate(bid.createdAt)}</Typography>
                        </Box>
                        
                        {bid.notes && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Notes</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{bid.notes}</Typography>
                          </Box>
                        )}
                        
                        {bid.attachments && bid.attachments.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Documents</Typography>
                            {bid.attachments.map((doc, index) => {
                              const docName = typeof doc === 'string' ? doc : doc.name;
                              const docUrl = typeof doc === 'string' ? '#' : doc.url;
                              
                              return (
                                <Chip
                                  key={index}
                                  label={docName}
                                  size="small"
                                  icon={<DocumentIcon fontSize="small" />}
                                  clickable
                                  onClick={() => window.open(docUrl, '_blank')}
                                  sx={{ mr: 0.5, mb: 0.5, borderRadius: 1 }}
                                />
                              );
                            })}
                          </Box>
                        )}
                      </CardContent>
                      
                      <Divider />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                        <Tooltip title="Edit Bid">
                          <IconButton size="small" onClick={() => handleEditBid(bid.id)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Bid">
                          <IconButton size="small" onClick={() => handleDeleteBid(bid.id)} sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {bids.length === 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: 6 
                }}>
                  <BidsIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No bids available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Start by adding a new bid for this project</Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddBid}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Add New Bid
                  </Button>
                </Box>
              )}
            </Box>
          )}
          
          {/* Expenses Tab */}
          {tabValue === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">Project Expenses</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => handleOpenQuickExpenseDialog('')}
                  sx={{ borderRadius: 1.5 }}
                >
                  Add Expense
                </Button>
              </Box>
              
              {/* Expense Charts */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Expense Categories
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ height: 300 }}>
                      {expensesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={(entry: any) => `${entry.name}: ${((entry.value / expensesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                            >
                              {expensesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          alignItems: 'center'
                        }}>
                          <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                          <Typography variant="body1" color="text.secondary" align="center">
                            No expense data available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Phase Budget vs Actual
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {phases.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={phases.map(p => ({
                              name: p.name,
                              budget: p.budget,
                              actual: p.actualCost,
                              variance: p.budget - p.actualCost
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar 
                              dataKey="budget" 
                              name="Budget" 
                              stackId="a" 
                              fill={theme.palette.primary.main}
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              dataKey="actual" 
                              name="Actual" 
                              stackId="b" 
                              fill={theme.palette.success.main}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center'
                      }}>
                        <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" align="center">
                          No phase budget data available
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Expense List */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  All Expenses
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {expenses.length > 0 ? (
                  <Box>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Box sx={{ minWidth: 750 }}>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: '100px 1fr 200px 150px 150px',
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          py: 1,
                          fontWeight: 600
                        }}>
                          <Typography variant="body2">Category</Typography>
                          <Typography variant="body2">Description</Typography>
                          <Typography variant="body2">Phase</Typography>
                          <Typography variant="body2">Date</Typography>
                          <Typography variant="body2" align="right">Amount</Typography>
                        </Box>
                        
                        {expenses.map((expense) => {
                          const phaseName = phases.find(p => p.id === expense.phaseId)?.name || 'Unknown Phase';
                          
                          return (
                            <Box 
                              key={expense.id} 
                              sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: '100px 1fr 200px 150px 150px',
                                py: 1.5,
                                alignItems: 'center',
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.03)
                                }
                              }}
                            >
                              <Box>
                                <Chip 
                                  label={expense.category} 
                                  size="small" 
                                  sx={{
                                    fontWeight: 500,
                                    borderRadius: 1,
                                    bgcolor: expense.category === 'materials' ? alpha(theme.palette.primary.main, 0.1) :
                                             expense.category === 'labor' ? alpha(theme.palette.warning.main, 0.1) :
                                             expense.category === 'permits' ? alpha(theme.palette.info.main, 0.1) :
                                             expense.category === 'equipment' ? alpha(theme.palette.secondary.main, 0.1) :
                                             alpha(theme.palette.grey[500], 0.1),
                                    color: expense.category === 'materials' ? theme.palette.primary.main :
                                           expense.category === 'labor' ? theme.palette.warning.main :
                                           expense.category === 'permits' ? theme.palette.info.main :
                                           expense.category === 'equipment' ? theme.palette.secondary.main :
                                           theme.palette.grey[700]
                                  }}
                                />
                              </Box>
                              <Typography variant="body2">{expense.description || '-'}</Typography>
                              <Typography variant="body2">{phaseName}</Typography>
                              <Typography variant="body2">
                                {expense.date instanceof Date 
                                  ? expense.date.toLocaleDateString() 
                                  : new Date(expense.date).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" fontWeight={600} align="right">
                                {formatCurrency(expense.amount)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {expenses.length} expense{expenses.length !== 1 ? 's' : ''} total
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        Total: {formatCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    py: 4, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" align="center">
                      No expenses have been added yet
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenQuickExpenseDialog('')}
                      sx={{ mt: 2, borderRadius: 1.5 }}
                    >
                      Add First Expense
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
          
          {/* Tasks Tab */}
          {tabValue === 4 && (
            <ProjectTaskManager 
              project={project} 
              onProjectUpdate={handleProjectUpdate}
              userId={user?.uid || ''}
            />
          )}
          
          {/* Documents Tab */}
          {tabValue === 5 && (
            <Box>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Project Documents</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    size="small"
                    sx={{ borderRadius: 1.5 }}
                  >
                    Upload Document
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  This section will allow you to manage project documents and files.
                </Alert>
              </Paper>
            </Box>
          )}
        </Box>
      </PageLayout>

      {/* Bid Dialog */}
      <Dialog open={newBidDialogOpen} onClose={() => setNewBidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contractor Bid</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the contractor bid details to update the phase actual cost.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                margin="dense"
                label="Contractor Name"
                name="contractorName"
                value={quickBid.contractorName}
                onChange={handleQuickBidChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                margin="dense"
                label="Bid Amount"
                name="amount"
                type="number"
                value={quickBid.amount}
                onChange={handleQuickBidChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                margin="dense"
                label="Description"
                name="description"
                value={quickBid.description}
                onChange={handleQuickBidChange}
                placeholder="Description of work to be performed"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewBidDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddQuickBid} 
            variant="contained" 
            disabled={!quickBid.contractorName || quickBid.amount <= 0}
          >
            Add Bid & Update Cost
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={newExpenseDialogOpen} onClose={() => setNewExpenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the expense details to add to the project.
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                margin="dense"
                label="Category"
                name="category"
                select
                value={quickExpense.category}
                onChange={handleQuickExpenseChange}
              >
                <MenuItem value="materials">Materials</MenuItem>
                <MenuItem value="labor">Labor</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="permits">Permits</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                margin="dense"
                label="Phase"
                name="phaseId"
                select
                value={quickExpense.phaseId}
                onChange={handleQuickExpenseChange}
              >
                {phases.map(phase => (
                  <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                margin="dense"
                label="Amount"
                name="amount"
                type="number"
                value={quickExpense.amount}
                onChange={handleQuickExpenseChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                margin="dense"
                label="Description"
                name="description"
                value={quickExpense.description}
                onChange={handleQuickExpenseChange}
                placeholder="Description of the expense"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Vendor"
                name="vendor"
                value={quickExpense.vendor || ''}
                onChange={handleQuickExpenseChange}
                placeholder="Vendor or supplier name"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Subcontractor"
                name="subcontractorId"
                select
                value={quickExpense.subcontractorId || ''}
                onChange={(e) => {
                  const subId = e.target.value;
                  const subName = subcontractors.find(s => s.id === subId)?.name || '';
                  handleQuickExpenseChange(e);
                  setQuickExpense(prev => ({
                    ...prev,
                    subcontractorId: subId,
                    subcontractorName: subName
                  }));
                }}
              >
                <MenuItem value="">None</MenuItem>
                {subcontractors.map(sub => (
                  <MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                margin="dense"
                label="Date"
                name="date"
                type="date"
                value={quickExpense.date}
                onChange={handleQuickExpenseChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewExpenseDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleAddQuickExpense()} 
            variant="contained" 
            disabled={!quickExpense.category || quickExpense.amount <= 0 || !quickExpense.phaseId}
          >
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProjectDetailPage;