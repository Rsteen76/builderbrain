import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  FormHelperText,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useProjectWizard } from '../../contexts/ProjectWizardContext';
import { getTemplateIdForProjectType } from '../../data/projectWizardTemplates';

// Project types
const PROJECT_TYPES = [
  'Residential Construction',
  'Commercial Construction',
  'Renovation',
  'Infrastructure',
  'Industrial',
  'Specialized Construction'
];

const PROJECT_SIZES = [
  'Small (Under $50,000)',
  'Medium ($50,000 - $250,000)',
  'Large ($250,000 - $1,000,000)',
  'Major (Over $1,000,000)'
];

const ProjectInfoStep: React.FC = () => {
  const { state, updateProjectInfo, validateStep, applyTemplate } = useProjectWizard();
  const { projectInfo } = state;

  // Validate on mount and when project info changes
  useEffect(() => {
    validateStep('project_info');
  }, [projectInfo, validateStep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateProjectInfo({
      [name]: name === 'totalBudget' ? Number(value) : value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    updateProjectInfo({ [name]: value });

    if (name === 'projectType') {
      const templateId = getTemplateIdForProjectType(value);
      if (templateId) {
        applyTemplate(templateId);
      }
    }
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      updateProjectInfo({
        [name]: date,
        ...(name === 'estimatedStartDate' ? { startDate: date } : {}),
      });
    }
  };

  const isStepValid = (): boolean => {
    return !!(
      projectInfo.name &&
      projectInfo.projectType &&
      projectInfo.location &&
      projectInfo.description
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" sx={{ mt: 1 }}>
        <Typography variant="h6" gutterBottom>
          Project Information
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Fill in the basic details about your construction project.
        </Typography>

        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Project Name"
                  name="name"
                  value={projectInfo.name || ''}
                  onChange={handleInputChange}
                  helperText="Enter a descriptive name for your project"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="project-type-label">Project Type</InputLabel>
                  <Select
                    labelId="project-type-label"
                    id="project-type"
                    name="projectType"
                    value={projectInfo.projectType || ''}
                    onChange={handleSelectChange}
                    label="Project Type"
                  >
                    {PROJECT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select the category that best describes your project</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="project-size-label">Project Size</InputLabel>
                  <Select
                    labelId="project-size-label"
                    id="project-size"
                    name="size"
                    value={projectInfo.size || ''}
                    onChange={handleSelectChange}
                    label="Project Size"
                  >
                    {PROJECT_SIZES.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select the approximate budget range</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Location"
                  name="location"
                  value={projectInfo.location || ''}
                  onChange={handleInputChange}
                  helperText="Enter the physical location where the project will be completed"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Project Description"
                  name="description"
                  value={projectInfo.description || ''}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  helperText="Provide a detailed description of your construction project"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Client Name (Optional)"
                  name="client"
                  value={projectInfo.client || ''}
                  onChange={handleInputChange}
                  helperText="If applicable, enter the name of the client or property owner"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={projectInfo.estimatedStartDate || projectInfo.startDate}
                    onChange={(date) => handleDateChange('estimatedStartDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Used to lay out suggested phases',
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Target Completion"
                    value={projectInfo.estimatedEndDate}
                    onChange={(date) => handleDateChange('estimatedEndDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Optional; defaults from template',
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Budget"
                  name="totalBudget"
                  type="number"
                  value={projectInfo.totalBudget || ''}
                  onChange={handleInputChange}
                  helperText="Used to prefill phase budgets"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {!isStepValid() && (
          <Alert severity="info">
            Please fill in all required fields to proceed to the next step
          </Alert>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default ProjectInfoStep;
