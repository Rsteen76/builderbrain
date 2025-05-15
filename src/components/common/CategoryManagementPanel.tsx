import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Divider,
  Card
} from '@mui/material';
import {
  Info as InfoIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  CategoryOutlined as CategoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import EnhancedCategorySelector from './EnhancedCategorySelector';
import { Category } from '../../types/category.types';
import { getUserPreferences, updateUserPreference } from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';

interface CategoryManagementPanelProps {
  onToggleNewCategories?: (useNew: boolean) => void;
  projectId?: string;
  initialUseNewCategories?: boolean;
}

const CategoryManagementPanel: React.FC<CategoryManagementPanelProps> = ({
  onToggleNewCategories,
  projectId,
  initialUseNewCategories = true
}) => {
  const { user } = useAuth();
  const [useNewCategories, setUseNewCategories] = useState<boolean>(initialUseNewCategories);
  const [showInfoDialog, setShowInfoDialog] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load user preferences on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const preferences = await getUserPreferences(user.uid);
      if (preferences) {
        // Set use new categories based on user preferences or initialization prop
        const useNewCats = preferences.useNewCategories !== undefined 
          ? preferences.useNewCategories 
          : initialUseNewCategories;
          
        setUseNewCategories(useNewCats);
        
        // Load custom categories if available
        if (preferences.customCategories) {
          setCustomCategories(preferences.customCategories);
        }
        
        // Notify parent component of the setting
        if (onToggleNewCategories) {
          onToggleNewCategories(useNewCats);
        }
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
      setSnackbar({
        open: true,
        message: "Failed to load preferences. Using default settings.",
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNewCategories = async () => {
    const newValue = !useNewCategories;
    setUseNewCategories(newValue);
    
    // Notify parent component
    if (onToggleNewCategories) {
      onToggleNewCategories(newValue);
    }
    
    // Save user preference
    if (user?.uid) {
      try {
        await updateUserPreference(user.uid, 'useNewCategories', newValue);
        setSnackbar({
          open: true,
          message: `${newValue ? 'New' : 'Classic'} category system activated`,
          severity: 'success'
        });
      } catch (error) {
        console.error("Error saving category preference:", error);
        setSnackbar({
          open: true,
          message: "Failed to save preference",
          severity: 'error'
        });
      }
    }
  };

  return (
    <Card elevation={0} sx={{ mb: 2, p: 2, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">Category System</Typography>
        <Tooltip title="Learn about the new category system">
          <IconButton
            size="small"
            sx={{ ml: 'auto' }}
            onClick={() => setShowInfoDialog(true)}
          >
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useNewCategories}
              onChange={handleToggleNewCategories}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              Use new detailed category system
            </Typography>
          }
        />
        {useNewCategories ? (
          <Alert severity="info" sx={{ mt: 1, fontSize: '0.85rem' }}>
            Using the new detailed category system with improved organization
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mt: 1, fontSize: '0.85rem' }}>
            Using the classic category system. The new system offers more detailed categorization.
          </Alert>
        )}
      </Box>
      
      <Dialog
        open={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
            About the New Category System
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            The new category system provides more detailed and structured organization for your construction expenses.
          </DialogContentText>
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            Benefits of the New System:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Improved Organization" 
                secondary="Categories follow standard construction sequence and CSI-inspired structure"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="More Detailed Categories" 
                secondary="More specific subcategories for better expense tracking"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Custom Categories" 
                secondary="Add your own custom categories for project-specific needs"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Better Reporting" 
                secondary="Enhanced reporting capabilities with more structured data"
              />
            </ListItem>
          </List>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Your existing categorized items will be automatically mapped to the new system. Items that can't be automatically mapped will be placed in "Needs Review" for you to categorize manually.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInfoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Card>
  );
};

export default CategoryManagementPanel;