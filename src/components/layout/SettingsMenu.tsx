import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Sync as SyncIcon,
  PersonOutline as ProfileIcon,
  ColorLens as ThemeIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DataResetService } from '../../services/data-reset';

interface SettingsMenuProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onThemeToggle, isDarkMode }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const theme = useTheme();
  const { user, logout } = useAuth();
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleResetData = async () => {
    if (!user?.uid) return;
    
    setIsResetting(true);
    try {
      await DataResetService.resetAllUserData(user.uid);
      setResetDialogOpen(false);
      // The service will reload the page after successful reset
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Failed to reset data. Please try again or contact support.');
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleMenuOpen}
        sx={{ 
          bgcolor: anchorEl ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.1)
          }
        }}
      >
        <SettingsIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            mt: 1,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={onThemeToggle}>
          <ListItemIcon>
            {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={isDarkMode ? "Light Mode" : "Dark Mode"} />
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          setResetDialogOpen(true);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Reset All Data" sx={{ color: theme.palette.error.main }} />
        </MenuItem>
        
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
      
      {/* Data Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => !isResetting && setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: theme.palette.error.main }}>Reset All Application Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            WARNING: This action will permanently delete ALL of your data including:
            
            • All projects and their phases
            • All tasks and expenses
            • All bids and subcontractors
            
            This action CANNOT be undone. Are you absolutely sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResetDialogOpen(false)} 
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResetData} 
            color="error" 
            variant="contained"
            disabled={isResetting}
            startIcon={isResetting ? <SyncIcon className="rotating" /> : <DeleteIcon />}
          >
            {isResetting ? "Resetting..." : "Reset All Data"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsMenu; 