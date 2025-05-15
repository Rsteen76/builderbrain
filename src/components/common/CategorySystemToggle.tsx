import React from 'react';
import { 
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  HistoryEdu as LegacyIcon,
  AutoAwesome as EnhancedIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface CategorySystemToggleProps {
  value: 'legacy' | 'enhanced';
  onChange: (value: 'legacy' | 'enhanced') => void;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Component for toggling between legacy and enhanced category systems
 */
const CategorySystemToggle: React.FC<CategorySystemToggleProps> = ({
  value,
  onChange,
  showLabel = true,
  size = 'small'
}) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: 'legacy' | 'enhanced' | null) => {
    // Prevent deselecting (null value)
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
      {showLabel && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}
        >
          Category System:
          <Tooltip title="Switch between the legacy category system and the new enhanced category system with more detailed categories">
            <InfoIcon 
              fontSize="small" 
              color="action" 
              sx={{ ml: 0.5, width: 16, height: 16 }} 
            />
          </Tooltip>
        </Typography>
      )}
      
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        aria-label="category system"
        size={size}
      >
        <ToggleButton 
          value="legacy" 
          aria-label="legacy category system"
          sx={{ 
            px: 1.5,
            py: size === 'small' ? 0.5 : 1,
          }}
        >
          <LegacyIcon fontSize="small" sx={{ mr: 0.5 }} />
          Legacy
        </ToggleButton>
        
        <ToggleButton 
          value="enhanced" 
          aria-label="enhanced category system"
          sx={{ 
            px: 1.5,
            py: size === 'small' ? 0.5 : 1,
          }}
        >
          <Badge 
            color="success" 
            variant="dot"
            overlap="circular"
            sx={{ '& .MuiBadge-badge': { top: 3, right: 3 } }}
          >
            <EnhancedIcon fontSize="small" sx={{ mr: 0.5 }} />
          </Badge>
          Enhanced
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default CategorySystemToggle;