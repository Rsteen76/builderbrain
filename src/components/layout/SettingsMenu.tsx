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
  Divider,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Sync as SyncIcon,
  ClearAll as ClearAllIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { DataResetService } from '../../services/data-reset';
import { migrateExpenseBuildingPhaseToPhaseNames } from '../../utils/migrations';

const SettingsMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [cacheDialogOpen, setCacheDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });
  const theme = useTheme();
  const { user, logout } = useAuth();
  
  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
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
  
  const handleClearCache = () => {
    setIsClearing(true);
    try {
      DataResetService.clearLocalStorageData();
      setCacheDialogOpen(false);
      window.location.reload(); // Reload to ensure clean state
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };
  
  // Add migration handler
  const handleRunMigration = async () => {
    if (!user?.uid) return;
    
    setIsMigrating(true);
    try {
      handleMenuClose();
      await migrateExpenseBuildingPhaseToPhaseNames();
      setSnackbar({
        open: true,
        message: 'Successfully migrated expense phase data',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error during migration:', error);
      setSnackbar({
        open: true,
        message: 'Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setIsMigrating(false);
    }
  };
  
  return (
    <>
      <Tooltip title="Settings">
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
      </Tooltip>
      
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
        <MenuItem onClick={() => {
          handleMenuClose();
          setCacheDialogOpen(true);
        }}>
          <ListItemIcon>
            <ClearAllIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText primary="Clear Cache" />
        </MenuItem>
        
        {/* Display migration option only in development mode */}
        {isDevelopment && (
          <MenuItem onClick={handleRunMigration} disabled={isMigrating}>
            <ListItemIcon>
              {isMigrating ? <SyncIcon className="rotating" fontSize="small" /> : <BugReportIcon fontSize="small" color="info" />}
            </ListItemIcon>
            <ListItemText primary={isMigrating ? "Migrating..." : "Migrate Expense Data"} />
          </MenuItem>
        )}
        
        <Divider />
        
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
      
      {/* Cache Clear Confirmation Dialog */}
      <Dialog
        open={cacheDialogOpen}
        onClose={() => !isClearing && setCacheDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear Application Cache?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will clear all locally stored application data, which can help fix display
            issues like stale data or incorrect recent activity. Your actual project data 
            will remain intact in the database.
            
            The application will reload after clearing the cache.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCacheDialogOpen(false)} 
            disabled={isClearing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearCache} 
            color="primary" 
            variant="contained"
            disabled={isClearing}
            startIcon={isClearing ? <SyncIcon className="rotating" /> : <ClearAllIcon />}
          >
            {isClearing ? "Clearing..." : "Clear Cache"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for migration results */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsMenu;
