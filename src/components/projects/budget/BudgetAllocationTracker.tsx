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
  CircularProgress
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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Expense, Bid, ProjectPhase, Project, BudgetProjection } from '../../../types';
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
}

// Define a common structure for items displayed in the tracker
interface DisplayableBudgetItem {
    id: string;
    description: string;
    amount: number;
    type: 'expense' | 'bid' | 'projection'; 
    status?: ExpenseStatus | BidStatus | 'projected';
    date?: Date | string | Timestamp | null;
    category?: string; // Original simple category for mapping hint
    subcontractorName?: string | null;
    vendor?: string | null;
    phaseId?: string;
    categoryId?: string; // Used for projection categories
    notes?: string; // Additional information
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  project,
  phases,
  expenses,
  bids,
  projections,
  onAddProjection,
  onUpdateProjectionCategory,
  onDeleteProjection
}) => {
  const theme = useTheme();
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

  const { user } = useAuth(); 
  
  // Re-add state variables needed for the Add Projection Dialog
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [currentProjectionCategory, setCurrentProjectionCategory] = useState<{ id: string; name: string } | null>(null);
  const [projectionAmount, setProjectionAmount] = useState<number | string>('');
  const [projectionNotes, setProjectionNotes] = useState<string>('');

  // Add a new state to track expanded subcategories
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

  // Add a new state to manage local projections for optimistic updates
  const [localProjections, setLocalProjections] = useState<BudgetProjection[]>(projections);

  useEffect(() => {
    if (project?.id) {
      setPrefsLoading(true);
      getCategoryMappingsForProject(project.id)
        .then((mappings) => {
          setCategoryMappings(mappings);
        })
        .catch((error: Error) => {
          console.error("Error loading category mappings:", error);
          setSnackbar({ open: true, message: 'Error loading category data', severity: 'error' });
        })
        .finally(() => {
          setPrefsLoading(false);
        });
    } else {
      setCategoryMappings({});
      setPrefsLoading(false);
    }
  }, [project?.id]);

  // Function to get category ID for an item (handles potential undefined IDs)
  const getCategoryIdForItem = (item: Partial<Expense | Bid>): string => {
    if (!item.id) return 'uncategorized';

    // First check if we have a manual mapping for this item
    if (categoryMappings[item.id]) {
      return categoryMappings[item.id];
    }

    try {
      // Determine the type of item to help with categorization
      let itemTypeHint = 'other';
      if ('category' in item && item.category) {
        // For expenses, use the category as a hint (materials, labor, etc.)
        itemTypeHint = item.category;
      } else if ('status' in item && !('category' in item)) {
        // Most likely a bid
        itemTypeHint = 'bid';
      }
      
      // Get description from appropriate field
      const itemDescription = ('description' in item ? item.description : 
                            ('title' in item ? item.title : 
                            ('scope' in item ? item.scope : ''))) || '';
      
      // Get vendor or subcontractor name
      const vendorOrSub = ('subcontractorName' in item ? item.subcontractorName : undefined) || 
                         ('vendor' in item ? item.vendor : '') || '';
      
      // Try to map using the detailed mapping function
      const categoryId = mapSimpleToDetailedCategory(
        itemTypeHint,
        vendorOrSub,
        itemDescription
      );
      
      return categoryId;
    } catch (error) {
      console.error("Error in mapSimpleToDetailedCategory:", error);
      return 'uncategorized';
    }
  };

  // Helper function to format date for display, handling various types
  const formatDisplayDate = (dateValue: Date | string | Timestamp | null | undefined): string => {
    if (!dateValue) return '-';
    try {
      if (dateValue instanceof Timestamp) {
        return dateValue.toDate().toLocaleDateString();
      }
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      // Attempt to parse if it's a string
      if (typeof dateValue === 'string') {
         const parsedDate = new Date(dateValue);
         // Check if parsing was successful
         if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toLocaleDateString();
         }
      }
      console.warn("Could not format date:", dateValue);
      return 'Invalid Date';
    } catch (error) {
      console.error("Error formatting date:", dateValue, error);
      return 'Error';
    }
  };

  // Function to toggle subcategory expansion
  const toggleSubcategory = (subcategoryId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the main category toggle
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  // Function to get status chip based on item type and status
  const getStatusChip = (item: DisplayableBudgetItem) => {
    if (item.type === 'expense') {
      const status = item.status as ExpenseStatus;
      if (status === 'paid') {
        return <Chip size="small" label="Paid" color="success" sx={{ fontSize: '0.7rem' }} />;
      } else if (status === 'approved') {
        return <Chip size="small" label="Approved" color="info" sx={{ fontSize: '0.7rem' }} />;
      } else if (status === 'pending') {
        return <Chip size="small" label="Pending" color="warning" sx={{ fontSize: '0.7rem' }} />;
      } else if (status === 'rejected') {
        return <Chip size="small" label="Rejected" color="error" sx={{ fontSize: '0.7rem' }} />;
      }
    } else if (item.type === 'bid') {
      return <Chip size="small" label="Bid" color="secondary" sx={{ fontSize: '0.7rem' }} />;
    } else if (item.type === 'projection') {
      return <Chip size="small" label="Projected" color="info" variant="outlined" sx={{ fontSize: '0.7rem' }} />;
    }
    return null;
  };

  // Calculate costs per category, building from the standard hierarchical structure
  const costsByCategory = useMemo(() => {
    console.log("Recalculating costsByCategory..."); // Log entry
    const hierarchicalData = new Map<string, {
      mainCategoryDetails: CategoryWithChildren | { id: string; name: string; order: number; color?: string }; // Allow basic object for uncategorized
      subCategories: Map<string, {
        id: string;
        name: string;
        description?: string;
        paid: number;
        pending: number;
        total: number;
        items: DisplayableBudgetItem[];
        needsReview: boolean;
      }>;
    }>();

    // Add standard categories
    MAIN_CATEGORIES.forEach(mainCat => {
      const subCatMap = new Map<string, {
        id: string;
        name: string;
        description?: string;
        paid: number;
        pending: number;
        total: number;
        items: DisplayableBudgetItem[];
        needsReview: boolean;
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

    // Define the structure for subcategory data explicitly
    type SubCategoryData = {
      id: string;
      name: string;
      description?: string;
      paid: number;
      pending: number;
      total: number;
      items: DisplayableBudgetItem[];
      needsReview: boolean;
    };

    // Add a dedicated entry for 'uncategorized' items/projections
    const uncategorizedSubMap = new Map<string, SubCategoryData>();
    
    // Add a placeholder subcategory to hold items that need review
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

    // 2. Process existing expenses, bids, projections and merge data
    const processItem = (item: Partial<Expense | Bid | BudgetProjection>, type: 'expense' | 'bid' | 'projection') => {
      if (!item || !item.id) {
        console.warn('Invalid item', item);
        return;
      }

      let detailedCategoryId = type === 'projection' 
        ? ((item as BudgetProjection).categoryId || 'needs-review') 
        : getCategoryIdForItem(item as Partial<Expense | Bid>);
      
      // **** Log the determined category ID ****
      console.log(`Processing Item: Type=${type}, ID=${item.id}, Desc/Notes=${(item as any).description || (item as any).notes || (item as any).title || 'N/A'}, Determined Category=${detailedCategoryId}`); 

      // Find main category
      const parentCategory = getParentCategory(detailedCategoryId);
      // Check if ID is a main category itself
      const categoryDetails = getCategoryById(detailedCategoryId);
      const categoryIsMain = !parentCategory && categoryDetails;
      const mainCategory = parentCategory || (categoryIsMain ? categoryDetails : undefined);
      let mainCategoryId = mainCategory?.id || 'uncategorized';
      
      // Default target categories
      let targetMainCategoryId = mainCategoryId;
      let targetSubCategoryId = detailedCategoryId;
      let isStandardMapping = false;
      let needsReview = false;

      // Check if it maps to a standard sub-category
      if (mainCategoryId !== 'uncategorized' && hierarchicalData.has(mainCategoryId)) {
         const mainData = hierarchicalData.get(mainCategoryId)!;
         if (mainData.subCategories.has(detailedCategoryId)) {
            isStandardMapping = true;
         } else if (categoryIsMain) {
            // If it's mapped to a main category but not a specific subcategory
            // Put it in a "General" subcategory under that main category
            const generalSubCatId = `${mainCategoryId}-general`;
            
            // Create the General subcategory if it doesn't exist
            if (!mainData.subCategories.has(generalSubCatId)) {
              mainData.subCategories.set(generalSubCatId, {
                id: generalSubCatId,
                name: 'General',
                description: `General ${mainCategory?.name} expenses`, 
                paid: 0,
                pending: 0, 
                total: 0,
                items: [],
                needsReview: true // Mark these for review since they're not specifically categorized
              });
            }
            
            // Update target subcategory
            targetSubCategoryId = generalSubCatId;
            isStandardMapping = true;
            needsReview = true; // Mark for review since we're guessing at the subcategory
         }
      }

      // If didn't map to a standard category, mark for review
      if (!isStandardMapping) {
         targetMainCategoryId = 'uncategorized';
         targetSubCategoryId = 'needs-review';
         needsReview = true;
      }

      // Get the target bucket (main category data)
      const mainCategoryData = hierarchicalData.get(targetMainCategoryId);
      if (!mainCategoryData) {
         console.warn(`Target Main Category bucket not found: ${targetMainCategoryId}`);
         return; 
      }

      // Ensure targetSubCategoryId exists in the map
      if (!mainCategoryData.subCategories.has(targetSubCategoryId)) {
         // If the target subcategory doesn't exist, put in needs-review
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

      // Get the specific sub-category data object
      const subCategoryData = hierarchicalData.get(targetMainCategoryId)!
        .subCategories.get(targetSubCategoryId)!;

      // Set review flag if needed
      if (needsReview) {
        subCategoryData.needsReview = true;
      }

      // Now add the item to the appropriate collection
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
        isPaid = false; // Bids are never "paid"
        isPending = bid.status === 'accepted'; // Only count accepted bids

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
        isPaid = false; // Projections are never "paid"
        isPending = true; // Projections are always "pending"

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
      
      // Update the category totals
      if (isPaid) {
        subCategoryData.paid += amount;
      } else if (isPending) {
        subCategoryData.pending += amount;
      }
      
      // Update total regardless
      subCategoryData.total += amount;
    };

    // Process all items
    console.log("Processing all items for costsByCategory...");
    expenses.forEach(expense => processItem(expense, 'expense'));
    bids.filter(bid => bid.status === 'accepted')
        .forEach(bid => processItem(bid, 'bid'));
    localProjections.forEach(projection => processItem(projection, 'projection'));
    console.log("Finished processing items for costsByCategory.");

    // Return the processed data, sorted by main category order
    const finalData = Array.from(hierarchicalData.values()); // Keep all, including empty/uncategorized
    return finalData.sort((a, b) => 
      (a.mainCategoryDetails.order || 999) - (b.mainCategoryDetails.order || 999)
    );

  }, [expenses, bids, localProjections, categoryMappings, theme]);

  // filteredCategories might need adjustment if filtering logic changes based on new structure
  const filteredCategories = useMemo(() => {
    // Current filtering logic operates on a flat list of categories.
    // We need to adapt it for the hierarchicalData structure.
    // Option 1: Filter sub-categories within each main category
    // Option 2: Filter main categories based on whether *any* subcategory matches
    
    // Let's try Option 1: Filter subcategories, keep main category if any subs match
    const filteredData = Array.from(costsByCategory.values()).map(mainData => {
        const filteredSubCategories = new Map<string, any>(); // Using 'any' temporarily
        mainData.subCategories.forEach((subCatData, subCatId) => {
             // Apply phase and search filters to subCatData or its items
             const phaseMatch = selectedPhase === 'all' || subCatData.items.some(item => item.phaseId === selectedPhase);
             const searchMatch = searchTerm === '' || 
                subCatData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subCatData.items.some(item => item.description?.toLowerCase().includes(searchTerm.toLowerCase()));
                
             if (phaseMatch && searchMatch) {
                filteredSubCategories.set(subCatId, subCatData);
             }
        });
        
        // Return main category data only if it has matching subcategories
        if (filteredSubCategories.size > 0) {
           return { ...mainData, subCategories: filteredSubCategories };
        }
        return null; // Exclude this main category entirely if no subs match
    }).filter(Boolean); // Remove null entries
    
    // Return the filtered hierarchical data
    return filteredData as typeof costsByCategory;

  }, [costsByCategory, selectedPhase, searchTerm]);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const handleOpenProjectionDialog = (categoryId: string, categoryName: string) => {
    setCurrentProjectionCategory({id: categoryId, name: categoryName});
    setProjectionAmount('');
    setProjectionNotes('');
    setProjectionDialogOpen(true);
  };
  
  const handleAddProjectionClick = async () => {
    if (!currentProjectionCategory || projectionAmount === '' || !project?.id || !onAddProjection) {
      console.error("Missing category, amount, project ID, or handler. Cannot add projection.");
      setSnackbar({ open: true, message: 'Missing required fields or handler.', severity: 'error' });
      return;
    }
    
    const newProjectionData: Omit<BudgetProjection, 'id' | 'createdAt'> = {
      categoryId: currentProjectionCategory.id,
      amount: typeof projectionAmount === 'number' ? projectionAmount : Number(projectionAmount),
      notes: projectionNotes || null,
    };
    
    setProjectionDialogOpen(false);
    
    try {
      setSnackbar({ open: true, message: 'Adding projection...', severity: 'info' });
      await onAddProjection(newProjectionData);
      // Success snackbar should be handled by the parent
    } catch (error) {
      console.error("Error delegating projection add:", error);
      // Error snackbar should be handled by the parent
    }
  };

  const handleRecategorizeItem = async (itemId: string, newCategoryId: string) => {
    if (!project?.id || !user?.uid || !itemId) {
        const message = !itemId ? 'Missing Item ID' : 'Missing Project/User ID';
        console.error(`Cannot update category: ${message}.`);
        setSnackbar({ open: true, message: `Cannot update category: ${message}`, severity: 'error' });
        return;
    }
    
    const originalCategoryId = categoryMappings[itemId];
    setCategoryMappings(prev => ({ ...prev, [itemId]: newCategoryId }));
    setEditingItemId(null); 
    
    try {
      await addCategoryMapping(itemId, newCategoryId, project.id, user.uid, false); 
      setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
    } catch (error) {
      console.error("Error updating category mapping:", error);
      setSnackbar({ open: true, message: 'Error updating category', severity: 'error' });
      setCategoryMappings(prev => {
        const reverted = { ...prev };
        if (originalCategoryId) reverted[itemId] = originalCategoryId;
        else delete reverted[itemId];
        return reverted;
      });
    }
  };

  const handleRecategorizeProjection = async (projectionId: string, newCategoryId: string) => {
    if (!projectionId || !newCategoryId || !onUpdateProjectionCategory) {
      console.error("Missing required data for updating projection category");
      setSnackbar({ open: true, message: 'Missing required data', severity: 'error' });
      return;
    }

    // Save the current category ID for potential rollback
    const projectionToUpdate = localProjections.find(p => p.id === projectionId);
    const originalCategoryId = projectionToUpdate?.categoryId || ''; // Ensure it's a string
    
    // Set the updating state to show loading UI
    setUpdatingItemId(projectionId);
    
    try {
      // Optimistic UI update - update local state immediately
      setLocalProjections(prev => 
        prev.map(p => 
          p.id === projectionId ? { ...p, categoryId: newCategoryId } : p
        )
      );
      
      // Perform the actual update operation
      await onUpdateProjectionCategory(projectionId, newCategoryId);
      
      // Success feedback
      setSnackbar({ open: true, message: 'Projection category updated successfully', severity: 'success' });
      
    } catch (error) {
      console.error("Error updating projection category:", error);
      setSnackbar({ open: true, message: 'Failed to update projection category', severity: 'error' });
      
      // Revert the optimistic update - explicitly ensure categoryId is a string
      setLocalProjections(prev => 
        prev.map(p => 
          p.id === projectionId ? { ...p, categoryId: originalCategoryId } : p
        )
      );
    } finally {
      // Clear updating state
      setUpdatingItemId(null);
    }
  };
  
  // Handle deleting a projection
  const handleDeleteProjection = async (projectionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering other click handlers
    
    if (!projectionId || !onDeleteProjection) {
      console.error("Missing projection ID or delete handler");
      setSnackbar({ open: true, message: 'Cannot delete: Missing data', severity: 'error' });
      return;
    }

    setUpdatingItemId(projectionId); // Show loading state

    try {
      // Optimistic UI update - remove from local state first
      setLocalProjections(prev => prev.filter(p => p.id !== projectionId));
      
      // Call the actual delete operation
      await onDeleteProjection(projectionId);
      
      // Success message
      setSnackbar({ open: true, message: 'Projection deleted successfully', severity: 'success' });
    } catch (error) {
      console.error("Error deleting projection:", error);
      setSnackbar({ open: true, message: 'Failed to delete projection', severity: 'error' });
      
      // Try to restore the projection if the server call failed
      if (projections) {
        const deletedProjection = projections.find(p => p.id === projectionId);
        if (deletedProjection) {
          setLocalProjections(prev => [...prev, deletedProjection]);
        }
      }
    } finally {
      setUpdatingItemId(null);
    }
  };

  // **** Calculate orphanedItems directly on each render (remove useMemo) ****
  const allHierarchicalIds = new Set(getAllHierarchicalCategories().map(c => c.id));
    
  type ItemWithType = 
    | (Expense & { itemType: 'expense' })
    | (Bid & { itemType: 'bid' })
    | (BudgetProjection & { itemType: 'projection' });
  
  const expenseItems: (Expense & { itemType: 'expense' })[] = expenses.map(expense => ({ ...expense, itemType: 'expense' as const }));
  const bidItems: (Bid & { itemType: 'bid' })[] = bids.map(bid => ({ ...bid, itemType: 'bid' as const }));
  const projectionItems: (BudgetProjection & { itemType: 'projection' })[] = localProjections.map(projection => ({ ...projection, itemType: 'projection' as const }));
    
  const combinedItems: ItemWithType[] = [...expenseItems, ...bidItems, ...projectionItems];
    
  const orphanedItems = combinedItems.filter(item => {
    if (!item.id) return false;
      
    if (item.itemType === 'projection') {
      const projection = item as BudgetProjection & { itemType: 'projection' };
      // Use the latest 'projection.categoryId' from the props
      return !projection.categoryId || !allHierarchicalIds.has(projection.categoryId);
    }
      
    const expenseBidItem = item as (Expense | Bid) & { itemType: 'expense' | 'bid' };
    const mappedCategory = getCategoryIdForItem(expenseBidItem); // Uses local categoryMappings state
      
    const isUncategorized = mappedCategory === 'uncategorized';
    const isNotValidCategory = !allHierarchicalIds.has(mappedCategory);
    return isUncategorized || isNotValidCategory;
  });
  // **** End of direct calculation ****

  const handleCloseSnackbar = () => {
      setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="phase-filter-label">Phase</InputLabel>
          <Select
            labelId="phase-filter-label"
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
        <TextField 
          size="small"
          label="Search Categories/Items"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button 
            variant="outlined"
            size="small"
            onClick={() => setShowOrphanedExpenses(!showOrphanedExpenses)}
            startIcon={orphanedItems.length > 0 ? <WarningIcon /> : <CheckCircleIcon />}
            color={orphanedItems.length > 0 && !showOrphanedExpenses ? "warning" : "inherit"}
        >
            {showOrphanedExpenses ? "Hide Uncategorized" : `Show Uncategorized (${orphanedItems.length})`}
        </Button>
      </Paper>

      {showOrphanedExpenses && (
          <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.warning.light, 0.1) }}>
              <CardHeader 
                title="Items Needing Review"
                subheader={`These ${orphanedItems.length} items need categorization review.`}
                avatar={<WarningIcon color="warning" />}
              />
              <CardContent>
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
                                    const date = 'date' in item ? item.date : ('submissionDeadline' in item ? item.submissionDeadline : ('createdAt' in item ? item.createdAt : null));
                                    const description = 'description' in item ? item.description : ('title' in item ? item.title : ('scope' in item ? item.scope : ('notes' in item ? item.notes : 'N/A')));
                                    
                                    const detectedCategory = itemType === 'projection' && 'categoryId' in item ? 
                                      item.categoryId : 
                                      (itemType === 'expense' || itemType === 'bid' ? getCategoryIdForItem(item as Expense | Bid) : 'uncategorized');
                                    
                                    const categoryName = detectedCategory ? (getCategoryById(detectedCategory)?.name || detectedCategory) : 'Uncategorized';
                                    
                                    const isCurrentlyUpdating = updatingItemId === item.id;

                                    return (
                                      <TableRow 
                                        key={item.id} 
                                        hover
                                        sx={{ opacity: isCurrentlyUpdating ? 0.5 : 1 }}
                                      >
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
                                                      value={itemType === 'projection' && 'categoryId' in item ? (item.categoryId || '') : (categoryMappings[item.id!] || '')}
                                                      onChange={async (newCatId) => {
                                                        if (!item.id || !newCatId || isCurrentlyUpdating) return;
                                                        
                                                        const currentItemId = item.id; 
                                                        setEditingItemId(null); 
                                                        setUpdatingItemId(currentItemId);
                                                        
                                                        try {
                                                          if (itemType === 'projection' && onUpdateProjectionCategory) {
                                                              setSnackbar({ open: true, message: 'Updating category...', severity: 'info' });
                                                              await handleRecategorizeProjection(currentItemId, newCatId); 
                                                          } else if (itemType !== 'projection'){
                                                              await handleRecategorizeItem(currentItemId, newCatId);
                                                          }
                                                          // Success message now handled by parent/handleRecategorizeItem
                                                        } catch (error) {
                                                            console.error("Error during category update delegation/handling:", error);
                                                            setSnackbar({ open: true, message: 'Failed to update category.', severity: 'error' });
                                                        } finally {
                                                            setUpdatingItemId(null);
                                                        }
                                                      }}
                                                      size="small"
                                                      fullWidth={false}
                                                      variant="standard"
                                                      disabled={isCurrentlyUpdating}
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
          </Card>
      )}

      <TableContainer component={Paper} elevation={2}>
        <Table stickyHeader aria-label="budget allocation table">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'background.default' } }}>
              <TableCell>Category / Item</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Pending/Projected</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prefsLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading categories...</TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={5} align="center">
                        {searchTerm ? 'No categories match your search.' : 'No budget items found.'}
                    </TableCell>
                 </TableRow>
             ) : (
              filteredCategories.map((mainCategoryData) => {
                const { mainCategoryDetails, subCategories } = mainCategoryData;
                
                // Calculate totals for the main category
                let totalMainPaid = 0, totalMainPending = 0, totalMainTotal = 0;
                let hasItemsNeedingReview = false;
                
                subCategories.forEach(sub => {
                  totalMainPaid += sub.paid;
                  totalMainPending += sub.pending;
                  totalMainTotal += sub.total;
                  if (sub.needsReview) hasItemsNeedingReview = true;
                });
                
                const isMainExpanded = expandedSection === mainCategoryDetails.id;

                return (
                  <React.Fragment key={mainCategoryDetails.id}>
                    {/* Main Category Row - Access via mainCategoryDetails */}
                    <TableRow 
                      hover 
                      onClick={() => toggleSection(mainCategoryDetails.id)}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: alpha(mainCategoryDetails.color || theme.palette.grey[500], 0.08),
                        borderBottom: isMainExpanded ? 'none' : `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          bgcolor: alpha(mainCategoryDetails.color || theme.palette.grey[500], 0.15),
                        }
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton size="small" sx={{ mr: 1 }} aria-label={isMainExpanded ? 'Collapse section' : 'Expand section'}>
                            {isMainExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          <Box 
                            component="span" 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: mainCategoryDetails.color || theme.palette.grey[500], 
                              mr: 1,
                              display: 'inline-block'
                            }} 
                          />
                          <Typography variant="subtitle1" fontWeight="bold">{mainCategoryDetails.name}</Typography>
                          {hasItemsNeedingReview && (
                            <Tooltip title="Contains items needing category review">
                              <WarningIcon 
                                fontSize="small" 
                                color="warning" 
                                sx={{ ml: 1, opacity: 0.7 }} 
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>{formatCurrency(totalMainPaid)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>{formatCurrency(totalMainPending)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(totalMainTotal)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Add Projection">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProjectionDialog(mainCategoryDetails.id, mainCategoryDetails.name);
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Subcategory Rows (Expanded) - Iterate over subCategories map */}
                    {isMainExpanded && Array.from(subCategories.values()).map(subCategoryData => {
                       const hasItems = subCategoryData.items.length > 0;
                       const isSubExpanded = expandedSubcategories.has(subCategoryData.id);
                       
                       return (
                         <React.Fragment key={subCategoryData.id}>
                           <TableRow 
                             hover
                             sx={{ 
                               bgcolor: alpha(theme.palette.background.paper, 0.5),
                               '& > td': { borderBottom: '1px solid rgba(224, 224, 224, 0.5)'},
                               '&:hover': { bgcolor: alpha(mainCategoryDetails.color || theme.palette.grey[500], 0.05) }
                             }}
                           >
                             <TableCell sx={{ pl: 6 }}> {/* Indent */}
                               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                 <IconButton 
                                   size="small" 
                                   sx={{ mr: 1 }} 
                                   aria-label={isSubExpanded ? 'Collapse subcategory' : 'Expand subcategory'}
                                   onClick={(e) => toggleSubcategory(subCategoryData.id, e)}
                                 >
                                   {isSubExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                 </IconButton>
                                 <Box 
                                   component="span"
                                   sx={{ 
                                     width: 4, 
                                     height: 16, 
                                     bgcolor: mainCategoryDetails.color || theme.palette.grey[500], 
                                     mr: 2,
                                     display: 'inline-block' 
                                   }} 
                                 />
                                 <Typography 
                                   variant="body2" 
                                   fontWeight={hasItems ? 'medium' : 'normal'}
                                   sx={{ display: 'flex', alignItems: 'center' }}
                                 >
                                   {subCategoryData.name} 
                                   {hasItems && (
                                     <Chip 
                                       size="small" 
                                       label={`${subCategoryData.items.length}`} 
                                       sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                                     />
                                   )}
                                   {subCategoryData.needsReview && (
                                     <Tooltip title="Items need category review">
                                       <WarningIcon 
                                         fontSize="small" 
                                         color="warning" 
                                         sx={{ ml: 1, opacity: 0.7, width: 18, height: 18 }} 
                                       />
                                     </Tooltip>
                                   )}
                                 </Typography>
                               </Box>
                               {subCategoryData.description && (
                                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 6 }}>
                                   {subCategoryData.description}
                                 </Typography>
                               )}
                             </TableCell>
                             <TableCell align="right">{formatCurrency(subCategoryData.paid)}</TableCell>
                             <TableCell align="right">{formatCurrency(subCategoryData.pending)}</TableCell>
                             <TableCell align="right" sx={{ fontWeight: 'medium' }}>{formatCurrency(subCategoryData.total)}</TableCell>
                             <TableCell align="right">
                               {subCategoryData.items.length > 0 && (
                                 <Tooltip title={subCategoryData.needsReview ? "Review Categories" : "View Items"}>
                                   <IconButton 
                                     size="small" 
                                     onClick={(e) => toggleSubcategory(subCategoryData.id, e)}
                                   >
                                     {subCategoryData.needsReview ? (
                                       <EditIcon fontSize="small" />
                                     ) : (
                                       <InfoIcon fontSize="small" />
                                     )}
                                   </IconButton>
                                 </Tooltip>
                               )}
                             </TableCell>
                           </TableRow>

                           {/* Subcategory Items (Expanded) */}
                           {isSubExpanded && subCategoryData.items.length > 0 && (
                             <>
                               {/* Items header row */}
                               <TableRow sx={{ bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                                 <TableCell colSpan={5} sx={{ py: 1 }}>
                                   <Typography variant="caption" fontWeight="medium" color="text.secondary">
                                     {subCategoryData.items.length} ITEM{subCategoryData.items.length !== 1 ? 'S' : ''} IN {subCategoryData.name.toUpperCase()}
                                   </Typography>
                                 </TableCell>
                               </TableRow>
                               
                               {/* Individual items */}
                               {subCategoryData.items.map(item => (
                                 <TableRow 
                                   key={item.id} 
                                   hover
                                   sx={{ 
                                     bgcolor: 'background.paper',
                                     '&:hover': { bgcolor: alpha(theme.palette.grey[100], 0.7) },
                                     '& > td': { 
                                       py: 1,
                                       borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.3)}` 
                                     }
                                   }}
                                 >
                                   <TableCell sx={{ pl: 10 }}>
                                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                       <Chip 
                                         size="small" 
                                         label={item.type === 'expense' ? 'Expense' : 
                                                item.type === 'bid' ? 'Bid' : 'Projection'} 
                                         color={item.type === 'expense' ? 'primary' : 
                                                item.type === 'bid' ? 'secondary' : 'info'}
                                         variant={item.type === 'projection' ? 'outlined' : 'filled'}
                                         sx={{ fontSize: '0.7rem', mr: 1 }}
                                       />
                                       <Box>
                                         <Typography variant="body2">{item.description}</Typography>
                                         {item.vendor && (
                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                             Vendor: {item.vendor}
                                           </Typography>
                                         )}
                                         {item.subcontractorName && (
                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                             Subcontractor: {item.subcontractorName}
                                           </Typography>
                                         )}
                                         {item.date && (
                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                             Date: {formatDisplayDate(item.date)}
                                           </Typography>
                                         )}
                                         {item.notes && (
                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                             Notes: {item.notes}
                                           </Typography>
                                         )}
                                         {item.phaseId && (
                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                             Phase: {phases.find(p => p.id === item.phaseId)?.name || 'Unknown'}
                                           </Typography>
                                         )}
                                       </Box>
                                     </Box>
                                   </TableCell>
                                   <TableCell align="right">
                                     {item.type === 'expense' && (item.status === 'paid') ? 
                                       formatCurrency(item.amount) : '-'}
                                   </TableCell>
                                   <TableCell align="right">
                                     {(item.type === 'expense' && item.status !== 'paid') || 
                                      item.type === 'bid' || 
                                      item.type === 'projection' ? 
                                       formatCurrency(item.amount) : '-'}
                                   </TableCell>
                                   <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                   <TableCell align="right">
                                     {getStatusChip(item)}
                                     {item.type === 'expense' && item.id && (
                                       <Tooltip title="Recategorize Item">
                                         <IconButton 
                                           size="small" 
                                           onClick={() => setEditingItemId(item.id)}
                                           sx={{ ml: 1, opacity: 0.6 }}
                                         >
                                           <CategoryIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                         </IconButton>
                                       </Tooltip>
                                     )}
                                     {item.type === 'projection' && item.id && (
                                       <Tooltip title="Delete Projection">
                                         <IconButton 
                                           size="small" 
                                           onClick={(e) => handleDeleteProjection(item.id, e)}
                                           sx={{ ml: 1, opacity: 0.6 }}
                                         >
                                           <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                         </IconButton>
                                       </Tooltip>
                                     )}
                                   </TableCell>
                                 </TableRow>
                               ))}
                             </>
                           )}
                         </React.Fragment>
                       );
                     })
                    }
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
          <Button onClick={handleAddProjectionClick} variant="contained" disabled={projectionAmount === '' || !onAddProjection}>
            Add Projection
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

// Define BidStatus and ExpenseStatus if not globally available
type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';
type BidStatus = 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'revision_requested';