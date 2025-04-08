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
import { formatCurrency, formatDate, formatPercentage, safelyParseDate } from '../utils/formatters';
import PageLayout from '../components/layout/PageLayout';
import ProjectTaskManager from '../components/projects/ProjectTaskManager';
import TemplateAdjuster from '../components/projects/TemplateAdjuster';
import { Project, Task, Phase, Bid, Subcontractor, BidPaymentStage, ProjectPhase } from '../types';
import { Expense, ExpenseCategory, ExpenseStatus } from '../types/expense.types';
import { v4 as uuidv4 } from 'uuid';
import { openBidDeleteDialog } from '../components/dialogs/BidDeletePortal';
import BidDeletePortal from '../components/dialogs/BidDeletePortal';

// Import bid operations
import { submitBid, findExistingExpenseForPaymentStage as findExpense } from '../utils/bidOperations';

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
import BidFormDialog from '../components/dialogs/BidFormDialog';
import QuickAddSubcontractorDialog from '../components/dialogs/QuickAddSubcontractorDialog';
import QuickBidDialog from '../components/dialogs/QuickBidDialog';
import QuickUpdateMode from '../components/projects/QuickUpdateMode';
import RecentExpenses from '../components/projects/RecentExpenses';

// Import newly modularized components
import TabNavigation from '../components/projects/detailTabs/TabNavigation';
import TabContent from '../components/projects/detailTabs/TabContent';
import PhaseDetailsDialog from '../components/projects/dialogs/PhaseDetailsDialog';
import ProjectDialogs from '../components/projects/ProjectDialogs';

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

// Define EnhancedExpense locally to match the expected type within this file
// This interface needs to align with how findExpense is expected to work
interface EnhancedExpense extends Expense {
  bidId?: string;
  paymentStageId?: string;
}

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phasesBeingUpdated, setPhasesBeingUpdated] = useState<{ [id: string]: ProjectPhase }>({});
  const [expensesData, setExpensesData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [quickUpdateMode, setQuickUpdateMode] = useState(false);
  const [templateAdjusterOpen, setTemplateAdjusterOpen] = useState(false);
  
  // State for quick bid and expense dialogs
  const [newBidDialogOpen, setNewBidDialogOpen] = useState(false);
  const [currentPhaseForBid, setCurrentPhaseForBid] = useState<string | null>(null);
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
  
  // Listen for global bid deletion events - MOVED HERE before any returns
  useEffect(() => {
    const handleBidDeletedEvent = (event: CustomEvent<{ bidId: string }>) => {
      const { bidId } = event.detail;
      console.log('ProjectDetailPage: Received bid-deleted event for bid ID:', bidId);
      
      setBids(prevBids => {
        console.log(`ProjectDetailPage: Filtering bids. Removing ID: ${bidId}. Current count: ${prevBids.length}`);
        const newBids = prevBids.filter(b => b.id !== bidId);
        console.log(`ProjectDetailPage: New bid count: ${newBids.length}`);
        return newBids;
      });
      
      // Fix type error by explicitly typing the function
      setRecentBids((prevBids: Bid[]) => prevBids.filter(b => b.id !== bidId));
      showNotification('Bid deleted successfully', 'success');
    };

    // Add event listener
    window.addEventListener('bid-deleted', handleBidDeletedEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('bid-deleted', handleBidDeletedEvent as EventListener);
    };
  }, []);  
  
  // Function to fetch expenses
  const fetchExpenses = async (projectId: string) => {
    if (!user?.uid) return;
    
    try {
      const expenseData = await ExpenseService.getProjectExpenses(user.uid, projectId);
      // Use type assertion to resolve type conflict
      setExpenses(expenseData as unknown as Expense[]);
      
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
        // Fix any invalid dates before setting phases
        const phasesWithValidDates = ensureValidPhaseDates(projectData.phases as ProjectPhase[]);
        setPhases(phasesWithValidDates);
        
        // Also initialize the phases being updated if in quick update mode
        if (quickUpdateMode) {
          const phasesMap: { [id: string]: ProjectPhase } = {};
          phasesWithValidDates.forEach((phase) => {
            if (phase.id) {
              phasesMap[phase.id] = phase;
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
  
  // Function to ensure all phases have valid dates
  const ensureValidPhaseDates = (phases: ProjectPhase[]): ProjectPhase[] => {
    return phases.map(phase => {
      let startDate = phase.startDate;
      let endDate = phase.endDate;
      
      // Check if startDate is valid
      if (!startDate || isNaN(safelyParseDate(startDate).getTime())) {
        startDate = new Date();
      }
      
      // Check if endDate is valid
      if (!endDate || isNaN(safelyParseDate(endDate).getTime())) {
        // Set endDate to 30 days after startDate
        const newEndDate = new Date(safelyParseDate(startDate).getTime());
        newEndDate.setDate(safelyParseDate(startDate).getDate() + 30);
        endDate = newEndDate;
      }
      
      return {
        ...phase,
        startDate,
        endDate
      };
    });
  };
  
  // Function to fetch bids
  const fetchBids = async (projectId: string) => {
    if (!user?.uid) return;
    
    try {
      const bidFilters = { projectId };
      console.log('Fetching bids with filters:', bidFilters);
      const bidData = await BidService.getBids(user.uid, bidFilters);
      console.log('Fetched bids (raw):', JSON.stringify(bidData, null, 2));
      console.log('Payment schedules:', bidData.map((bid) => ({
        bidId: bid.id, 
        bidTitle: bid.title,
        // Only include these properties if they exist
        ...(bid as any).paymentSchedule && { paymentSchedule: (bid as any).paymentSchedule },
        ...(bid as any).phaseId && { phaseId: (bid as any).phaseId }
      })));
      // We're setting the full Bid objects directly to the state
      // Make sure the state is typed as Bid[] instead of BidSummary[]
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
  
  // Add event listener for expense status changes
  useEffect(() => {
    const handleExpenseStatusChanged = (event: Event) => {
      // Check if this is our custom event and if it's for this project
      const customEvent = event as CustomEvent<{
        expenseId: string;
        projectId: string;
        phaseId?: string;
        oldStatus: string;
        newStatus: string;
      }>;
      
      if (customEvent.detail && customEvent.detail.projectId === projectId) {
        console.log('Expense status changed, refreshing project data:', customEvent.detail);
        // Refresh all project data including expenses
        refreshAllProjectData();
      }
    };
    
    // Add event listener
    window.addEventListener('expense-status-changed', handleExpenseStatusChanged);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('expense-status-changed', handleExpenseStatusChanged);
    };
  }, [projectId, refreshAllProjectData]);
  
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
    // Open the template adjuster for phase management
    setTemplateAdjusterOpen(true);
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
    console.log('Opening quick bid dialog for phase:', phaseId);
    setCurrentPhaseForBid(phaseId);
    setNewBidDialogOpen(true);
    // Set the active tab to 'phases' when opening the quick bid dialog
    // Find the index of the 'phases' tab
    const phasesTabIndex = 1; // Assuming 'phases' is the second tab (index 1)
    setTabValue(phasesTabIndex);
  };

  // Replace handleAddQuickBid with a version that uses the shared utility
  const handleAddQuickBid = (quickBid: { phaseId: string; contractorName: string; amount: number; description: string }) => {
    // Only proceed if we have a valid phase ID and project
    if (!quickBid.phaseId || !project || !user?.uid) return;
    
    // Get the phase name
    const phase = phases.find(p => p.id === quickBid.phaseId);
    const phaseName = phase?.name || '';
    
    // Convert quick bid to regular bid format
    const bidFormData = {
      title: `${quickBid.contractorName} - ${phaseName}`,
      subcontractorName: quickBid.contractorName,
      totalAmount: quickBid.amount,
      phaseId: quickBid.phaseId,
      phaseName: phaseName,
      scope: quickBid.description,
      timeline: 30, // Default timeline
      notes: quickBid.description,
      status: 'accepted' as 'accepted', // Auto-accept quick bids
      paymentTerms: {
        downPaymentPercent: 50,
        installments: [
          {
            id: uuidv4(),
            name: 'Final Payment',
            percent: 50,
            milestoneDescription: 'Upon completion'
          }
        ]
      },
      attachments: [],
      tags: [phaseName]
    };
    
    // Use the shared submitBid function
    submitBid(user.uid, bidFormData, null, project.id, project.name)
      .then(resultBid => {
        if (resultBid) {
          // Add the bid to local state
          setBids(prev => [...prev, resultBid]);
          
          // Show success notification
          showNotification('Quick bid added successfully', 'success');
          
          // Also reload expenses since a new expense will have been created
          fetchExpenses(project.id);
        }
      })
      .catch(error => {
        console.error('Error adding quick bid:', error);
        showNotification('Failed to add quick bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      });
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

      const newExpense: Omit<EnhancedExpense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
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
        paymentDetails: expense.status === 'paid' ? expense.paymentDetails : undefined,
        // Add the bidId and paymentStageId if they exist, converting null to undefined
        bidId: expense.bidId ?? undefined,
        paymentStageId: expense.paymentStageId ?? undefined
      };
      
      console.log('Adding new expense:', newExpense);
      
      const savedExpense = await ExpenseService.createExpense(user.uid, newExpense as any);
      
      // Update the expenses state with type assertion to fix the conflict
      setExpenses(prevExpenses => [...prevExpenses, savedExpense as unknown as Expense]);
      
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
    
    console.log('Calculating project progress with phases:', 
      phases.map(p => ({
        id: p.id,
        name: p.name,
        budget: p.budget,
        progress: p.progress
      }))
    );
    
    // Filter out phases with invalid budget
    const validPhases = phases.filter(phase => typeof phase.budget === 'number' && !isNaN(phase.budget));
    
    if (validPhases.length === 0) {
      // If no phases have valid budgets, use simple average
      const averageProgress = phases.reduce((sum, phase) => 
        sum + (typeof phase.progress === 'number' && !isNaN(phase.progress) ? phase.progress : 0), 
        0
      ) / phases.length;
      
      console.log('Using simple average progress:', averageProgress);
      return Math.round(averageProgress);
    }
    
    const totalWeight = validPhases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
    
    if (totalWeight === 0) {
      // Fallback to simple average if total weight is still zero
      const averageProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0) / phases.length;
      console.log('Total weight is zero, using simple average:', averageProgress);
      return Math.round(averageProgress);
    }
    
    const weightedProgress = validPhases.reduce((sum, phase) => {
      const weight = phase.budget / totalWeight;
      const phaseProgress = typeof phase.progress === 'number' && !isNaN(phase.progress) ? phase.progress : 0;
      const weighted = phaseProgress * weight;
      
      console.log(`Phase ${phase.name}: budget=${phase.budget}, weight=${weight.toFixed(2)}, progress=${phaseProgress}, weighted=${weighted.toFixed(2)}`);
      
      return sum + weighted;
    }, 0);
    
    console.log('Final weighted progress:', weightedProgress);
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

  // Calculate ACTUAL phase costs based on PAID expenses only
  const phaseActualCosts = useMemo(() => {
    const costs: Record<string, number> = {};
    
    // Initialize costs for all phases with 0
    phases.forEach(phase => {
      costs[phase.id] = 0;
    });
    
    // Sum up paid expense amounts by phase
    expenses
      .filter(expense => expense.status === 'paid')
      .forEach(expense => {
        if (expense.phaseId && costs[expense.phaseId] !== undefined) {
          costs[expense.phaseId] += expense.amount || 0;
        }
      });
    
    return costs;
  }, [phases, expenses]);

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
    // Debug logging to help diagnose issues
    console.log('Project dates:', {
      startDate: project?.startDate,
      endDate: project?.endDate,
      startDateType: project?.startDate ? typeof project.startDate : 'undefined',
      startDateIsDate: project?.startDate instanceof Date,
      endDateType: project?.endDate ? typeof project.endDate : 'undefined',
      endDateIsDate: project?.endDate instanceof Date,
    });
    
    // Helper function to safely parse dates of any type
    const safelyParseDate = (dateInput: any): Date | null => {
      if (!dateInput) return null;
      
      try {
        // If it's already a Date object
        if (dateInput instanceof Date) {
          return isNaN(dateInput.getTime()) ? null : dateInput;
        }
        
        // If it's a Firestore Timestamp
        if (dateInput && typeof dateInput.toDate === 'function') {
          return dateInput.toDate();
        }
        
        // If it's a string, try to parse it
        if (typeof dateInput === 'string') {
          const parsed = new Date(dateInput);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        
        // If it's a number (timestamp)
        if (typeof dateInput === 'number') {
          const parsed = new Date(dateInput);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        
        return null;
      } catch (error) {
        console.error('Error parsing date:', error, dateInput);
        return null;
      }
    };
    
    // If we have a project with dates, use those directly
    if (project?.startDate || project?.endDate) {
      const projectStartDate = safelyParseDate(project.startDate) || new Date();
      const projectEndDate = safelyParseDate(project.endDate) || new Date(projectStartDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
      
      console.log('Parsed project dates:', {
        startDate: projectStartDate,
        endDate: projectEndDate
      });
      
      const today = new Date();
      
      const totalDuration = projectEndDate.getTime() - projectStartDate.getTime();
      const elapsedDuration = Math.max(0, today.getTime() - projectStartDate.getTime());
      
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
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
      elapsedDays: 0, 
      totalDays: 30, 
      percentComplete: 0 
    };
    
    console.log('Phase dates for timeline calculation:', 
      phases.map(p => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        startDateType: p.startDate ? typeof p.startDate : 'undefined',
        endDate: p.endDate,
        endDateType: p.endDate ? typeof p.endDate : 'undefined',
      }))
    );
    
    // Get valid dates from phases
    const validStartDates: Date[] = [];
    const validEndDates: Date[] = [];
    
    phases.forEach(phase => {
      const startDate = safelyParseDate(phase.startDate);
      const endDate = safelyParseDate(phase.endDate);
      
      if (startDate) validStartDates.push(startDate);
      if (endDate) validEndDates.push(endDate);
    });
    
    console.log('Valid parsed phase dates:', {
      validStartDates,
      validEndDates
    });
    
    // Handle case where no valid dates are found
    if (validStartDates.length === 0 && validEndDates.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days
        elapsedDays: 0,
        totalDays: 30,
        percentComplete: 0
      };
    }
    
    // Use the earliest start date and latest end date
    const phaseBasedStartDate = validStartDates.length > 0 
      ? new Date(Math.min(...validStartDates.map(d => d.getTime()))) 
      : new Date();
    
    const phaseBasedEndDate = validEndDates.length > 0
      ? new Date(Math.max(...validEndDates.map(d => d.getTime())))
      : new Date(phaseBasedStartDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    
    const today = new Date();
    
    const totalDuration = phaseBasedEndDate.getTime() - phaseBasedStartDate.getTime();
    const elapsedDuration = Math.max(0, today.getTime() - phaseBasedStartDate.getTime());
    
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

  // Add a useMemo for expense breakdown
  const expenseBreakdown = useMemo(() => {
    const breakdown = {
      pending: 0,
      approved: 0,
      paid: 0,
      rejected: 0
    };
    
    // Add debug logging
    console.log('Calculating expense breakdown with', expenses.length, 'expenses');
    
    expenses.forEach(expense => {
      const amount = typeof expense.amount === 'number' ? expense.amount : 0;
      // Normalize status to handle case sensitivity or whitespace issues
      const status = expense.status?.trim().toLowerCase();
      
      console.log(`Expense in ProjectDetailPage: ${expense.description}, Amount: ${amount}, Status: ${status} (original: ${expense.status})`);
      
      if (status === 'pending') {
        breakdown.pending += amount;
        console.log(`Adding ${amount} to pending, now: ${breakdown.pending}`);
      } else if (status === 'approved') {
        breakdown.approved += amount;
        console.log(`Adding ${amount} to approved, now: ${breakdown.approved}`);
      } else if (status === 'paid') {
        breakdown.paid += amount;
        console.log(`Adding ${amount} to paid, now: ${breakdown.paid}`);
      } else if (status === 'rejected') {
        breakdown.rejected += amount;
        console.log(`Adding ${amount} to rejected, now: ${breakdown.rejected}`);
      } else {
        console.log(`Unknown status "${status}" for expense ${expense.id}`);
      }
    });
    
    console.log('Final expense breakdown:', breakdown);
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
//   const [recentBids, setRecentBids] = useState<Bid[]>([]);

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

  // Replace handleSubmitBid with a version that calls the shared utility
  const handleSubmitBid = async (bidFormData: {
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
      installments: {
        id: string;
        name: string;
        percent: number;
        milestoneDescription: string;
        phaseId?: string;
        phaseName?: string;
      }[];
    };
    notes: string;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
    attachments: string[];
    tags: string[];
  }): Promise<void> => {
    if (!user || !project?.id) return Promise.resolve();
    
    try {
      setIsSaving(true);
      
      // Use the shared submitBid function
      const result = await submitBid(
        user.uid, 
        bidFormData, 
        editingBidId, 
        project.id, 
        project.name
      );
      
      if (result) {
        const resultBid: Bid = result;
        
        if (editingBidId) {
          // Update bid in local state
          setBids(prev => prev.map(b => b.id === editingBidId ? resultBid : b));
          showNotification('Bid updated successfully', 'success');
        } else {
          // Add to local state with the complete bid object
          setBids(prev => [...prev, resultBid]);
          
          // Add to recent bids for easy comparison
          setRecentBids(prev => [resultBid, ...prev].slice(0, 5));
          showNotification('Bid added successfully', 'success');
        }
        
        // Reset editing state and close dialog
        setEditingBidId(null);
        setBidFormOpen(false);
        
        // Refresh expenses list
        fetchExpenses(project.id || '');
      }
    } catch (error: any) {
      console.error('Error saving bid:', error);
      showNotification('Failed to save bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
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
    <QuickUpdateMode
      phasesBeingUpdated={phasesBeingUpdated}
      renderingKey={renderingKey}
      handleQuickUpdatePhase={handleQuickUpdatePhase}
    />
  );

  // Helper function to render Recent Expenses section (extracted for clarity)
  const renderRecentExpenses = () => (
    <RecentExpenses expenses={expenses as any} phases={phases} />
  );

  // Add state for phase details dialog and selected phase
  const [phaseDetailsDialogOpen, setPhaseDetailsDialogOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  // Add function to handle viewing phase details
  const handleViewPhaseDetails = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setPhaseDetailsDialogOpen(true);
  };

  // Add function to close the phase details dialog
  const handleClosePhaseDetails = () => {
    setPhaseDetailsDialogOpen(false);
    setSelectedPhaseId(null);
  };

  // Re-add state for subcontractor management
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [showQuickAddSubcontractor, setShowQuickAddSubcontractor] = useState(false);

  // Re-add function to fetch subcontractors
  const fetchSubcontractors = async () => {
    if (!user?.uid) return;
    try {
      const fetchedSubcontractors = await SubcontractorService.getSubcontractors(user.uid);
      setSubcontractors(fetchedSubcontractors);
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
    }
  };

  // Re-add useEffect to fetch subcontractors when bid form opens
  useEffect(() => {
    if (bidFormOpen) {
      fetchSubcontractors();
    }
  }, [bidFormOpen, user?.uid]);

  // Add useEffect to fetch subcontractors when quick bid dialog opens
  useEffect(() => {
    if (newBidDialogOpen) {
      fetchSubcontractors();
    }
  }, [newBidDialogOpen, user?.uid]);

  // Re-add function to handle quick add of a new subcontractor
  const handleQuickAddSubcontractor = async (subcontractorData: {
    name: string;
    specialty: string;
    contact: {
      phone: string;
      email: string;
    };
  }): Promise<void> => {
    if (!user?.uid) return Promise.resolve();
    
    try {
      setIsSaving(true);
      const newSubcontractor = await SubcontractorService.createSubcontractor(user.uid, {
        name: subcontractorData.name,
        specialty: subcontractorData.specialty,
        contact: subcontractorData.contact,
        rating: 0,
        totalProjects: 0
      });
      
      // Update the subcontractors list
      setSubcontractors(prev => [...prev, newSubcontractor]);
      
      // Show success notification
      showNotification('Subcontractor added successfully', 'success');
      
      // Close the dialog
      setShowQuickAddSubcontractor(false);
    } catch (error) {
      console.error('Error adding subcontractor:', error);
      showNotification('Failed to add subcontractor: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Re-add handleEditBid function
  const handleEditBid = (bidId: string) => {
    const bidToEdit = bids.find(b => b.id === bidId);
    if (bidToEdit) {
      console.log('Editing bid:', JSON.stringify(bidToEdit, null, 2));
      setEditingBidId(bidId);
      
      const paymentSchedule = bidToEdit.paymentSchedule || [];
      let downPaymentPercent = 20;
      let installments = [{id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}];
      
      if (paymentSchedule.length > 0) {
        const downPayment = paymentSchedule.find(p => p.name === 'Down Payment');
        if (downPayment) {
          downPaymentPercent = downPayment.percentage || 20;
        }
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
      
      let submissionDeadline: Date | undefined = undefined;
      if (bidToEdit.submissionDeadline) {
        try {
          submissionDeadline = bidToEdit.submissionDeadline instanceof Date 
            ? bidToEdit.submissionDeadline 
            : new Date(bidToEdit.submissionDeadline);
          if (isNaN(submissionDeadline.getTime())) {
            submissionDeadline = undefined;
          }
        } catch (error) {
          console.error('Error converting submission deadline:', error);
          submissionDeadline = undefined;
        }
      }
      
      const formData = {
        title: bidToEdit.title || '',
        subcontractorName: bidToEdit.subcontractorName || '',
        subcontractorId: bidToEdit.subcontractorId || '',
        totalAmount: bidToEdit.totalAmount || 0,
        phaseId: bidToEdit.phaseId || (phases.length > 0 ? phases[0].id : ''),
        phaseName: bidToEdit.phaseName || (phases.length > 0 ? phases[0].name : ''),
        scope: bidToEdit.scope || '',
        timeline: bidToEdit.timeline || 30,
        submissionDeadline: submissionDeadline,
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
        tags: Array.isArray(bidToEdit.tags) ? [...bidToEdit.tags] : []
      };
      
      console.log('Setting bid form with data:', JSON.stringify(formData, null, 2));
      setBidForm(formData);
      setBidFormOpen(true);
    } else {
      console.error(`Bid with ID ${bidId} not found`);
      showNotification(`Bid with ID ${bidId} not found`, 'error');
    }
  };

  // --- Calculate Proposed Costs for Phases ---
  const phaseProposedCosts = useMemo(() => {
    const costs: Record<string, number> = {};
    
    // Initialize costs for all phases with 0
    phases.forEach(phase => {
      costs[phase.id] = 0;
    });
    
    // Calculate from accepted bids
    phases.forEach(phase => {
      const acceptedPhaseBids = bids.filter(bid => 
        bid.phaseId === phase.id && bid.status === 'accepted'
      );
      
      // Sum up all accepted bids for this phase
      costs[phase.id] = acceptedPhaseBids.reduce((sum, bid) => sum + (bid.totalAmount || 0), 0);
      
      // Find expenses that are related to these bids but already paid
      // This avoids double-counting in both proposed and actual
      const paidBidExpenses = expenses.filter(expense => 
        expense.phaseId === phase.id && 
        expense.status === 'paid' && 
        expense.bidId && 
        acceptedPhaseBids.some(bid => bid.id === expense.bidId)
      );
      
      // Subtract paid expenses from the proposed costs to avoid double counting
      const paidBidExpensesTotal = paidBidExpenses.reduce((sum, expense) => 
        sum + (expense.amount || 0), 0
      );
      
      costs[phase.id] -= paidBidExpensesTotal;
    });
    
    return costs;
  }, [phases, bids, expenses]);

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

  // Now we can simplify the handleDeleteBidRequest function
  const handleDeleteBidRequest = (bidId: string) => {
    const bidFound = bids.find(b => b.id === bidId);
    console.log('ProjectDetailPage: handleDeleteBidRequest for ID:', bidId, 'Found:', !!bidFound);
    if (bidFound) {
      openBidDeleteDialog(bidFound);
      // No need to handle state updates here - they'll be handled by the global event listener
    }
  };

  // Define the onSubmitSuccess handler for the bid dialog
  const handleBidSubmitSuccess = (savedBid: Bid) => {
    console.log('Bid saved/updated:', savedBid);
    // Refresh bids and expenses lists after successful save
    if (project?.id) {
      fetchBids(project.id);
      fetchExpenses(project.id);
    }
    // Optionally update recent bids state
    setRecentBids(prev => {
      const index = prev.findIndex(b => b.id === savedBid.id);
      if (index > -1) {
        // Update existing
        const updated = [...prev];
        updated[index] = savedBid;
        return updated;
      } else {
        // Add new and keep list short
        return [savedBid, ...prev].slice(0, 5);
      }
    });
  };

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
        <TabNavigation
          tabValue={tabValue}
          onTabChange={handleTabChange}
        />
        
        {/* Tab Content */}
        <TabContent
          tabValue={tabValue}
          project={project}
          phases={phases}
          bids={bids}
          recentBids={recentBids}
          expenses={expenses as any}
          expensesData={expensesData}
          combinedExpenses={
            phases.map(phase => ({
              name: phase.name,
              budget: phase.budget || 0,
              actual: phase.actualCost || 0
            }))
          }
          budgetData={budgetData}
          phaseProposedCosts={phaseProposedCosts}
          phaseActualCosts={phaseActualCosts}
          theme={theme}
          userId={user?.uid || ''}
          getStatusColor={getStatusColor}
          handleAddPhase={handleAddPhase}
          handleUpdatePhase={handleUpdatePhase}
          handleDeletePhase={handleDeletePhase}
          handleAddBid={handleAddBid}
          handleEditBid={handleEditBid}
          handleOpenQuickBidDialog={handleOpenQuickBidDialog}
          handleOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
          handleOpenTemplateAdjuster={handleOpenTemplateAdjuster}
          handleProjectUpdate={handleProjectUpdate}
          handleViewPhaseDetails={handleViewPhaseDetails}
        />
      </PageLayout>

      {/* Dialogs Section */}
      <ProjectDialogs
        project={project}
        phases={phases}
        bids={bids}
        expenses={expenses}
        theme={theme}
        getStatusColor={getStatusColor}
        
        // Dialog open states
        bidFormOpen={bidFormOpen}
        showQuickAddSubcontractor={showQuickAddSubcontractor}
        newBidDialogOpen={newBidDialogOpen}
        newExpenseDialogOpen={newExpenseDialogOpen}
        templateAdjusterOpen={templateAdjusterOpen}
        phaseDetailsDialogOpen={phaseDetailsDialogOpen}
        
        // Form data
        bidForm={bidForm}
        editingBidId={editingBidId}
        currentPhaseForBid={currentPhaseForBid}
        currentPhaseForExpense={currentPhaseForExpense}
        currentExpenseData={currentExpenseData}
        selectedPhaseId={selectedPhaseId}
        isSaving={isSaving}
        
        // Snackbar
        snackbar={snackbar}
        
        // Subcontractors
        subcontractors={subcontractors}
        
        // Handlers
        handleCloseBidForm={handleCloseBidForm}
        handleSubmitBid={handleSubmitBid}
        handleQuickAddSubcontractor={handleQuickAddSubcontractor}
        handleAddQuickBid={handleAddQuickBid}
        handleAddQuickExpense={handleAddQuickExpense}
        handleSnackbarClose={handleSnackbarClose}
        handleCloseTemplateAdjuster={handleCloseTemplateAdjuster}
        handleProjectUpdate={handleProjectUpdate}
        handleClosePhaseDetails={handleClosePhaseDetails}
        handleUpdatePhase={handleUpdatePhase}
        setShowQuickAddSubcontractor={setShowQuickAddSubcontractor}
        setNewBidDialogOpen={setNewBidDialogOpen}
        setCurrentPhaseForExpense={setCurrentPhaseForExpense}
        setNewExpenseDialogOpen={setNewExpenseDialogOpen}
      />
      {
        project && (
          <BidFormDialog
            open={bidFormOpen}
            onClose={handleCloseBidForm}
            onSubmitSuccess={handleBidSubmitSuccess} // Pass the success handler
            // Pass project-specific context
            projectId={project.id}
            phases={phases} // Pass only the phases for *this* project
            // Pass editing state
            initialBidData={bidForm} // Assuming bidForm holds the data for editing
            editingBidId={editingBidId}
            // Callback for adding subs remains (optional)
            onAddSubcontractor={() => setShowQuickAddSubcontractor(true)}
          />
        )
      }
    </>
  );
};

export default ProjectDetailPage;