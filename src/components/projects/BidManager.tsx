import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Alert, CircularProgress,
  TableSortLabel,
  useTheme,
  alpha,
  Card,
  CardContent,
  Avatar,
  useMediaQuery,
  Grid,
  Divider,
  TablePagination,
  Skeleton,
  Stack,
  Tooltip,
  Badge,
  Collapse
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon, MonetizationOn as MoneyIcon, AttachMoney as AttachMoneyIcon, Business as BusinessIcon, Event as EventIcon, Description as DescriptionIcon, Gavel as GavelIcon, Check as CheckIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassEmptyIcon, ReceiptLong as ReceiptIcon } from '@mui/icons-material';
import { ProjectService } from '../../services/project';
import { BidService, BidFilter, BidSort, BidSortField, SortDirection } from '../../services/bid'; // Import filter/sort types
import { ExpenseService } from '../../services/expense';
import { Project, Bid, Expense, BidPaymentStage } from '../../types';
import BidFormModal from './BidFormModal'; // Import the modal
import BidPaymentSchedule from './BidPaymentSchedule'; // Import payment schedule component
import BidPaymentTermsModal from './BidPaymentTermsModal'; // Import the new payment terms modal
import { visuallyHidden } from '@mui/utils'; // For accessibility with sorting
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Define types for sorting
type Order = SortDirection; // Use imported type
type BidKeys = BidSortField; // Use imported type

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
  // Firestore Timestamps can be compared with toMillis()
  if (aValue && typeof aValue === 'object' && 'toDate' in aValue && bValue && typeof bValue === 'object' && 'toDate' in bValue) {
    const aDate = (aValue as any).toDate();
    const bDate = (bValue as any).toDate();
    if (bDate.getTime() < aDate.getTime()) return -1;
    if (bDate.getTime() > aDate.getTime()) return 1;
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
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true); // Start loading true
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<BidKeys>('scope'); // Default sort by scope
  const [bids, setBids] = useState<Bid[]>([]); // Initialize empty
  const theme = useTheme(); // Get theme for styling
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedBids, setExpandedBids] = useState<{ [key: string]: boolean }>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // New state for payment terms modal
  const [paymentTermsModalOpen, setPaymentTermsModalOpen] = useState(false);
  const [bidForPaymentTerms, setBidForPaymentTerms] = useState<Bid | null>(null);

  // Fetch bids when component mounts or project/user changes
  useEffect(() => {
    const fetchBidsForProject = async () => {
      if (!userId || !project.id) {
        setError("User or Project ID missing, cannot fetch bids.");
        setLoading(false);
        setBids([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const bidFilters: BidFilter = { projectId: project.id };
        // Assuming BidService.getBids returns Bid[] now, or adapt if it returns BidSummary[]
        const fetchedBids = await BidService.getBids(userId, bidFilters);
        setBids(fetchedBids);
      } catch (err) {
        console.error("Error fetching bids for project:", err);
        setError(err instanceof Error ? err.message : "Failed to load bids for this project.");
        setBids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBidsForProject();
  }, [project.id, userId]); // Re-fetch if projectId or userId changes

  // Keep this useEffect to sync with external project updates if needed,
  // but primary data source is now the fetch above.
  // useEffect(() => {
  //   setBids(project.bids || []);
  // }, [project.bids]);

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: BidKeys) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // --- Memoized Sorting, Grouping, and Highlighting Logic ---
  const { groupedBids, lowestBidsByCategory, sortedAndPagedBids } = useMemo(() => {
    const eligibleStatusesForLowest: Bid['status'][] = ['submitted', 'draft']; // Define statuses to consider for "lowest"

    // 1. Primary sort by Category, Secondary sort by user selection
    let sortedBids = stableSort(bids, (a, b) => {
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

    // 3. Apply pagination to the already sorted list
    const pagedBids = sortedBids.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return { groupedBids: grouped, lowestBidsByCategory: lowest, sortedAndPagedBids: pagedBids };
  }, [bids, order, orderBy, page, rowsPerPage]);

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

  const handleSelectBid = (bid: Bid) => {
    setSelectedBid(selectedBid?.id === bid.id ? null : bid);
  };

  const handleBidUpdate = (updatedBid: Bid) => {
    // Update the local bids array with the updated bid
    const updatedBids = bids.map(b => b.id === updatedBid.id ? updatedBid : b);
    setBids(updatedBids);
    
    // Update the selected bid if it's the one that was updated
    if (selectedBid?.id === updatedBid.id) {
      setSelectedBid(updatedBid);
    }
    
    // Update the parent component with the latest full list from state
    onProjectUpdate({ ...project, bids: updatedBids });
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
    if (!project.id) {
        setError("Project ID is missing. Cannot save bid.");
        setLoading(false);
        return;
    }

    try {
      let savedBid: Bid;
      let updatedBidsList: Bid[];
      let wasAccepted = false;
      
      const payloadWithProjectId = { ...submittedBidData, projectId: project.id };

      if (editingBid?.id) {
        const bidIdToUpdate = editingBid.id;
        const { id, createdAt, updatedAt, userId: ignoredUserId, ...updatePayload } = payloadWithProjectId as any;
        
        // Check if status is being changed to 'accepted'
        wasAccepted = editingBid.status !== 'accepted' && updatePayload.status === 'accepted';
        
        await BidService.updateBid(bidIdToUpdate, updatePayload);
        
        const refetchedBid = await BidService.getBid(userId, bidIdToUpdate);
        if (!refetchedBid) throw new Error("Failed to refetch updated bid");
        savedBid = refetchedBid;
        updatedBidsList = bids.map(b => (b.id === savedBid.id ? savedBid : b));
      } else {
        // Create a full bid payload from the submitted data, ensuring projectId is included
        const createPayload = {
          ...payloadWithProjectId,
        };
        
        // Check if new bid is being created with 'accepted' status
        wasAccepted = createPayload.status === 'accepted';
        
        savedBid = await BidService.createBid(userId, createPayload);
        updatedBidsList = [...bids, savedBid];
      }

      // Update local state and close the form modal
      setBids(updatedBidsList);
      onProjectUpdate({ ...project, bids: updatedBidsList });
      handleCloseModal();
      
      // If bid was accepted, directly create expense from payment schedule
      if (wasAccepted && savedBid.paymentSchedule && savedBid.paymentSchedule.length > 0) {
        try {
          // Get the first payment stage to create an expense
          const firstStage = savedBid.paymentSchedule[0];
          
          // Calculate payment progress
          const totalAmount = savedBid.totalAmount;
          const paymentProgress = {
            paid: 0,
            pending: totalAmount,
            remaining: totalAmount
          };
          
          // Update the bid with payment progress
          await BidService.updateBid(savedBid.id, { paymentProgress });
          
          // Create an expense for the initial payment
          // Map bid category to expense category
          let expenseCategory: 'labor' | 'materials' | 'equipment' | 'permits' | 'other' = 'other';
          
          // Determine best category based on bid scope
          const scope = savedBid.scope?.toLowerCase() || '';
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
          
          const expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
            projectId: savedBid.projectId,
            category: expenseCategory,
            description: `${firstStage.name} (${firstStage.percentage}%) - ${savedBid.title || savedBid.scope || 'Unnamed bid'} - ${savedBid.subcontractorName || 'Unknown contractor'}`,
            amount: firstStage.amount,
            date: new Date(),
            status: 'pending',
            vendor: savedBid.subcontractorName || '',
            notes: `This expense is for payment stage: ${firstStage.name} (${firstStage.percentage}%) for accepted bid (ID: ${savedBid.id}).\n\nRequirements: ${firstStage.completionRequirements || 'None'}\n\nOriginal bid notes: ${savedBid.notes || 'None'}`,
          };
          
          // Create the expense
          const expense = await ExpenseService.createExpense(userId, expenseData);
          
          // Update the payment stage with the expense ID
          if (expense) {
            const updatedSchedule = [...savedBid.paymentSchedule];
            updatedSchedule[0].expenseId = expense.id;
            
            await BidService.updateBid(savedBid.id, {
              paymentSchedule: updatedSchedule
            });
          }
          
          // Refresh the bids data
          if (userId && project.id) {
            const bidFilters: BidFilter = { projectId: project.id };
            const refreshedBids = await BidService.getBids(userId, bidFilters);
            setBids(refreshedBids);
            onProjectUpdate({ ...project, bids: refreshedBids });
          }
          
          setSuccess(`Bid accepted with payment schedule. Initial payment of ${formatCurrency(firstStage.amount || 0)} has been added to expenses.`);
          setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
          console.error("Error creating expense:", err);
          setError("Bid was saved but there was an error creating the related expense.");
        }
      }
    } catch (err) {
      console.error("Error saving bid:", err);
      setError(err instanceof Error ? err.message : "Failed to save bid. Please try again.");
    } finally {
      setLoading(false);
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
      setBids(updatedBidsList); // Update local state first
      onProjectUpdate({ ...project, bids: updatedBidsList }); // Then notify parent

    } catch (err) {
      console.error("Error deleting bid:", err);
      setError(err instanceof Error ? err.message : "Failed to delete bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (bidId: string) => {
    setExpandedBids(prev => ({
      ...prev,
      [bidId]: !prev[bidId]
    }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'approved': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'rejected': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'approved': return <CheckCircleIcon />;
      case 'pending': return <HourglassEmptyIcon />;
      case 'rejected': return <CloseIcon />;
      default: return <HourglassEmptyIcon />;
    }
  };

  // Use sortedAndPagedBids which incorporates sorting and pagination
  const displayedBids = sortedAndPagedBids;
  const lowestBidAmount = bids.length > 0 ? Math.min(...bids.filter(bid => bid.totalAmount > 0).map(bid => bid.totalAmount || 0)) : 0;
  const highestBidAmount = bids.length > 0 ? Math.max(...bids.filter(bid => bid.totalAmount > 0).map(bid => bid.totalAmount || 0)) : 0;
  const avgBidAmount = bids.length > 0 ? bids.filter(bid => bid.totalAmount > 0).reduce((sum, bid) => sum + (bid.totalAmount || 0), 0) / bids.filter(bid => bid.totalAmount > 0).length : 0;

  if (loading) { // Show skeleton only during initial load
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Skeleton variant="text" width={200} height={24} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>
        
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
            mb: 3,
          }}
        >
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
        </Card>
        
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Skeleton variant="rectangular" height={53} />
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={70} sx={{ my: 0.5 }} />
          ))}
        </TableContainer>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
            mb: 3,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 36,
                  height: 36,
                }}
              >
                <GavelIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={500}>Bids Summary</Typography>
            </Stack>
            
            <Grid container spacing={3} sx={{ px: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Total Bids</Typography>
                  <Typography variant="h5" color="text.primary" fontWeight={600}>
                    {bids.length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Lowest Bid</Typography>
                  <Typography variant="h5" color="text.primary" fontWeight={600}>
                    {formatCurrency(lowestBidAmount)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Highest Bid</Typography>
                  <Typography variant="h5" color="text.primary" fontWeight={600}>
                    {formatCurrency(highestBidAmount)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Average Bid</Typography>
                  <Typography variant="h5" color="text.primary" fontWeight={600}>
                    {formatCurrency(avgBidAmount)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                width: 36,
                height: 36,
              }}
            >
              <BusinessIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={500}>Contractor Bids</Typography>
          </Stack>
          <Button
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenAddModal()}
            sx={{ borderRadius: 2 }}
          >
            New Bid
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}

      {bids.length === 0 && !loading ? (
        <Alert 
          severity="info"
          icon={<BusinessIcon color="info" />}
          sx={{ 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            py: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          No bids added yet. Click the "New Bid" button to create your first bid.
        </Alert>
      ) : bids.length > 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            width: '100%', 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
            mb: 3
          }}
        >
          {isMobile ? (
            // Mobile view
            <Box>
              {displayedBids.map((bid) => (
                <Box key={bid.id}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      mb: 0,
                      borderRadius: 0,
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack spacing={1} sx={{ width: '70%' }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {bid.subcontractorName || 'Unnamed Contractor'}
                          </Typography>
                          <Chip 
                            label={bid.status?.toUpperCase() || 'PENDING'}
                            size="small"
                            icon={getStatusIcon(bid.status || 'pending')}
                            sx={{
                              width: 'fit-content',
                              bgcolor: alpha(getStatusColor(bid.status || 'pending'), 0.1),
                              color: getStatusColor(bid.status || 'pending'),
                              fontWeight: 500,
                              borderRadius: '4px',
                              '& .MuiChip-icon': {
                                fontSize: '0.9rem',
                              }
                            }}
                          />
                        </Stack>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" fontWeight={600}>
                            {typeof bid.totalAmount === 'number' ? 
                             formatCurrency(bid.totalAmount) : 
                             formatCurrency(0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(bid.submissionDeadline)}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mt: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleExpand(bid.id!)}
                          color="primary"
                          sx={{ mx: 0.5 }}
                        >
                          {expandedBids[bid.id!] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenEditModal(bid)}
                          color="primary"
                          sx={{ mx: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(bid.id!)}
                          color="error"
                          sx={{ mx: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                  <Collapse in={expandedBids[bid.id!]} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" fontWeight={500}>Scope of Work</Typography>
                          <Typography variant="body2">
                            {bid.scope || 'No scope of work provided'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" fontWeight={500}>Timeline</Typography>
                          <Typography variant="body2">
                            {bid.timeline ? `${bid.timeline} days` : 'No timeline provided'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <BidPaymentSchedule bid={bid} projectId={project.id!} userId={userId} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                </Box>
              ))}
              
              <TablePagination
                component="div"
                count={bids.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              />
            </Box>
          ) : (
            // Desktop view
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableRow>
                      <TableCell width="56px" />
                      <TableCell 
                        sortDirection={orderBy === 'subcontractorName' ? order : false}
                        sx={{ fontWeight: 600 }}
                      >
                        <TableSortLabel
                          active={orderBy === 'subcontractorName'}
                          direction={orderBy === 'subcontractorName' ? order : 'asc'}
                          onClick={(e) => handleRequestSort(e, 'subcontractorName')}
                        >
                          Contractor
                          {orderBy === 'subcontractorName' ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sortDirection={orderBy === 'totalAmount' ? order : false}
                        sx={{ fontWeight: 600 }}
                      >
                        <TableSortLabel
                          active={orderBy === 'totalAmount'}
                          direction={orderBy === 'totalAmount' ? order : 'asc'}
                          onClick={(e) => handleRequestSort(e, 'totalAmount')}
                        >
                          Bid Amount
                          {orderBy === 'totalAmount' ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell 
                        align="center" 
                        sortDirection={orderBy === 'status' ? order : false}
                        sx={{ fontWeight: 600 }}
                      >
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={(e) => handleRequestSort(e, 'status')}
                        >
                          Status
                          {orderBy === 'status' ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sortDirection={orderBy === 'submissionDeadline' ? order : false}
                        sx={{ fontWeight: 600 }}
                      >
                        <TableSortLabel
                          active={orderBy === 'submissionDeadline'}
                          direction={orderBy === 'submissionDeadline' ? order : 'asc'}
                          onClick={(e) => handleRequestSort(e, 'submissionDeadline')}
                        >
                          Submission Date
                          {orderBy === 'submissionDeadline' ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedBids.map((bid) => (
                      <React.Fragment key={bid.id}>
                        <TableRow 
                          hover
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            '& > *': { borderBottom: expandedBids[bid.id!] ? 0 : undefined },
                          }}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExpand(bid.id!)}
                              aria-label="expand row"
                            >
                              {expandedBids[bid.id!] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {bid.subcontractorName || 'Unnamed Contractor'}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600}>
                              {typeof bid.totalAmount === 'number' ? 
                               formatCurrency(bid.totalAmount) : 
                               formatCurrency(0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={bid.status?.toUpperCase() || 'PENDING'}
                              size="small"
                              icon={getStatusIcon(bid.status || 'pending')}
                              sx={{
                                bgcolor: alpha(getStatusColor(bid.status || 'pending'), 0.1),
                                color: getStatusColor(bid.status || 'pending'),
                                fontWeight: 500,
                                borderRadius: '4px',
                                '& .MuiChip-icon': {
                                  fontSize: '0.9rem',
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">{formatDate(bid.submissionDeadline)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditModal(bid)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(bid.id!)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell 
                            colSpan={6} 
                            sx={{ 
                              py: expandedBids[bid.id!] ? 2 : 0,
                              px: expandedBids[bid.id!] ? 3 : 2,
                              borderBottom: expandedBids[bid.id!] ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                              bgcolor: alpha(theme.palette.background.default, 0.3),
                            }}
                          >
                            <Collapse in={expandedBids[bid.id!]} timeout="auto" unmountOnExit>
                              <Box sx={{ my: 1 }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={4}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <DescriptionIcon color="primary" fontSize="small" />
                                        <Typography variant="subtitle2" fontWeight={500}>Scope of Work</Typography>
                                      </Stack>
                                      <Typography variant="body2">
                                        {bid.scope || 'No scope of work provided'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <EventIcon color="primary" fontSize="small" />
                                        <Typography variant="subtitle2" fontWeight={500}>Timeline</Typography>
                                      </Stack>
                                      <Typography variant="body2">
                                        {bid.timeline ? `${bid.timeline} days` : 'No timeline provided'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <MoneyIcon color="primary" fontSize="small" />
                                        <Typography variant="subtitle2" fontWeight={500}>Payment Terms</Typography>
                                      </Stack>
                                      <Typography variant="body2">
                                        {bid.paymentTerms || 'No payment terms provided'}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <BidPaymentSchedule bid={bid} projectId={project.id!} userId={userId} />
                                  </Grid>
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={bids.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              />
            </>
          )}
        </Paper>
      ) : null /* Handle case where bids is empty but not loading */
      }

      <BidFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingBid}
        userId={userId}
        projectId={project.id}
      />
    </>
  );
};

export default BidManager; 