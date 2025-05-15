import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  TextField,
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  ListSubheader,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { 
  MAIN_CATEGORIES 
} from '../../data/hierarchicalCategories';
import { 
  ENHANCED_MAIN_CATEGORIES as NEW_MAIN_CATEGORIES 
} from '../../data/newHierarchicalCategories';
import { Category, CategoryWithChildren } from '../../types/category.types';

// Extend the Category interface to include user-defined property
interface ExtendedCategory extends Category {
  userDefined?: boolean;
  children?: Category[];
}

import { 
  getUserPreferences, 
  updateUserPreference, 
  addCustomCategory 
} from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';

// Import the categoryMapper utilities
import {
  intelligentCategoryMapping,
  getAllCategoriesForActiveSystem,
  findBestMatchingCategory
} from '../../utils/categoryMapper';

interface EnhancedCategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  required?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
  placeholder?: string;
  projectPhases?: ProjectPhase[];
  phaseId?: string;
  useNewCategories?: boolean;
  onSuggestCategory?: (category: ExtendedCategory) => void;
  suggestedCategory?: string;
  setSuggestedCategory?: (categoryId: string) => void;
  allowCustomCategories?: boolean;
  label?: string;
}

interface ProjectPhase {
  id: string;
  name: string;
  relevantCategories?: string[];
}

const EnhancedCategorySelector: React.FC<EnhancedCategorySelectorProps> = ({
  value,
  onChange,
  useNewCategories = true,
  allowCustomCategories = true,
  phaseId,
  projectPhases = [],
  label = 'Category',
  placeholder = 'Select a category',
  error = false,
  helperText,
  fullWidth = true,
  required = false,
  size = 'medium',
  disabled = false,
  onSuggestCategory,
  suggestedCategory,
  setSuggestedCategory,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<ExtendedCategory[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ExtendedCategory | null>(null);

  // Load user custom categories on mount
  useEffect(() => {
    const loadUserCategories = async () => {
      if (!user?.uid || !allowCustomCategories) return;
      
      setLoading(true);
      try {
        const prefs = await getUserPreferences(user.uid);
        if (prefs?.customCategories) {
          setCustomCategories(prefs.customCategories);
        }
      } catch (error) {
        console.error("Error loading custom categories:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserCategories();
  }, [user, allowCustomCategories]);

  // Get all available categories for the active system
  const availableCategories = useMemo(() => {
    // Get all categories from the active category system
    const systemCategories = useNewCategories ? 
      NEW_MAIN_CATEGORIES.flatMap((category: Category) => [
        category,
        ...(category.children || [])
      ]) : 
      MAIN_CATEGORIES.flatMap((category: Category) => [
        category,
        ...(category.children || [])
      ]);

    // Filter by phase if a phase ID is provided
    let filteredCategories = systemCategories;
    if (phaseId && projectPhases.length > 0) {
      const phase = projectPhases.find(p => p.id === phaseId);
      if (phase?.relevantCategories && phase.relevantCategories.length > 0) {
        filteredCategories = systemCategories.filter(cat => 
          phase.relevantCategories?.includes(cat.id)
        );
      }
    }

    // Add custom categories if enabled
    if (allowCustomCategories && customCategories.length > 0) {
      // Only add custom categories that match the current system
      const customCatsForSystem = customCategories.filter(cat => {
        if (useNewCategories) {
          return cat.id.startsWith('custom-') && cat.id.includes('new-');
        } else {
          return cat.id.startsWith('custom-') && !cat.id.includes('new-');
        }
      });
      
      return [...filteredCategories, ...customCatsForSystem];
    }
    
    return filteredCategories;
  }, [MAIN_CATEGORIES, NEW_MAIN_CATEGORIES, useNewCategories, phaseId, projectPhases, customCategories, allowCustomCategories]);

  // Generate search results based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return availableCategories;
    
    const lowerSearch = searchTerm.toLowerCase();
    return availableCategories.filter(category => {
      // Check if category name matches search term
      if (category.name.toLowerCase().includes(lowerSearch)) {
        return true;
      }
      
      // Check if category description matches search term
      if (category.description?.toLowerCase().includes(lowerSearch)) {
        return true;
      }
      
      // Check if category keywords match search term
      const keywords = (category as any).keywords;
      if (keywords && Array.isArray(keywords)) {
        return keywords.some(kw => kw.toLowerCase().includes(lowerSearch));
      }
      
      return false;
    });
  }, [availableCategories, searchTerm]);

  // Get the display name for the currently selected category
  const getSelectedCategoryName = () => {
    if (!value) return '';
    
    const selectedCategory = availableCategories.find(cat => cat.id === value);
    if (selectedCategory) return selectedCategory.name;
    
    // If not found in available categories, might be in the other category system
    // or might be a custom category that hasn't been loaded yet
    const allNewCats = NEW_MAIN_CATEGORIES.flatMap((cat: Category) => [cat, ...(cat.children || [])]);
    const allOldCats = MAIN_CATEGORIES.flatMap((cat: Category) => [cat, ...(cat.children || [])]);
    
    const foundInNew = allNewCats.find((cat: ExtendedCategory) => cat.id === value);
    if (foundInNew) return foundInNew.name;
    
    const foundInOld = allOldCats.find((cat: ExtendedCategory) => cat.id === value);
    if (foundInOld) return foundInOld.name;
    
    // If still not found, show ID as fallback
    return `Category (${value})`;
  };

  // Handle adding a new custom category
  const handleAddCustomCategory = async () => {
    if (!user?.uid || !newCategoryName.trim()) return;
    
    setLoading(true);
    try {
      // Create a unique ID for the custom category
      const customId = `custom-${useNewCategories ? 'new-' : ''}${newCategoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`;
      
      // Determine parent category if selected
      let parentCategory = null;
      if (newCategoryParentId) {
        parentCategory = availableCategories.find((cat: ExtendedCategory) => cat.id === newCategoryParentId) || null;
      }
      
      // Create the new category object
      const newCategory: ExtendedCategory = {
        id: customId,
        name: newCategoryName.trim(),
        description: `User-defined custom category${parentCategory ? ` under ${parentCategory.name}` : ''}`,
        level: parentCategory ? 'sub' : 'main',
        isActive: true,
        parentId: parentCategory?.id,
        order: customCategories.length + 1,
        color: useNewCategories ? '#ff9800' : '#607d8b', // Orange for new, blue-grey for old
        userDefined: true
      };
      
      // Add to user preferences
      await addCustomCategory(user.uid, newCategory);
      
      // Update local state
      setCustomCategories(prev => [...prev, newCategory]);
      
      // Select the new category
      onChange(customId);
      
      // Reset form and close dialog
      setNewCategoryName('');
      setNewCategoryParentId('');
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding custom category:", error);
    } finally {
      setLoading(false);
    }
  };

  // Suggest a category based on entered text
  const suggestCategory = () => {
    if (!searchTerm || searchTerm.length < 3) {
      setSuggestedCategory?.('');
      return;
    }
    
    const bestMatch = findBestMatchingCategory(searchTerm);
    if (bestMatch && bestMatch !== 'needs-review') {
      const matchedCategory = availableCategories.find((cat: ExtendedCategory) => cat.id === bestMatch);
      if (matchedCategory) {
        setSuggestedCategory?.(matchedCategory.id);
      }
    }
  };

  // Use suggestion as value
  const useSuggestion = () => {
    if (suggestedCategory) {
      onChange(suggestedCategory);
      setSuggestedCategory?.('');
      setSearchTerm('');
    }
  };

  return (
    <Box>
      {/* Main category selector */}
      <FormControl fullWidth={fullWidth} error={error} required={required} size={size} disabled={disabled}>
        <Autocomplete
          value={value ? availableCategories.find((cat: ExtendedCategory) => cat.id === value) || null : null}
          onChange={(event, newValue) => {
            if (newValue) {
              onChange(newValue.id);
            } else {
              onChange('');
            }
          }}
          inputValue={searchTerm}
          onInputChange={(event, newInputValue) => {
            setSearchTerm(newInputValue);
            // Auto-suggest after typing
            if (newInputValue.length > 2) {
              suggestCategory();
            } else {
              setSuggestedCategory?.('');
            }
          }}
          options={filteredCategories}
          getOptionLabel={(option: ExtendedCategory) => option.name}
          groupBy={(option: ExtendedCategory) => {
            if (option.level === 'main') {
              return 'Main Categories';
            } else if (option.userDefined) {
              return 'Custom Categories';
            } else {
              // Find parent category
              const parentId = option.parentId;
              if (parentId) {
                const parent = availableCategories.find((cat: ExtendedCategory) => cat.id === parentId);
                return parent ? parent.name : 'Subcategories';
              }
              return 'Subcategories';
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder={placeholder}
              helperText={helperText}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <CategoryIcon color="action" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {option.userDefined && (
                    <Chip 
                      label="Custom" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ mr: 1, fontSize: '0.7rem', height: 20 }} 
                    />
                  )}
                  <Typography variant="body1">{option.name}</Typography>
                </Box>
                {option.description && (
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          )}
          loading={loading}
          loadingText="Loading categories..."
        />
      </FormControl>

      {/* Suggested category alert */}
      {suggestedCategory && (
        <Alert 
          severity="info" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={useSuggestion}
            >
              Use
            </Button>
          }
          sx={{ mt: 1, mb: 1 }}
        >
          Suggested category: {availableCategories.find((cat: ExtendedCategory) => cat.id === suggestedCategory)?.name}
        </Alert>
      )}

      {/* Add custom category button */}
      {allowCustomCategories && (
        <Box mt={1} display="flex" justifyContent="flex-end">
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setAddDialogOpen(true)}
            disabled={disabled}
          >
            Add Custom Category
          </Button>
        </Box>
      )}

      {/* Add custom category dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        fullWidth 
        maxWidth="xs"
      >
        <DialogTitle>Add Custom Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Create your own custom category to better organize items specific to your project.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
            error={newCategoryName.trim().length === 0}
            helperText={newCategoryName.trim().length === 0 ? 'Category name is required' : ''}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Parent Category (Optional)</InputLabel>
            <Select
              value={newCategoryParentId}
              onChange={(e) => setNewCategoryParentId(e.target.value)}
              label="Parent Category (Optional)"
            >
              <MenuItem value="">
                <em>No parent (top-level category)</em>
              </MenuItem>
              {availableCategories
                .filter((cat: ExtendedCategory) => cat.level === 'main')
                .map((category: ExtendedCategory) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleAddCustomCategory} 
            color="primary" 
            variant="contained"
            disabled={!newCategoryName.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedCategorySelector;