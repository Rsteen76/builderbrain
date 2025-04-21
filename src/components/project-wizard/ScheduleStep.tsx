import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { 
  DatePicker, 
  LocalizationProvider 
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { useProjectWizard, ScheduleMilestone } from '../../contexts/ProjectWizardContext';

const ScheduleStep: React.FC = () => {
  const { state, addMilestone, removeMilestone, validateStep } = useProjectWizard();
  const { schedule } = state;
  
  // Validate on mount and when milestones change
  useEffect(() => {
    validateStep('schedule');
  }, [schedule.milestones, validateStep]);
  
  const [milestone, setMilestone] = useState<{
    title: string;
    description: string;
    dueDate: Date | null;
  }>({
    title: '',
    description: '',
    dueDate: null
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMilestone(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user types
    if (name === 'title' && validationErrors.title) {
      setValidationErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setMilestone(prev => ({ ...prev, dueDate: date }));
  };

  const handleAddMilestone = () => {
    // Validate
    const errors: {title?: string} = {};
    if (!milestone.title?.trim()) {
      errors.title = 'Milestone title is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    const newMilestone: ScheduleMilestone = {
      id: Date.now().toString(),
      title: milestone.title!.trim(),
      description: milestone.description?.trim() || '',
      dueDate: milestone.dueDate || new Date(), // Always provide a date
      isCompleted: false
    };
    
    addMilestone(newMilestone);
    
    // Reset form
    setMilestone({
      title: '',
      description: '',
      dueDate: null
    });
  };

  const handleDeleteMilestone = (id: string) => {
    removeMilestone(id);
  };

  const isStepValid = (): boolean => {
    // Schedule step is valid if at least one milestone exists
    return schedule.milestones.length > 0;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Project Schedule
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Add key milestones for your project. You can add as many as needed to track important dates and deliverables.
      </Typography>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Add New Milestone
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Milestone Title"
                name="title"
                value={milestone.title}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                required
                error={!!validationErrors.title}
                helperText={validationErrors.title}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={milestone.dueDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true, 
                      margin: 'normal',
                      variant: 'outlined'
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={milestone.description}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                onClick={handleAddMilestone}
                sx={{ mt: 1 }}
              >
                Add Milestone
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!isStepValid() && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Add at least one milestone to continue to the next step
        </Alert>
      )}

      {schedule.milestones.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Milestone</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Due Date</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
                <TableCell width={80}><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.milestones
                .sort((a, b) => {
                  if (!a.dueDate) return 1;
                  if (!b.dueDate) return -1;
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      {item.dueDate ? format(new Date(item.dueDate), 'MMM dd, yyyy') : 'No date'}
                    </TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteMilestone(item.id)}
                        aria-label="delete milestone"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">No milestones added yet</Alert>
      )}
    </Box>
  );
};

export default ScheduleStep; 