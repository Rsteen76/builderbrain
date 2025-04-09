import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BidFilter, BidSort } from '../../services/bid';
import { Bid } from '../../types';

/**
 * Props for the FilterPanel component
 */
export interface FilterPanelProps {
  /** Current filter settings */
  filter: BidFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: BidFilter) => void;
  /** Current sort settings */
  sort: BidSort;
  /** Callback when sort changes */
  onSortChange: (sort: BidSort) => void;
  /** Available status options */
  statusOptions: Bid['status'][];
  /** Available priority options */
  priorityOptions: NonNullable<Bid['priority']>[];
  /** Display names for bid statuses */
  statusDisplay?: Record<string, string>;
  /** Display names for bid priorities */
  priorityDisplay?: Record<string, string>;
}

/**
 * Status display names
 */
const DEFAULT_STATUS_DISPLAY: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

/**
 * Priority display names
 */
const DEFAULT_PRIORITY_DISPLAY: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/**
 * FilterPanel component for filtering and sorting bids
 * 
 * This component provides a comprehensive set of filter and sort controls
 * for bid lists, including status, priority, amount range, and deadline filters.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filter, 
  onFilterChange, 
  sort, 
  onSortChange,
  statusOptions,
  priorityOptions,
  statusDisplay = DEFAULT_STATUS_DISPLAY,
  priorityDisplay = DEFAULT_PRIORITY_DISPLAY,
}) => {
  /**
   * Handle status filter change
   */
  const handleStatusChange = (event: SelectChangeEvent<unknown>) => {
    onFilterChange({
      ...filter,
      status: event.target.value as Bid['status'] | Bid['status'][],
    });
  };
  
  /**
   * Handle priority filter change
   */
  const handlePriorityChange = (event: SelectChangeEvent<unknown>) => {
    onFilterChange({
      ...filter,
      priority: event.target.value as NonNullable<Bid['priority']>,
    });
  };
  
  /**
   * Handle minimum amount filter change
   */
  const handleMinAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? Number(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      minAmount: value,
    });
  };
  
  /**
   * Handle maximum amount filter change
   */
  const handleMaxAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? Number(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      maxAmount: value,
    });
  };
  
  /**
   * Handle deadline "from" date filter change
   */
  const handleDeadlineFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      submissionDeadlineFrom: value,
    });
  };
  
  /**
   * Handle deadline "to" date filter change
   */
  const handleDeadlineToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onFilterChange({
      ...filter,
      submissionDeadlineTo: value,
    });
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSort: BidSort) => {
    onSortChange(newSort);
  };

  /**
   * Reset all filters and sorting to default
   */
  const handleReset = () => {
    onFilterChange({});
    onSortChange({ field: 'submissionDeadline', direction: 'asc' });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon />}
          onClick={handleReset}
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
              onChange={handleStatusChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as Bid['status'][]).map((value) => (
                    <Chip 
                      key={value} 
                      label={statusDisplay[value] || value} 
                      size="small" 
                    />
                  ))}
                </Box>
              )}
            >
              {statusOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {statusDisplay[value] || value}
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
              onChange={handlePriorityChange}
            >
              <MenuItem value="">Any Priority</MenuItem>
              {priorityOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {priorityDisplay[value] || value}
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
      </Grid>
    </Paper>
  );
};

export default FilterPanel; 