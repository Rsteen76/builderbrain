import React, { useState } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Business as ProjectsIcon,
  AttachMoney as ExpensesIcon,
  Engineering as SubcontractorsIcon,
  Gavel as BidsIcon,
  CalendarToday as CalendarIcon,
  Person as ClientsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SettingsMenu from './SettingsMenu';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  actionButton?: React.ReactNode;
  actions?: React.ReactNode; // Alias for actionButton to maintain backward compatibility
  breadcrumbs?: Array<{ label: string; path: string }>;
  sx?: React.CSSProperties | any; // Allow sx prop for custom styling
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title,
  subtitle,
  icon, 
  actionButton,
  actions, // Support both actionButton and actions
  breadcrumbs,
  sx
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    window.location.reload(); // Reload to apply theme changes
  };
  
  const menuItems = [
    { label: 'Dashboard', icon: <HomeIcon />, path: '/' },
    { label: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
    { label: 'Expenses', icon: <ExpensesIcon />, path: '/expenses' },
    { label: 'Bids', icon: <BidsIcon />, path: '/bids' },
    { label: 'Subcontractors', icon: <SubcontractorsIcon />, path: '/subcontractors' },
    { label: 'Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { label: 'Clients', icon: <ClientsIcon />, path: '/clients' },
  ];
  
  const userInitial = user?.displayName 
    ? user.displayName.charAt(0).toUpperCase() 
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : '?';
  
  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a React element, just return it as is
    if (React.isValidElement(icon)) {
      // Don't attempt to modify the icon properties since we don't know its type
      return <Box sx={{ mr: 1.5, color: theme.palette.primary.main, display: 'flex' }}>{icon}</Box>;
    }
    
    // If icon is a component type, render it
    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent sx={{ mr: 1.5, color: theme.palette.primary.main }} />;
  };
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={toggleDrawer}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.default,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 1.5,
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              color: 'transparent',
              typography: { sm: 'h6', md: 'h5' },
            }}
          >
            BuildMaster Pro
          </Typography>
        </Toolbar>
        
        <Divider />
        
        <List>
          {menuItems.map(item => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setDrawerOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  mb: 0.5,
                  mx: 1,
                  borderRadius: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              boxShadow: `0 0 10px ${alpha(theme.palette.common.black, 0.05)}`,
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ ml: 1, overflow: 'hidden' }}>
              <Typography variant="body2" noWrap fontWeight={600}>
                {user?.displayName || user?.email || 'User'}
              </Typography>
              {user?.displayName && (
                <Typography variant="caption" noWrap color="text.secondary">
                  {user.email}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - 240px)` },
          ...(sx || {}), // Apply any custom styles passed via sx prop
        }}
      >
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: 'background.paper', 
            color: 'text.primary',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {renderIcon()}
                  <Typography variant="h6" fontWeight={600}>
                    {title}
                  </Typography>
                </Box>
                
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {actionButton || actions}
              <SettingsMenu 
                onThemeToggle={toggleDarkMode}
                isDarkMode={darkMode}
              />
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Box sx={{ px: 3, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box component="nav" aria-label="breadcrumbs">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span style={{ margin: '0 8px', color: theme.palette.text.secondary }}>/</span>}
                  <Box 
                    component="span" 
                    sx={{ 
                      color: index === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary',
                      fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => navigate(crumb.path)}
                  >
                    {crumb.label}
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          </Box>
        )}
        
        <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default PageLayout;