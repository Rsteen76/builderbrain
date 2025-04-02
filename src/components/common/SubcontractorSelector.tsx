import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
  FormHelperText,
  SelectChangeEvent,
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
        console.error('Error fetching subcontractors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubcontractors();
  }, [user]);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    
    if (selectedValue === 'new') {
      setShowNewField(true);
      onChange('', '');
    } else if (selectedValue === '') {
      onChange('', '');
      setShowNewField(false);
    } else {
      const selectedSubcontractor = subcontractors.find(s => s.id === selectedValue);
      onChange(selectedValue, selectedSubcontractor?.name || '');
      setShowNewField(false);
    }
  };

  const handleNewSubcontractorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewSubcontractor(event.target.value);
  };

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
      console.error('Error creating subcontractor:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      <FormControl fullWidth error={error}>
        <InputLabel id="subcontractor-label">Subcontractor</InputLabel>
        <Select
          labelId="subcontractor-label"
          value={value}
          onChange={handleSelectChange}
          label="Subcontractor"
          startAdornment={
            <InputAdornment position="start">
              <SubcontractorIcon />
            </InputAdornment>
          }
          disabled={isLoading || disabled}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {isLoading ? (
            <MenuItem disabled>
              <CircularProgress size={20} /> Loading...
            </MenuItem>
          ) : (
            subcontractors.map((sub) => (
              <MenuItem key={sub.id} value={sub.id}>
                {sub.name}
              </MenuItem>
            ))
          )}
          <MenuItem value="new" sx={{ color: 'primary.main' }}>
            <AddIcon fontSize="small" sx={{ mr: 1 }} /> Add New Subcontractor
          </MenuItem>
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      {showNewField && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            name="newSubcontractor"
            label="New Subcontractor Name"
            value={newSubcontractor}
            onChange={handleNewSubcontractorChange}
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
        </Box>
      )}
    </Box>
  );
};

export default SubcontractorSelector; 