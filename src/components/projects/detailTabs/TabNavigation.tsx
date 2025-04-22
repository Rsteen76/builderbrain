import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccessTime as TimelineIcon,
  Gavel as BidsIcon,
  AttachMoney as ExpensesIcon,
  Assignment as TasksIcon,
  Description as DocumentIcon,
  AccountBalance as BudgetIcon,
} from '@mui/icons-material';

interface TabNavigationProps {
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabValue,
  onTabChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const appBarHeight = isMobile 
    ? 56
    : (theme.mixins.toolbar?.minHeight || 64);

  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider', 
      mb: 3,
      position: 'sticky',
      top: `${appBarHeight}px`, 
      zIndex: theme.zIndex.appBar - 1,
      bgcolor: 'background.paper',
    }}>
      <Tabs
        value={tabValue}
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ '& .MuiTab-root': { textTransform: 'none', minHeight: 48, fontSize: '0.9rem' } }}
      >
        <Tab label="Overview" icon={<BusinessIcon />} iconPosition="start" />
        <Tab label="Budget" icon={<BudgetIcon />} iconPosition="start" />
        <Tab label="Phases" icon={<TimelineIcon />} iconPosition="start" />
        <Tab label="Bids" icon={<BidsIcon />} iconPosition="start" />
        <Tab label="Expenses" icon={<ExpensesIcon />} iconPosition="start" />
        <Tab label="Tasks" icon={<TasksIcon />} iconPosition="start" />
        <Tab label="Documents" icon={<DocumentIcon />} iconPosition="start" />
      </Tabs>
    </Box>
  );
};

export default TabNavigation; 