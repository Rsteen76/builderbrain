import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  ListSubheader,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import { CategoryWithChildren, Category } from '../../types/category.types';
import { MAIN_CATEGORIES, getAllCategories } from '../../data/hierarchicalCategories';
import CategoryIcon from '@mui/icons-material/Category';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
  error?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
  disabled?: boolean;
  required?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  label = 'Category',
  error,
  fullWidth = true,
  size = 'small',
  variant = 'outlined',
  disabled = false,
  required = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load all categories
    const categories = getAllCategories();
    setAllCategories(categories);

    // Set initial selected category if value exists
    if (value) {
      const category = categories.find(cat => cat.id === value);
      if (category) {
        setSelectedCategory(category);
      }
    }
  }, [value]);

  const handleChange = (event: React.SyntheticEvent, newValue: Category | null) => {
    setSelectedCategory(newValue);
    if (newValue) {
      onChange(newValue.id);
    } else {
      onChange('');
    }
  };

  // Helper function to determine the group for a category
  const getCategoryGroup = (option: Category): string => {
    // Find the parent category for this subcategory
    const parentCategory = MAIN_CATEGORIES.find(cat => 
      cat.children?.some(child => child.id === option.id)
    );
    
    return parentCategory?.name || 'Other';
  };

  // Prepare options for the autocomplete - ONLY use subcategories
  const subcategoryOptions = getAllCategories()
    .filter(cat => cat.level === 'sub')
    .sort((a, b) => {
      // Sort first by group name
      const groupA = getCategoryGroup(a);
      const groupB = getCategoryGroup(b);
      
      // If groups are different, sort by group
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }
      
      // If in same group, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  return (
    <FormControl fullWidth={fullWidth} error={!!error} variant={variant} size={size} required={required}>
      <Autocomplete
        value={selectedCategory}
        onChange={handleChange}
        disabled={disabled}
        options={subcategoryOptions}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={!!error}
            helperText={error}
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
            }}
          />
        )}
        renderOption={(props, option) => (
          <MenuItem
            {...props}
            key={option.id}
            sx={{
              pl: 4,
              borderLeft: `4px solid ${option.color || '#ccc'}`
            }}
          >
            <Box display="flex" alignItems="center">
              {option.name}
            </Box>
          </MenuItem>
        )}
        groupBy={getCategoryGroup}
      />
    </FormControl>
  );
};

export default CategorySelector; 