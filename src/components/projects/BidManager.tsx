import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Alert, CircularProgress,
  TableSortLabel,
  useTheme,
  alpha
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectService } from '../../services/project';
import { BidService } from '../../services/bid';
import { ExpenseService } from '../../services/expense';
import { Project, Bid, Expense } from '../../types';
import BidFormModal from './BidFormModal'; // Import the modal
import { visuallyHidden } from '@mui/utils'; // For accessibility with sorting

// Define types for sorting
type Order = 'asc' | 'desc';
type BidKeys = keyof Bid; // Properties we can sort by

interface HeadCell {
  id: BidKeys | 'actions'; // Include non-data columns if needed
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'subcontractorName', numeric: false, label: 'Contractor/Supplier', sortable: true },
  { id: 'scope', numeric: false, label: 'Category/Scope', sortable: true },
  { id: 'totalAmount', numeric: true, label: 'Amount', sortable: true },
  { id: 'status', numeric: false, label: 'Status', sortable: true },
  { id: 'submissionDeadline', numeric: false, label: 'Submission Date', sortable: true },
  { id: 'actions', numeric: false, label: 'Actions', sortable: false },
];

interface BidManagerProps {
  project: Project;
  userId: string;
  onProjectUpdate: (updatedProject: Project) => void;
}

// Helper to get bid status chip color
const getBidStatusColor = (status: Bid['status']): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'submitted':
    case 'draft':
        return 'info';
    case 'accepted':
        return 'success';
    case 'rejected':
        return 'error';
    case 'revision_requested':
        return 'warning';
    case 'expired':
    case 'withdrawn':
        return 'default';
    default: 
        return 'default';
  }
};

// Helper function for stable sorting
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1]; // Stabilize by original index if equal
  });
  return stabilizedThis.map((el) => el[0]);
}

// Adjust getComparator signature to handle potentially optional keys
function getComparator<T, Key extends keyof T>( // Explicitly define T
  order: Order,
  orderBy: Key,
): (a: T, b: T) => number { // Use T directly, allowing optional properties
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// descendingComparator already handles null/undefined check
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  // Handle potential null/undefined values and different types
  const aValue = a[orderBy];
  const bValue = b[orderBy];

  // Treat null/undefined as lowest value for strings, highest for numbers/dates in descending
  if (aValue == null) return 1;
  if (bValue == null) return -1;

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  if (aValue instanceof Date && bValue instanceof Date) {
     if (bValue.getTime() < aValue.getTime()) return -1;
     if (bValue.getTime() > aValue.getTime()) return 1;
     return 0;
  }
  // Default to string comparison
  const aStr = String(aValue).toLowerCase();
  const bStr = String(bValue).toLowerCase();
   if (bStr < aStr) return -1;
   if (bStr > aStr) return 1;
   return 0;
}

const BidManager: React.FC<BidManagerProps> = ({ project, userId, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<BidKeys>('scope'); // Default sort by scope
  const [bids, setBids] = useState<Bid[]>(project.bids || []);

  const theme = useTheme(); // Get theme for styling

  // Ensure we always have the latest bids from the project
  useEffect(() => {
    setBids(project.bids || []);
  }, [project.bids]);

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: BidKeys) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // --- Memoized Sorting, Grouping, and Highlighting Logic ---
  const { groupedBids, lowestBidsByCategory } = useMemo(() => {
    const eligibleStatusesForLowest: Bid['status'][] = ['submitted', 'draft']; // Define statuses to consider for "lowest"

    // 1. Primary sort by Category, Secondary sort by user selection
    const sortedBids = stableSort(bids, (a, b) => {
        // Primary Sort: Category (handle undefined)
        const categoryA = a.scope || 'zzzz'; // Put uncategorized last
        const categoryB = b.scope || 'zzzz';
        const categoryComparison = categoryA.localeCompare(categoryB);
        if (categoryComparison !== 0) {
             // Always sort categories ascending regardless of main order direction for grouping
             return categoryComparison; 
        }
        // Secondary Sort: User selected column based on overall order direction
         return getComparator<Bid, keyof Bid>(order, orderBy)(a, b);
    });

    // 2. Grouping (implicitly done by sorting) and Finding Lowest Bid per Category
    const grouped: { [category: string]: Bid[] } = {};
    const lowest: { [category: string]: number } = {};

    sortedBids.forEach(bid => {
      const category = bid.scope || 'Uncategorized'; // Group undefined categories
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(bid);

      // Check if this bid qualifies for lowest calculation
      if (eligibleStatusesForLowest.includes(bid.status) && bid.totalAmount > 0) {
        if (lowest[category] === undefined || bid.totalAmount < lowest[category]) {
          lowest[category] = bid.totalAmount;
        }
      }
    });

    return { groupedBids: grouped, lowestBidsByCategory: lowest };
  }, [bids, order, orderBy]);

  const handleOpenAddModal = () => {
    setEditingBid(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleOpenEditModal = (bid: Bid) => {
    setEditingBid(bid);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBid(null);
  };

  const handleFormSubmit = async (submittedBidData: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    console.log('Bid Form submitted:', submittedBidData);
    setLoading(true);
    setError(null);

    if (!userId) {
        setError("User authentication error. Cannot save bid.");
        setLoading(false);
        return;
    }

    try {
      let savedBid: Bid;
      let updatedBidsList: Bid[];
      let wasAccepted = false;
      
      if (editingBid?.id) {
        const bidIdToUpdate = editingBid.id;
        const { id, createdAt, updatedAt, ...updatePayload } = submittedBidData as any;
        
        // Check if status is being changed to 'accepted'
        wasAccepted = editingBid.status !== 'accepted' && updatePayload.status === 'accepted';
        
        await BidService.updateBid(bidIdToUpdate, updatePayload);
        
        const refetchedBid = await BidService.getBid(userId, bidIdToUpdate);
        if (!refetchedBid) throw new Error("Failed to refetch updated bid");
        savedBid = refetchedBid;
        updatedBidsList = bids.map(b => (b.id === savedBid.id ? savedBid : b));
      } else {
        // Create a full bid payload from the submitted data
        const createPayload = {
          ...submittedBidData,
          userId // Add userId from props
        };
        
        // Check if new bid is being created with 'accepted' status
        wasAccepted = createPayload.status === 'accepted';
        
        savedBid = await BidService.createBid(userId, createPayload);
        updatedBidsList = [...bids, savedBid];
      }

      // If bid was accepted, create a pending expense
      if (wasAccepted) {
        await createPendingExpenseFromBid(savedBid);
      }

      const sortedBids = updatedBidsList.sort((a, b) => (a.scope || '').localeCompare(b.scope || ''));
      onProjectUpdate({ ...project, bids: sortedBids });
      handleCloseModal();

    } catch (err) {
      console.error("Error saving bid:", err);
      setError(err instanceof Error ? err.message : "Failed to save bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to create a pending expense from an accepted bid
  const createPendingExpenseFromBid = async (bid: Bid) => {
    try {
      // Map bid category to expense category
      let expenseCategory: 'labor' | 'materials' | 'equipment' | 'permits' | 'other' = 'other';
      
      // Determine best category based on bid scope
      const scope = bid.scope?.toLowerCase() || '';
      if (scope.includes('labor') || 
          scope.includes('framing') || 
          scope.includes('install') ||
          scope.includes('carpentry')) {
        expenseCategory = 'labor';
      } else if (scope.includes('material') || 
                scope.includes('supplies') || 
                scope.includes('concrete') || 
                scope.includes('lumber')) {
        expenseCategory = 'materials';
      } else if (scope.includes('equipment') || 
                scope.includes('machinery') || 
                scope.includes('tools') ||
                scope.includes('rental')) {
        expenseCategory = 'equipment';
      } else if (scope.includes('permit') || 
                scope.includes('inspection') || 
                scope.includes('license') ||
                scope.includes('certification')) {
        expenseCategory = 'permits';
      }
      
      // Create the expense object
      const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        projectId: bid.projectId,
        category: expenseCategory,
        description: `Expense from accepted bid: ${bid.title || bid.scope || 'Unnamed bid'} - ${bid.subcontractorName || 'Unknown contractor'}`,
        amount: bid.totalAmount,
        date: new Date(),
        status: 'pending',
        vendor: bid.subcontractorName || '',
        notes: `This expense was automatically created from an accepted bid (ID: ${bid.id}).\n\nOriginal bid notes: ${bid.notes || 'None'}`,
      };
      
      // Create the expense
      await ExpenseService.createExpense(userId, expenseData);
      console.log('Created pending expense from accepted bid');
      setSuccess(`Bid accepted and converted to a pending expense of $${bid.totalAmount.toLocaleString()}`);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (error) {
      console.error('Error creating expense from bid:', error);
      // Don't throw error - we don't want to fail the bid update if expense creation fails
    }
  };

  const handleDelete = async (bidId: string) => {
    if (!window.confirm('Are you sure you want to delete this bid?') || !bidId) {
      return;
    }
    if (!userId) {
        setError("User authentication error. Cannot delete bid.");
        return;
    }

    console.log('Delete bid with ID:', bidId);
    setLoading(true);
    setError(null);

    try {
      await BidService.deleteBid(bidId);

      const updatedBidsList = bids.filter(b => b.id !== bidId);
      onProjectUpdate({ ...project, bids: updatedBidsList });

    } catch (err) {
      console.error("Error deleting bid:", err);
      setError(err instanceof Error ? err.message : "Failed to delete bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  return (
    <Paper sx={{ p: 3, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Bids</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={loading}>
          Add Bid
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  padding={'normal'}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: 'background.paper' }}
                >
                  {headCell.sortable ? (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={(event) => handleRequestSort(event, headCell.id as BidKeys)}
                    >
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(groupedBids).length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  No bids added yet.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedBids).map(([category, bidsInCategory]) => (
                <React.Fragment key={category}>
                  <TableRow sx={{ '& > *': { borderBottom: 'unset', backgroundColor: theme.palette.grey[100] } }}>
                    <TableCell colSpan={headCells.length} sx={{ fontWeight: 'bold', py: 1 }}>
                      {category}
                    </TableCell>
                  </TableRow>
                  {bidsInCategory.map((bid) => {
                     const isLowest =
                        lowestBidsByCategory[category] !== undefined &&
                        bid.totalAmount === lowestBidsByCategory[category] &&
                        ['submitted', 'draft'].includes(bid.status); // Double check eligibility
                     return (
                        <TableRow
                            key={bid.id}
                            hover
                            sx={ isLowest ? { backgroundColor: alpha(theme.palette.success.light, 0.2) } : {} }
                        >
                        <TableCell>{bid.subcontractorName}</TableCell>
                        <TableCell>{bid.scope || '-'}</TableCell> 
                        <TableCell align="right" sx={isLowest ? { fontWeight: 'bold' } : {}}>
                            ${bid.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                            <Chip label={bid.status} color={getBidStatusColor(bid.status)} size="small" />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(bid.submissionDeadline)}</TableCell>
                        <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenEditModal(bid)} disabled={loading}>
                                <EditIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(bid.id)} disabled={loading}>
                                <DeleteIcon fontSize="inherit" />
                            </IconButton>
                        </TableCell>
                        </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <BidFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingBid}
        userId={userId}
        projectId={project.id}
      />
    </Paper>
  );
};

export default BidManager; 