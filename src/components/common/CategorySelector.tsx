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

// Extended category option with group property
interface CategoryOption extends Category {
  group: string;
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

  // Group options by main category
  const options: CategoryOption[] = MAIN_CATEGORIES.map(mainCategory => {
    const subcategories = mainCategory.children || [];
    return [
      { ...mainCategory, group: 'main' },
      ...subcategories.map(subcat => ({ ...subcat, group: mainCategory.id }))
    ];
  }).flat() as CategoryOption[];

  return (
    <FormControl fullWidth={fullWidth} error={!!error} variant={variant} size={size} required={required}>
      <Autocomplete
        value={selectedCategory as CategoryOption | null}
        onChange={handleChange}
        disabled={disabled}
        options={options}
        groupBy={(option) => option.group === 'main' ? 'Main Categories' : 
          options.find(cat => cat.id === option.group)?.name || ''}
        getOptionLabel={(option) => option.name}
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
              pl: option.level === 'sub' ? 4 : 2,
              borderLeft: option.level === 'sub' ? `4px solid ${option.color || '#ccc'}` : 'none'
            }}
          >
            <Box display="flex" alignItems="center">
              {option.level === 'main' && (
                <Box 
                  component="span" 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: option.color || '#ccc', 
                    mr: 1 
                  }} 
                />
              )}
              {option.name}
            </Box>
          </MenuItem>
        )}
      />
    </FormControl>
  );
};

export default CategorySelector; 