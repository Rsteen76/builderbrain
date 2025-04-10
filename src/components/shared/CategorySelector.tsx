import React, { useEffect, useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography, 
  FormHelperText, 
  Chip,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import { Category, CategoryLevel } from '../../types/category.types';

export interface CategorySelectorProps {
  categories: Category[];
  selectedMainCategory?: string;
  selectedSubCategory?: string;
  onMainCategoryChange: (categoryId: string) => void;
  onSubCategoryChange: (categoryId: string) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedMainCategory,
  selectedSubCategory,
  onMainCategoryChange,
  onSubCategoryChange,
  label = 'Category',
  disabled = false,
  error = false,
  errorMessage,
  required = false,
}) => {
  const [availableSubCategories, setAvailableSubCategories] = useState<Category[]>([]);

  // Get main categories
  const mainCategories = categories.filter(
    cat => cat.level === 'main' && cat.isActive
  );

  // Update available subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategory) {
      const subCategories = categories.filter(
        cat => cat.parentId === selectedMainCategory && cat.isActive
      );
      setAvailableSubCategories(subCategories);
    } else {
      setAvailableSubCategories([]);
    }
  }, [selectedMainCategory, categories]);

  const handleMainCategoryChange = (event: SelectChangeEvent<string>) => {
    const categoryId = event.target.value;
    onMainCategoryChange(categoryId);
    
    // Reset subcategory when main category changes
    onSubCategoryChange('');
  };

  const handleSubCategoryChange = (event: SelectChangeEvent<string>) => {
    const categoryId = event.target.value;
    onSubCategoryChange(categoryId);
  };

  // Find the category names for display
  const selectedMainCategoryName = mainCategories.find(
    cat => cat.id === selectedMainCategory
  )?.name || '';
  
  const selectedSubCategoryName = availableSubCategories.find(
    cat => cat.id === selectedSubCategory
  )?.name || '';

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            error={error}
            disabled={disabled}
            size="small"
          >
            <InputLabel id="main-category-label">Main Category</InputLabel>
            <Select
              labelId="main-category-label"
              id="main-category-select"
              value={selectedMainCategory || ''}
              onChange={handleMainCategoryChange}
              label="Main Category"
              required={required}
            >
              <MenuItem value="">
                <em>Select a main category</em>
              </MenuItem>
              {mainCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            error={error}
            disabled={disabled || !selectedMainCategory}
            size="small"
          >
            <InputLabel id="sub-category-label">Subcategory</InputLabel>
            <Select
              labelId="sub-category-label"
              id="sub-category-select"
              value={selectedSubCategory || ''}
              onChange={handleSubCategoryChange}
              label="Subcategory"
              required={required}
            >
              <MenuItem value="">
                <em>Select a subcategory</em>
              </MenuItem>
              {availableSubCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
            {availableSubCategories.length === 0 && selectedMainCategory && (
              <FormHelperText>No subcategories available</FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
      
      {error && errorMessage && (
        <FormHelperText error>{errorMessage}</FormHelperText>
      )}
      
      {/* Display selected categories as chips */}
      {(selectedMainCategoryName || selectedSubCategoryName) && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedMainCategoryName && (
            <Chip 
              label={selectedMainCategoryName} 
              color="primary" 
              variant="outlined"
              size="small"
            />
          )}
          {selectedSubCategoryName && (
            <Chip 
              label={selectedSubCategoryName} 
              color="secondary"
              size="small"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default CategorySelector; 