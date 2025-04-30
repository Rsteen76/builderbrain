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
import { Timestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

import { 
  addCategoryMapping, 
  getCategoryMappingsForProject, 
  autoAssignCategory 
} from '../../../services/category.service';
import { 
  MAIN_CATEGORIES, 
  getCategoryById, 
  getSubcategories, 
  getParentCategory, 
  mapSimpleToDetailedCategory,
  getAllCategories as getAllHierarchicalCategories
} from '../../../data/hierarchicalCategories';
import CategorySelector from '../../common/CategorySelector';
import { Category, CategoryWithChildren } from '../../../types/category.types';

import { BudgetItem } from '../../../types/budget.types';

interface BudgetAllocationTrackerProps {
  project: Project | null;
  phases: ProjectPhase[];
  expenses: Expense[];
  bids: Bid[];
  projections: BudgetProjection[];
  onAddProjection?: (projectionData: Omit<BudgetProjection, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProjectionCategory?: (projectionId: string, newCategoryId: string) => Promise<void>;
  onDeleteProjection?: (projectionId: string) => Promise<void>;
  onEditProjection?: (projectionId: string, updatedData: { amount: number; notes: string | null }) => Promise<void>;
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  project,
  phases,
  expenses,
  bids,
  projections,
  onAddProjection,
  onUpdateProjectionCategory,
  onDeleteProjection,
  onEditProjection
}) => {
  const theme = useTheme();
  const { user } = useAuth(); 
  
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'expenses' | 'bids' | 'consolidated'>('consolidated');
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [prefsLoading, setPrefsLoading] = useState<boolean>(true);
  const [showOrphanedExpenses, setShowOrphanedExpenses] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  // State variables for projections
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [currentProjectionCategory, setCurrentProjectionCategory] = useState<{ id: string; name: string } | null>(null);
  const [projectionAmount, setProjectionAmount] = useState<number | string>('');
  const [projectionNotes, setProjectionNotes] = useState<string>('');
  const [localProjections, setLocalProjections] = useState<BudgetProjection[]>([]);
  const [displayViewMode, setDisplayViewMode] = useState<'hierarchical' | 'overview'>('hierarchical');
  const [projectionsViewMode, setProjectionsViewMode] = useState<'integrated' | 'summary'>('integrated');
  const [editingProjection, setEditingProjection] = useState<BudgetProjection | null>(null);
  const [editProjectionDialogOpen, setEditProjectionDialogOpen] = useState(false);
  const [editProjectionAmount, setEditProjectionAmount] = useState<number | string>('');
  const [editProjectionNotes, setEditProjectionNotes] = useState<string>('');
  
  // NEW: Category view settings
  const [categoryView, setCategoryView] = useState<'detailed' | 'simplified'>('simplified');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);
  const [quickFilterMode, setQuickFilterMode] = useState<'all' | 'with-expenses' | 'over-budget'>('all');

  // Add this helper function to handle the async autoAssignCategory calls synchronously
  const syncAutoAssignCategory = (category: string): string => {
    // This is a simplified version that provides immediate categorization
    // without waiting for the async operation to complete
    if (!category) return 'uncategorized';
    
    // Basic category matching logic - can be enhanced as needed
    const lowerCat = category.toLowerCase();
    
    // Map common construction categories
    if (lowerCat.includes('concrete') || lowerCat.includes('cement') || lowerCat.includes('foundation')) {
      return 'concrete-work';
    } else if (lowerCat.includes('framing') || lowerCat.includes('frame') || lowerCat.includes('lumber')) {
      return 'framing';
    } else if (lowerCat.includes('roof') || lowerCat.includes('shingle')) {
      return 'roofing';
    } else if (lowerCat.includes('plumb') || lowerCat.includes('pipe')) {
      return 'plumbing';
    } else if (lowerCat.includes('electric') || lowerCat.includes('wiring')) {
      return 'electrical';
    } else if (lowerCat.includes('hvac') || lowerCat.includes('heating') || lowerCat.includes('cooling')) {
      return 'hvac';
    } else if (lowerCat.includes('drywall') || lowerCat.includes('sheetrock')) {
      return 'drywall';
    } else if (lowerCat.includes('paint')) {
      return 'painting';
    } else if (lowerCat.includes('floor')) {
      return 'flooring';
    } else if (lowerCat.includes('cabinet') || lowerCat.includes('countertop')) {
      return 'cabinets-countertops';
    } else if (lowerCat.includes('finish')) {
      return 'finishes';
    } else if (lowerCat.includes('permit') || lowerCat.includes('inspection')) {
      return 'permits-fees';
    } else if (lowerCat.includes('design') || lowerCat.includes('architect')) {
      return 'design-engineering';
    } else if (lowerCat.includes('site') || lowerCat.includes('prep') || lowerCat.includes('excavat')) {
      return 'site-preparation';
    } else if (lowerCat.includes('window') || lowerCat.includes('door')) {
      return 'windows-doors';
    } else if (lowerCat.includes('insulation')) {
      return 'insulation';
    } else if (lowerCat.includes('landscape')) {
      return 'landscaping';
    } else if (lowerCat.includes('clean') || lowerCat.includes('debris')) {
      return 'cleanup';
    }
    
    return 'uncategorized';
  };

  // Initialize localProjections from props
  useEffect(() => {
    if (projections && projections.length > 0) {
      setLocalProjections(projections);
    } else {
      setLocalProjections([]);
    }
  }, [projections]);

  // Projection handling functions
  const handleAddProjection = async () => {
    if (!user?.uid || !currentProjectionCategory || !onAddProjection || projectionAmount === '') {
      return;
    }

    try {
      const newProjection: Omit<BudgetProjection, 'id' | 'createdAt'> = {
        categoryId: currentProjectionCategory.id,
        amount: typeof projectionAmount === 'number' ? projectionAmount : parseFloat(projectionAmount as string),
        notes: projectionNotes || null,
        userId: user.uid,
        projectId: project?.id || ''
      };

      await onAddProjection(newProjection);

      // Add to local state right away for immediate visual feedback
      const tempId = `temp-${Date.now()}`;
      setLocalProjections(prev => [
        ...prev,
        {
          ...newProjection,
          id: tempId, // Will be replaced on next data fetch
          createdAt: new Date()
        }
      ]);

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

  const handleDeleteProjection = async (projectionId: string, event?: React.MouseEvent) => {
    // Prevent event bubbling if provided
    if (event) {
      event.stopPropagation();
    }

    if (!onDeleteProjection) return;

    try {
      setUpdatingItemId(projectionId);
      await onDeleteProjection(projectionId);
      
      // Update local state right away
      setLocalProjections(prev => prev.filter(p => p.id !== projectionId));
      
      setSnackbar({
        open: true,
        message: 'Projection deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting projection:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete projection',
        severity: 'error'
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleOpenEditProjectionDialog = (projection: BudgetProjection) => {
    setEditingProjection(projection);
    setEditProjectionAmount(projection.amount);
    setEditProjectionNotes(projection.notes || '');
    setEditProjectionDialogOpen(true);
  };

  const handleEditProjectionSave = async () => {
    if (!editingProjection || !onEditProjection || editProjectionAmount === '') {
      return;
    }

    try {
      const amount = typeof editProjectionAmount === 'number' 
        ? editProjectionAmount 
        : parseFloat(editProjectionAmount as string);
      
      setUpdatingItemId(editingProjection.id);
      
      await onEditProjection(editingProjection.id, {
        amount,
        notes: editProjectionNotes || null
      });
      
      // Update local state immediately for visual feedback
      setLocalProjections(prev => prev.map(p => 
        p.id === editingProjection.id
          ? { ...p, amount, notes: editProjectionNotes || null }
          : p
      ));
      
      setEditProjectionDialogOpen(false);
      setEditingProjection(null);
      setEditProjectionAmount('');
      setEditProjectionNotes('');
      
      setSnackbar({
        open: true,
        message: 'Projection updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating projection:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update projection',
        severity: 'error'
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Calculate combined items with complete category data
  const costsByCategory = useMemo(() => {
    const hierarchicalData = new Map<string, {
      mainCategoryDetails: CategoryWithChildren | { id: string; name: string; order: number; color?: string };
      subCategories: Map<string, {
        id: string;
        name: string;
        description?: string;
        paid: number;
        pending: number;
        total: number;
        items: any[];
        needsReview: boolean;
      }>;
    }>();

    MAIN_CATEGORIES.forEach(mainCat => {
      const subCatMap = new Map<string, {
        id: string;
        name: string;
        description?: string;
        paid: number;
        pending: number;
        total: number;
        items: [],
        needsReview: false 
      }>();
      const children = Array.isArray(mainCat.children) ? mainCat.children : [];
      children.forEach(subCat => {
        subCatMap.set(subCat.id, {
          id: subCat.id,
          name: subCat.name,
          description: subCat.description,
          paid: 0,
          pending: 0,
          total: 0,
          items: [],
          needsReview: false 
        });
      });
      hierarchicalData.set(mainCat.id, {
        mainCategoryDetails: mainCat,
        subCategories: subCatMap,
      });
    });

    const uncategorizedSubMap = new Map<string, any>();
    uncategorizedSubMap.set('needs-review', {
      id: 'needs-review',
      name: 'Items Needing Review',
      description: 'Items that could not be automatically categorized', 
      paid: 0,
      pending: 0,
      total: 0,
      items: [],
      needsReview: true
    });

    hierarchicalData.set('uncategorized', {
      mainCategoryDetails: { id: 'uncategorized', name: 'Uncategorized', order: 999, color: theme.palette.grey[500] },
      subCategories: uncategorizedSubMap,
    });

    const processItem = (item: Partial<Expense | Bid | BudgetProjection>, type: 'expense' | 'bid' | 'projection') => {
      if (!item || !item.id) {
        console.warn('Invalid item', item);
        return;
      }

      let detailedCategoryId: string;

      if (type === 'expense') {
        const expense = item as Expense;
        if (expense.categoryId && getCategoryById(expense.categoryId)) { 
          detailedCategoryId = expense.categoryId;
        } else {
          detailedCategoryId = syncAutoAssignCategory(expense.category || '');
        }
      } else if (type === 'projection') {
        detailedCategoryId = (item as BudgetProjection).categoryId || 'needs-review';
      } else {
        const bid = item as Partial<Bid>;
        detailedCategoryId = bid.categoryId || syncAutoAssignCategory('');
      }

      const parentCategory = getParentCategory(detailedCategoryId);
      const categoryDetails = getCategoryById(detailedCategoryId);
      const categoryIsMain = !parentCategory && categoryDetails;
      const mainCategory = parentCategory || (categoryIsMain ? categoryDetails : undefined);
      let mainCategoryId = mainCategory?.id || 'uncategorized';

      let targetMainCategoryId = mainCategoryId;
      let targetSubCategoryId = detailedCategoryId;
      let isStandardMapping = false;
      let needsReview = false;

      if (mainCategoryId !== 'uncategorized' && hierarchicalData.has(mainCategoryId)) {
        const mainData = hierarchicalData.get(mainCategoryId)!;
        if (mainData.subCategories.has(detailedCategoryId)) {
          isStandardMapping = true;
        } else if (categoryIsMain) {
          const generalSubCatId = `${mainCategoryId}-general`;
          if (!mainData.subCategories.has(generalSubCatId)) {
            mainData.subCategories.set(generalSubCatId, {
              id: generalSubCatId,
              name: 'General',
              description: `General ${mainCategory?.name} expenses`, 
              paid: 0,
              pending: 0,
              total: 0,
              items: [],
              needsReview: true
            });
          }
          targetSubCategoryId = generalSubCatId;
          isStandardMapping = true;
          needsReview = true;
        }
      }

      if (!isStandardMapping) {
        targetMainCategoryId = 'uncategorized';
        targetSubCategoryId = 'needs-review';
        needsReview = true;
      }

      const mainCategoryData = hierarchicalData.get(targetMainCategoryId);
      if (!mainCategoryData) {
        console.warn(`Target Main Category bucket not found: ${targetMainCategoryId}`);
        return; 
      }

      if (!mainCategoryData.subCategories.has(targetSubCategoryId)) {
        targetMainCategoryId = 'uncategorized';
        targetSubCategoryId = 'needs-review';
        if (!hierarchicalData.get('uncategorized')?.subCategories.has('needs-review')) {
          hierarchicalData.get('uncategorized')!.subCategories.set('needs-review', {
            id: 'needs-review',
            name: 'Items Needing Review',
            description: 'Items that could not be categorized automatically',
            paid: 0,
            pending: 0,
            total: 0,
            items: [],
            needsReview: true
          });
        }
      }

      const subCategoryData = hierarchicalData.get(targetMainCategoryId)!
        .subCategories.get(targetSubCategoryId)!;

      if (needsReview) {
        subCategoryData.needsReview = true;
      }

      let amount = 0;
      let isPaid = false;
      let isPending = true;

      if (type === 'expense') {
        const expense = item as Expense;
        amount = expense.amount || 0;
        isPaid = expense.status === 'paid';
        isPending = expense.status === 'pending' || expense.status === 'approved';

        subCategoryData.items.push({
          id: expense.id || `temp-expense-${Date.now()}`,
          description: expense.description || expense.vendor || 'Unknown Expense',
          amount: amount,
          date: expense.date,
          status: expense.status,
          type: 'expense',
          category: expense.category,
          vendor: expense.vendor,
          phaseId: expense.phaseId
        });
      } else if (type === 'bid') {
        const bid = item as Bid;
        amount = bid.totalAmount || 0;
        isPaid = false;
        isPending = bid.status === 'accepted';

        if (isPending) {
          subCategoryData.items.push({
            id: bid.id || `temp-bid-${Date.now()}`,
            description: bid.title || bid.scope || 'Bid',
            amount: amount,
            date: bid.submissionDeadline || bid.createdAt,
            status: bid.status,
            type: 'bid',
            subcontractorName: bid.subcontractorName || null,
            phaseId: bid.phaseId
          });
        }
      } else if (type === 'projection') {
        const projection = item as BudgetProjection;
        amount = projection.amount || 0;
        isPaid = false;
        isPending = true;

        subCategoryData.items.push({
          id: projection.id || `temp-projection-${Date.now()}`,
          description: projection.notes || 'Manual Projection',
          amount: amount,
          date: projection.createdAt || new Date(),
          status: 'projected',
          type: 'projection',
          categoryId: projection.categoryId || '',
          notes: projection.notes || ''
        });
      }
      
      if (isPaid) {
        subCategoryData.paid += amount;
      } else if (isPending) {
        subCategoryData.pending += amount;
      }
      
      subCategoryData.total += amount;
    };

    expenses.forEach(expense => processItem(expense, 'expense'));
    bids.filter(bid => bid.status === 'submitted') 
        .forEach(bid => processItem(bid, 'bid'));
    localProjections.forEach(projection => processItem(projection, 'projection'));

    const finalData = Array.from(hierarchicalData.values());
    return finalData.sort((a, b) => 
      (a.mainCategoryDetails.order || 999) - (b.mainCategoryDetails.order || 999)
    );

  }, [expenses, bids, localProjections, categoryMappings, theme]);

  const categoryBudgetStatus = useMemo(() => {
    const result = new Map<string, {
      budgeted: number;
      actual: number;
      percentage: number;
      status: 'under' | 'near' | 'over';
    }>();
    
    const totalBudget = typeof project?.budget === 'object' 
      ? project.budget.total || 0
      : typeof project?.budget === 'number' ? project.budget : 0;
    
    if (!totalBudget) return result;
    
    const mainCategories = MAIN_CATEGORIES.filter(cat => !!cat.budgetPercentage);
    
    mainCategories.forEach(category => {
      const budgeted = totalBudget * (category.budgetPercentage || 0) / 100;
      
      let actual = 0;
      costsByCategory.forEach(mainCat => {
        if (mainCat.mainCategoryDetails.id === category.id) {
          actual = Array.from(mainCat.subCategories.values()).reduce((sum, sub) => 
            sum + sub.total, 0);
        }
      });
      
      const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
      const status = percentage > 110 ? 'over' : percentage > 90 ? 'near' : 'under';
      
      result.set(category.id, {
        budgeted,
        actual,
        percentage,
        status
      });
    });
    
    return result;
  }, [costsByCategory, project]);

  const filteredCategories = useMemo(() => {
    if (quickFilterMode === 'all') {
      return costsByCategory;
    } else if (quickFilterMode === 'with-expenses') {
      return costsByCategory.filter(mainCat => {
        return Array.from(mainCat.subCategories.values()).some(sub => sub.total > 0);
      });
    } else if (quickFilterMode === 'over-budget') {
      return costsByCategory.filter(mainCat => {
        const budgetInfo = categoryBudgetStatus.get(mainCat.mainCategoryDetails.id);
        return budgetInfo && budgetInfo.status === 'over';
      });
    }
    return costsByCategory;
  }, [costsByCategory, quickFilterMode, categoryBudgetStatus]);

  const handleOpenProjectionDialog = (categoryId: string, categoryName: string) => {
    setCurrentProjectionCategory({ id: categoryId, name: categoryName });
    setProjectionAmount('');
    setProjectionNotes('');
    setProjectionDialogOpen(true);
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  };

  const expandAllCategories = () => {
    const allIds = costsByCategory.map(cat => cat.mainCategoryDetails.id);
    setExpandedCategories(new Set(allIds));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const allHierarchicalIds = new Set(getAllHierarchicalCategories().map(c => c.id));
    
  type ItemWithType = 
    | (Expense & { itemType: 'expense' })
    | (Bid & { itemType: 'bid' })
    | (BudgetProjection & { itemType: 'projection' });
  
  const expenseItems: (Expense & { itemType: 'expense' })[] = expenses
    .filter(expense => !expense.bidId)
    .map(expense => ({ ...expense, itemType: 'expense' as const }));
    
  const bidItems: (Bid & { itemType: 'bid' })[] = bids.map(bid => ({ ...bid, itemType: 'bid' as const }));
  const projectionItems: (BudgetProjection & { itemType: 'projection' })[] = localProjections.map(projection => ({ ...projection, itemType: 'projection' as const }));
    
  const combinedItems: ItemWithType[] = [...expenseItems, ...bidItems, ...projectionItems];
    
  const orphanedItems = combinedItems.filter(item => {
    if (!item.id) return false;
      
    if (item.itemType === 'projection') {
      const projection = item as BudgetProjection & { itemType: 'projection' };
      return !projection.categoryId || !allHierarchicalIds.has(projection.categoryId);
    }
      
    const expenseBidItem = item as (Expense | Bid) & { itemType: 'expense' | 'bid' };
    const mappedCategory = syncAutoAssignCategory(expenseBidItem.categoryId || '');
      
    const isUncategorized = mappedCategory === 'uncategorized';
    const isNotValidCategory = !allHierarchicalIds.has(mappedCategory);
    return isUncategorized || isNotValidCategory;
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2, 
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}` 
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <AccountBalanceWalletIcon sx={{ mr: 1 }} />
              Budget Allocation Tracker
              {prefsLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="phase-filter-label">Phase</InputLabel>
              <Select
                labelId="phase-filter-label"
                id="phase-filter"
                value={selectedPhase}
                label="Phase"
                onChange={(e) => setSelectedPhase(e.target.value)}
              >
                <MenuItem value="all">All Phases</MenuItem>
                {phases.map((phase) => (
                  <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              id="search-term"
              label="Search"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                ...(searchTerm && {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                })
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="category-view-label">Category View</InputLabel>
              <Select
                labelId="category-view-label"
                id="category-view"
                value={categoryView}
                label="Category View"
                onChange={(e) => setCategoryView(e.target.value as 'detailed' | 'simplified')}
              >
                <MenuItem value="simplified">Simplified</MenuItem>
                <MenuItem value="detailed">Detailed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="quick-filter-label">Quick Filter</InputLabel>
              <Select
                labelId="quick-filter-label"
                id="quick-filter"
                value={quickFilterMode}
                label="Quick Filter"
                onChange={(e) => setQuickFilterMode(e.target.value as 'all' | 'with-expenses' | 'over-budget')}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="with-expenses">Categories with Expenses</MenuItem>
                <MenuItem value="over-budget">Over Budget Categories</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExpandMoreIcon />}
                onClick={expandAllCategories}
              >
                Expand All
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExpandLessIcon />}
                onClick={collapseAllCategories}
              >
                Collapse All
              </Button>
              
              <ToggleButtonGroup
                size="small"
                value={displayMode}
                exclusive
                onChange={(e, newMode) => newMode && setDisplayMode(newMode)}
                aria-label="expense display mode"
                sx={{ ml: 'auto' }}
              >
                <ToggleButton value="consolidated" aria-label="consolidated view">
                  <Tooltip title="Show all expense types together">
                    <LibraryBooksIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="expenses" aria-label="expenses only">
                  <Tooltip title="Show only expenses">
                    <ReceiptIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="bids" aria-label="bids only">
                  <Tooltip title="Show only bids">
                    <MonetizationOnIcon fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                size="small"
                value={displayViewMode}
                exclusive
                onChange={(e, newMode) => newMode && setDisplayViewMode(newMode)}
                aria-label="display view mode"
              >
                <ToggleButton value="hierarchical" aria-label="hierarchical view">
                  <Tooltip title="Show hierarchical category view">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountTreeIcon sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="caption">Detailed</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="overview" aria-label="overview">
                  <Tooltip title="Show summary overview">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TableChartIcon sx={{ mr: 0.5 }} fontSize="small" />
                      <Typography variant="caption">Budget Overview</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {orphanedItems.length > 0 && (
        <Card elevation={3} sx={{ mb: 3, borderRadius: 2, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Uncategorized Items ({orphanedItems.length})
                </Typography>
              </Box>
            }
            action={
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={() => setShowOrphanedExpenses(!showOrphanedExpenses)}
                startIcon={showOrphanedExpenses ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {showOrphanedExpenses ? 'Hide' : 'Show'}
              </Button>
            }
          />
          {showOrphanedExpenses && (
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                These items haven't been properly categorized. Assign them to categories for accurate budget tracking.
              </Alert>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Detected Category</TableCell>
                      <TableCell align="right">Assign Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orphanedItems.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No uncategorized items found.</TableCell></TableRow>
                    ) : (
                      orphanedItems.map(item => {
                        const itemType = 'itemType' in item ? item.itemType : ('category' in item ? 'expense' : ('totalAmount' in item ? 'bid' : 'projection'));
                        const amount = 'amount' in item ? item.amount : ('totalAmount' in item ? item.totalAmount : 0);
                        const description = 'description' in item ? item.description : ('title' in item ? item.title : 'notes' in item ? item.notes : 'Unknown');
                        const date = 'date' in item ? item.date : ('submissionDeadline' in item ? item.submissionDeadline : ('createdAt' in item ? item.createdAt : null));
                        
                        let detectedCategory = 'Uncategorized';
                        let categoryName = 'Uncategorized';
                        
                        if (itemType === 'projection' && 'categoryId' in item) {
                          const projection = item as BudgetProjection;
                          const catId = projection.categoryId;
                          if (catId) {
                            const cat = getCategoryById(catId);
                            if (cat) {
                              detectedCategory = cat.id;
                              categoryName = cat.name;
                            }
                          }
                        } else {
                          const expenseBidItem = item as (Expense | Bid);
                          if ('category' in expenseBidItem && expenseBidItem.category) {
                            const detectedMappedCategory = syncAutoAssignCategory(expenseBidItem.category);
                            if (detectedMappedCategory !== 'uncategorized') {
                              const cat = getCategoryById(detectedMappedCategory);
                              if (cat) {
                                detectedCategory = cat.id;
                                categoryName = cat.name;
                              } else {
                                detectedCategory = detectedMappedCategory;
                                categoryName = detectedMappedCategory;
                              }
                            }
                          }
                        }
                        
                        const isCurrentlyUpdating = updatingItemId === item.id;
                        
                        const formatDisplayDate = (dateValue: any): string => {
                          if (!dateValue) return '-';
                          if (typeof dateValue === 'string') {
                            try {
                              const parsedDate = new Date(dateValue);
                              return parsedDate.toLocaleDateString();
                            } catch {
                              return dateValue;
                            }
                          } else if (dateValue instanceof Date) {
                            return dateValue.toLocaleDateString();
                          } else if (typeof dateValue.toDate === 'function') {
                            return dateValue.toDate().toLocaleDateString();
                          }
                          return '-';
                        };
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={itemType === 'expense' ? 'Expense' : 
                                      itemType === 'bid' ? 'Bid' : 'Projection'} 
                                color={itemType === 'expense' ? 'primary' : 
                                      itemType === 'bid' ? 'secondary' : 'success'}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell>{description}</TableCell>
                            <TableCell>{typeof amount === 'number' ? formatCurrency(amount) : 'N/A'}</TableCell> 
                            <TableCell>{formatDisplayDate(date)}</TableCell>
                            <TableCell>
                              <Tooltip title={detectedCategory}>
                                <span>{categoryName}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              {isCurrentlyUpdating ? (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                                   <CircularProgress size={20} />
                                </Box>
                              ) : editingItemId === item.id ? (
                                <CategorySelector 
                                  onCategorySelected={async (categoryId) => {
                                    if (!item.id) return;
                                    
                                    setUpdatingItemId(item.id);
                                    
                                    try {
                                      if (itemType === 'projection') {
                                        const projection = item as BudgetProjection & { itemType: 'projection' };
                                        if (onUpdateProjectionCategory) {
                                          await onUpdateProjectionCategory(projection.id, categoryId);
                                          setLocalProjections(prev => 
                                            prev.map(p => p.id === projection.id 
                                              ? { ...p, categoryId } 
                                              : p
                                            )
                                          );
                                        }
                                      } else {
                                        const expenseBidItem = item as any;
                                        
                                        if (categoryId && expenseBidItem.id) {
                                          let originalCategory = '';
                                          
                                          if ('category' in expenseBidItem && expenseBidItem.category) {
                                            originalCategory = expenseBidItem.category;
                                          }
                                          
                                          if (originalCategory) {
                                            const mappingResult = await addCategoryMapping(
                                              expenseBidItem.id,
                                              originalCategory,
                                              categoryId,
                                              project?.id || '' // Add the projectId parameter
                                            );
                                            
                                            if (mappingResult) {
                                              setCategoryMappings(prev => ({
                                                ...prev,
                                                [expenseBidItem.id]: categoryId
                                              }));
                                              
                                              setSnackbar({
                                                open: true,
                                                message: 'Category assigned successfully',
                                                severity: 'success'
                                              });
                                            } else {
                                              setSnackbar({
                                                open: true,
                                                message: 'Failed to assign category',
                                                severity: 'error'
                                              });
                                            }
                                          }
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error updating category:', error);
                                      setSnackbar({ open: true, message: 'Failed to update category.', severity: 'error' });
                                    } finally {
                                      setUpdatingItemId(null);
                                      setEditingItemId(null);
                                    }
                                  }}
                                  size="small"
                                  fullWidth={false}
                                  variant="standard"
                                />
                              ) : (
                                <Tooltip title="Assign Category">
                                  <IconButton size="small" onClick={() => setEditingItemId(item.id!)} disabled={!item.id || !!updatingItemId}>
                                    <EditIcon fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          )}
        </Card>
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
            disabled={projectionAmount === '' || !onAddProjection}
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