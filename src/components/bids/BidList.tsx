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
  BidFilter,
  BidSort,
  BidSortField,
  SortDirection,
  BidSummary
} from '../../services/bid';
import { formatCurrency } from '../../utils/formatters';
import { Bid } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import BidDeletionWrapper from './BidDeletionWrapper';

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
  onDelete: (bid: BidSummary) => void;
  onDuplicate: (bid: BidSummary) => void;
  theme: any;
}

const BidRow: React.FC<BidRowProps> = ({ 
  bid, 
  onView, 
  onEdit, 
  onDelete, 
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

const BidList: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bids, setBids] = useState<BidSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<BidFilter>({});
  const [sort, setSort] = useState<BidSort>({ field: 'submissionDeadline', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  const fetchBids = async () => {
    if (!user?.uid) {
        setError("User not authenticated.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedBids = await BidService.getBids(user.uid, filter, sort);
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
      console.error("Error fetching bids:", err);
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchBids();
    } else if (!authLoading && !user) {
      setError("Please log in to view bids.");
      setLoading(false);
    }
  }, [user, filter, sort, authLoading]);

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

  const handleView = (bid: BidSummary) => {
    navigate(`/bids/${bid.id}`);
  };

  const handleEdit = (bid: BidSummary) => {
    navigate(`/bids/${bid.id}/edit`);
  };

  const handleDuplicate = (bid: BidSummary) => {
    navigate(`/bids/new?duplicate=${bid.id}`);
  };

  const handleDeleteRequest = (bid: BidSummary) => {
    // Update the local state to remove the deleted bid
    setBids(prevBids => prevBids.filter(b => b.id !== bid.id));
    // Show a notification that the bid was deleted
    // Note: The actual deletion is handled by BidDeletionWrapper
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    fetchBids();
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Bids</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/bids/new')}
        >
          New Bid
        </Button>
      </Box>

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
            onClick={() => navigate('/bids/new')}
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
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onDuplicate={handleDuplicate}
              theme={theme}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BidList; 