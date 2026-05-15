import React, { useMemo, useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
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
  onBudgetUpdated?: () => void | Promise<void>;
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  projectId,
  expenses = [],
  bids = [],
  phases = [],
  allowEdit = true,
  isEmbedded = false,
  onBudgetUpdated,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [editingPhaseBudgets, setEditingPhaseBudgets] = useState<boolean>(false);
  const [savingBudget, setSavingBudget] = useState<boolean>(false);
  const [savingPhaseBudgets, setSavingPhaseBudgets] = useState<boolean>(false);
  const [projectBudget, setProjectBudget] = useState<number | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [budgetPhases, setBudgetPhases] = useState<ProjectPhase[]>(phases);
  const [phaseBudgetDrafts, setPhaseBudgetDrafts] = useState<Record<string, string>>({});
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

  const countedExpenses = useMemo(
    () => expenses.filter(expense => expense.status !== 'rejected'),
    [expenses]
  );

  useEffect(() => {
    setBudgetPhases(phases);
    setPhaseBudgetDrafts(
      phases.reduce<Record<string, string>>((drafts, phase) => {
        drafts[phase.id] = typeof phase.budget === 'number' && phase.budget > 0 ? String(phase.budget) : '';
        return drafts;
      }, {})
    );
  }, [phases]);

  const actualExpenseTotal = useMemo(
    () => countedExpenses
      .filter(expense => expense.status === 'paid' || expense.status === 'approved')
      .reduce((sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : 0), 0),
    [countedExpenses]
  );

  const pendingExpenseTotal = useMemo(
    () => countedExpenses
      .filter(expense => expense.status === 'pending' || expense.status === 'partially_paid')
      .reduce((sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : 0), 0),
    [countedExpenses]
  );

  const acceptedBidTotal = useMemo(
    () => bids
      .filter(bid => bid.status === 'accepted')
      .reduce((sum, bid) => sum + (typeof bid.totalAmount === 'number' ? bid.totalAmount : 0), 0),
    [bids]
  );

  const projectionTotal = useMemo(
    () => localProjections.reduce((sum, projection) => sum + (typeof projection.amount === 'number' ? projection.amount : 0), 0),
    [localProjections]
  );

  const phaseBudgetTotal = useMemo(
    () => budgetPhases.reduce((sum, phase) => sum + (typeof phase.budget === 'number' ? phase.budget : 0), 0),
    [budgetPhases]
  );

  const forecastTotal = actualExpenseTotal + pendingExpenseTotal + projectionTotal;

  const phaseRows = useMemo(
    () => budgetPhases.map((phase, index) => {
      const phaseExpenses = countedExpenses.filter(expense => expense.phaseId === phase.id);
      const actualCost = phaseExpenses.reduce(
        (sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : 0),
        0
      );
      const budget = typeof phase.budget === 'number' ? phase.budget : 0;

      return {
        id: phase.id,
        order: phase.order ?? index + 1,
        name: phase.name || `Phase ${index + 1}`,
        budget,
        actualCost,
        remaining: budget - actualCost,
        percentUsed: budget > 0 ? (actualCost / budget) * 100 : 0,
      };
    }).sort((a, b) => a.order - b.order),
    [budgetPhases, countedExpenses]
  );

  const expenseStatusRows = useMemo(() => {
    const statuses: ExpenseStatus[] = ['pending', 'approved', 'partially_paid', 'paid', 'rejected'];
    return statuses.map(status => {
      const statusExpenses = expenses.filter(expense => expense.status === status);
      return {
        status,
        count: statusExpenses.length,
        total: statusExpenses.reduce(
          (sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : 0),
          0
        ),
      };
    }).filter(row => row.count > 0);
  }, [expenses]);

  const acceptedBids = useMemo(
    () => bids.filter(bid => bid.status === 'accepted'),
    [bids]
  );

  const projectionCategoryOptions = useMemo(
    () => categorySystem === 'legacy' ? getAllLegacyCategories() : getAllEnhancedCategories(),
    [categorySystem]
  );

  // Load project data including budget
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      
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

      } catch (error) {
        logger.error("Error loading project data:", error);
        setError("Error loading project budget data");
      } finally {
        setLoading(false);
      }

      try {
        const mappings = await getCategoryMappingsForProject(projectId);
        setCategoryMapping(mappings || {});
      } catch (error) {
        logger.error("Error loading budget category mappings:", error);
        setSnackbar({
          open: true,
          message: 'Error loading category settings. Using default categories.',
          severity: 'info'
        });
      }
    };
    
    loadProjectData();
  }, [projectId]);

  const parseBudgetInput = (value: string): number | null | undefined => {
    if (value.trim() === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const notifyBudgetUpdated = async () => {
    if (onBudgetUpdated) {
      await onBudgetUpdated();
    }
  };

  const handleSaveProjectBudget = async () => {
    const budget = parseBudgetInput(tempBudget);

    if (budget === undefined) {
      setError('Enter a valid project budget.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSavingBudget(true);
    try {
      await updateProjectBudget(projectId, budget);
      setProjectBudget(budget);
      setTempBudget(budget === null ? '' : budget.toString());
      setEditingBudget(false);
      setSuccess('Project budget updated.');
      setTimeout(() => setSuccess(null), 3000);
      await notifyBudgetUpdated();
    } catch (err) {
      logger.error('Error updating budget:', err);
      setError('Failed to update project budget.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleSavePhaseBudgets = async () => {
    const invalidPhase = budgetPhases.find((phase) => parseBudgetInput(phaseBudgetDrafts[phase.id] || '') === undefined);
    if (invalidPhase) {
      setError(`Enter a valid budget for ${invalidPhase.name || 'the selected phase'}.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSavingPhaseBudgets(true);
    try {
      const updatedPhases = budgetPhases.map((phase) => ({
        ...phase,
        budget: parseBudgetInput(phaseBudgetDrafts[phase.id] || '') || 0,
      }));

      await updateProject(projectId, { phases: updatedPhases });
      setBudgetPhases(updatedPhases);
      setEditingPhaseBudgets(false);
      setSuccess('Phase budgets updated.');
      setTimeout(() => setSuccess(null), 3000);
      await notifyBudgetUpdated();
    } catch (err) {
      logger.error('Error updating phase budgets:', err);
      setError('Failed to update phase budgets.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingPhaseBudgets(false);
    }
  };

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
      logger.error('Error adding projection:', error);
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
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              Total Project Budget:
            </Typography>
            
            {!editingBudget ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {projectBudget !== null ? formatCurrency(projectBudget) : 'Not set'}
                </Typography>
                {allowEdit && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingBudget(true)} 
                  >
                    Edit Budget
                  </Button>
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
                  onClick={handleSaveProjectBudget}
                  disabled={savingBudget}
                >
                  {savingBudget ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="text" 
                  size="small"
                  disabled={savingBudget}
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

      {loading ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[0, 1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rounded" height={112} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                label: 'Total Project Budget',
                value: projectBudget !== null ? formatCurrency(projectBudget) : 'Not set',
                detail: `${formatCurrency(phaseBudgetTotal)} allocated to phases`,
                icon: <AccountBalanceWalletIcon color="primary" />,
              },
              {
                label: 'Actual / Approved',
                value: formatCurrency(actualExpenseTotal),
                detail: projectBudget ? formatPercentage(actualExpenseTotal / projectBudget) + ' of budget' : 'No budget set',
                icon: <ReceiptIcon color="success" />,
              },
              {
                label: 'Pending Expenses',
                value: formatCurrency(pendingExpenseTotal),
                detail: `${expenseStatusRows.reduce((sum, row) => row.status === 'pending' || row.status === 'partially_paid' ? sum + row.count : sum, 0)} open items`,
                icon: <InfoIcon color="warning" />,
              },
              {
                label: 'Forecast',
                value: formatCurrency(forecastTotal),
                detail: `${formatCurrency(projectionTotal)} projected costs`,
                icon: <TimelineIcon color="info" />,
              },
            ].map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.label}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{card.value}</Typography>
                        <Typography variant="caption" color="text.secondary">{card.detail}</Typography>
                      </Box>
                      {card.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card variant="outlined">
                <CardHeader
                  title="Phase Budget vs Actual"
                  subheader="Budget allocation from the project wizard compared with expenses assigned to each phase"
                  action={allowEdit && phaseRows.length > 0 ? (
                    editingPhaseBudgets ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleSavePhaseBudgets}
                          disabled={savingPhaseBudgets}
                        >
                          {savingPhaseBudgets ? 'Saving...' : 'Save Phases'}
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          disabled={savingPhaseBudgets}
                          onClick={() => {
                            setEditingPhaseBudgets(false);
                            setPhaseBudgetDrafts(
                              budgetPhases.reduce<Record<string, string>>((drafts, phase) => {
                                drafts[phase.id] = typeof phase.budget === 'number' && phase.budget > 0 ? String(phase.budget) : '';
                                return drafts;
                              }, {})
                            );
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => setEditingPhaseBudgets(true)}
                      >
                        Edit Phase Budgets
                      </Button>
                    )
                  ) : undefined}
                />
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Phase</TableCell>
                        <TableCell align="right">Budget</TableCell>
                        <TableCell align="right">Actual</TableCell>
                        <TableCell align="right">Remaining</TableCell>
                        <TableCell align="right">Used</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {phaseRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Alert severity="info">No phase budgets are defined for this project yet.</Alert>
                          </TableCell>
                        </TableRow>
                      ) : (
                        phaseRows.map((phase) => (
                          <TableRow key={phase.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{phase.name}</Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(phase.percentUsed, 100)}
                                color={phase.percentUsed > 100 ? 'error' : 'primary'}
                                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {editingPhaseBudgets ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={phaseBudgetDrafts[phase.id] || ''}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setPhaseBudgetDrafts((current) => ({
                                      ...current,
                                      [phase.id]: value,
                                    }));
                                  }}
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                  }}
                                  inputProps={{ min: 0 }}
                                  sx={{ width: 150 }}
                                />
                              ) : (
                                formatCurrency(phase.budget)
                              )}
                            </TableCell>
                            <TableCell align="right">{formatCurrency(phase.actualCost)}</TableCell>
                            <TableCell align="right">
                              <Typography color={phase.remaining < 0 ? 'error.main' : 'text.primary'} variant="body2">
                                {formatCurrency(phase.remaining)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{phase.percentUsed.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    {phaseRows.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell><Typography fontWeight={700}>Totals</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={700}>{formatCurrency(phaseBudgetTotal)}</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={700}>{formatCurrency(actualExpenseTotal + pendingExpenseTotal)}</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={700}>{formatCurrency(phaseBudgetTotal - actualExpenseTotal - pendingExpenseTotal)}</Typography></TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader title="Expense Status" subheader="Current expense pipeline" />
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {expenseStatusRows.length === 0 ? (
                        <TableRow>
                          <TableCell>No expenses recorded yet.</TableCell>
                        </TableRow>
                      ) : expenseStatusRows.map((row) => (
                        <TableRow key={row.status}>
                          <TableCell>
                            <Chip size="small" label={row.status.replace('_', ' ')} />
                          </TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                          <TableCell align="right">{formatCurrency(row.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              <Card variant="outlined">
                <CardHeader title="Accepted Bid Commitments" subheader="Accepted contract value not necessarily paid yet" />
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {acceptedBids.length === 0 ? (
                        <TableRow>
                          <TableCell>No accepted bids yet.</TableCell>
                        </TableRow>
                      ) : acceptedBids.map((bid) => (
                        <TableRow key={bid.id}>
                          <TableCell>{bid.title || bid.subcontractorName || 'Accepted bid'}</TableCell>
                          <TableCell align="right">{formatCurrency(bid.totalAmount || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    {acceptedBids.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell><Typography fontWeight={700}>Committed</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={700}>{formatCurrency(acceptedBidTotal)}</Typography></TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardHeader
                  title="Projected Costs"
                  subheader="Forecasted items such as land acquisition or expected future costs"
                  action={allowEdit ? (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setProjectionDialogOpen(true)}
                    >
                      Add Projection
                    </Button>
                  ) : undefined}
                />
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {localProjections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3}>No projected costs recorded.</TableCell>
                        </TableRow>
                      ) : localProjections.map((projection) => {
                        const category = getCategoryDetailsById(projection.categoryId);
                        return (
                          <TableRow key={projection.id}>
                            <TableCell>{category?.name || projection.categoryId}</TableCell>
                            <TableCell>{projection.notes || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(projection.amount || 0)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    {localProjections.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2}><Typography fontWeight={700}>Projected Total</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={700}>{formatCurrency(projectionTotal)}</Typography></TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Dialog open={projectionDialogOpen} onClose={() => setProjectionDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Projected Cost</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={projectionCategoryOptions}
            getOptionLabel={(option) => option.name}
            value={currentProjectionCategory}
            onChange={(_event, value) => setCurrentProjectionCategory(value ? { id: value.id, name: value.name } : null)}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Category"
                fullWidth
              />
            )}
          />
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
            disabled={!currentProjectionCategory || projectionAmount === ''}
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
