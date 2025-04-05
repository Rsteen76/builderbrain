import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragHandle as DragHandleIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Phase } from '../../types';

interface PhaseSetupStepperProps {
  phases: Phase[];
  onChange: (phases: Phase[]) => void;
  projectStartDate: Date;
  projectEndDate: Date | null;
  projectBudget: number;
}

const PhaseSetupStepper: React.FC<PhaseSetupStepperProps> = ({
  phases,
  onChange,
  projectStartDate,
  projectEndDate,
  projectBudget,
}) => {
  // State to track if we're distributing budget automatically
  const [autoBudget, setAutoBudget] = useState(false);
  const [autoDate, setAutoDate] = useState(false);
  
  // Helper function to generate a unique ID
  const generateId = () => `phase-${Math.random().toString(36).substring(2, 9)}`;
  
  // Add a new empty phase
  const handleAddPhase = () => {
    // Calculate default dates based on project timeline or existing phases
    let startDate = new Date(projectStartDate);
    let endDate = projectEndDate ? new Date(projectEndDate) : new Date();
    
    if (phases.length > 0) {
      // If we have existing phases, set the start date after the last phase
      const lastPhase = phases[phases.length - 1];
      if (lastPhase.endDate) {
        startDate = new Date(lastPhase.endDate);
        // Add one day to avoid overlap
        startDate.setDate(startDate.getDate() + 1);
      }
      
      // Set end date 14 days after start by default
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 14);
    }
    
    // Calculate default budget as a portion of remaining budget
    const usedBudget = phases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
    const remainingBudget = projectBudget - usedBudget;
    const defaultBudget = remainingBudget > 0 ? Math.round(remainingBudget * 0.2) : 0;
    
    const newPhase: Phase = {
      id: generateId(),
      name: `Phase ${phases.length + 1}`,
      description: '',
      startDate,
      endDate,
      status: 'not_started',
      progress: 0,
      budget: defaultBudget,
      actualCost: 0,
    };
    
    onChange([...phases, newPhase]);
  };
  
  // Remove a phase
  const handleRemovePhase = (index: number) => {
    const updatedPhases = [...phases];
    updatedPhases.splice(index, 1);
    
    // Update phase names if they were auto-generated
    const renamedPhases = updatedPhases.map((phase, idx) => {
      // Only rename if the phase name followed the pattern "Phase X"
      if (phase.name.match(/^Phase \d+$/)) {
        return { ...phase, name: `Phase ${idx + 1}` };
      }
      return phase;
    });
    
    onChange(renamedPhases);
  };
  
  // Move a phase up in the order
  const handleMoveUp = (index: number) => {
    if (index === 0) return; // Already at the top
    
    const updatedPhases = [...phases];
    // Swap with the phase above
    [updatedPhases[index - 1], updatedPhases[index]] = [updatedPhases[index], updatedPhases[index - 1]];
    
    onChange(updatedPhases);
  };
  
  // Move a phase down in the order
  const handleMoveDown = (index: number) => {
    if (index === phases.length - 1) return; // Already at the bottom
    
    const updatedPhases = [...phases];
    // Swap with the phase below
    [updatedPhases[index], updatedPhases[index + 1]] = [updatedPhases[index + 1], updatedPhases[index]];
    
    onChange(updatedPhases);
  };
  
  // Handle changes to a phase field
  const handlePhaseChange = (index: number, field: keyof Phase, value: any) => {
    const updatedPhases = phases.map((phase, i) => {
      if (i === index) {
        return { ...phase, [field]: value };
      }
      return phase;
    });
    
    onChange(updatedPhases);
  };
  
  // Distribute budget evenly across phases
  const handleDistributeBudget = () => {
    if (phases.length === 0 || projectBudget <= 0) return;
    
    const phaseBudget = Math.floor(projectBudget / phases.length);
    const remainder = projectBudget - (phaseBudget * phases.length);
    
    const updatedPhases = phases.map((phase, index) => ({
      ...phase,
      budget: phaseBudget + (index === 0 ? remainder : 0),
    }));
    
    onChange(updatedPhases);
  };
  
  // Distribute dates evenly between project start and end dates
  const handleDistributeDates = () => {
    if (phases.length === 0 || !projectEndDate) return;
    
    const projectDuration = projectEndDate.getTime() - projectStartDate.getTime();
    const phaseDuration = projectDuration / phases.length;
    
    const updatedPhases = phases.map((phase, index) => {
      const phaseStartTime = projectStartDate.getTime() + (phaseDuration * index);
      const phaseEndTime = projectStartDate.getTime() + (phaseDuration * (index + 1));
      
      return {
        ...phase,
        startDate: new Date(phaseStartTime),
        endDate: new Date(phaseEndTime),
      };
    });
    
    onChange(updatedPhases);
  };
  
  // Calculate total budget allocated
  const totalBudget = phases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
  
  // Display warning if total exceeds project budget
  const budgetWarning = totalBudget > projectBudget;
  
  return (
    <Box>
      {/* Budget and timeline controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Budget Allocation: ${totalBudget.toLocaleString()} of ${projectBudget.toLocaleString()}
            </Typography>
            <LinearProgressWithLabel 
              value={projectBudget > 0 ? (totalBudget / projectBudget) * 100 : 0} 
              warning={budgetWarning}
            />
            {budgetWarning && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Budget allocation exceeds project budget by ${(totalBudget - projectBudget).toLocaleString()}
              </Alert>
            )}
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleDistributeBudget}
              sx={{ mt: 1 }}
            >
              Distribute Budget Evenly
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Timeline: {projectStartDate.toLocaleDateString()} - {projectEndDate ? projectEndDate.toLocaleDateString() : 'Not set'}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleDistributeDates}
              disabled={!projectEndDate}
              sx={{ mt: 1 }}
            >
              Distribute Dates Evenly
            </Button>
            {!projectEndDate && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Set a project end date to distribute phase timelines automatically.
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Phase list */}
      {phases.map((phase, index) => (
        <Card key={phase.id || index} sx={{ mb: 2 }}>
          <CardHeader
            title={
              <TextField
                fullWidth
                label="Phase Name"
                variant="standard"
                value={phase.name}
                onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  style: { fontSize: '1.25rem', fontWeight: 500 }
                }}
              />
            }
            action={
              <Box>
                <IconButton 
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  size="small"
                >
                  <KeyboardArrowUpIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleMoveDown(index)}
                  disabled={index === phases.length - 1}
                  size="small"
                >
                  <KeyboardArrowDownIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleRemovePhase(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={phase.description || ''}
                  onChange={(e) => handlePhaseChange(index, 'description', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={phase.startDate}
                    onChange={(newValue) => handlePhaseChange(index, 'startDate', newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={phase.endDate}
                    onChange={(newValue) => handlePhaseChange(index, 'endDate', newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={phase.budget || 0}
                  onChange={(e) => handlePhaseChange(index, 'budget', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={phase.status || 'not_started'}
                    label="Status"
                    onChange={(e) => handlePhaseChange(index, 'status', e.target.value)}
                  >
                    <MenuItem value="not_started">Not Started</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                    <MenuItem value="delayed">Delayed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      
      {/* Add phase button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddPhase}
        >
          Add Phase
        </Button>
      </Box>
    </Box>
  );
};

// Progress bar with label component
const LinearProgressWithLabel = ({ 
  value, 
  warning 
}: { 
  value: number, 
  warning: boolean 
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <div
          style={{
            height: 10,
            borderRadius: 5,
            width: '100%',
            backgroundColor: '#e0e0e0',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 5,
              width: `${Math.min(value, 100)}%`,
              backgroundColor: warning ? '#f44336' : '#2196f3',
            }}
          />
        </div>
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {Math.round(value)}%
        </Typography>
      </Box>
    </Box>
  );
};

export default PhaseSetupStepper; 