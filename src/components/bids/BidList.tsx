import React, { useState, useEffect } from 'react';
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
  BidSummary, 
  BidStatus, 
  BidPriority, 
  BidFilter,
  BidSort,
  BidSortField,
  SortDirection
} from '../../services/bid';
import { formatCurrency } from '../../utils/formatters';

// Status chip colors
const STATUS_COLORS: Record<BidStatus, string> = {
  draft: 'default',
  submitted: 'info',
  under_review: 'info',
  awarded: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
  revised: 'info',
};

// Priority chip colors
const PRIORITY_COLORS: Record<BidPriority, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

// Status display names
const STATUS_DISPLAY: Record<BidStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  awarded: 'Awarded',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
  revised: 'Revised',
};

// Priority display names
const PRIORITY_DISPLAY: Record<BidPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

interface BidRowProps {
  bid: BidSummary;
  onView: (bid: BidSummary) => void;
  onEdit: (bid: BidSummary) => void;
  onDelete: (bid: BidSummary) => void;
  onDuplicate: (bid: BidSummary) => void;
}

const BidRow: React.FC<BidRowProps> = ({ 
  bid, 
  onView, 
  onEdit, 
  onDelete, 
  onDuplicate 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
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
    const now = new Date();
    const deadlineDate = new Date(bid.submissionDeadline);
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
                  color={STATUS_COLORS[bid.status] as any} 
                />
                <Chip 
                  size="small" 
                  label={PRIORITY_DISPLAY[bid.priority]} 
                  color={PRIORITY_COLORS[bid.priority] as any} 
                />
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
                {new Date(bid.submissionDeadline).toLocaleDateString()}
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
                <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
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
  filters: BidFilter;
  onFilterChange: (filters: BidFilter) => void;
  onResetFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filters, 
  onFilterChange,
  onResetFilters 
}) => {
  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onFilterChange({
      ...filters,
      status: event.target.value as BidStatus | BidStatus[],
    });
  };
  
  const handlePriorityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onFilterChange({
      ...filters,
      priority: event.target.value as BidPriority,
    });
  };
  
  const handleMinAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? Number(event.target.value) : undefined;
    onFilterChange({
      ...filters,
      minAmount: value,
    });
  };
  
  const handleMaxAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? Number(event.target.value) : undefined;
    onFilterChange({
      ...filters,
      maxAmount: value,
    });
  };
  
  const handleDeadlineFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onFilterChange({
      ...filters,
      submissionDeadlineFrom: value,
    });
  };
  
  const handleDeadlineToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onFilterChange({
      ...filters,
      submissionDeadlineTo: value,
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon />}
          onClick={onResetFilters}
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
              value={filters.status || []}
              label="Status"
              onChange={handleStatusChange as any}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as BidStatus[]).map((value) => (
                    <Chip 
                      key={value} 
                      label={STATUS_DISPLAY[value]} 
                      size="small" 
                    />
                  ))}
                </Box>
              )}
            >
              {Object.entries(STATUS_DISPLAY).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
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
              value={filters.priority || ''}
              label="Priority"
              onChange={handlePriorityChange as any}
            >
              <MenuItem value="">Any Priority</MenuItem>
              {Object.entries(PRIORITY_DISPLAY).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Min Amount"
            type="number"
            value={filters.minAmount || ''}
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
            value={filters.maxAmount || ''}
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
            value={filters.submissionDeadlineFrom ? filters.submissionDeadlineFrom.toISOString().split('T')[0] : ''}
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
            value={filters.submissionDeadlineTo ? filters.submissionDeadlineTo.toISOString().split('T')[0] : ''}
            onChange={handleDeadlineToChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

const BidList: React.FC = () => {
  const [bids, setBids] = useState<BidSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bidToDelete, setBidToDelete] = useState<BidSummary | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  // Filters and sorting
  const [filters, setFilters] = useState<BidFilter>({});
  const [sort, setSort] = useState<BidSort>({
    field: 'submissionDeadline',
    direction: 'asc',
  });
  const [anchorElSort, setAnchorElSort] = useState<null | HTMLElement>(null);

  // Load bids
  useEffect(() => {
    fetchBids();
  }, [filters, sort]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      setError(null);

      // Apply status filter based on active tab
      let statusFilter: BidStatus | BidStatus[] | undefined = undefined;
      
      switch (activeTab) {
        case 0: // All
          statusFilter = undefined;
          break;
        case 1: // Draft
          statusFilter = 'draft';
          break;
        case 2: // Submitted
          statusFilter = ['submitted', 'under_review', 'revised'];
          break;
        case 3: // Awarded
          statusFilter = 'awarded';
          break;
        case 4: // Rejected
          statusFilter = ['rejected', 'expired', 'withdrawn'];
          break;
        default:
          statusFilter = undefined;
      }

      const currentFilters = {
        ...filters,
        status: statusFilter,
      };

      const result = await BidService.getBids(currentFilters, sort);
      setBids(result);
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search bids
  const filteredBids = bids.filter(bid => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      bid.title.toLowerCase().includes(search) ||
      bid.projectName.toLowerCase().includes(search) ||
      bid.subcontractorName.toLowerCase().includes(search)
    );
  });

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    fetchBids();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElSort(event.currentTarget);
  };

  const handleSortClose = () => {
    setAnchorElSort(null);
  };

  const handleSortChange = (field: BidSortField, direction: SortDirection) => {
    setSort({ field, direction });
    handleSortClose();
  };

  const handleFilterChange = (newFilters: BidFilter) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleAddBid = () => {
    navigate('/bids/new');
  };

  const handleViewBid = (bid: BidSummary) => {
    navigate(`/bids/${bid.id}`);
  };

  const handleEditBid = (bid: BidSummary) => {
    navigate(`/bids/${bid.id}/edit`);
  };

  const handleDeleteClick = (bid: BidSummary) => {
    setBidToDelete(bid);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bidToDelete) return;

    try {
      await BidService.deleteBid(bidToDelete.id);
      setBids(bids.filter(b => b.id !== bidToDelete.id));
      setDeleteDialogOpen(false);
      setBidToDelete(null);
    } catch (err) {
      console.error('Error deleting bid:', err);
      setError('Failed to delete bid. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBidToDelete(null);
  };

  const handleDuplicateBid = (bid: BidSummary) => {
    // Navigate to new bid form with duplicated values
    navigate('/bids/new', { state: { duplicate: bid } });
  };

  const handleRefresh = () => {
    fetchBids();
  };

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Bids</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddBid}
        >
          New Bid
        </Button>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Search and filters */}
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
            {Object.keys(filters).some(k => filters[k as keyof BidFilter] !== undefined) && (
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
            onClick={handleSortClick}
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

        {/* Filter panel */}
        <Collapse in={showFilters}>
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onResetFilters={handleResetFilters} 
          />
        </Collapse>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="All Bids" />
          <Tab label="Drafts" />
          <Tab label="Submitted" />
          <Tab label="Awarded" />
          <Tab label="Rejected/Expired" />
        </Tabs>
      </Box>

      {/* Bid list */}
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
              : "There are no bids yet. Create your first bid to get started."}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddBid}
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
              onView={handleViewBid}
              onEdit={handleEditBid}
              onDelete={handleDeleteClick}
              onDuplicate={handleDuplicateBid}
            />
          ))}
        </Box>
      )}

      {/* Sorting menu */}
      <Menu
        anchorEl={anchorElSort}
        open={Boolean(anchorElSort)}
        onClose={handleSortClose}
      >
        <MenuItem selected={sort.field === 'submissionDeadline' && sort.direction === 'asc'} onClick={() => handleSortChange('submissionDeadline', 'asc')}>
          Deadline (Earliest first)
        </MenuItem>
        <MenuItem selected={sort.field === 'submissionDeadline' && sort.direction === 'desc'} onClick={() => handleSortChange('submissionDeadline', 'desc')}>
          Deadline (Latest first)
        </MenuItem>
        <MenuItem selected={sort.field === 'createdAt' && sort.direction === 'desc'} onClick={() => handleSortChange('createdAt', 'desc')}>
          Recently Created
        </MenuItem>
        <MenuItem selected={sort.field === 'updatedAt' && sort.direction === 'desc'} onClick={() => handleSortChange('updatedAt', 'desc')}>
          Recently Updated
        </MenuItem>
        <MenuItem selected={sort.field === 'totalAmount' && sort.direction === 'desc'} onClick={() => handleSortChange('totalAmount', 'desc')}>
          Amount (Highest first)
        </MenuItem>
        <MenuItem selected={sort.field === 'totalAmount' && sort.direction === 'asc'} onClick={() => handleSortChange('totalAmount', 'asc')}>
          Amount (Lowest first)
        </MenuItem>
        <MenuItem selected={sort.field === 'priority' && sort.direction === 'desc'} onClick={() => handleSortChange('priority', 'desc')}>
          Priority (Highest first)
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the bid "{bidToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BidList; 