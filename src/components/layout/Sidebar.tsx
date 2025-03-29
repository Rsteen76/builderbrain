import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as ProjectsIcon,
  Receipt as ExpensesIcon,
  Description as BidsIcon,
  Assignment as TasksIcon,
  Folder as DocumentsIcon,
  Payment as PaymentsIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
}

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
  { text: 'Expenses', icon: <ExpensesIcon />, path: '/expenses' },
  { text: 'Bids', icon: <BidsIcon />, path: '/bids' },
  { text: 'Tasks', icon: <TasksIcon />, path: '/tasks' },
  { text: 'Documents', icon: <DocumentsIcon />, path: '/documents' },
  { text: 'Payments', icon: <PaymentsIcon />, path: '/payments' },
];

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => navigate('/settings')}
            selected={location.pathname === '/settings'}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 