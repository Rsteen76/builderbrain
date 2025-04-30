import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { getAllCategories } from '../../data/hierarchicalCategories';
import { alpha, useTheme } from '@mui/material/styles';

interface CategorySelectorProps {
  value?: string;
  onChange?: (event: SelectChangeEvent) => void;
  onCategorySelected?: (categoryId: string) => Promise<void> | void;
  label?: string;
  required?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  error?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  categoryFilter?: (categoryId: string) => boolean;
  hideMainCategories?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  onCategorySelected,
  label = 'Category',
  required = false,
  fullWidth = true,
  size = 'medium',
  error = false,
  variant = 'outlined',
  disabled = false,
  color = 'primary',
  categoryFilter,
  hideMainCategories = false,
}) => {
  const theme = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>(value || '');

  useEffect(() => {
    // Get all categories from the hierarchical data structure
    let allCategories = getAllCategories();
    
    // Filter categories if a filter function is provided
    if (categoryFilter) {
      allCategories = allCategories.filter(cat => categoryFilter(cat.id));
    }
    
    // Filter out main categories if hideMainCategories is true
    if (hideMainCategories) {
      allCategories = allCategories.filter(cat => !!cat.parentId);
    }
    
    // Sort categories alphabetically by name within each level
    allCategories.sort((a, b) => {
      // First sort by parent (null parents come first)
      if ((!a.parentId && b.parentId) || (a.parentId && !b.parentId)) {
        return !a.parentId ? -1 : 1;
      }
      
      // If both have same parent status, sort by name
      return a.name.localeCompare(b.name);
    });
    
    setCategories(allCategories);
  }, [categoryFilter, hideMainCategories]);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value as string;
    setSelectedValue(newValue);
    
    if (onChange) {
      onChange(event);
    }
    
    if (onCategorySelected) {
      onCategorySelected(newValue);
    }
  };

  // Group categories by their parent category
  const groupedCategories: { [key: string]: any[] } = {};
  const mainCategories: any[] = [];
  
  categories.forEach(category => {
    if (!category.parentId) {
      mainCategories.push(category);
    } else {
      if (!groupedCategories[category.parentId]) {
        groupedCategories[category.parentId] = [];
      }
      groupedCategories[category.parentId].push(category);
    }
  });

  return (
    <FormControl 
      fullWidth={fullWidth} 
      size={size} 
      required={required} 
      error={error} 
      variant={variant} 
      disabled={disabled}
    >
      <InputLabel id={`category-selector-label`}>{label}</InputLabel>
      <Select
        labelId={`category-selector-label`}
        value={selectedValue}
        label={label}
        onChange={handleChange}
        color={color}
      >
        {!hideMainCategories && mainCategories.map(category => (
          <MenuItem key={category.id} value={category.id} sx={{ fontWeight: 'bold' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: category.color || theme.palette.grey[500], 
                  mr: 1 
                }} 
              />
              {category.name}
            </Box>
          </MenuItem>
        ))}
        
        {mainCategories.map(mainCategory => {
          const subCategories = groupedCategories[mainCategory.id] || [];
          if (subCategories.length === 0) return null;
          
          return (
            <React.Fragment key={`group-${mainCategory.id}`}>
              {subCategories.map(subCategory => (
                <MenuItem key={subCategory.id} value={subCategory.id} sx={{ pl: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: alpha(mainCategory.color || theme.palette.grey[500], 0.8), 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2">{subCategory.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </React.Fragment>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default CategorySelector;