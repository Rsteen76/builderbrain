import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Paper, 
  useTheme, 
  alpha, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse
} from '@mui/material';
import {
  CategoryOutlined as CategoryIcon,
  CheckCircleOutline as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { Phase } from '../../types/project.types';
import { determineCurrentPhase, getSuggestedCategoriesForCurrentPhase } from '../../utils/categorySuggestions';
import { getPhaseInfo } from '../../data/phaseCategories';
import { getCategoryById } from '../../data/hierarchicalCategories';

interface PhaseCategorySuggestionsProps {
  phases: Phase[];
  itemDescription?: string;
  onSelectCategory: (categoryId: string) => void;
  selectedCategory?: string;
}

const PhaseCategorySuggestions: React.FC<PhaseCategorySuggestionsProps> = ({
  phases,
  itemDescription,
  onSelectCategory,
  selectedCategory
}) => {
  const theme = useTheme();
  const [currentPhase, setCurrentPhase] = useState<string | undefined>();
  const [suggestedCategories, setSuggestedCategories] = useState<Array<{id: string, name: string, parentName: string}>>([]);
  const [expanded, setExpanded] = useState<boolean>(true);

  useEffect(() => {
    // Determine the current phase based on project phases
    const phaseKey = determineCurrentPhase(phases);
    setCurrentPhase(phaseKey);
    
    // Get suggested categories for this phase
    if (phaseKey) {
      const suggestions = getSuggestedCategoriesForCurrentPhase(phaseKey, itemDescription);
      setSuggestedCategories(suggestions);
    }
  }, [phases, itemDescription]);

  const phaseInfo = currentPhase ? getPhaseInfo(currentPhase) : undefined;

  if (!currentPhase || !phaseInfo || suggestedCategories.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.7)
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          mb: expanded ? 1 : 0
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ mr: 1, fontSize: '1.1rem' }} />
          Suggested Categories for <Box component="span" sx={{ fontWeight: 'bold', ml: 0.5 }}>{phaseInfo.phaseName}</Box>
        </Typography>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ fontSize: '0.9rem', color: theme.palette.info.main, mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Based on the current project phase, these categories are recommended:
          </Typography>
        </Box>
        
        <List dense disablePadding>
          {suggestedCategories.map((category) => (
            <ListItem 
              key={category.id}
              disablePadding
              sx={{ 
                py: 0.5,
                borderRadius: 1,
                mb: 0.5,
                bgcolor: selectedCategory === category.id ? 
                  alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
              onClick={() => onSelectCategory(category.id)}
              button
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {selectedCategory === category.id ? (
                  <CheckCircleIcon fontSize="small" color="primary" />
                ) : (
                  <CategoryIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={category.name}
                secondary={category.parentName}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: selectedCategory === category.id ? 'bold' : 'normal'
                }}
                secondaryTypographyProps={{
                  variant: 'caption'
                }}
              />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Other categories are available in the dropdown below.
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PhaseCategorySuggestions;