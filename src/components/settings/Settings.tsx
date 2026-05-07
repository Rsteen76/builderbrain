import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import UserProfile from './UserProfile';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="User Profile" {...a11yProps(0)} />
          <Tab icon={<SecurityIcon />} label="Security" {...a11yProps(1)} />
          <Tab icon={<NotificationsIcon />} label="Notifications" {...a11yProps(2)} />
        </Tabs>
        
        <TabPanel value={activeTab} index={0}>
          <UserProfile />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <SecuritySettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <NotificationSettings />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
