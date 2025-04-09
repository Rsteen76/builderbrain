import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Alert,
  AlertTitle,
  Divider,
  Stack,
  Badge,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon, 
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FileCopy as DuplicateIcon,
  Visibility as ViewIcon,
  CloudDownload as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { 
  BidService, 
  BidFilter,
  BidSort,
  BidSortField,
  SortDirection,
  BidSummary
} from '../../services/bid';
import { formatCurrency, safelyParseDate } from '../../utils/formatters';
import { formatBidForDialog } from '../../utils/bidUtils';
import { Bid, BidFormData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { openBidDeleteDialog } from '../dialogs/BidDeletePortal';
import BidDeletePortal from '../dialogs/BidDeletePortal';
import BidFormDialog from '../dialogs/BidFormDialog';
import BidCard from './BidCard';
import FilterPanel from './FilterPanel';
import BidListHeader from './BidListHeader';
import BidListActions from './BidListActions';
import { v4 as uuidv4 } from 'uuid';
import { useBidFormDialog } from '../../hooks';

// Status colors
const bidStatusColors: Record<Bid['status'], string> = {
  draft: 'default',
  submitted: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
};

// Priority colors
const bidPriorityColors: Record<NonNullable<Bid['priority']>, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

// Status display names
const STATUS_DISPLAY: Record<Bid['status'], string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

// Priority display names
const PRIORITY_DISPLAY: Record<NonNullable<Bid['priority']>, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface BidListProps {
  projectId?: string;
  hideHeader?: boolean;
}

const BidList: React.FC<BidListProps> = ({ projectId, hideHeader = false }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState<BidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<BidFilter>({});
  const [sort, setSort] = useState<BidSort>({ field: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Use the renamed hook
  const bidDialogs = useBidFormDialog(user?.uid, {
    projectId,
    onSubmitSuccess: (savedBid: Bid) => {
      console.log('BidList - Bid saved/updated:', savedBid);
      fetchBids(); // Refetch the list after saving
    },
    onError: (errorMsg: string) => {
      setError(errorMsg);
    }
  });

  const fetchBids = async () => {
    if (!user?.uid) {
        setError("User not authenticated.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      // Create a new filter object that includes the projectId if it exists
      const bidFilter: BidFilter = { ...filter };
      if (projectId) {
        bidFilter.projectId = projectId;
        console.log(`BidList: Filtering bids for project ID: ${projectId}`);
      }

      // Apply tab-based status filter
      let statusFilter: string | string[] | undefined;
      switch(tabValue) {
        case 1: statusFilter = 'draft'; break;
        case 2: statusFilter = 'submitted'; break;
        case 3: statusFilter = 'accepted'; break;
        case 4: statusFilter = ['rejected', 'expired', 'withdrawn']; break;
        // case 5: statusFilter = ??? // Need logic for 'Converted' if applicable
        default: statusFilter = undefined; // All bids
      }
      if (statusFilter) {
        bidFilter.status = statusFilter;
      }

      const fetchedBids = await BidService.getBids(user.uid, bidFilter, sort);
      const bidSummaries = fetchedBids.map(bid => ({
        id: bid.id,
        userId: bid.userId,
        projectId: bid.projectId,
        projectName: bid.projectName,
        subcontractorId: bid.subcontractorId,
        subcontractorName: bid.subcontractorName,
        title: bid.title,
        status: bid.status,
        priority: bid.priority,
        submissionDeadline: bid.submissionDeadline || undefined,
        totalAmount: bid.totalAmount,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt
      }));
      setBids(bidSummaries);
    } catch (err) {
      console.error("[BidList] Error fetching bids:", err);
      // Log the specific error before setting the generic message
      const specificError = err instanceof Error ? err.message : String(err);
      console.error("[BidList] Specific error detail:", specificError);
      setError('Failed to load bids. Please try again.');
    } finally {
      console.log('[BidList] fetchBids finished.');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[BidList useEffect] Running effect - authLoading:', authLoading, 'user:', !!user, 'projectId:', projectId, 'tabValue:', tabValue);
    if (!authLoading && user) {
      console.log('[BidList useEffect] Conditions met, calling fetchBids...');
      fetchBids();
    } else if (!authLoading && !user) {
      console.error('[BidList useEffect] User not authenticated, setting error.');
      setError("Please log in to view bids.");
      setLoading(false);
    } else {
      console.log('[BidList useEffect] Conditions not met (still loading auth or no user).');
    }
  }, [user, filter, sort, authLoading, projectId, tabValue]);

  // Listen for global bid deletion events
  useEffect(() => {
    const handleBidDeletedEvent = (event: CustomEvent<{ bidId: string }>) => {
      const { bidId } = event.detail;
      console.log('BidList: Received bid-deleted event for bid ID:', bidId);
      setBids(prevBids => prevBids.filter(b => b.id !== bidId));
    };

    // Add event listener
    window.addEventListener('bid-deleted', handleBidDeletedEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('bid-deleted', handleBidDeletedEvent as EventListener);
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (newFilter: BidFilter) => {
    setFilter(newFilter);
    fetchBids();
  };

  const handleSortChange = (newSort: BidSort) => {
    setSort(newSort);
    fetchBids();
  };

  const handleRefresh = () => {
    fetchBids();
  };

  const handleToggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const hasActiveFilters = Object.keys(filter).some(k => 
    filter[k as keyof BidFilter] !== undefined
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, bidId: string) => {
    event.stopPropagation(); // Prevent card click
    setSelectedBidId(bidId);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBidId(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // --- Dialog Handlers (using the hook) ---
  const handleOpenNewBidModal = () => {
    bidDialogs.openNewBidDialog();
  };

  const handleView = (bid: BidSummary) => {
    navigate(`/bids/${bid.id}`);
    handleMenuClose();
  };

  const handleEdit = (bid: BidSummary) => {
    bidDialogs.openEditBidDialog(bid);
    handleMenuClose();
  };

  const handleDeleteRequest = (bid: BidSummary) => {
    console.log('BidList: handleDeleteRequest called for bid ID:', bid.id);
    handleMenuClose();
    openBidDeleteDialog(bid);
  };

  const handleDuplicate = async (bid: BidSummary) => {
    if (!user?.uid) return;
    console.log('Attempting to duplicate bid:', bid.id);
    handleMenuClose();
    try {
      setLoading(true);
      const originalBid = await BidService.getBid(user.uid, bid.id);
      if (!originalBid) {
        throw new Error("Original bid not found");
      }
      const { id, createdAt, updatedAt, status, submissionDeadline, ...duplicateData } = originalBid;
      const newBidData = {
        ...duplicateData,
        title: `${originalBid.title || 'Bid'} (Copy)`,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newBid = await BidService.createBid(user.uid, newBidData as any);
      console.log('Duplicated bid:', newBid);
      fetchBids();
    } catch (err) {
      console.error("Error duplicating bid:", err);
      setError("Failed to duplicate bid.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = bids.filter(bid => {
    const search = searchTerm.toLowerCase();
    return (
      (bid.title || '').toLowerCase().includes(search) ||
      (bid.projectName || '').toLowerCase().includes(search) ||
      (bid.subcontractorName || '').toLowerCase().includes(search)
    );
  });

  const availableStatuses = Array.from(new Set(bids.map(b => b.status))) as Bid['status'][];
  const availablePriorities = Array.from(new Set(bids.filter(b => b.priority).map(b => b.priority))) as NonNullable<Bid['priority']>[];

  // Display combined loading state
  const isLoading = loading || bidDialogs.loading;
  // Display combined error state
  const displayError = error || bidDialogs.error;

  return (
    <Box sx={{ mt: 2 }}>
      {!hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h5">Bids</Typography>
        </Box>
      )}

      <BidListActions onOpenNewBidDialog={handleOpenNewBidModal} />

      {displayError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {displayError}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <BidListHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
          hasActiveFilters={hasActiveFilters}
          sort={sort}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
        />

        <Collapse in={showFilters}>
          <FilterPanel 
            filter={filter}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
            statusOptions={availableStatuses}
            priorityOptions={availablePriorities}
            statusDisplay={STATUS_DISPLAY}
            priorityDisplay={PRIORITY_DISPLAY}
          />
        </Collapse>

        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="All Bids" />
          <Tab label="Drafts" />
          <Tab label="Submitted" />
          <Tab label="Accepted" />
          <Tab label="Rejected/Expired" />
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : displayError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {displayError}
        </Alert>
      ) : filteredBids.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>No bids found</AlertTitle>
          {searchTerm ? 'Try adjusting your search or filters.' : 'Create your first bid to get started.'}
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {filteredBids.map(bid => (
            <BidCard
              key={bid.id}
              bid={bid}
              onView={() => handleView(bid)}
              onEdit={() => handleEdit(bid)}
              onDeleteRequest={() => handleDeleteRequest(bid)}
              onDuplicate={() => handleDuplicate(bid)}
              onMenuOpen={(event: React.MouseEvent<HTMLElement>) => handleMenuOpen(event, bid.id)}
            />
          ))}
        </Box>
      )}

      {/* Conditionally render the Bid Form Dialog only when open */}
      {bidDialogs.isModalOpen && (
        <BidFormDialog
          open={bidDialogs.isModalOpen}
          onClose={bidDialogs.closeBidDialog}
          onSubmitSuccess={bidDialogs.handleBidSubmitSuccess}
          initialBidData={bidDialogs.initialBidData || undefined}
          editingBidId={bidDialogs.editingBidId}
          projectId={projectId}
        />
      )}

      {/* Menu for Bid Actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && selectedBidId !== null}
        onClose={handleMenuClose}
      >
        {/* Find the selected bid to pass to handlers */}
        {selectedBidId && bids.find(b => b.id === selectedBidId) && (
          <>
            <MenuItem onClick={() => { 
              const selected = bids.find(b => b.id === selectedBidId);
              if (selected) handleView(selected);
            }}>
              <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
              <ListItemText>View Details</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { 
              const selected = bids.find(b => b.id === selectedBidId);
              if (selected) handleEdit(selected);
            }}>
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { 
              const selected = bids.find(b => b.id === selectedBidId);
              if (selected) handleDuplicate(selected);
            }}>
              <ListItemIcon><DuplicateIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => { 
                const selected = bids.find(b => b.id === selectedBidId);
                if (selected) handleDeleteRequest(selected);
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Pass the required userId prop */}
      <BidDeletePortal userId={user?.uid ?? ''} />
    </Box>
  );
};

export default BidList; 