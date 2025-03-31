import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Alert, CircularProgress,
  TableSortLabel,
  useTheme,
  alpha
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectService, Project } from '../../services/project';
import { Bid, BidStatus } from '../../types/project.types';
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
  { id: 'contractorName', numeric: false, label: 'Contractor/Supplier', sortable: true },
  { id: 'category', numeric: false, label: 'Category', sortable: true },
  { id: 'bidAmount', numeric: true, label: 'Amount', sortable: true },
  { id: 'status', numeric: false, label: 'Status', sortable: true },
  { id: 'submittedDate', numeric: false, label: 'Submitted Date', sortable: true },
  { id: 'actions', numeric: false, label: 'Actions', sortable: false },
];

interface BidManagerProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

// Helper to get bid status chip color
const getBidStatusColor = (status: BidStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'Submitted':
    case 'Pending':
        return 'info';
    case 'Accepted':
        return 'success';
    case 'Rejected':
        return 'error';
    case 'Needs Revision':
        return 'warning';
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

const BidManager: React.FC<BidManagerProps> = ({ project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<BidKeys>('category'); // Default sort by category

  const theme = useTheme(); // Get theme for styling

  const bids = project.bids || [];

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: BidKeys) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // --- Memoized Sorting, Grouping, and Highlighting Logic ---
  const { groupedBids, lowestBidsByCategory } = useMemo(() => {
    const eligibleStatusesForLowest: BidStatus[] = ['Submitted', 'Pending']; // Define statuses to consider for "lowest"

    // 1. Primary sort by Category, Secondary sort by user selection
    const sortedBids = stableSort(bids, (a, b) => {
        // Primary Sort: Category (handle undefined)
        const categoryA = a.category || 'zzzz'; // Put uncategorized last
        const categoryB = b.category || 'zzzz';
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
      const category = bid.category || 'Uncategorized'; // Group undefined categories
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(bid);

      // Check if this bid qualifies for lowest calculation
      if (eligibleStatusesForLowest.includes(bid.status) && bid.bidAmount > 0) {
        if (lowest[category] === undefined || bid.bidAmount < lowest[category]) {
          lowest[category] = bid.bidAmount;
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

  const handleFormSubmit = async (submittedBid: Bid) => {
    console.log('Bid Form submitted:', submittedBid);
    setLoading(true);
    setError(null);
    let updatedBids;

    if (editingBid) {
      // Edit existing bid
      updatedBids = bids.map(b => (b.id === submittedBid.id ? submittedBid : b));
    } else {
      // Add new bid
      updatedBids = [...bids, submittedBid];
    }

    try {
      const updatedProjectData: Partial<Project> = {
        bids: updatedBids,
      };
      await ProjectService.updateProject(project.id!, updatedProjectData);
      onProjectUpdate({ ...project, bids: updatedBids });
      handleCloseModal();
    } catch (err) {
      console.error("Error saving bid:", err);
      setError(err instanceof Error ? err.message : "Failed to save bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bidId: string) => {
    if (!window.confirm('Are you sure you want to delete this bid?')) {
      return;
    }
    console.log('Delete bid with ID:', bidId);
    setLoading(true);
    setError(null);

    const updatedBids = bids.filter(b => b.id !== bidId);

    try {
      const updatedProjectData: Partial<Project> = {
        bids: updatedBids,
      };
      await ProjectService.updateProject(project.id!, updatedProjectData);
      onProjectUpdate({ ...project, bids: updatedBids });
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
                        bid.bidAmount === lowestBidsByCategory[category] &&
                        ['Submitted', 'Pending'].includes(bid.status); // Double check eligibility
                     return (
                        <TableRow
                            key={bid.id}
                            hover
                            sx={ isLowest ? { backgroundColor: alpha(theme.palette.success.light, 0.2) } : {} }
                        >
                        <TableCell>{bid.contractorName}</TableCell>
                        <TableCell>{bid.category || '-'}</TableCell> 
                        <TableCell align="right" sx={isLowest ? { fontWeight: 'bold' } : {}}>
                            ${bid.bidAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                            <Chip label={bid.status} color={getBidStatusColor(bid.status)} size="small" />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(bid.submittedDate)}</TableCell>
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
      />
    </Paper>
  );
};

export default BidManager; 