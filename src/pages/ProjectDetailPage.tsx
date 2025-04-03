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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemText,
  Alert,
  FormHelperText,
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
  Money as MoneyIcon,
  Category as CategoryIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
  BusinessCenter as BusinessCenterIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  Task as TaskIcon,
  ReceiptLong as ReceiptLongIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ProjectService } from '../services/project';
import { ExpenseService } from '../services/expense';
import { BidService } from '../services/bid';
import { SubcontractorService } from '../services/subcontractor';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import PageLayout from '../components/layout/PageLayout';
import ProjectTaskManager from '../components/projects/ProjectTaskManager';
import TemplateAdjuster from '../components/projects/TemplateAdjuster';
import { Project, Task, Phase, Expense, Bid, Subcontractor, BidPaymentStage, ProjectPhase } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Import extracted tab components
import ProjectOverviewTab from '../components/projects/detailTabs/ProjectOverviewTab';
import ProjectPhasesTab from '../components/projects/detailTabs/ProjectPhasesTab';
import ProjectBidsTab from '../components/projects/detailTabs/ProjectBidsTab';
import ProjectExpensesTab from '../components/projects/detailTabs/ProjectExpensesTab';
import ProjectDocumentsTab from '../components/projects/detailTabs/ProjectDocumentsTab';
// Import header actions component
import ProjectDetailHeaderActions from '../components/projects/ProjectDetailHeaderActions';
// Import metric cards component
import ProjectMetricCards from '../components/projects/ProjectMetricCards';

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

import SubcontractorSelector from '../components/common/SubcontractorSelector';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Autocomplete from '@mui/material/Autocomplete';
import toast from 'react-hot-toast'; // Add toast import

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

// Project detail page with phases, progress tracking, and expense breakdowns
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

// Add a constant for construction specialties near the top of the file where other constants are defined
const CONSTRUCTION_SPECIALTIES = [
  'General Contractor',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Masonry',
  'Drywall',
  'Painting',
  'Roofing',
  'Flooring',
  'Concrete',
  'Excavation',
  'Demolition',
  'Landscaping',
  'Glass & Windows',
  'Insulation',
  'Site Work',
  'Steel & Metal',
  'Tile & Stone',
  'Other'
];

// Project detail page with phases, progress tracking, and expense breakdowns
const ProjectDetailPage: React.FC = () => {
  console.log('--- Rendering ProjectDetailPage ---'); // Test edit
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
  const [templateAdjusterOpen, setTemplateAdjusterOpen] = useState(false);
  
  // State for quick bid and expense dialogs
  const [newBidDialogOpen, setNewBidDialogOpen] = useState(false);
  const [currentPhaseForBid, setCurrentPhaseForBid] = useState<string | null>(null);
  const [quickBid, setQuickBid] = useState<QuickBid>({
    phaseId: '',
    contractorName: '',
    amount: 0,
    description: '',
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
  
  // State for expense dialog
  const [newExpenseDialogOpen, setNewExpenseDialogOpen] = useState(false);
  const [currentPhaseForExpense, setCurrentPhaseForExpense] = useState<string | null>(null);
  const [currentExpenseData, setCurrentExpenseData] = useState({
    phaseId: '',
    category: 'other' as const,
    amount: 0,
    description: '',
    date: new Date(),
    status: 'pending' as const,
    projectId: '',
    vendor: '',
    notes: '',
    subcontractorId: '',
    subcontractorName: '',
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
        fetchBids(project.id)
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
    // Reset form and open modal
    setEditingBidId(null);
    setBidForm({
      title: '',
      subcontractorName: '',
      subcontractorId: '',
      totalAmount: 0,
      // Set default phaseId and phaseName if phases exist
      phaseId: phases.length > 0 ? phases[0].id : '',
      phaseName: phases.length > 0 ? phases[0].name : '',
      scope: '',
      timeline: 30,
      paymentTerms: {
        downPaymentPercent: 20,
        installments: [
          {id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}
        ]
      },
      notes: '',
      status: 'submitted',
      attachments: [],
      tags: [] // Initialize empty tags array
    });
    setBidFormOpen(true);
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
    
    // If the field is 'status', auto-save this specific change
    if (field === 'status') {
      handleAutoSavePhase(phaseId, field, value);
    }
  };
  
  // Auto-save a phase update to the database
  const handleAutoSavePhase = async (phaseId: string, field: string, value: any) => {
    if (!project?.id || !user?.uid) return;
    
    try {
      // Set loading state for feedback
      setIsSaving(true);
      
      // Get the updated phase
      const updatedPhase = {
        ...phasesBeingUpdated[phaseId],
        [field]: value,
        updatedAt: new Date()
      };
      
      // Update the phases array in the project
      const updatedPhases = phases.map(phase => 
        phase.id === phaseId ? updatedPhase : phase
      );
      
      // Save to database
      await ProjectService.updateProject(project.id, {
        phases: updatedPhases
      });
      
      // Update local state
      setPhases(updatedPhases);
      
      // Show success notification
      showNotification(`Phase ${updatedPhase.name} updated successfully`, 'success');
      
      console.log(`Auto-saved phase update: ${phaseId}, ${field} = ${value}`);
    } catch (error) {
      console.error('Error auto-saving phase update:', error);
      showNotification('Failed to save phase update: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
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
      id: uuidv4(),
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
  const handleOpenQuickExpenseDialog = (phaseId?: string) => { // Make phaseId optional
    setCurrentExpenseData(prev => ({
      ...prev,
      phaseId: phaseId || '',
      projectId: project?.id || '',
    }));
    setCurrentPhaseForExpense(phaseId || null); // Pass null if phaseId is undefined
    setNewExpenseDialogOpen(true);
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
  const handleAddQuickExpense = async (expense: Partial<Expense>) => {
    if (!project || !user?.uid) return;
    
    try {
      // Ensure we have a valid date
      const expenseDate = expense.date instanceof Date 
        ? expense.date 
        : new Date(expense.date || new Date());

      const newExpense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        ...expense,
        projectId: project.id,
        phaseId: currentPhaseForExpense || expense.phaseId || '',
        phaseName: phases.find(p => p.id === (currentPhaseForExpense || expense.phaseId))?.name || '',
        // Set buildingPhase to the same value as phaseName for backward compatibility
        buildingPhase: phases.find(p => p.id === (currentPhaseForExpense || expense.phaseId))?.name || '',
        status: expense.status || 'pending',
        amount: expense.amount || 0,
        description: expense.description || '',
        category: expense.category || 'other',
        date: expenseDate,
        vendor: expense.vendor || '',
        notes: expense.notes || '',
        subcontractorId: expense.subcontractorId || '',
        subcontractorName: expense.subcontractorName || '',
        receiptUrl: expense.receiptUrl || '',
        lineItems: expense.lineItems || [],
        paymentDetails: expense.status === 'paid' ? expense.paymentDetails : undefined
      };
      
      console.log('Adding new expense:', newExpense);
      
      const savedExpense = await ExpenseService.createExpense(user.uid, newExpense);
      
      // Update the expenses state
      setExpenses(prevExpenses => [...prevExpenses, savedExpense]);
      
      // Find and update the phase with the new expense
      if (newExpense.phaseId) {
        const phaseToUpdate = phases.find(p => p.id === newExpense.phaseId);
        if (phaseToUpdate) {
          const newTotalActualCost = (phaseToUpdate.actualCost || 0) + newExpense.amount;
          
          // Update phases in both the main phases state and phasesBeingUpdated
          const updatedPhase = { ...phaseToUpdate, actualCost: newTotalActualCost };
          
          setPhases(prevPhases => 
            prevPhases.map(phase => 
              phase.id === newExpense.phaseId ? updatedPhase : phase
            )
          );
          
          if (quickUpdateMode) {
            // Add type check to ensure phaseId is a valid string
            const phaseId = String(newExpense.phaseId);
            setPhasesBeingUpdated(prev => ({
              ...prev,
              [phaseId]: updatedPhase
            }));
          }
          
          // Update project with the new phases
          if (project) {
            const updatedProject = { 
              ...project,
              phases: phases.map(phase => 
                phase.id === newExpense.phaseId ? updatedPhase : phase
              )
            };
            
            // Update project in the database
            await ProjectService.updateProject(project.id, {
              phases: updatedProject.phases
            });
            
            setProject(updatedProject);
          }
        }
      }
      
      // Also update the project actual cost in the database
      if (project) {
        const newProjectActualCost = (project.actualCost || 0) + newExpense.amount;
        
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
      
      // Close the dialog
      setNewExpenseDialogOpen(false);
      setCurrentPhaseForExpense(null);
      
      showNotification('Expense added successfully', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('Failed to add expense: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  // Update the refreshPhaseExpenses function to properly handle quick update mode
  const refreshPhaseExpenses = useCallback(() => {
    if (!project?.id || !user?.uid) return;
    
    // Log all phases and expenses for debugging
    console.log('Phases:', phases);
    console.log('Expenses:', expenses);
    
    // Create a map of phase IDs to names for lookup
    const phaseNameMap = phases.reduce((acc, phase) => {
      acc[phase.id] = phase.name;
      return acc;
    }, {} as Record<string, string>);
    
    const expensesByPhase = expenses.reduce((acc, expense) => {
      // First try to get phaseId directly
      let phaseId = expense.phaseId;
      
      // If no phaseId, try to find a matching phase by name
      if (!phaseId) {
        // Use phaseName or fall back to buildingPhase
        const phaseName = expense.phaseName || expense.buildingPhase;
        if (phaseName) {
          // Find the phase with a matching name (try exact match first)
          let matchingPhase = phases.find(p => 
            p.name.toLowerCase() === phaseName.toLowerCase()
          );
          
          // If no exact match, try partial matching
          if (!matchingPhase) {
            matchingPhase = phases.find(p => 
              p.name.toLowerCase().includes(phaseName.toLowerCase()) || 
              phaseName.toLowerCase().includes(p.name.toLowerCase())
            );
          }
          
          if (matchingPhase) {
            phaseId = matchingPhase.id;
            console.log(`Matched expense ${expense.id} to phase ${phaseId} by name "${phaseName}" -> "${matchingPhase.name}"`);
          } else {
            console.warn(`No matching phase found for expense with phase name "${phaseName}"`, 
              { expense, availablePhases: phases.map(p => p.name) });
          }
        }
      }
      
      if (phaseId) {
        if (!acc[phaseId]) {
          acc[phaseId] = [];
        }
        acc[phaseId].push(expense);
      } else {
        console.warn(`Expense ${expense.id} has no associated phase`, expense);
      }
      
      return acc;
    }, {} as Record<string, Expense[]>);
    
    // Calculate total expenses for each phase
    const phaseTotals = Object.entries(expensesByPhase).reduce((acc, [phaseId, phaseExpenses]) => {
      acc[phaseId] = phaseExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      return acc;
    }, {} as Record<string, number>);
    
    // Update phasesBeingUpdated with new expense totals
    if (quickUpdateMode) {
      setPhasesBeingUpdated(prev => {
        const updated = { ...prev };
        Object.entries(phaseTotals).forEach(([phaseId, total]) => {
          if (updated[phaseId]) {
            updated[phaseId] = {
              ...updated[phaseId],
              actualCost: total
            };
          } else {
            console.warn(`Phase ID ${phaseId} from expenses not found in phasesBeingUpdated`);
          }
        });
        
        // Debug: log the result
        console.log('Updated phasesBeingUpdated:', updated);
        return updated;
      });
    }
    
    // Log how many expenses are associated with each phase
    Object.entries(expensesByPhase).forEach(([phaseId, phaseExpenses]) => {
      const phaseName = phaseNameMap[phaseId] || 'Unknown';
      console.log(`Phase "${phaseName}" (${phaseId}) has ${phaseExpenses.length} expenses, total: ${phaseTotals[phaseId]}`);
    });
  }, [project?.id, user?.uid, expenses, quickUpdateMode, phases]);

  // Add a useEffect to reset and refresh expenses when toggling quick update mode
  useEffect(() => {
    // Only run this effect when quick update mode changes
    if (quickUpdateMode && project?.id && user?.uid) {
      console.log('Quick update mode toggled, refreshing expense data');
      
      // Debug: Log all expenses and their phase information
      console.log('All expenses:', expenses);
      console.log('Expense phase info:', expenses.map(e => ({ 
        id: e.id, 
        phaseId: e.phaseId,
        phaseName: e.phaseName,
        buildingPhase: e.buildingPhase,
        description: e.description,
        amount: e.amount
      })));
      console.log('All phases:', phases.map(p => ({ id: p.id, name: p.name, budget: p.budget })));
      
      // Check for phase ID mismatches
      const phaseIdsSet = new Set(phases.map(p => p.id));
      const orphanedExpenses = expenses.filter(e => e.phaseId && !phaseIdsSet.has(e.phaseId));
      if (orphanedExpenses.length > 0) {
        console.warn('Found expenses with phaseIds that don\'t match any phases:', orphanedExpenses);
      }
      
      // Initialize phase updates with all expenses properly matched
      // First create a map of all phases
      const phaseUpdates = phases.reduce((acc, phase) => {
        acc[phase.id] = { ...phase, actualCost: 0 }; // Reset actual cost to recalculate
        return acc;
      }, {} as { [id: string]: ProjectPhase });
      
      // Then assign expenses to phases
      for (const expense of expenses) {
        // Try to match by phase ID first
        let matchedPhaseId = expense.phaseId;
        
        // If no direct ID match, try to match by name
        if (!matchedPhaseId || !phaseUpdates[matchedPhaseId]) {
          const expPhaseName = expense.phaseName || expense.buildingPhase;
          if (expPhaseName) {
            // Find a matching phase by name
            const matchingPhase = phases.find(p => 
              p.name.toLowerCase() === expPhaseName.toLowerCase() ||
              p.name.toLowerCase().includes(expPhaseName.toLowerCase()) ||
              expPhaseName.toLowerCase().includes(p.name.toLowerCase())
            );
            
            if (matchingPhase) {
              matchedPhaseId = matchingPhase.id;
              console.log(`Matched expense "${expense.description}" ($${expense.amount}) to phase "${matchingPhase.name}" via name matching`);
            }
          }
        }
        
        // Update the phase's actual cost if we found a match
        if (matchedPhaseId && phaseUpdates[matchedPhaseId]) {
          phaseUpdates[matchedPhaseId].actualCost += expense.amount || 0;
          console.log(`Added expense $${expense.amount} to phase "${phaseUpdates[matchedPhaseId].name}"`);
        }
      }
      
      // Log the resulting phase costs
      console.log('Phase costs after expense calculation:',
        Object.entries(phaseUpdates).map(([id, phase]) => ({
          id,
          name: phase.name,
          budget: phase.budget,
          actualCost: phase.actualCost
        }))
      );
      
      setPhasesBeingUpdated(phaseUpdates);
    }
  }, [quickUpdateMode, project?.id, user?.uid, phases, expenses]);

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
    
    // Calculate actual costs from expenses instead of phases
    const totalActual = expenses.reduce((sum, expense) => {
      // Only count paid and approved expenses as "spent"
      if (expense.status === 'paid' || expense.status === 'approved') {
        return sum + (typeof expense.amount === 'number' ? expense.amount : 0);
      }
      return sum;
    }, 0);
    
    return {
      totalBudget,
      totalActual,
      difference: totalBudget - totalActual,
      percentUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    };
  }, [phases, project?.budget, expenses]);

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

  // Handle opening the template adjuster modal
  const handleOpenTemplateAdjuster = () => {
    setTemplateAdjusterOpen(true);
  };

  // Handle closing the template adjuster modal
  const handleCloseTemplateAdjuster = () => {
    setTemplateAdjusterOpen(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  // Add a new useMemo for expense breakdown
  const expenseBreakdown = useMemo(() => {
    const breakdown = {
      pending: 0,
      approved: 0,
      paid: 0,
      rejected: 0
    };
    
    expenses.forEach(expense => {
      const amount = typeof expense.amount === 'number' ? expense.amount : 0;
      if (expense.status === 'pending') {
        breakdown.pending += amount;
      } else if (expense.status === 'approved') {
        breakdown.approved += amount;
      } else if (expense.status === 'paid') {
        breakdown.paid += amount;
      } else if (expense.status === 'rejected') {
        breakdown.rejected += amount;
      }
    });
    
    return breakdown;
  }, [expenses]);

  // Update the state with proper bid form fields
  const [bidFormOpen, setBidFormOpen] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [bidForm, setBidForm] = useState<{
    title: string;
    subcontractorName: string;
    subcontractorId?: string;
    totalAmount: number;
    phaseId?: string;
    phaseName?: string;
    scope: string;
    timeline: number;
    submissionDeadline?: Date;
    paymentTerms: {
      downPaymentPercent: number;
      installments: {id: string; name: string; percent: number; milestoneDescription: string; phaseId?: string; phaseName?: string}[];
    };
    notes: string;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
    attachments: string[]; // Must be string[] to match BidService expectations
    tags: string[];
  }>({
    title: '',
    subcontractorName: '',
    totalAmount: 0,
    scope: '',
    timeline: 30,
    paymentTerms: {
      downPaymentPercent: 20,
      installments: [
        {id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}
      ]
    },
    notes: '',
    status: 'submitted',
    attachments: [], // Initialize as an empty array
    tags: []
  });
  
  // Add payment template state
  const [paymentTemplate, setPaymentTemplate] = useState('standard');

  // Add a function to handle payment template changes after the handleCloseBidForm function
  const handlePaymentTemplateChange = (e: SelectChangeEvent<string>) => {
    const template = e.target.value;
    setPaymentTemplate(template);
    
    // Get default phase for new payments
    const defaultPhase = phases.length > 0 ? phases[0] : null;
    
    // Update payment terms based on template
    switch(template) {
      case 'standard':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 50,
            installments: [
              {
                id: uuidv4(), 
                name: 'Final Payment', 
                percent: 50, 
                milestoneDescription: 'Upon completion',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              }
            ]
          }
        }));
        break;
      case 'trades':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 30,
            installments: [
              {
                id: uuidv4(), 
                name: 'Rough-In', 
                percent: 40, 
                milestoneDescription: 'After rough-in inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              },
              {
                id: uuidv4(), 
                name: 'Final/Top-Out', 
                percent: 30, 
                milestoneDescription: 'After final inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              }
            ]
          }
        }));
        break;
      case 'custom':
        // Keep current values, user will modify manually
        break;
    }
  };

  // Add a list of recently added bids for comparison
  const [recentBids, setRecentBids] = useState<Bid[]>([]);

  const handleCloseBidForm = () => {
    setBidFormOpen(false);
    setEditingBidId(null);
  };

  const handleChangeBidForm = (field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePaymentTerms = (field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        [field]: value
      }
    }));
  };

  const handleAddInstallment = () => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: [
          ...prev.paymentTerms.installments,
          {id: uuidv4(), name: `Installment ${prev.paymentTerms.installments.length + 1}`, percent: 0, milestoneDescription: ''}
        ]
      }
    }));
    setPaymentTemplate('custom'); // Set to custom when installments are modified
  };

  const handleChangeInstallment = (id: string, field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.map(item => 
          item.id === id ? {...item, [field]: value} : item
        )
      }
    }));
    setPaymentTemplate('custom'); // Set to custom when installments are modified
  };

  const handleRemoveInstallment = (id: string) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.filter(item => item.id !== id)
      }
    }));
    setPaymentTemplate('custom'); // Set to custom when installments are modified
  };

  // Add a utility function to clean objects before sending to Firestore
  const removeUndefinedFields = (obj: any): any => {
    const cleanObj = { ...obj };
    
    // Special handling for certain fields that need to be null in Firestore
    const fieldsToMakeNull = ['submissionDeadline', 'startDate', 'completionDate', 'dueDate'];
    
    Object.keys(cleanObj).forEach(key => {
      if (cleanObj[key] === undefined) {
        // For fields that Firestore expects, convert undefined to null
        if (fieldsToMakeNull.includes(key)) {
          cleanObj[key] = null;
        } else {
          delete cleanObj[key];
        }
      } else if (cleanObj[key] === null) {
        // Keep null values as is
      } else if (typeof cleanObj[key] === 'object' && cleanObj[key] !== null) {
        // Recursively clean nested objects
        cleanObj[key] = removeUndefinedFields(cleanObj[key]);
      }
    });
    return cleanObj;
  };

  // Update the handleSubmitBid function to properly handle date fields and undefined values
  const handleSubmitBid = async () => {
    if (!user || !project?.id) return;
    
    // Validate required fields
    if (!bidForm.title) {
      showNotification('Please enter a title for the bid', 'error');
      return;
    }
    
    if (!bidForm.subcontractorName) {
      showNotification('Please select or enter a subcontractor name', 'error');
      return;
    }
    
    if (!bidForm.phaseId && phases.length > 0) {
      // If phaseId is not set but phases exist, use the first phase as default
      handleChangeBidForm('phaseId', phases[0].id);
      handleChangeBidForm('phaseName', phases[0].name);
      showNotification('No phase selected - using first project phase by default', 'info');
    } else if (!bidForm.phaseId) {
      showNotification('Please select a phase for this bid', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Calculate total percentage to ensure it adds up to 100%
      const downPaymentPercent = bidForm.paymentTerms.downPaymentPercent;
      const installmentsTotal = bidForm.paymentTerms.installments.reduce((sum, item) => sum + item.percent, 0);
      const totalPercent = downPaymentPercent + installmentsTotal;
      
      if (totalPercent !== 100) {
        showNotification('Payment percentages must add up to 100%', 'error');
        setIsSaving(false);
        return;
      }
      
      const now = new Date();
      
      // Create payment schedule for bid with explicit date objects
      const paymentSchedule = [
        {
          id: uuidv4(),
          name: 'Down Payment',
          percentage: downPaymentPercent,
          amount: (bidForm.totalAmount * downPaymentPercent) / 100,
          status: 'pending',
          phaseId: bidForm.phaseId,
          phaseName: bidForm.phaseName,
          dueDate: now,
          description: 'Initial payment to start work',
          createdAt: now,
          updatedAt: now
        } as BidPaymentStage,
        ...bidForm.paymentTerms.installments.map(installment => ({
          id: uuidv4(),
          name: installment.name,
          percentage: installment.percent,
          amount: (bidForm.totalAmount * installment.percent) / 100,
          status: 'pending',
          phaseId: installment.phaseId || bidForm.phaseId,
          phaseName: installment.phaseName || bidForm.phaseName,
          dueDate: now,
          description: installment.milestoneDescription,
          createdAt: now,
          updatedAt: now
        } as BidPaymentStage))
      ] as BidPaymentStage[];
      
      // Create base bid data object with explicit null values for Date fields that can't be undefined
      const bidData = {
        userId: user.uid,
        projectId: project.id,
        title: bidForm.title || '',
        subcontractorName: bidForm.subcontractorName || '',
        subcontractorId: bidForm.subcontractorId || '',
        phaseId: bidForm.phaseId || '',
        phaseName: bidForm.phaseName || '',
        totalAmount: bidForm.totalAmount || 0,
        scope: bidForm.scope || '',
        timeline: bidForm.timeline || 0,
        notes: bidForm.notes || '',
        status: bidForm.status || 'draft',
        tags: Array.isArray(bidForm.tags) ? bidForm.tags : [],
        attachments: [],
        // Set date fields explicitly to null if invalid
        submissionDeadline: null, // Default to null, will override if valid below
        startDate: null,
        completionDate: null,
        paymentSchedule,
        updatedAt: now,
        paymentProgress: {
          paid: 0,
          pending: bidForm.totalAmount,
          remaining: bidForm.totalAmount
        }
      } as any;
      
      // Only set date fields if they are valid Date objects
      if (bidForm.submissionDeadline instanceof Date && !isNaN(bidForm.submissionDeadline.getTime())) {
        bidData.submissionDeadline = bidForm.submissionDeadline;
      }
      
      // Clean any remaining undefined fields
      const cleanBidData = removeUndefinedFields(bidData);
      
      // Check if we're updating an existing bid or creating a new one
      if (editingBidId) {
        // Update existing bid
        await BidService.updateBid(editingBidId, cleanBidData);
        
        // Update bid in local state
        setBids(prev => prev.map(b => b.id === editingBidId ? { ...b, ...cleanBidData, id: editingBidId } : b));
        
        // Show success notification
        showNotification('Bid updated successfully', 'success');
      } else {
        // Generate ID and create final bid object for new bid
        const newBidId = uuidv4();
        const newBid: Bid = {
          id: newBidId,
          ...cleanBidData,
          createdAt: now,
        } as Bid;
        
        // Double-check submissionDeadline before sending to Firestore
        if (newBid.submissionDeadline === undefined) {
          (newBid as any).submissionDeadline = null;
        }
        
        // Save new bid to database
        await BidService.createBid(user.uid, newBid);
        
        // Add to local state
        setBids(prev => [...prev, newBid]);
        
        // Add to recent bids for easy comparison
        setRecentBids(prev => [newBid, ...prev].slice(0, 5));
        
        // Show success notification
        showNotification('Bid added successfully', 'success');
      }
      
      // Reset editing state
      setEditingBidId(null);
      
      // Close dialog
      setBidFormOpen(false);
    } catch (error) {
      console.error('Error saving bid:', error);
      showNotification('Failed to save bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add additional state variables for subcontractor management
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [subcontractorSearchQuery, setSubcontractorSearchQuery] = useState('');
  const [showQuickAddSubcontractor, setShowQuickAddSubcontractor] = useState(false);
  const [newSubcontractor, setNewSubcontractor] = useState({
    name: '',
    specialty: '',
    contact: {
      phone: '',
      email: ''
    }
  });

  // Add a function to fetch subcontractors
  const fetchSubcontractors = async () => {
    if (!user?.uid) return;
    
    try {
      const fetchedSubcontractors = await SubcontractorService.getSubcontractors(user.uid);
      setSubcontractors(fetchedSubcontractors);
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
    }
  };

  // Fetch subcontractors when bid form opens
  useEffect(() => {
    if (bidFormOpen) {
      fetchSubcontractors();
    }
  }, [bidFormOpen, user?.uid]);

  // Function to handle quick add of a new subcontractor
  const handleQuickAddSubcontractor = async () => {
    if (!user?.uid) return;
    
    try {
      setIsSaving(true);
      
      // Create basic subcontractor
      const subcontractorData: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: newSubcontractor.name,
        specialty: newSubcontractor.specialty,
        contact: {
          phone: newSubcontractor.contact.phone,
          email: newSubcontractor.contact.email
        },
        rating: 0,
        totalProjects: 0
        // Remove createdAt and updatedAt as they're added by the service
      };
      
      const createdSubcontractor = await SubcontractorService.createSubcontractor(user.uid, subcontractorData);
      
      // Add to local state
      setSubcontractors(prev => [createdSubcontractor, ...prev]);
      
      // Update bid form with the new subcontractor
      setBidForm(prev => ({
        ...prev,
        subcontractorName: createdSubcontractor.name,
        subcontractorId: createdSubcontractor.id
      }));
      
      // Reset and close quick add form
      setNewSubcontractor({
        name: '',
        specialty: '',
        contact: {
          phone: '',
          email: ''
        }
      });
      setShowQuickAddSubcontractor(false);
      
      // Show success notification
      showNotification('Subcontractor added successfully', 'success');
    } catch (error) {
      console.error('Error adding subcontractor:', error);
      showNotification('Failed to add subcontractor: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add tag handling functions
  const handleAddTag = (tag: string) => {
    if (tag && !bidForm.tags.includes(tag)) {
      setBidForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setBidForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Add state for tag input
  const [tagInput, setTagInput] = useState('');

  // Add these functions back which were removed
  
  const handleEditBid = (bidId: string) => {
    // Find the bid to edit
    const bidToEdit = bids.find(b => b.id === bidId);
    
    if (bidToEdit) {
      // Store the ID of the bid being edited
      setEditingBidId(bidId);
      
      // Get the payment schedule from the bid, if any
      const paymentSchedule = bidToEdit.paymentSchedule || [];
      
      // Calculate down payment and installments from payment schedule
      let downPaymentPercent = 20; // Default
      let installments = [{id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}];
      
      if (paymentSchedule.length > 0) {
        // Find down payment
        const downPayment = paymentSchedule.find(p => p.name === 'Down Payment');
        if (downPayment) {
          downPaymentPercent = downPayment.percentage || 20;
        }
        
        // Extract installments (all except down payment)
        const installmentPayments = paymentSchedule.filter(p => p.name !== 'Down Payment');
        if (installmentPayments.length > 0) {
          installments = installmentPayments.map(p => ({
            id: p.id || uuidv4(),
            name: p.name || 'Installment',
            percent: p.percentage || 0,
            milestoneDescription: p.description || '',
            phaseId: p.phaseId || bidToEdit.phaseId,
            phaseName: p.phaseName || bidToEdit.phaseName
          }));
        }
      }
      
      // Populate the form with the bid data, matching the structure in handleAddBid
      setBidForm({
        title: bidToEdit.title || '',
        subcontractorName: bidToEdit.subcontractorName || '',
        subcontractorId: bidToEdit.subcontractorId || '',
        totalAmount: bidToEdit.totalAmount || 0,
        phaseId: bidToEdit.phaseId || (phases.length > 0 ? phases[0].id : ''),
        phaseName: bidToEdit.phaseName || (phases.length > 0 ? phases[0].name : ''),
        scope: bidToEdit.scope || '',
        timeline: bidToEdit.timeline || 30,
        paymentTerms: {
          downPaymentPercent: downPaymentPercent,
          installments: installments
        },
        notes: bidToEdit.notes || '',
        status: (bidToEdit.status === 'draft' || 
                bidToEdit.status === 'submitted' || 
                bidToEdit.status === 'accepted' || 
                bidToEdit.status === 'rejected' || 
                bidToEdit.status === 'expired') 
                ? bidToEdit.status 
                : 'submitted',
        attachments: Array.isArray(bidToEdit.attachments) 
                    ? bidToEdit.attachments.map(att => typeof att === 'string' ? att : (att && typeof att === 'object' && 'url' in att ? att.url : ''))
                    : [],
        tags: bidToEdit.tags || []
      });
      
      // Open the form modal
      setBidFormOpen(true);
    } else {
      console.error(`Bid with ID ${bidId} not found`);
    }
  };
  
  const handleDeleteBid = (bidId: string) => {
    // Delete bid
    if (!window.confirm('Are you sure you want to delete this bid?')) {
      return;
    }
    
    try {
      // Delete from database
      BidService.deleteBid(bidId)
        .then(() => {
          // If successful, update local state
          setBids(prevBids => prevBids.filter(b => b.id !== bidId));
          showNotification('Bid deleted successfully', 'success');
        })
        .catch(error => {
          console.error('Error deleting bid:', error);
          showNotification('Failed to delete bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        });
    } catch (error) {
      console.error('Error deleting bid:', error);
      showNotification('Failed to delete bid', 'error');
    }
  };

  // Cancel quick updates
  const handleCancelQuickUpdates = () => {
    setQuickUpdateMode(false);
    setPhasesBeingUpdated({});
  };
  
  // Initialize phases for quick update
  const handleEnterQuickUpdateMode = () => {
    setQuickUpdateMode(true);
  };
  
  // Add a useEffect to refresh expenses when quick update mode is activated
  useEffect(() => {
    // Whenever quick update mode changes, ensure expenses are fresh
    if (quickUpdateMode && project?.id && user?.uid) {
      console.log('Quick update mode active, refreshing phase expenses');
      refreshPhaseExpenses();
    }
  }, [quickUpdateMode, project?.id, user?.uid]); // Remove expenses and phases from dependencies

  // Save all phase updates at once
  const handleSaveQuickUpdates = async () => {
    if (!project?.id || !user?.uid) return;
    
    try {
      // Show loading state
      setIsSaving(true);
      
      // Convert back to array format
      const updatedPhases = Object.values(phasesBeingUpdated);
      
      // Save to database
      await ProjectService.updateProject(project.id, {
        phases: updatedPhases
      });
      
      // Update local state
      setPhases(updatedPhases);
      setQuickUpdateMode(false);
      
      // Show success notification
      showNotification('All phase updates saved successfully', 'success');
    } catch (error) {
      console.error('Error saving phase updates:', error);
      showNotification('Failed to save updates: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to render Quick Update Mode section (extracted for clarity)
  const renderQuickUpdateMode = () => (
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
                      {phasesBeingUpdated[phase.id]?.progress || phase.progress || 0}% Complete
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
                          bgcolor: (phasesBeingUpdated[phase.id]?.status || phase.status) === status 
                            ? alpha(getStatusColor(status), 0.15)
                            : alpha(theme.palette.background.default, 0.6),
                          color: (phasesBeingUpdated[phase.id]?.status || phase.status) === status 
                            ? getStatusColor(status)
                            : theme.palette.text.secondary,
                          borderRadius: '12px',
                          border: `1px solid ${alpha(getStatusColor(status), (phasesBeingUpdated[phase.id]?.status || phase.status) === status ? 0.5 : 0.1)}`,
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
                        width: `${(phasesBeingUpdated[phase.id]?.status || phase.status) === 'completed' ? 100 : (phasesBeingUpdated[phase.id]?.status || phase.status) === 'in_progress' ? 50 : (phasesBeingUpdated[phase.id]?.status || phase.status) === 'delayed' ? 25 : 0}%`,
                        bgcolor: getStatusColor(phasesBeingUpdated[phase.id]?.status || phase.status),
                        borderRadius: 3,
                        transition: 'width 0.5s ease-in-out',
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      Budget Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {(phasesBeingUpdated[phase.id]?.actualCost || phase.actualCost || 0) > phase.budget && (
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
                    <Typography variant="body2" color="text.primary">{formatCurrency(phase.budget)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  // Helper function to render Recent Expenses section (extracted for clarity)
  const renderRecentExpenses = () => (
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
            const phaseName = expense.phaseName || phases.find(p => p.id === expense.phaseId)?.name || expense.buildingPhase || 'Unknown Phase';
            return (
              <Grid item xs={12} sm={6} md={6} lg={4} key={expense.id}>
                {/* Simplified Card structure for brevity - reconstruct if needed */}
                 <Card elevation={2} sx={{ p: 0, borderRadius: 2, height: '100%' }}>
                   <CardContent>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between'}}>
                       <Chip label={expense.category} size="small" />
                       <Typography variant="h6" fontWeight={700}>{formatCurrency(expense.amount)}</Typography>
                     </Box>
                     <Typography variant="body2" sx={{ my: 1 }}>{expense.description || 'No description'}</Typography>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                       <Typography variant="caption">Phase: {phaseName}</Typography>
                       <Typography variant="caption">Date: {formatDate(expense.date)}</Typography>
                     </Box>
                   </CardContent>
                 </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Paper>
  );

  // Loading and Error states
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
        <Alert severity="error" sx={{ mt: 3 }}>{error || 'Project not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </PageLayout>
    );
  }

  // Main component return statement (Corrected Structure)
  return (
    <>
      <PageLayout
        title={project.name}
        subtitle={`Project #${project.id?.substr(-6) || ''}`}
        icon={BusinessIcon}
        actions={
          <ProjectDetailHeaderActions
            isMobile={isMobile}
            isSmall={isSmall}
            quickUpdateMode={quickUpdateMode}
            isSaving={isSaving}
            theme={theme}
            menuAnchorEl={menuAnchorEl}
            handleEnterQuickUpdateMode={handleEnterQuickUpdateMode}
            handleEdit={handleEdit}
            handleMenuOpen={handleMenuOpen}
            handleCancelQuickUpdates={handleCancelQuickUpdates}
            handleSaveQuickUpdates={handleSaveQuickUpdates}
            handleMenuClose={handleMenuClose}
            handleAddPhase={handleAddPhase}
            handleAddBid={handleAddBid}
            handleDelete={handleDelete}
          />
        }
      >
        {/* Quick Update Interface */}
        {quickUpdateMode && renderQuickUpdateMode()}

        {/* Recent Expenses in Quick Update Mode */}
        {quickUpdateMode && expenses.length > 0 && renderRecentExpenses()}

        {/* Project Overview and Key Metrics */}
        <ProjectMetricCards 
          project={project}
          projectProgress={projectProgress}
          budgetData={budgetData}
          expenseBreakdown={expenseBreakdown}
          timeline={timeline}
          theme={theme}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
        
        {/* Project Detail Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ '& .MuiTab-root': { textTransform: 'none', minHeight: 48, fontSize: '0.9rem' } }}
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
          {tabValue === 0 && (
            <ProjectOverviewTab
              project={project}
              phases={phases}
              expenses={expenses} 
              budgetData={budgetData} 
              expensesData={expensesData}
              handleAddPhase={handleAddPhase}
              combinedExpenses={combinedExpenses} 
              theme={theme} 
            />
          )}
          {tabValue === 1 && (
            <ProjectPhasesTab
              phases={phases}
              bids={bids}
              theme={theme}
              handleAddPhase={handleAddPhase}
              handleUpdatePhase={handleUpdatePhase}
              handleDeletePhase={handleDeletePhase}
              handleOpenQuickBidDialog={handleOpenQuickBidDialog}
              handleOpenTemplateAdjuster={handleOpenTemplateAdjuster}
              getStatusColor={getStatusColor}
              formatCurrency={formatCurrency}
            />
          )}
          {tabValue === 2 && (
            <ProjectBidsTab
              bids={bids}
              recentBids={recentBids}
              theme={theme}
              handleAddBid={handleAddBid}
              handleEditBid={handleEditBid}
              handleDeleteBid={handleDeleteBid}
              formatCurrency={formatCurrency}
              formatDate={formatDate} 
            />
          )}
          {tabValue === 3 && (
            <ProjectExpensesTab
              expenses={expenses}
              expensesData={expensesData}
              phases={phases}
              theme={theme}
              handleOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
              formatCurrency={formatCurrency}
            />
          )}
          {tabValue === 4 && (
            <ProjectTaskManager 
              project={project} 
              onProjectUpdate={handleProjectUpdate}
              userId={user?.uid || ''}
            />
          )}
          {tabValue === 5 && (
            <ProjectDocumentsTab /> 
          )}
        </Box>
      </PageLayout>

      {/* Dialogs, Snackbar, Modals outside PageLayout */}
      <Dialog open={newBidDialogOpen} onClose={() => setNewBidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contractor Bid</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Enter bid details to update phase cost.</DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth required margin="dense" label="Contractor Name" name="contractorName" value={quickBid.contractorName} onChange={handleQuickBidChange}/></Grid>
            <Grid item xs={12}><TextField fullWidth required margin="dense" label="Bid Amount" name="amount" type="number" value={quickBid.amount} onChange={handleQuickBidChange} InputProps={{startAdornment: <InputAdornment position="start">$</InputAdornment>}}/></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} margin="dense" label="Description" name="description" value={quickBid.description} onChange={handleQuickBidChange} placeholder="Work description"/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewBidDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddQuickBid} variant="contained" disabled={!quickBid.contractorName || quickBid.amount <= 0 || isSaving}> {isSaving ? <CircularProgress size={24} /> : 'Add Bid'} </Button>
        </DialogActions>
      </Dialog>

      <ExpenseFormModal
        open={newExpenseDialogOpen}
        onClose={() => { setNewExpenseDialogOpen(false); setCurrentPhaseForExpense(null); }}
        onSave={handleAddQuickExpense}
        projects={[{ id: project?.id || '', name: project?.name || '' }]}
        expense={currentExpenseData}
        projectPhases={phases}
        // isSaving={isSaving} // Removed prop
      />
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
      
      <TemplateAdjuster 
        open={templateAdjusterOpen}
        onClose={handleCloseTemplateAdjuster}
        project={project} 
        onUpdateProject={handleProjectUpdate}
      />

      <Dialog open={bidFormOpen} onClose={handleCloseBidForm} maxWidth="md" fullWidth>
        <DialogTitle><Typography variant="h6" fontWeight={600}> {editingBidId ? 'Edit Bid' : 'Add New Bid'} </Typography></DialogTitle>
        <DialogContent dividers>
           <Grid container spacing={3}>
             <Grid item xs={12} sm={6}><TextField fullWidth required label="Bid Title" value={bidForm.title} onChange={(e) => handleChangeBidForm('title', e.target.value)} /></Grid>
             <Grid item xs={12}><FormControl fullWidth required><InputLabel id="bid-phase-select-label">Project Phase</InputLabel><Select labelId="bid-phase-select-label" value={bidForm.phaseId || ''} label="Project Phase" onChange={(e) => { const phaseId = e.target.value; const phase = phases.find(p => p.id === phaseId); handleChangeBidForm('phaseId', phaseId); handleChangeBidForm('phaseName', phase?.name || ''); }}>{phases.map((phase) => (<MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>))}</Select></FormControl></Grid>
             <Grid item xs={12} sm={6}><Autocomplete fullWidth options={subcontractors} getOptionLabel={(option) => option.name} isOptionEqualToValue={(option, value) => option.id === value.id} value={subcontractors.find(s => s.id === bidForm.subcontractorId) || null} onChange={(_, newValue) => { handleChangeBidForm('subcontractorName', newValue?.name || ''); handleChangeBidForm('subcontractorId', newValue?.id || ''); }} renderInput={(params) => (<TextField {...params} label="Subcontractor" required />)}/><Button size="small" color="primary" onClick={() => setShowQuickAddSubcontractor(true)} sx={{ mt: 1 }} startIcon={<AddIcon />}>Add New Sub</Button></Grid>
             <Grid item xs={12} sm={6}><TextField fullWidth required label="Total Amount" type="number" value={bidForm.totalAmount} onChange={(e) => handleChangeBidForm('totalAmount', parseFloat(e.target.value) || 0)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}/></Grid>
             <Grid item xs={12} sm={6}><TextField fullWidth required label="Timeline (days)" type="number" value={bidForm.timeline} onChange={(e) => handleChangeBidForm('timeline', parseInt(e.target.value) || 0)} /></Grid>
             <Grid item xs={12}><TextField fullWidth required multiline rows={3} label="Scope of Work" value={bidForm.scope} onChange={(e) => handleChangeBidForm('scope', e.target.value)} /></Grid>
             <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={bidForm.status} onChange={(e) => handleChangeBidForm('status', e.target.value as Bid['status'])} label="Status"><MenuItem value="draft">Draft</MenuItem><MenuItem value="submitted">Submitted</MenuItem><MenuItem value="accepted">Accepted</MenuItem><MenuItem value="rejected">Rejected</MenuItem><MenuItem value="expired">Expired</MenuItem></Select></FormControl></Grid>
             <Grid item xs={12}><Typography variant="subtitle2" gutterBottom>Tags</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}><>{bidForm.tags.map((tag) => (<Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} size="small" sx={{ borderRadius: 1 }}/>))}</><TextField size="small" variant="standard" placeholder="Add tag..." sx={{ flexGrow: 1, minWidth: 150 }} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); handleAddTag(tagInput.trim()); setTagInput(''); }}}/></Box></Grid>
             <Grid item xs={12}><Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Payment Terms</Typography><Divider sx={{ mb: 2 }}/><FormControl fullWidth sx={{ mb: 2 }}><InputLabel id="payment-template-label">Schedule Template</InputLabel><Select labelId="payment-template-label" value={paymentTemplate} label="Schedule Template" onChange={handlePaymentTemplateChange}><MenuItem value="standard">Standard (50/50)</MenuItem><MenuItem value="trades">Trades (30/40/30)</MenuItem><MenuItem value="custom">Custom</MenuItem></Select></FormControl><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth label="Down Payment (%)" type="number" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} value={bidForm.paymentTerms.downPaymentPercent} onChange={(e) => { const val = Math.max(0, Math.min(100, Number(e.target.value))); handleChangePaymentTerms('downPaymentPercent', val); setPaymentTemplate('custom'); }}/><FormHelperText>{formatCurrency(bidForm.totalAmount * bidForm.paymentTerms.downPaymentPercent / 100)}</FormHelperText></Grid><Grid item xs={12}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="subtitle2">Installments</Typography><Button size="small" startIcon={<AddIcon />} onClick={handleAddInstallment}>Add</Button></Box>{bidForm.paymentTerms.installments.map((installment) => (<Box key={installment.id} sx={{ p: 2, mb: 1, border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, borderRadius: 1, position: 'relative' }}><IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4 }} onClick={() => handleRemoveInstallment(installment.id)}><DeleteIcon fontSize="small"/></IconButton><Grid container spacing={2}><Grid item xs={12} sm={6}><TextField fullWidth required label="Name" value={installment.name} onChange={(e) => handleChangeInstallment(installment.id, 'name', e.target.value)}/></Grid><Grid item xs={12} sm={6}><TextField fullWidth required label="Percent (%)" type="number" value={installment.percent} onChange={(e) => { const val = Math.max(0, Number(e.target.value)); handleChangeInstallment(installment.id, 'percent', val); setPaymentTemplate('custom'); }} helperText={`${formatCurrency(bidForm.totalAmount * installment.percent / 100)}`}/></Grid><Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Phase</InputLabel><Select value={installment.phaseId || ''} label="Phase" onChange={(e) => { const pId = e.target.value; const pName = phases.find(p => p.id === pId)?.name || ''; handleChangeInstallment(installment.id, 'phaseId', pId); handleChangeInstallment(installment.id, 'phaseName', pName); }}>{phases.map((p) => (<MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>))}</Select></FormControl></Grid><Grid item xs={12}><TextField fullWidth label="Milestone Description" value={installment.milestoneDescription} onChange={(e) => handleChangeInstallment(installment.id, 'milestoneDescription', e.target.value)}/></Grid></Grid></Box>))}{bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0) !== 100 && (<Alert severity="warning" sx={{ mt: 1 }}>Percentages must total 100%</Alert>)}</Grid></Grid></Grid>
             <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Notes / Exclusions" value={bidForm.notes} onChange={(e) => handleChangeBidForm('notes', e.target.value)}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseBidForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitBid} disabled={ isSaving || !bidForm.title || !bidForm.subcontractorName || !bidForm.phaseId || (bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)) !== 100 }> {isSaving ? <CircularProgress size={24}/> : (editingBidId ? 'Update Bid' : 'Submit Bid')} </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showQuickAddSubcontractor} onClose={() => setShowQuickAddSubcontractor(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Subcontractor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><TextField fullWidth required label="Name" value={newSubcontractor.name} onChange={(e) => setNewSubcontractor(prev => ({ ...prev, name: e.target.value }))} /></Grid>
              <Grid item xs={12}><FormControl fullWidth><InputLabel>Specialty</InputLabel><Select value={newSubcontractor.specialty} label="Specialty" onChange={(e) => setNewSubcontractor(prev => ({ ...prev, specialty: e.target.value }))}>{CONSTRUCTION_SPECIALTIES.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}</Select></FormControl></Grid>
              <Grid item xs={12}><TextField fullWidth label="Phone" value={newSubcontractor.contact.phone} onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Email" type="email" value={newSubcontractor.contact.email} onChange={(e) => setNewSubcontractor(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickAddSubcontractor(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickAddSubcontractor} disabled={!newSubcontractor.name || isSaving}> {isSaving ? <CircularProgress size={24}/> : 'Add'} </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectDetailPage;