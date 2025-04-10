import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Autocomplete, Chip } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { CONSTRUCTION_CATEGORY_HIERARCHY, getCategoryById, getSubcategories } from '../../../data/constructionCategories';
import { CategoryWithChildren } from '../../../types/category.types';

interface CategorySelectorProps {
  selectedMainCategory: string;
  selectedSubcategory: string;
  onMainCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (categoryId: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedMainCategory,
  selectedSubcategory,
  onMainCategoryChange,
  onSubcategoryChange,
  label = 'Category',
  required = false,
  error = false,
  helperText = '',
  size = 'medium'
}) => {
  const [availableSubcategories, setAvailableSubcategories] = useState<CategoryWithChildren[]>([]);
  
  // Update subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategory) {
      const subcategories = getSubcategories(selectedMainCategory);
      setAvailableSubcategories(subcategories);
      
      // If the current subcategory doesn't belong to this main category, reset it
      if (subcategories.length > 0 && !subcategories.some(sub => sub.id === selectedSubcategory)) {
        onSubcategoryChange('');
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedMainCategory, selectedSubcategory, onSubcategoryChange]);
  
  const handleMainCategoryChange = (event: SelectChangeEvent) => {
    onMainCategoryChange(event.target.value);
  };
  
  const handleSubcategoryChange = (event: SelectChangeEvent) => {
    onSubcategoryChange(event.target.value);
  };
  
  // Get the selected category objects (for display purposes)
  const selectedMainCategoryObj = selectedMainCategory 
    ? getCategoryById(selectedMainCategory) 
    : undefined;
    
  const selectedSubcategoryObj = selectedSubcategory
    ? getCategoryById(selectedSubcategory)
    : undefined;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth error={error} required={required} size={size}>
        <InputLabel id="main-category-label">{label}</InputLabel>
        <Select
          labelId="main-category-label"
          id="main-category-select"
          value={selectedMainCategory}
          label={label}
          onChange={handleMainCategoryChange}
        >
          <MenuItem value="">
            <em>Select a category</em>
          </MenuItem>
          {CONSTRUCTION_CATEGORY_HIERARCHY.map((category) => (
            <MenuItem 
              key={category.id} 
              value={category.id}
              sx={{ 
                borderLeft: `4px solid ${category.color}`,
                paddingLeft: 2
              }}
            >
              {category.name}
            </MenuItem>
          ))}
        </Select>
        {helperText && <Typography color="error" variant="caption">{helperText}</Typography>}
      </FormControl>
      
      {selectedMainCategory && (
        <FormControl fullWidth required={required} size={size}>
          <InputLabel id="subcategory-label">Subcategory</InputLabel>
          <Select
            labelId="subcategory-label"
            id="subcategory-select"
            value={selectedSubcategory}
            label="Subcategory"
            onChange={handleSubcategoryChange}
            disabled={availableSubcategories.length === 0}
          >
            <MenuItem value="">
              <em>Select a subcategory</em>
            </MenuItem>
            {availableSubcategories.map((subcategory) => (
              <MenuItem 
                key={subcategory.id} 
                value={subcategory.id}
              >
                {subcategory.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {/* Display the selected categories */}
      {(selectedMainCategoryObj || selectedSubcategoryObj) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {selectedMainCategoryObj && (
            <Chip 
              label={selectedMainCategoryObj.name} 
              color="primary" 
              variant="outlined"
              sx={{ 
                backgroundColor: `${selectedMainCategoryObj.color}20`,
                borderColor: selectedMainCategoryObj.color
              }}
            />
          )}
          {selectedSubcategoryObj && (
            <Chip 
              label={selectedSubcategoryObj.name} 
              size="small"
              sx={{ backgroundColor: 'background.paper' }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default CategorySelector; 