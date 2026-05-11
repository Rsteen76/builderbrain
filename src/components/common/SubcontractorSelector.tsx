import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import {
  FormControl,
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as SubcontractorIcon,
} from '@mui/icons-material';
import { Subcontractor } from '../../types';
import { SubcontractorService } from '../../services/subcontractor';
import { useAuth } from '../../contexts/AuthContext';

interface SubcontractorSelectorProps {
  value: string;
  onChange: (subcontractorId: string, subcontractorName: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const SubcontractorSelector: React.FC<SubcontractorSelectorProps> = ({
  value,
  onChange,
  error,
  helperText,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewField, setShowNewField] = useState(false);
  const [newSubcontractor, setNewSubcontractor] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch subcontractors
  useEffect(() => {
    const fetchSubcontractors = async () => {
      if (!user?.uid) return;
      
      try {
        setIsLoading(true);
        const fetchedSubcontractors = await SubcontractorService.getSubcontractors(user.uid);
        setSubcontractors(fetchedSubcontractors);
      } catch (error) {
        logger.error('Error fetching subcontractors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubcontractors();
  }, [user]);

  const handleCreateSubcontractor = async () => {
    if (!user?.uid || !newSubcontractor.trim()) return;
    
    try {
      setIsCreating(true);
      const newSubcontractorData = {
        name: newSubcontractor.trim(),
        specialty: '',
        contact: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const createdSubcontractor = await SubcontractorService.createSubcontractor(
        user.uid, 
        newSubcontractorData as any
      );
      
      // Add to subcontractors list
      setSubcontractors([...subcontractors, createdSubcontractor]);
      
      // Update parent with new subcontractor
      onChange(createdSubcontractor.id, createdSubcontractor.name);
      
      // Reset new subcontractor UI
      setNewSubcontractor('');
      setShowNewField(false);
      
    } catch (error) {
      logger.error('Error creating subcontractor:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Find selected subcontractor
  const selectedSubcontractor = subcontractors.find(sub => sub.id === value);

  return (
    <Box>
      <FormControl fullWidth error={error}>
        <Autocomplete
          id="subcontractor-select"
          options={subcontractors}
          loading={isLoading}
          value={selectedSubcontractor || null}
          disabled={disabled}
          selectOnFocus
          clearOnBlur={false}
          handleHomeEndKeys
          autoHighlight
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(event, newValue) => {
            if (newValue) {
              onChange(newValue.id, newValue.name);
            } else {
              onChange('', '');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Subcontractor"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SubcontractorIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              error={error}
              helperText={helperText}
            />
          )}
        />
      </FormControl>

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setShowNewField(true)}
        sx={{ mt: 1, display: showNewField ? 'none' : 'flex' }}
      >
        Add New Subcontractor
      </Button>

      {showNewField && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            name="newSubcontractor"
            label="New Subcontractor Name"
            value={newSubcontractor}
            onChange={(e) => setNewSubcontractor(e.target.value)}
            fullWidth
            error={error}
            helperText={helperText}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCreateSubcontractor}
            disabled={isCreating || !newSubcontractor.trim()}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {isCreating ? <CircularProgress size={24} /> : 'Add'}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setShowNewField(false)}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SubcontractorSelector; 
