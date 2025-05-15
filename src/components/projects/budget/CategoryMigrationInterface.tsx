import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Alert,
  Tooltip,
  Paper,
  CircularProgress,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Check as MappedIcon,
  Warning as UnmappedIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

import { 
  getCategoriesBySystem,
  generateSuggestedMappings
} from '../../../utils/categoryMappingUtils';

import {
  isEnhancedCategoryId
} from '../../../utils/categoryMigrationUtils';

import { Category } from '../../../types/category.types';

interface CategoryMigrationInterfaceProps {
  projectId: string;
  categoryMappings: Record<string, string>;
  onUpdateMapping: (oldCategoryId: string, newCategoryId: string) => Promise<boolean>;
  usedLegacyCategories?: string[];
}

const CategoryMigrationInterface: React.FC<CategoryMigrationInterfaceProps> = ({
  projectId,
  categoryMappings = {},
  onUpdateMapping,
  usedLegacyCategories = []
}) => {
  const theme = useTheme();
  
  // Track component state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // ID of the category being saved
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Track data
  const [legacyCategories, setLegacyCategories] = useState<Category[]>([]);
  const [enhancedCategories, setEnhancedCategories] = useState<Category[]>([]);
  const [localMappings, setLocalMappings] = useState<Record<string, string>>(categoryMappings);
  const [suggestedMappings, setSuggestedMappings] = useState<Record<string, string>>({});
  
  // Load categories when the component mounts
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      
      try {
        // Get all categories from both systems
        const legacyCats = getCategoriesBySystem('legacy');
        const enhancedCats = getCategoriesBySystem('enhanced');
        
        setLegacyCategories(legacyCats);
        setEnhancedCategories(enhancedCats);
        
        // Generate suggested mappings for unmapped categories
        const unmappedCategoryIds = usedLegacyCategories.filter(
          id => !categoryMappings[id]
        );
        
        const suggested = generateSuggestedMappings(
          unmappedCategoryIds,
          categoryMappings
        );
        
        setSuggestedMappings(suggested);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, [projectId, categoryMappings, usedLegacyCategories]);
  
  // Sync categoryMappings prop with local state
  useEffect(() => {
    setLocalMappings(categoryMappings);
  }, [categoryMappings]);
  
  // Filter categories based on search query
  const getFilteredCategories = () => {
    if (!searchQuery) {
      // If no search query, filter to just show used categories or all if none provided
      return usedLegacyCategories.length > 0
        ? legacyCategories.filter(cat => usedLegacyCategories.includes(cat.id))
        : legacyCategories;
    }
    
    const query = searchQuery.toLowerCase();
    return legacyCategories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.id.toLowerCase().includes(query)
    );
  };
  
  // Get an enhanced category by ID
  const getEnhancedCategoryById = (id: string): Category | undefined => {
    return enhancedCategories.find(cat => cat.id === id);
  };
  
  // Handle changing a category mapping
  const handleChangeMapping = async (legacyCategoryId: string, enhancedCategoryId: string) => {
    setLocalMappings(prev => ({
      ...prev,
      [legacyCategoryId]: enhancedCategoryId
    }));
    
    if (editingCategory === legacyCategoryId) {
      setEditingCategory(null);
    }
  };
  
  // Apply a suggested mapping
  const handleApplySuggestion = (legacyCategoryId: string) => {
    if (suggestedMappings[legacyCategoryId]) {
      handleChangeMapping(legacyCategoryId, suggestedMappings[legacyCategoryId]);
    }
  };
  
  // Save changes to a mapping
  const handleSaveMapping = async (legacyCategoryId: string) => {
    setSaving(legacyCategoryId);
    setError(null);
    
    try {
      const enhancedCategoryId = localMappings[legacyCategoryId];
      const success = await onUpdateMapping(legacyCategoryId, enhancedCategoryId);
      
      if (!success) {
        throw new Error('Failed to update mapping');
      }
      
      // Remove from suggested mappings if it was there
      if (suggestedMappings[legacyCategoryId]) {
        const { [legacyCategoryId]: _, ...remainingSuggestions } = suggestedMappings;
        setSuggestedMappings(remainingSuggestions);
      }
    } catch (err) {
      console.error('Error saving mapping:', err);
      setError(`Failed to update mapping for ${legacyCategoryId}`);
    } finally {
      setSaving(null);
    }
  };
  
  // Apply all suggested mappings
  const handleApplyAllSuggestions = () => {
    // Update local mappings with all suggestions
    setLocalMappings(prev => ({
      ...prev,
      ...suggestedMappings
    }));
    
    // Clear suggestions since they're now applied
    setSuggestedMappings({});
  };
  
  // Save all mappings that were changed
  const handleSaveAllMappings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Find all mappings that were changed or added
      const changedMappings = Object.entries(localMappings)
        .filter(([legacyId, enhancedId]) => 
          categoryMappings[legacyId] !== enhancedId || 
          !categoryMappings[legacyId]
        );
      
      // Save each mapping
      for (const [legacyId, enhancedId] of changedMappings) {
        setSaving(legacyId);
        await onUpdateMapping(legacyId, enhancedId);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error saving mappings:', err);
      setError('Failed to save all mappings');
    } finally {
      setLoading(false);
      setSaving(null);
    }
  };
  
  // Calculate progress stats
  const getMigrationStats = () => {
    const total = usedLegacyCategories.length;
    const mapped = usedLegacyCategories.filter(id => 
      localMappings[id] && isEnhancedCategoryId(localMappings[id])
    ).length;
    
    return {
      total,
      mapped,
      unmapped: total - mapped,
      percentage: total > 0 ? Math.round((mapped / total) * 100) : 100
    };
  };
  
  const stats = getMigrationStats();
  const filteredCategories = getFilteredCategories();
  
  if (loading && legacyCategories.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Category Migration Progress
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={stats.percentage} 
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 1,
          mb: 2 
        }}>
          <Typography variant="body2" color="text.secondary">
            {stats.mapped} of {stats.total} categories mapped
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.percentage}% complete
          </Typography>
        </Box>
        
        {Object.keys(suggestedMappings).length > 0 && (
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleApplyAllSuggestions}
            sx={{ mb: 2 }}
          >
            Apply {Object.keys(suggestedMappings).length} Auto-Suggested Mappings
          </Button>
        )}
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
      </Box>
      
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Legacy Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Enhanced Category</TableCell>
              <TableCell align="center" sx={{ width: 100, fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ width: 150, fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.map((legacyCategory) => {
              const isUsed = usedLegacyCategories.includes(legacyCategory.id);
              const mappedId = localMappings[legacyCategory.id];
              const mappedCategory = mappedId && getEnhancedCategoryById(mappedId);
              const hasSuggestion = !!suggestedMappings[legacyCategory.id];
              const isMapped = !!mappedCategory && isEnhancedCategoryId(mappedId);
              const isEditing = editingCategory === legacyCategory.id;
              const isSaving = saving === legacyCategory.id;
              
              return (
                <TableRow 
                  key={legacyCategory.id}
                  hover
                  sx={{
                    bgcolor: isUsed ? 'inherit' : theme.palette.action.hover
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">
                        {legacyCategory.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {legacyCategory.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {isEditing ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={mappedId || ''}
                          onChange={(e) => handleChangeMapping(legacyCategory.id, e.target.value as string)}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Not mapped</em>
                          </MenuItem>
                          {enhancedCategories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                              {cat.name} ({cat.id})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : mappedCategory ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">
                          {mappedCategory.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mappedCategory.id}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not mapped
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    {isMapped ? (
                      <Tooltip title="Category is mapped">
                        <Chip
                          icon={<MappedIcon />}
                          label="Mapped"
                          size="small"
                          color="success"
                        />
                      </Tooltip>
                    ) : hasSuggestion ? (
                      <Tooltip title={`Suggested: ${getEnhancedCategoryById(suggestedMappings[legacyCategory.id])?.name || ''}`}>
                        <Chip
                          icon={<AutoAwesomeIcon />}
                          label="Suggested"
                          size="small"
                          color="info"
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Category needs mapping">
                        <Chip
                          icon={<UnmappedIcon />}
                          label="Unmapped"
                          size="small"
                          color="warning"
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  
                  <TableCell align="center">
                    {isSaving ? (
                      <CircularProgress size={24} />
                    ) : isEditing ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSaveMapping(legacyCategory.id)}
                      >
                        Save
                      </Button>
                    ) : hasSuggestion ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={() => handleApplySuggestion(legacyCategory.id)}
                      >
                        Apply
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => setEditingCategory(legacyCategory.id)}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          disabled={loading || stats.mapped === stats.total}
          onClick={handleSaveAllMappings}
        >
          {stats.mapped === stats.total ? 'All Categories Mapped' : 'Save All Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default CategoryMigrationInterface;