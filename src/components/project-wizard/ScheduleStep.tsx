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
  Grid,
  Stack,
  Chip
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { useProjectWizard, ScheduleMilestone } from '../../contexts/ProjectWizardContext';

const ScheduleStep: React.FC = () => {
  const { state, addMilestone, removeMilestone, validateStep, addPhase, updatePhase, removePhase } = useProjectWizard();
  const { schedule, phases, selectedTemplateId } = state;

  // Validate on mount and when milestones change
  useEffect(() => {
    validateStep('schedule');
  }, [schedule.milestones, phases, validateStep]);

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
    return phases.length > 0 || schedule.milestones.length > 0;
  };

  const formatInputDate = (date: Date): string => format(new Date(date), 'yyyy-MM-dd');

  const handlePhaseDateChange = (
    phaseId: string,
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    const nextDate = value ? new Date(`${value}T00:00:00`) : new Date();
    updatePhase(phaseId, { [field]: nextDate });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Project Phases & Milestones
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Start with suggested phases, then adjust names, dates, and budgets to match how you will actually build the job.
      </Typography>

      {selectedTemplateId && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Suggested builder phases were added from the selected project type. Edit them here before creating the project.
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Suggested Phases
              </Typography>
              <Typography variant="body2" color="text.secondary">
                These become the project phases used by budget, tasks, bids, expenses, and progress tracking.
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addPhase()}>
              Add Phase
            </Button>
          </Stack>

          {phases.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2">Phase</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Start</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Finish</Typography></TableCell>
                    <TableCell align="right"><Typography variant="subtitle2">Budget</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle2">Tasks</Typography></TableCell>
                    <TableCell width={80}><Typography variant="subtitle2">Actions</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phases.map((phase) => (
                    <TableRow key={phase.id}>
                      <TableCell sx={{ minWidth: 260 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Phase name"
                          value={phase.name}
                          onChange={(event) => updatePhase(phase.id, { name: event.target.value })}
                          sx={{ mb: 1 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Description"
                          value={phase.description || ''}
                          onChange={(event) => updatePhase(phase.id, { description: event.target.value })}
                          multiline
                          minRows={2}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          value={formatInputDate(phase.startDate)}
                          onChange={(event) => handlePhaseDateChange(phase.id, 'startDate', event.target.value)}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          value={formatInputDate(phase.endDate)}
                          onChange={(event) => handlePhaseDateChange(phase.id, 'endDate', event.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 140 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={phase.budget || ''}
                          onChange={(event) =>
                            updatePhase(phase.id, {
                              budget: Number(event.target.value),
                              budgetPercentage: state.projectInfo.totalBudget
                                ? (Number(event.target.value) / state.projectInfo.totalBudget) * 100
                                : phase.budgetPercentage,
                            })
                          }
                          inputProps={{ min: 0 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${phase.tasks.length} starter tasks`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removePhase(phase.id)}
                          aria-label={`delete phase ${phase.name}`}
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
            <Alert severity="info">No phases added yet. Add a phase to continue.</Alert>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Add Key Milestone
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
          Add at least one phase or milestone to continue to the next step
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
              {[...schedule.milestones]
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
