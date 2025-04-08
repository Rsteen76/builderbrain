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
  Card,
  CardContent,
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
import { Bid, Subcontractor } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { openBidDeleteDialog } from '../dialogs/BidDeletePortal';
import BidDeletePortal from '../dialogs/BidDeletePortal';
import BidFormDialog from '../dialogs/BidFormDialog';
import { v4 as uuidv4 } from 'uuid';

// Add the BidFormData interface definition near the top
interface BidFormData {
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
  projectId?: string;
  projectName?: string;
}

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

interface BidRowProps {
  bid: BidSummary;
  onView: (bid: BidSummary) => void;
  onEdit: (bid: BidSummary) => void;
  onDeleteRequest: (bid: BidSummary) => void;
  onDuplicate: (bid: BidSummary) => void;
  theme: any;
}

const BidRow: React.FC<BidRowProps> = ({ 
  bid, 
  onView, 
  onEdit, 
  onDeleteRequest, 
  onDuplicate,
  theme,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: (bid: BidSummary) => void) => {
    action(bid);
    handleClose();
  };

  // Calculate if deadline is close (within 3 days)
  const isDeadlineClose = () => {
    // Check if deadline exists first
    if (!bid.submissionDeadline) {
        return false;
    }
    const now = new Date();
    const deadlineDate = new Date(bid.submissionDeadline); // Now safe to call
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: isDeadlineClose() ? `1px solid ${theme.palette.warning.main}` : 'none',
        boxShadow: isDeadlineClose() ? `0 0 5px ${theme.palette.warning.main}` : undefined,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 0.5, 
                  cursor: 'pointer', 
                  '&:hover': { color: 'primary.main' },
                  wordBreak: 'break-word'
                }}
                onClick={() => onView(bid)}
              >
                {bid.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1 }}
              >
                Project: {bid.projectName}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                <Chip 
                  size="small" 
                  label={STATUS_DISPLAY[bid.status]} 
                  color={bidStatusColors[bid.status] as any} 
                />
                {bid.priority && (
                    <Chip 
                      size="small" 
                      label={PRIORITY_DISPLAY[bid.priority]} 
                      color={bidPriorityColors[bid.priority] as any} 
                    />
                )}
                {isDeadlineClose() && (
                  <Chip 
                    size="small" 
                    label="Deadline Soon" 
                    color="warning" 
                  />
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Subcontractor
              </Typography>
              <Typography variant="body1">
                {bid.subcontractorName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Deadline
              </Typography>
              <Typography variant="body1">
                {bid.submissionDeadline ? new Date(bid.submissionDeadline).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(bid.totalAmount)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={1}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                aria-label="more"
                aria-controls="bid-menu"
                aria-haspopup="true"
                onClick={handleClick}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="bid-menu"
                anchorEl={anchorEl}
                keepMounted
                open={open}
                onClose={handleClose}
              >
                <MenuItem onClick={() => handleAction(onView)}>
                  <ListItemIcon>
                    <ViewIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>View Details</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction(onEdit)}>
                  <ListItemIcon>
                    <EditIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction(onDuplicate)}>
                  <ListItemIcon>
                    <DuplicateIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleAction(onDeleteRequest)} sx={{ color: 'error.main' }}>
                  <ListItemIcon sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

interface FilterPanelProps {
  filter: BidFilter;
  onFilterChange: (filter: BidFilter) => void;
  sort: BidSort;
  onSortChange: (sort: BidSort) => void;
  statusOptions: Bid['status'][];
  priorityOptions: NonNullable<Bid['priority']>[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filter, 
  onFilterChange, 
  sort, 
  onSortChange,
  statusOptions,
  priorityOptions,
}) => {
  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onFilterChange({
      ...filter,
      status: event.target.value as Bid['status'] | Bid['status'][],
    });
  };
  
  const handlePriorityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onFilterChange({
      ...filter,
      priority: event.target.value as NonNullable<Bid['priority']>,
    });
  };
  
  const handleMinAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? Number(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      minAmount: value,
    });
  };
  
  const handleMaxAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? Number(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      maxAmount: value,
    });
  };
  
  const handleDeadlineFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      submissionDeadlineFrom: value,
    });
  };
  
  const handleDeadlineToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      submissionDeadlineTo: value,
    });
  };

  const handleSortChange = (newSort: BidSort) => {
    onSortChange(newSort);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon />}
          onClick={() => {
            onFilterChange({});
            onSortChange({ field: 'submissionDeadline', direction: 'asc' });
          }}
        >
          Reset
        </Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status-select"
              multiple
              value={filter.status || []}
              label="Status"
              onChange={handleStatusChange as any}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as Bid['status'][]).map((value) => (
                    <Chip 
                      key={value} 
                      label={STATUS_DISPLAY[value]} 
                      size="small" 
                    />
                  ))}
                </Box>
              )}
            >
              {statusOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {STATUS_DISPLAY[value]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              id="priority-select"
              value={filter.priority || ''}
              label="Priority"
              onChange={handlePriorityChange as any}
            >
              <MenuItem value="">Any Priority</MenuItem>
              {priorityOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {PRIORITY_DISPLAY[value]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Min Amount"
            type="number"
            value={filter.minAmount || ''}
            onChange={handleMinAmountChange}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Max Amount"
            type="number"
            value={filter.maxAmount || ''}
            onChange={handleMaxAmountChange}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Deadline From"
            type="date"
            value={filter.submissionDeadlineFrom ? filter.submissionDeadlineFrom.toISOString().split('T')[0] : ''}
            onChange={handleDeadlineFromChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Deadline To"
            type="date"
            value={filter.submissionDeadlineTo ? filter.submissionDeadlineTo.toISOString().split('T')[0] : ''}
            onChange={handleDeadlineToChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => handleSortChange({ field: 'submissionDeadline', direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
            sx={{ minWidth: 100 }}
          >
            Sort
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

interface BidListProps {
  projectId?: string;
  hideHeader?: boolean;
}

// Helper function to format bid for the dialog
// Similar to the one in ProjectDetailPage, adjust as needed
const formatBidForDialog = (bid: Bid): Partial<any> => {
  let downPaymentPercent = 20;
  let installments: any[] = [];
  if (bid.paymentSchedule && bid.paymentSchedule.length > 0) {
    const downPayment = bid.paymentSchedule.find(p => p.name === 'Down Payment');
    downPaymentPercent = downPayment?.percentage || 20;
    installments = bid.paymentSchedule
      .filter(p => p.name !== 'Down Payment')
      .map(p => ({
        id: p.id || uuidv4(),
        name: p.name || 'Installment',
        percent: p.percentage || 0,
        milestoneDescription: p.description || '',
        phaseId: p.phaseId,
        phaseName: p.phaseName,
      }));
  }

  return {
    title: bid.title || '',
    subcontractorName: bid.subcontractorName || '',
    subcontractorId: bid.subcontractorId || '',
    totalAmount: bid.totalAmount || 0,
    phaseId: bid.phaseId || '',
    phaseName: bid.phaseName || '',
    projectId: bid.projectId, 
    scope: bid.scope || '',
    timeline: bid.timeline || 30,
    submissionDeadline: bid.submissionDeadline ? safelyParseDate(bid.submissionDeadline) : undefined,
    paymentTerms: {
      downPaymentPercent: downPaymentPercent,
      installments: installments,
    },
    notes: bid.notes || '',
    status: bid.status || 'draft',
    attachments: Array.isArray(bid.attachments)
      ? bid.attachments.map(att => (typeof att === 'string' ? att : att?.url)).filter(Boolean) as string[]
      : [],
    tags: Array.isArray(bid.tags) ? [...bid.tags] : [],
  };
};

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
  
  // State for the Bid Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [initialBidData, setInitialBidData] = useState<Partial<BidFormData> | null>(null);

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
  };

  const handleSortChange = (newSort: BidSort) => {
    setSort(newSort);
  };

  const handleRefresh = () => {
    fetchBids();
  };

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

  // --- Modal Handlers ---
  const handleOpenNewBidModal = () => {
    setEditingBidId(null);
    setInitialBidData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditBidModal = async (bid: BidSummary) => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      // Fetch full bid using the ID from the summary
      const fullBid = await BidService.getBid(user.uid, bid.id); 
      if (fullBid) {
        setInitialBidData(formatBidForDialog(fullBid));
        setEditingBidId(bid.id);
        setIsModalOpen(true);
      } else {
        setError('Could not load bid data for editing.');
      }
    } catch (err) {
      setError('Error loading bid data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBidId(null);
    setInitialBidData(null);
    setError(null); // Clear any errors from the dialog fetch
  };

  const handleBidSubmitSuccess = (savedBid: Bid) => {
    console.log('BidList - Bid saved/updated:', savedBid);
    fetchBids(); // Refetch the list after saving
    // Reset form state after successful submission
    setEditingBidId(null);
    setInitialBidData(null); 
    // We typically close the modal in the dialog itself after calling onSubmitSuccess
    // but ensure isModalOpen is set to false if not already handled.
    // setIsModalOpen(false); // Uncomment if the dialog doesn't close automatically
  };
  // --- End Modal Handlers ---

  const handleView = (bid: BidSummary) => {
    navigate(`/bids/${bid.id}`);
    handleMenuClose();
  };

  const handleEdit = (bid: BidSummary) => {
    handleOpenEditBidModal(bid); 
    handleMenuClose();
  };

  const handleDeleteRequest = (bid: BidSummary) => {
    console.log('BidList: handleDeleteRequest called for bid ID:', bid.id);
    // Pass only the bid object. The callback is handled globally.
    openBidDeleteDialog(bid); 
    handleMenuClose();
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

  return (
    <Box sx={{ py: 3 }}>
      {!hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">Bids</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenNewBidModal}
          >
            New Bid
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search bids..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ minWidth: 100 }}
          >
            Filters
            {Object.keys(filter).some(k => filter[k as keyof BidFilter] !== undefined) && (
              <Badge 
                color="primary" 
                variant="dot" 
                sx={{ ml: 1 }}
              />
            )}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => handleSortChange({ field: 'submissionDeadline', direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
            sx={{ minWidth: 100 }}
          >
            Sort
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={showFilters}>
          <FilterPanel 
            filter={filter}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
            statusOptions={availableStatuses}
            priorityOptions={availablePriorities}
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredBids.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bids found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm 
              ? "No bids match your search criteria. Try using different keywords."
              : "There are no bids yet for the selected status. Create your first bid to get started."}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenNewBidModal}
          >
            Create New Bid
          </Button>
        </Paper>
      ) : (
        <Box>
          {filteredBids.map(bid => (
            <BidRow
              key={bid.id}
              bid={bid}
              onView={() => handleView(bid)}
              onEdit={() => handleEdit(bid)}
              onDeleteRequest={() => handleDeleteRequest(bid)}
              onDuplicate={() => handleDuplicate(bid)}
              theme={theme}
            />
          ))}
        </Box>
      )}

      {/* Conditionally render the Bid Form Dialog only when open */}
      {isModalOpen && (
        <BidFormDialog
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmitSuccess={handleBidSubmitSuccess}
          initialBidData={initialBidData || undefined}
          editingBidId={editingBidId}
        />
      )}
    </Box>
  );
};

export default BidList; 