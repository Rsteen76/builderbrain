import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Paper,
  Divider,
  Alert,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Project, Phase } from '../../types';
import { ProjectService } from '../../services/project';

// Extend Phase to include percentage for template editing
interface PhaseWithPercentage extends Phase {
  percentage?: number;
}

interface TemplateAdjusterProps {
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
  onClose: () => void;
  open: boolean;
}

const TemplateAdjuster: React.FC<TemplateAdjusterProps> = ({
  project,
  onUpdateProject,
  onClose,
  open
}) => {
  // Clone the current phases to avoid direct mutation
  const [phases, setPhases] = useState<PhaseWithPercentage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Initialize phases from project when the dialog opens
  useEffect(() => {
    if (open && project && project.phases) {
      // Deep clone to avoid reference issues
      const phasesWithPercentage: PhaseWithPercentage[] = (JSON.parse(JSON.stringify(project.phases || [])) as Phase[]).map((phase, index, array) => {
        // For existing phases, calculate a default percentage if not already present
        return {
          ...phase,
          percentage: 100 / array.length // Default to equal distribution
        };
      });
      
      setPhases(phasesWithPercentage);
      setIsModified(false);
      setError(null);
      setValidationErrors({});
    }
  }, [open, project]);

  // Add a new phase
  const handleAddPhase = () => {
    const today = new Date();
    // Set end date to be 30 days from today
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);
    
    const newPhase: PhaseWithPercentage = {
      name: `New Phase ${phases.length + 1}`,
      percentage: 0,
      status: 'not_started',
      progress: 0,
      budget: 0,
      actualCost: 0,
      tasks: [],
      startDate: today,
      endDate: endDate
    };
    
    setPhases([...phases, newPhase]);
    setIsModified(true);
  };

  // Delete a phase
  const handleDeletePhase = (index: number) => {
    const updatedPhases = [...phases];
    updatedPhases.splice(index, 1);
    setPhases(updatedPhases);
    setIsModified(true);
  };

  // Update a phase field
  const handlePhaseChange = (index: number, field: keyof PhaseWithPercentage, value: any) => {
    const updatedPhases = [...phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    
    // Validate phase name
    if (field === 'name' && !value.trim()) {
      setValidationErrors({...validationErrors, [`phase_${index}_name`]: 'Phase name is required'});
    } else if (field === 'name') {
      const { [`phase_${index}_name`]: _, ...rest } = validationErrors;
      setValidationErrors(rest);
    }
    
    // Validate percentage
    if (field === 'percentage') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setValidationErrors({...validationErrors, [`phase_${index}_percentage`]: 'Percentage must be a positive number'});
      } else {
        const { [`phase_${index}_percentage`]: _, ...rest } = validationErrors;
        setValidationErrors(rest);
      }
    }
    
    setPhases(updatedPhases);
    setIsModified(true);
  };

  // Move a phase up in the list
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    
    const updatedPhases = [...phases];
    const temp = updatedPhases[index];
    updatedPhases[index] = updatedPhases[index - 1];
    updatedPhases[index - 1] = temp;
    
    setPhases(updatedPhases);
    setIsModified(true);
  };

  // Move a phase down in the list
  const handleMoveDown = (index: number) => {
    if (index >= phases.length - 1) return;
    
    const updatedPhases = [...phases];
    const temp = updatedPhases[index];
    updatedPhases[index] = updatedPhases[index + 1];
    updatedPhases[index + 1] = temp;
    
    setPhases(updatedPhases);
    setIsModified(true);
  };

  // Normalize percentages to ensure they sum to 100%
  const normalizePercentages = () => {
    const total = phases.reduce((sum, phase) => sum + (phase.percentage || 0), 0);
    
    if (total === 0) {
      // If all percentages are 0, distribute evenly
      const equalPercentage = 100 / phases.length;
      const updatedPhases = phases.map(phase => ({
        ...phase,
        percentage: parseFloat(equalPercentage.toFixed(2))
      }));
      setPhases(updatedPhases);
    } else {
      // Scale percentages proportionally to sum to 100%
      const scale = 100 / total;
      const updatedPhases = phases.map(phase => ({
        ...phase,
        percentage: parseFloat((scale * (phase.percentage || 0)).toFixed(2))
      }));
      setPhases(updatedPhases);
    }
    
    setIsModified(true);
  };

  // Save changes
  const handleSave = async () => {
    // Validate
    const errors: {[key: string]: string} = {};
    
    // Check for empty phase names
    phases.forEach((phase, index) => {
      if (!phase.name.trim()) {
        errors[`phase_${index}_name`] = 'Phase name is required';
      }
    });
    
    // Check total percentages
    const total = phases.reduce((sum, phase) => sum + (phase.percentage || 0), 0);
    if (Math.abs(total - 100) > 0.1) {
      setError(`Phase percentages should sum to 100% (currently ${total.toFixed(1)}%). Click "Normalize" to fix.`);
      return;
    }
    
    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove percentage property before saving to match Phase interface
      const phasesToSave: Phase[] = phases.map(({ percentage, ...phaseData }) => phaseData);
      
      // Create updated project with new phases
      const updatedProject = {
        ...project,
        phases: phasesToSave
      };
      
      // Update project in database
      await ProjectService.updateProject(project.id, { phases: phasesToSave });
      
      // Call the parent's update handler
      onUpdateProject(updatedProject);
      
      // Close the dialog
      onClose();
    } catch (err) {
      console.error('Error updating project template:', err);
      setError('Failed to update project template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Adjust Project Template</Typography>
          {isModified && <Chip size="small" label="Modified" color="primary" />}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adjust the phases of your project by modifying names and percentages. 
          You can also add new phases or reorder them.
        </Typography>

        <Box mb={2}>
          <Grid container spacing={2} sx={{ mb: 1 }} alignItems="center">
            <Grid item xs={5}>
              <Typography variant="subtitle2">Phase Name</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="subtitle2">Percentage (%)</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2">Actions</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 2 }} />
          
          {phases.map((phase, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      size="small"
                      value={phase.name}
                      onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                      error={!!validationErrors[`phase_${index}_name`]}
                      helperText={validationErrors[`phase_${index}_name`]}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={phase.percentage || 0}
                      onChange={(e) => handlePhaseChange(index, 'percentage', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      error={!!validationErrors[`phase_${index}_percentage`]}
                      helperText={validationErrors[`phase_${index}_percentage`]}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Move Up">
                        <span>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move Down">
                        <span>
                          <IconButton 
                            size="small" 
                            onClick={() => handleMoveDown(index)}
                            disabled={index === phases.length - 1}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete Phase">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeletePhase(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
          
          {phases.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
              <Typography color="text.secondary">
                No phases defined. Add phases to your project.
              </Typography>
            </Paper>
          )}

          <Box mt={2} display="flex" justifyContent="space-between">
            <Button 
              startIcon={<AddIcon />} 
              onClick={handleAddPhase}
              variant="contained"
              color="primary"
            >
              Add Phase
            </Button>
            
            <Button
              startIcon={<RefreshIcon />}
              onClick={normalizePercentages}
              variant="outlined"
              color="secondary"
            >
              Normalize Percentages
            </Button>
          </Box>
        </Box>
        
        <Box mt={3}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Note:</strong> Changes to the project template will affect project scheduling,
              budget allocations, and progress tracking. Make sure all phases add up to 100%.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={isLoading || Object.keys(validationErrors).length > 0}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {isLoading ? 'Saving...' : 'Save Template Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateAdjuster; 