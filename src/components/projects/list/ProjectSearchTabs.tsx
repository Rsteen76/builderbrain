import React from 'react';
import {
  Box,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  alpha,
  useTheme,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { ProjectTabCounts } from './projectListUtils';

interface ProjectSearchTabsProps {
  searchQuery: string;
  selectedTab: number;
  tabCounts: ProjectTabCounts;
  isMobile: boolean;
  onSearchChange: (value: string) => void;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const ProjectSearchTabs: React.FC<ProjectSearchTabsProps> = ({
  searchQuery,
  selectedTab,
  tabCounts,
  isMobile,
  onSearchChange,
  onTabChange,
}) => {
  const theme = useTheme();
  const tabChipSx = {
    height: { xs: 16, sm: 18 },
    fontSize: { xs: '0.6rem', sm: '0.65rem' },
    fontWeight: 600,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    '& .MuiChip-label': {
      px: { xs: 0.5, sm: 0.75 },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search projects by name, description, location..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.common.black, 0.02),
            },
          }}
        />

        <Tabs
          value={selectedTab}
          onChange={onTabChange}
          variant="scrollable"
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
          aria-label="project tabs"
          sx={{
            minHeight: 38,
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': { opacity: 0.3 },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: theme.palette.primary.main,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 38,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              px: { xs: 1, sm: 2 },
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            },
          }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>All</span>
                <Chip label={tabCounts.all} size="small" sx={tabChipSx} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>Active</span>
                <Chip label={tabCounts.active} size="small" sx={tabChipSx} />
              </Stack>
            }
          />
          {/* ...other tabs with same styling adjustments... */}
        </Tabs>
      </Box>
    </Paper>
  );
};

export default ProjectSearchTabs;
