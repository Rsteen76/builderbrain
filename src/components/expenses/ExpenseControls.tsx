import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Theme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { Project } from '../../types'; // Assuming Project type is in '../../types'

interface ExpenseControlsProps {
  theme: Theme; // Pass theme for consistent styling
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  projectFilter: string | null;
  onProjectFilterChange: (projectId: string | null) => void;
  projects: Project[];
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  groupBy: 'none' | 'project' | 'category' | 'vendor' | 'subcontractor';
  onGroupByChange: (group: 'none' | 'project' | 'category' | 'vendor' | 'subcontractor') => void;
  onRefresh: () => void;
  projectId?: string; // To hide project filter if displaying expenses for a specific project
}

export function ExpenseControls({
  theme,
  searchTerm,
  onSearchTermChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  categoryFilter,
  onCategoryFilterChange,
  groupBy,
  onGroupByChange,
  onRefresh,
  projectId,
}: ExpenseControlsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
      <Box sx={{ flexGrow: 1 }}>
        {/* Placeholder for potential future use if Tabs were also part of this component */}
        {/* For now, this Box is mainly to maintain structure similar to original Expenses.tsx layout if needed */}
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' }, width: { xs: '100%', md: 'auto' } }}>
        <TextField
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchTermChange('')}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {/* Only show project filter when not viewing project-specific expenses */}
        {!projectId && (
          <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '200px' } }}>
            <InputLabel id="project-filter-label">Project</InputLabel>
            <Select
              labelId="project-filter-label"
              value={projectFilter || ''}
              onChange={(e) => onProjectFilterChange(e.target.value === '' ? null : e.target.value)}
              label="Project"
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        {/* Category filter */}
        <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '150px' } }}>
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select
            labelId="category-filter-label"
            value={categoryFilter || ''}
            onChange={(e) => onCategoryFilterChange(e.target.value === '' ? null : e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="materials">Materials</MenuItem>
            <MenuItem value="labor">Labor</MenuItem>
            <MenuItem value="equipment">Equipment</MenuItem>
            <MenuItem value="permits">Permits</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', md: '150px' } }}>
          <InputLabel id="group-by-label">Group By</InputLabel>
          <Select
            labelId="group-by-label"
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value as any)}
            label="Group By"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon fontSize="small" />
              </InputAdornment>
            }
          >
            <MenuItem value="none">No Grouping</MenuItem>
            <MenuItem value="project">Project</MenuItem>
            <MenuItem value="category">Category</MenuItem>
            <MenuItem value="vendor">Vendor</MenuItem>
            <MenuItem value="subcontractor">Subcontractor</MenuItem>
          </Select>
        </FormControl>
        
        <Tooltip title="Refresh expenses">
          <IconButton onClick={onRefresh} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
