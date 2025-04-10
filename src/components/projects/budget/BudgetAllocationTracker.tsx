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
  Snackbar
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
  Category as CategoryIcon
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
import { Category } from '../../../types/category.types';

import { BudgetItem } from '../../../types/budget.types';

interface BudgetAllocationTrackerProps {
  project: Project | null;
  phases: ProjectPhase[];
  expenses: Expense[];
  bids: Bid[];
  onAddProjection?: (projection: BudgetProjection) => void;
}

// Define a common structure for items displayed in the tracker
interface DisplayableBudgetItem {
    id: string; // Make ID non-optional for display items
    description: string;
    amount: number;
    type: 'expense' | 'bid' | 'projection'; 
    status?: ExpenseStatus | BidStatus | 'projected';
    date?: Date | string | Timestamp | null;
    category?: string; // Original simple category for mapping hint
    subcontractorName?: string | null;
    vendor?: string | null;
    phaseId?: string;
    // Add other common fields if needed for display/logic
}

const BudgetAllocationTracker: React.FC<BudgetAllocationTrackerProps> = ({
  project,
  phases,
  expenses,
  bids,
  onAddProjection
}) => {
  const theme = useTheme();
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'expenses' | 'bids' | 'consolidated'>('consolidated');
  
  const [projections, setProjections] = useState<BudgetProjection[]>([]);
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [currentProjectionCategory, setCurrentProjectionCategory] = useState<{id: string, name: string} | null>(null);
  const [projectionAmount, setProjectionAmount] = useState<number | ''>('');
  const [projectionNotes, setProjectionNotes] = useState('');
  
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [prefsLoading, setPrefsLoading] = useState<boolean>(true);
  const [showOrphanedExpenses, setShowOrphanedExpenses] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const { user } = useAuth(); 
  
  useEffect(() => {
    if (project?.id) {
      setPrefsLoading(true);
      getCategoryMappingsForProject(project.id)
        .then((mappings) => {
          setCategoryMappings(mappings);
          if (project.projections) {
            const loadedProjections = project.projections.map(p => ({
              ...p,
              createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt) 
            }));
            setProjections(loadedProjections);
          }
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
      setProjections([]);
      setPrefsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (project?.projections) {
      const loadedProjections = project.projections.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt)
      }));
      if (JSON.stringify(loadedProjections) !== JSON.stringify(projections)) {
        setProjections(loadedProjections);
      }
    }
  }, [project?.projections]);
  
  // Function to get category ID for an item (handles potential undefined IDs)
  const getCategoryIdForItem = (item: Partial<Expense | Bid>): string => {
    if (!item.id) return 'uncategorized';

    if (categoryMappings[item.id]) {
      return categoryMappings[item.id];
    }

    try {
      let itemTypeHint = 'other';
      if ('category' in item && item.category) {
        itemTypeHint = item.category;
      } else if ('status' in item && !('category' in item)) {
         itemTypeHint = 'bid'; // Likely a Bid
      }
      
      const itemDescription = ('description' in item ? item.description : ('title' in item ? item.title : ('scope' in item ? item.scope : ''))) || '';
      const vendorOrSub = ('subcontractorName' in item ? item.subcontractorName : undefined) || ('vendor' in item ? item.vendor : '') || '';
      
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

  // Calculate costs per category, using the new hierarchical categories
  const costsByCategory = useMemo(() => {
    const categoryCosts: Record<string, { 
      name: string;
      id: string; 
      mainCategoryId: string;
      spent: number;
      pending: number;
      bidTotal: number;
      projected: number;
      items: DisplayableBudgetItem[]; // Use the common display type
      hasCosts: boolean;
      hasProjections: boolean;
    }> = {};

    // Helper to get category details and ensure entry exists
    const ensureCategory = (categoryId: string): string => {
      if (!categoryCosts[categoryId]) {
        const category = getCategoryById(categoryId);
        const parentCategory = category?.parentId ? getParentCategory(categoryId) : category;
        categoryCosts[categoryId] = {
          id: categoryId,
          name: category?.name || categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          mainCategoryId: parentCategory?.id || 'uncategorized',
          spent: 0,
          pending: 0,
          bidTotal: 0,
          projected: 0,
          items: [],
          hasCosts: false,
          hasProjections: false,
        };
      }
      return categoryId;
    };

    // Process expenses
    expenses.forEach((expense) => {
      if (!expense.id) return; 
      const categoryId = ensureCategory(getCategoryIdForItem(expense)); 
      
      // Map expense to DisplayableBudgetItem
      const displayItem: DisplayableBudgetItem = {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          type: 'expense',
          status: expense.status,
          date: expense.date,
          category: expense.category, // Keep original for potential re-mapping hint
          subcontractorName: expense.subcontractorName,
          vendor: expense.vendor,
          phaseId: expense.phaseId
      };
      categoryCosts[categoryId].items.push(displayItem);

      if (expense.status === 'paid' || expense.status === 'approved') {
        categoryCosts[categoryId].spent += expense.amount;
      } else if (expense.status === 'pending') {
        categoryCosts[categoryId].pending += expense.amount;
      }
      categoryCosts[categoryId].hasCosts = true;
    });

    // Process bids
    bids.forEach((bid) => {
      if (!bid.id) return; 
      const categoryId = ensureCategory(getCategoryIdForItem(bid)); 

      // Map bid to DisplayableBudgetItem
      const displayItem: DisplayableBudgetItem = {
          id: bid.id,
          description: bid.title || bid.scope || 'Bid Item', // Use title or scope
          amount: bid.totalAmount, // Use totalAmount from Bid type
          type: 'bid',
          status: bid.status,
          date: bid.submissionDeadline || bid.createdAt,
          subcontractorName: bid.subcontractorName,
          phaseId: bid.phaseId
      };
      categoryCosts[categoryId].items.push(displayItem);

      if (bid.status === 'accepted') { 
         categoryCosts[categoryId].bidTotal += bid.totalAmount || 0; 
      }
      categoryCosts[categoryId].hasCosts = true;
    });

    // Process projections
    projections.forEach((projection) => {
      const categoryId = ensureCategory(projection.categoryId); 
      categoryCosts[categoryId].projected += projection.amount;
      categoryCosts[categoryId].hasProjections = true;
      // Add projection as a displayable item
      const displayItem: DisplayableBudgetItem = {
          id: projection.id,
          description: projection.notes || 'Manual Projection',
          amount: projection.amount,
          type: 'projection',
          status: 'projected',
          date: projection.createdAt
      };
      categoryCosts[categoryId].items.push(displayItem);
    });

    // Convert to array and sort 
    return Object.values(categoryCosts).sort((a, b) => {
      if (a.mainCategoryId !== b.mainCategoryId) {
        if (a.mainCategoryId === 'uncategorized') return 1;
        if (b.mainCategoryId === 'uncategorized') return -1;
        return a.mainCategoryId.localeCompare(b.mainCategoryId);
      }
      return a.name.localeCompare(b.name);
    });

  }, [expenses, bids, projections, categoryMappings]);

  const filteredCategories = useMemo(() => {
    return costsByCategory.filter(category => {
      const phaseMatch = selectedPhase === 'all' || 
        category.items.some(item => 'phaseId' in item && item.phaseId === selectedPhase);
        
      const searchMatch = searchTerm === '' || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.items.some(item => item.description?.toLowerCase().includes(searchTerm.toLowerCase()));

      return phaseMatch && searchMatch;
    });
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
  
  const handleAddProjection = async () => {
    if (!currentProjectionCategory || projectionAmount === '' || !project?.id) {
      console.error("Missing category, amount, or project ID. Cannot add projection.");
      setSnackbar({ open: true, message: 'Missing required fields for projection', severity: 'error' });
      return;
    }
    
    const newProjection: BudgetProjection = {
      id: `projection-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      categoryId: currentProjectionCategory.id,
      amount: typeof projectionAmount === 'number' ? projectionAmount : Number(projectionAmount),
      notes: projectionNotes || null,
      createdAt: new Date() 
    };
    
    const updatedProjections = [...projections, newProjection];
    setProjections(updatedProjections);
    setProjectionDialogOpen(false);
    
    try {
      await updateProject(project.id, { projections: updatedProjections });
      setSnackbar({ open: true, message: 'Projection added successfully', severity: 'success' });
      if (onAddProjection) {
          onAddProjection(newProjection);
      }
    } catch (error) {
      console.error("Error saving projection:", error);
      setSnackbar({ open: true, message: 'Error saving projection', severity: 'error' });
      setProjections(projections);
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
  
  // Get orphaned items (both expenses and bids)
  const orphanedItems = useMemo(() => {
    const allHierarchicalIds = new Set(getAllHierarchicalCategories().map(c => c.id));
    const combinedItems: Array<Partial<Expense | Bid>> = [...expenses, ...bids];
    
    return combinedItems.filter(item => {
        if (!item.id) return false; 
        const mappedCategory = getCategoryIdForItem(item);
        return mappedCategory === 'uncategorized' || !allHierarchicalIds.has(mappedCategory);
    });
  }, [expenses, bids, categoryMappings]); 

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
            color={orphanedItems.length > 0 && !showOrphanedExpenses ? "warning" : "inherit"} // Use inherit for default color
        >
            {showOrphanedExpenses ? "Hide Uncategorized" : `Show Uncategorized (${orphanedItems.length})`}
        </Button>
      </Paper>

      {showOrphanedExpenses && (
          <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.warning.light, 0.1) }}>
              <CardHeader 
                title="Uncategorized Items"
                subheader={`These ${orphanedItems.length} items need categorization review.`}
                avatar={<WarningIcon color="warning" />}
              />
              <CardContent>
                  <TableContainer>
                      <Table size="small">
                          <TableHead>
                              <TableRow>
                                  <TableCell>Description</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Detected Category</TableCell>
                                  <TableCell align="right">Assign Category</TableCell>
                              </TableRow>
                          </TableHead>
                          <TableBody>
                              {orphanedItems.length === 0 ? (
                                  <TableRow><TableCell colSpan={5} align="center">No uncategorized items found.</TableCell></TableRow>
                              ) : (
                                  orphanedItems.map(item => {
                                    const amount = 'amount' in item ? item.amount : ('totalAmount' in item ? item.totalAmount : 0);
                                    const date = 'date' in item ? item.date : ('submissionDeadline' in item ? item.submissionDeadline : ('createdAt' in item ? item.createdAt : null));
                                    const description = 'description' in item ? item.description : ('title' in item ? item.title : ('scope' in item ? item.scope : 'N/A'));
                                    
                                    return (
                                      <TableRow key={item.id} hover>
                                          <TableCell>{description}</TableCell>
                                          <TableCell>{typeof amount === 'number' ? formatCurrency(amount) : 'N/A'}</TableCell> 
                                          <TableCell>{formatDisplayDate(date)}</TableCell>
                                          <TableCell><i>{getCategoryIdForItem(item)}</i></TableCell>
                                          <TableCell align="right">
                                              {editingItemId === item.id ? (
                                                  <CategorySelector 
                                                      value={categoryMappings[item.id!] || ''} 
                                                      onChange={(newCatId) => { if (item.id) handleRecategorizeItem(item.id, newCatId); }}
                                                      size="small"
                                                      fullWidth={false}
                                                      variant="standard"
                                                  />
                                              ) : (
                                                  <Tooltip title="Assign Category">
                                                      <IconButton size="small" onClick={() => setEditingItemId(item.id!)} disabled={!item.id}>
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
              <TableCell>Category</TableCell>
              <TableCell align="right">Spent</TableCell>
              <TableCell align="right">Pending</TableCell>
              <TableCell align="right">Bids (Accepted)</TableCell>
              <TableCell align="right">Projected</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prefsLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading categories...</TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={7} align="center">
                        {searchTerm ? 'No categories match your search.' : 'No budget items found for the selected phase.'}
                    </TableCell>
                 </TableRow>
             ) : (
              filteredCategories.map((category) => {
                const categoryDetails = getCategoryById(category.id);
                const mainCategory = categoryDetails?.parentId ? getParentCategory(categoryDetails.id) : categoryDetails;
                const isExpanded = expandedSection === category.id;
                const totalCost = category.spent + category.pending + category.bidTotal + category.projected;

                return (
                  <React.Fragment key={category.id}>
                    <TableRow 
                      hover 
                      onClick={() => toggleSection(category.id)}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: mainCategory ? alpha(mainCategory.color || theme.palette.grey[500], 0.05) : undefined,
                        '&:hover': {
                          bgcolor: mainCategory ? alpha(mainCategory.color || theme.palette.grey[500], 0.1) : undefined,
                        }
                      }}
                    >
                      <TableCell component="th" scope="row">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton size="small" sx={{ mr: 1 }} aria-label={isExpanded ? 'Collapse section' : 'Expand section'}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          <Box>
                            <Typography variant="subtitle2">{category.name}</Typography>
                            {mainCategory && category.id !== mainCategory.id && (
                              <Typography variant="caption" color="text.secondary">{mainCategory.name}</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(category.spent)}</TableCell>
                      <TableCell align="right">{formatCurrency(category.pending)}</TableCell>
                      <TableCell align="right">{formatCurrency(category.bidTotal)}</TableCell>
                      <TableCell align="right">{formatCurrency(category.projected)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="medium">{formatCurrency(totalCost)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                         <Tooltip title="Add Manual Projection">
                           <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenProjectionDialog(category.id, category.name); }}>
                             <AddIcon fontSize="small" color="primary"/>
                           </IconButton>
                         </Tooltip>
                       </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow sx={{ '& > td': { borderBottom: 0, p: 0 } }}>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Box sx={{ margin: 1, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 1 }}>
                            <Typography variant="overline" color="text.secondary" gutterBottom>
                              Items in {category.name}
                            </Typography>
                            <Table size="small" aria-label="item details">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Description</TableCell>
                                  <TableCell align="right">Amount</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Status/Date</TableCell>
                                  <TableCell align="right">Re-categorize</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {category.items.length === 0 ? (
                                  <TableRow><TableCell colSpan={5} align="center">No items in this category yet.</TableCell></TableRow>
                                ) : (
                                  category.items.map((item) => (
                                    <TableRow key={item.id} hover>
                                      <TableCell component="th" scope="row">
                                        {item.description || 'No Description'}
                                      </TableCell>
                                      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                      <TableCell>
                                        <Chip label={item.type || 'unknown'} size="small" variant="outlined" />
                                      </TableCell>
                                      <TableCell>
                                        {item.status}
                                        {item.date && ` on ${formatDisplayDate(item.date)}`}
                                      </TableCell>
                                      <TableCell align="right">
                                        {editingItemId === item.id ? (
                                          <CategorySelector 
                                            value={getCategoryIdForItem({id: item.id} as Partial<Expense | Bid>)} 
                                            onChange={(newCatId) => {
                                                if (item.id) {
                                                    handleRecategorizeItem(item.id, newCatId);
                                                } else {
                                                    console.error("Cannot recategorize item without ID");
                                                    setSnackbar({ open: true, message: 'Error: Item ID missing', severity: 'error' });
                                                }
                                            }}
                                            size="small"
                                            fullWidth={false} 
                                            variant='standard' 
                                          />
                                        ) : (
                                          <Tooltip title="Edit Category">
                                            <IconButton size="small" onClick={() => setEditingItemId(item.id!)} disabled={!item.id}>
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
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
          <Button onClick={handleAddProjection} variant="contained" disabled={projectionAmount === ''}>
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