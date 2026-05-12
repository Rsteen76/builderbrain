import React, { useMemo, useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { 
  getUserCategorySystemPreference, 
  getCategoriesBySystem
} from '../../utils/categoryMappingUtils';

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
  phaseId?: string;  // Added prop for current phase ID
  projectPhases?: any[]; // Added prop for project phases
  categorySystem?: 'legacy' | 'enhanced'; // New prop for category system
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
  phaseId,
  projectPhases = [],
  categorySystem,
}) => {
  const theme = useTheme();
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const [phaseRelevantCategories, setPhaseRelevantCategories] = useState<string[]>([]);
  
  // Use the provided system or get user preference
  const activeCategorySystem = categorySystem || getUserCategorySystemPreference();
  const categories = useMemo(() => {
    let allCategories = getCategoriesBySystem(activeCategorySystem);

    if (categoryFilter) {
      allCategories = allCategories.filter(cat => categoryFilter(cat.id));
    }

    if (hideMainCategories) {
      allCategories = allCategories.filter(cat => !!cat.parentId);
    }

    return allCategories.sort((a, b) => {
      if ((!a.parentId && b.parentId) || (a.parentId && !b.parentId)) {
        return !a.parentId ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [categoryFilter, hideMainCategories, activeCategorySystem]);

  // Handle value coming from parent component, convert if needed
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Determine phase-relevant categories based on the current phase
  useEffect(() => {
    if (!phaseId) {
      setPhaseRelevantCategories([]);
      return;
    }

    // Find the current phase
    const currentPhase = projectPhases.find(phase => phase.id === phaseId);
    if (!currentPhase) {
      setPhaseRelevantCategories([]);
      return;
    }

    // Determine relevant categories based on phase name
    const phaseName = currentPhase.name.toLowerCase();
    const relevantCategoryIds: string[] = [];

    // Enhanced phase-to-category mapping
    if (activeCategorySystem === 'enhanced') {
      if (phaseName.includes('site') || phaseName.includes('demolition') || phaseName.includes('excavation')) {
        relevantCategoryIds.push('04-site-demolition', '04-site-earthwork', '04-site-utilities', '04-site-environmental');
      } 
      else if (phaseName.includes('foundation') || phaseName.includes('concrete') || phaseName.includes('footings')) {
        relevantCategoryIds.push('05-structural-foundation', '05-structural-concrete', '06-envelope-waterproofing');
      } 
      else if (phaseName.includes('framing') || phaseName.includes('structure')) {
        relevantCategoryIds.push('05-structural-framing', '05-structural-steel', '05-structural-masonry');
      } 
      else if (phaseName.includes('rough') || phaseName.includes('plumbing') || phaseName.includes('electrical') || phaseName.includes('hvac')) {
        relevantCategoryIds.push('07-systems-plumbing', '07-systems-electrical', '07-systems-hvac');
      } 
      else if (phaseName.includes('exterior') || phaseName.includes('siding') || phaseName.includes('roofing')) {
        relevantCategoryIds.push('06-envelope-roofing', '06-envelope-walls', '06-envelope-windows', '06-envelope-doors');
      } 
      else if (phaseName.includes('interior') && phaseName.includes('rough')) {
        relevantCategoryIds.push('08-interior-insulation', '08-interior-drywall');
      } 
      else if (phaseName.includes('interior') || phaseName.includes('finish') || phaseName.includes('paint') || phaseName.includes('flooring')) {
        relevantCategoryIds.push('08-interior-flooring', '08-interior-finishes', '08-interior-cabinetry');
      } 
      else if (phaseName.includes('cabinet') || phaseName.includes('appliances') || phaseName.includes('fixtures')) {
        relevantCategoryIds.push('09-specialties-fixtures', '09-specialties-appliances');
      }
      else if (phaseName.includes('landscape')) {
        relevantCategoryIds.push('10-exterior-landscaping', '10-exterior-hardscaping', '10-exterior-irrigation');
      }
      else if (phaseName.includes('cleanup') || phaseName.includes('final') || phaseName.includes('complete')) {
        relevantCategoryIds.push('11-completion-cleaning', '11-completion-punchlist', '11-completion-documentation');
      }
    } else {
      // Legacy phase-to-category mapping (original code)
      if (phaseName.includes('site') || phaseName.includes('demolition') || phaseName.includes('excavation')) {
        relevantCategoryIds.push('site-work-demolition', 'site-work-excavation', 'site-work-utilities');
      } 
      else if (phaseName.includes('foundation') || phaseName.includes('concrete') || phaseName.includes('footings')) {
        relevantCategoryIds.push('foundation-concrete', 'foundation-footings', 'foundation-waterproofing');
      } 
      else if (phaseName.includes('framing') || phaseName.includes('structure')) {
        relevantCategoryIds.push('framing-lumber', 'framing-labor', 'framing-trusses');
      } 
      else if (phaseName.includes('rough') || phaseName.includes('plumbing') || phaseName.includes('electrical') || phaseName.includes('hvac')) {
        relevantCategoryIds.push('mechanical-plumbing', 'mechanical-electrical', 'mechanical-hvac');
      } 
      else if (phaseName.includes('exterior') || phaseName.includes('siding') || phaseName.includes('roofing')) {
        relevantCategoryIds.push('exterior-roofing', 'exterior-siding', 'exterior-windows');
      } 
      else if (phaseName.includes('interior')) {
        relevantCategoryIds.push('interior-rough-insulation', 'interior-rough-drywall');
      } 
      else if (phaseName.includes('finish') || phaseName.includes('paint') || phaseName.includes('flooring')) {
        relevantCategoryIds.push('interior-finishes-flooring', 'interior-finishes-paint', 'interior-finishes-trim');
      } 
      else if (phaseName.includes('cabinet') || phaseName.includes('appliances') || phaseName.includes('fixtures')) {
        relevantCategoryIds.push('interior-finishes-cabinets', 'interior-finishes-countertops', 'specialty-fixtures');
      }
      else if (phaseName.includes('landscape')) {
        relevantCategoryIds.push('landscape-hardscape', 'landscape-softscape', 'landscape-irrigation');
      }
      else if (phaseName.includes('cleanup') || phaseName.includes('final')) {
        relevantCategoryIds.push('cleanup-final', 'cleanup-hauling');
      }
    }
    
    setPhaseRelevantCategories(relevantCategoryIds);
  }, [phaseId, projectPhases, activeCategorySystem]);

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

  // Extract phase-relevant categories so they can be displayed at the top
  const relevantCategories = phaseRelevantCategories.length > 0 
    ? categories.filter(cat => phaseRelevantCategories.includes(cat.id))
    : [];

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
        {/* Show phase-relevant categories first if available */}
        {relevantCategories.length > 0 && (
          <>
            <MenuItem disabled>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                Recommended for Current Phase
              </Typography>
            </MenuItem>
            {relevantCategories.map(category => {
              const parentCategory = mainCategories.find(c => c.id === category.parentId);
              return (
                <MenuItem key={`relevant-${category.id}`} value={category.id} sx={{ pl: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: alpha(parentCategory?.color || theme.palette.primary.main, 0.8), 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{category.name}</Typography>
                    <Chip 
                      label={parentCategory?.name} 
                      size="small" 
                      sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} 
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              );
            })}
            <Divider sx={{ my: 1 }} />
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                All Categories
              </Typography>
            </MenuItem>
          </>
        )}
        
        {/* Original categories */}
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
        
        {Object.entries(groupedCategories).flatMap(([parentId, subCategories]) => {
          const parentCategory = mainCategories.find(category => category.id === parentId);
          if (subCategories.length === 0) return [];
          
          return subCategories.map(subCategory => (
            <MenuItem key={subCategory.id} value={subCategory.id} sx={{ pl: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: alpha(parentCategory?.color || theme.palette.grey[500], 0.8),
                    mr: 1
                  }}
                />
                <Typography variant="body2">{subCategory.name}</Typography>
              </Box>
            </MenuItem>
          ));
        })}
      </Select>
    </FormControl>
  );
};

export default CategorySelector;
