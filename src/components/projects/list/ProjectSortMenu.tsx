import React from 'react';
import {
  Box,
  Fade,
  Menu,
  MenuItem,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  SortByAlpha as SortIcon,
} from '@mui/icons-material';
import type { ProjectListFilterOptions } from './projectListUtils';

interface ProjectSortMenuProps {
  anchorEl: HTMLElement | null;
  filterOptions: ProjectListFilterOptions;
  onClose: () => void;
  onSort: (sortBy: ProjectListFilterOptions['sortBy']) => void;
}

const sortOptions: Array<{
  value: ProjectListFilterOptions['sortBy'];
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'name', label: 'Name', icon: <SortIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} /> },
  { value: 'dueDate', label: 'Due Date', icon: <CalendarIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} /> },
  { value: 'budget', label: 'Budget', icon: <MoneyIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} /> },
  { value: 'progress', label: 'Progress', icon: <AccessTimeIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} /> },
];

const ProjectSortMenu: React.FC<ProjectSortMenuProps> = ({
  anchorEl,
  filterOptions,
  onClose,
  onSort,
}) => {
  const theme = useTheme();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      TransitionComponent={Fade}
      PaperProps={{
        elevation: 2,
        sx: {
          minWidth: 220,
          borderRadius: 1.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ px: 2, py: 1, fontWeight: 600, color: 'text.secondary' }}
      >
        Sort Projects
      </Typography>

      {sortOptions.map((option) => (
        <MenuItem
          key={option.value}
          onClick={() => onSort(option.value)}
          selected={filterOptions.sortBy === option.value}
          sx={{
            fontSize: '0.875rem',
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              },
            },
          }}
        >
          <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {option.icon}
            {option.label}
            <Box component="span" sx={{ ml: 'auto' }}>
              {filterOptions.sortBy === option.value && (
                filterOptions.sortDirection === 'asc' ? '↑' : '↓'
              )}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Menu>
  );
};

export default ProjectSortMenu;
