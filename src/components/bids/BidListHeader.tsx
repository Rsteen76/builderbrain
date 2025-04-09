import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { BidSort, SortDirection } from '../../services/bid';

/**
 * Props for the BidListHeader component
 */
export interface BidListHeaderProps {
  /** Current search term */
  searchTerm: string;
  /** Handler for search changes */
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Current filter state visibility */
  showFilters: boolean;
  /** Handler for toggling filter visibility */
  onToggleFilters: () => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Current sort configuration */
  sort: BidSort;
  /** Handler for sort changes */
  onSortChange: (sort: BidSort) => void;
  /** Handler for refreshing data */
  onRefresh: () => void;
}

/**
 * BidListHeader component
 * 
 * Provides search, filter toggle, sort, and refresh controls for the bid list.
 */
const BidListHeader: React.FC<BidListHeaderProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  sort,
  onSortChange,
  onRefresh,
}) => {
  /**
   * Toggle sort direction
   */
  const handleToggleSortDirection = () => {
    onSortChange({ 
      ...sort, 
      direction: sort.direction === 'asc' ? 'desc' : 'asc' 
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <TextField
        placeholder="Search bids..."
        variant="outlined"
        size="small"
        fullWidth
        value={searchTerm}
        onChange={onSearchChange}
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
        onClick={onToggleFilters}
        sx={{ minWidth: 100 }}
      >
        Filters
        {hasActiveFilters && (
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
        onClick={handleToggleSortDirection}
        sx={{ minWidth: 100 }}
      >
        Sort
      </Button>
      <Tooltip title="Refresh">
        <IconButton onClick={onRefresh}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default BidListHeader; 