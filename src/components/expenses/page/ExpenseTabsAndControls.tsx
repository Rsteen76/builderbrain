import React from 'react';
import { Box, Tab, Tabs, Theme } from '@mui/material';
import { Project } from '../../../types';
import { ExpenseControls } from '../ExpenseControls';
import { ExpenseGroupBy } from '../list/expenseListUtils';

interface ExpenseTabsAndControlsProps {
  theme: Theme;
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  projectFilter: string | null;
  onProjectFilterChange: (projectId: string | null) => void;
  projects: Project[];
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  groupBy: ExpenseGroupBy;
  onGroupByChange: (group: ExpenseGroupBy) => void;
  onRefresh: () => void;
  projectId?: string;
}

export function ExpenseTabsAndControls({
  theme,
  tabValue,
  onTabChange,
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
}: ExpenseTabsAndControlsProps) {
  return (
    <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' } }}>
      <Box sx={{ flexGrow: 1 }}>
        <Tabs
          value={tabValue}
          onChange={onTabChange}
          indicatorColor="primary"
          textColor="primary"
          aria-label="expense tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Expenses" />
          <Tab label="Needs Payment" />
          <Tab label="Paid" />
        </Tabs>
      </Box>

      <ExpenseControls
        theme={theme}
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        projectFilter={projectFilter}
        onProjectFilterChange={onProjectFilterChange}
        projects={projects}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        onRefresh={onRefresh}
        projectId={projectId}
      />
    </Box>
  );
}
