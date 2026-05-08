import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  useTheme,
  alpha,
  Card,
  CardHeader,
  CardContent,
  Divider,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Snackbar,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TableFooter,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Flag as FlagIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  Timeline as TimelineIcon,
  TableChart as TableChartIcon,
  AccountTree as AccountTreeIcon,
  LibraryBooks as LibraryBooksIcon,
  Receipt as ReceiptIcon,
  MonetizationOn as MonetizationOnIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from '@mui/icons-material';
import { Expense, Bid, ProjectPhase, Project, BudgetProjection, ExpenseStatus, BidStatus } from '../../../types';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import { getProjectById, updateProject } from '../../../services/project';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createBudgetProjection,
  normalizeBudgetProjection,
  saveProjectProjections,
  updateProjectBudget,
} from '../../../services/budget';

import { 
  addCategoryMapping, 
  getCategoryMappingsForProject, 
  autoAssignCategory 
} from '../../../services/category.service';

// Import the enhanced components
import CategorySelector from '../../common/CategorySelector';
import CategorySystemToggle from '../../common/CategorySystemToggle';
import { 
  getUserCategorySystemPreference, 
  saveUserCategorySystemPreference,
  convertCategoryId,
  getCategoriesBySystem
} from '../../../utils/categoryMappingUtils';

import { 
  MAIN_CATEGORIES, 
  getCategoryById, 
  getSubcategories, 
  getParentCategory, 
  getAllCategories as getAllLegacyCategories
} from '../../../data/hierarchicalCategories';

import {
  getAllCategories as getAllEnhancedCategories
} from '../../../data/newHierarchicalCategories';

import { Category, CategoryWithChildren } from '../../../types/category.types';

import { BudgetItem } from '../../../types/budget.types';

interface BudgetAllocationTrackerProps {
  projectId: string;
  expenses?: Expense[];
  bids?: Bid[];
  phases?: ProjectPhase[];
  allowEdit?: boolean;
  isEmbedded?: boolean;
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  projectId,
  expenses = [],
  bids = [],
  phases = [],
  allowEdit = true,
  isEmbedded = false,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [projectBudget, setProjectBudget] = useState<number | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Category system state
  const [categorySystem, setCategorySystem] = useState<'legacy' | 'enhanced'>(
    getUserCategorySystemPreference()
  );
  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({});
  
  // State variables for projections
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [currentProjectionCategory, setCurrentProjectionCategory] = useState<{ id: string; name: string } | null>(null);
  const [projectionAmount, setProjectionAmount] = useState<number | string>('');
  const [projectionNotes, setProjectionNotes] = useState<string>('');
  const [localProjections, setLocalProjections] = useState<BudgetProjection[]>([]);
  const [editingProjection, setEditingProjection] = useState<BudgetProjection | null>(null);
  const [editProjectionDialogOpen, setEditProjectionDialogOpen] = useState(false);
  const [editProjectionAmount, setEditProjectionAmount] = useState<number | string>('');
  const [editProjectionNotes, setEditProjectionNotes] = useState<string>('');
  
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  // Load project data including budget
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      try {
        const project = await getProjectById(projectId, 'withBudget');
        if (project) {
          const budget = project.budget && typeof project.budget === 'object' ? project.budget : { total: project.budget || 0 };
          setProjectBudget(budget.total || null);
          setTempBudget(budget.total ? budget.total.toString() : '');
          
          // Get projections from the project and load them to local state
          if (project.projections && Array.isArray(project.projections)) {
            setLocalProjections(project.projections.map(normalizeBudgetProjection));
          }
        }
        
        // Load category mappings
        const mappings = await getCategoryMappingsForProject(projectId);
        setCategoryMapping(mappings || {});

      } catch (error) {
        console.error("Error loading project data:", error);
        setError("Error loading project budget data");
      } finally {
        setLoading(false);
      }
    };
    
    loadProjectData();
  }, [projectId]);

  // Handle category system toggle
  const handleCategorySystemChange = (value: 'legacy' | 'enhanced') => {
    setCategorySystem(value);
    saveUserCategorySystemPreference(value);
    
    // Show a snackbar message about the change
    setSnackbar({
      open: true,
      message: `Switched to ${value === 'legacy' ? 'Legacy' : 'Enhanced'} category system`,
      severity: 'info'
    });
  };

  // Get the corresponding category object for the active system
  const getCategoryDetailsById = (categoryId: string) => {
    const allCategoriesInSystem = categorySystem === 'legacy' 
      ? getAllLegacyCategories()
      : getAllEnhancedCategories();
    
    return allCategoriesInSystem.find(cat => cat.id === categoryId) || null;
  };

  const handleAddProjection = async () => {
    if (!user?.uid || !currentProjectionCategory || projectionAmount === '') {
      return;
    }

    try {
      const newProjectionData: Omit<BudgetProjection, 'id' | 'createdAt'> = {
        categoryId: currentProjectionCategory.id,
        amount: typeof projectionAmount === 'number' ? projectionAmount : parseFloat(projectionAmount as string),
        notes: projectionNotes || null,
        userId: user.uid,
        projectId: projectId
      };
      const newProjection = createBudgetProjection(newProjectionData);

      // Add to local state right away for immediate visual feedback
      const updatedProjections = [...localProjections, newProjection];
      setLocalProjections(updatedProjections);

      // Also update in the database (project.projections array)
      await saveProjectProjections(projectId, updatedProjections);

      // Close dialog and reset values
      setProjectionDialogOpen(false);
      setProjectionAmount('');
      setProjectionNotes('');
      setCurrentProjectionCategory(null);

      setSnackbar({
        open: true,
        message: 'Projection added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding projection:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add projection',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {!isEmbedded && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Budget Allocation
          </Typography>
          
          {/* Category system selection toggle */}
          <CategorySystemToggle 
            value={categorySystem}
            onChange={handleCategorySystemChange}
          />
          
          {/* Budget edit controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              Total Project Budget:
            </Typography>
            
            {!editingBudget ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {projectBudget !== null ? formatCurrency(projectBudget) : 'Not set'}
                </Typography>
                {allowEdit && (
                  <IconButton 
                    size="small" 
                    onClick={() => setEditingBudget(true)} 
                    sx={{ ml: 1 }}
                    aria-label="Edit budget"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            ) : (
              <>
                <TextField
                  variant="outlined"
                  size="small"
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ width: 150 }}
                />
                <Button 
                  variant="contained" 
                  size="small" 
                  sx={{ ml: 1 }}
                  onClick={async () => {
                    try {
                      const budget = tempBudget ? parseFloat(tempBudget) : null;
                      await updateProjectBudget(projectId, budget);
                      setProjectBudget(budget);
                      setEditingBudget(false);
                      setSuccess('Budget updated successfully');
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err) {
                      console.error('Error updating budget:', err);
                      setError('Failed to update budget');
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                >
                  Save
                </Button>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => {
                    setEditingBudget(false);
                    setTempBudget(projectBudget ? projectBudget.toString() : '');
                  }}
                  sx={{ ml: 1 }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {success}
            </Alert>
          )}
        </Box>
      )}

      <Dialog open={projectionDialogOpen} onClose={() => setProjectionDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Projection for {currentProjectionCategory?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={projectionAmount}
            onChange={(e) => setProjectionAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <TextField
            margin="dense"
            label="Notes (Optional)"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={projectionNotes}
            onChange={(e) => setProjectionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddProjection} 
            variant="contained" 
            disabled={projectionAmount === ''}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetAllocationTracker;
