import React from 'react';
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Business as BusinessIcon } from '@mui/icons-material';
import { BID_SCOPE_TEMPLATES } from '../../../data/bidFormConstants';
import { Bid, Project, ProjectPhase } from '../../../types';
import { BidFormData } from '../../../types/form.types';
import { getBidTitleOptions } from './bidFormHelpers';

interface BidDetailsSectionProps {
  bidForm: BidFormData;
  bidFormErrors: Record<string, string>;
  contextProjectId?: string;
  projects: Project[];
  isLoadingProjects: boolean;
  currentProjectPhases: ProjectPhase[];
  handleChangeBidForm: (field: string, value: any) => void;
}

const BidDetailsSection: React.FC<BidDetailsSectionProps> = ({
  bidForm,
  bidFormErrors,
  contextProjectId,
  projects,
  isLoadingProjects,
  currentProjectPhases,
  handleChangeBidForm,
}) => (
  <Box className="form-section">
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
      Bid Details
    </Typography>

    <Grid container spacing={2}>
      {!contextProjectId && (
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" size="small" error={!!bidFormErrors.projectId}>
            <InputLabel id="bid-project-select-label">Project</InputLabel>
            <Select
              labelId="bid-project-select-label"
              value={bidForm.projectId || ''}
              label="Project"
              required
              onChange={(e) => {
                const selectedProjectId = e.target.value;
                const project = projects.find(p => p.id === selectedProjectId);
                handleChangeBidForm('projectId', selectedProjectId);
                if (project) {
                  handleChangeBidForm('projectName', project.name);
                }
              }}
              startAdornment={
                <InputAdornment position="start">
                  <BusinessIcon fontSize="small" color="primary" />
                </InputAdornment>
              }
              endAdornment={
                isLoadingProjects ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : null
              }
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name || 'Unnamed Project'}
                </MenuItem>
              ))}
            </Select>
            {bidFormErrors.projectId && (
              <FormHelperText>{bidFormErrors.projectId}</FormHelperText>
            )}
          </FormControl>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="bid-phase-select-label">Project Phase</InputLabel>
          <Select
            labelId="bid-phase-select-label"
            value={bidForm.phaseId || ''}
            label="Project Phase"
            onChange={(e) => {
              const selectedPhaseId = e.target.value;
              const phase = currentProjectPhases.find(p => p.id === selectedPhaseId);
              handleChangeBidForm('phaseId', selectedPhaseId);
              handleChangeBidForm('phaseName', phase?.name || '');
            }}
            sx={{ borderRadius: 1 }}
            disabled={!bidForm.projectId || currentProjectPhases.length === 0}
          >
            {currentProjectPhases.length === 0 && (
              <MenuItem value="" disabled>
                {bidForm.projectId ? 'No phases for selected project' : 'Select a project first'}
              </MenuItem>
            )}
            {currentProjectPhases.map((phase) => (
              <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={bidForm.status}
            onChange={(e) => handleChangeBidForm('status', e.target.value as Bid['status'])}
            label="Status"
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="draft">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'grey.400', mr: 1 }} /> Draft
              </Box>
            </MenuItem>
            <MenuItem value="submitted">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }} /> Submitted
              </Box>
            </MenuItem>
            <MenuItem value="accepted">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} /> Accepted
              </Box>
            </MenuItem>
            <MenuItem value="rejected">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} /> Rejected
              </Box>
            </MenuItem>
            <MenuItem value="expired">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.dark', mr: 1 }} /> Expired
              </Box>
            </MenuItem>
            <MenuItem value="withdrawn">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.secondary', mr: 1 }} /> Withdrawn
              </Box>
            </MenuItem>
            <MenuItem value="revision_requested">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} /> Revision Requested
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={8}>
        <Autocomplete
          fullWidth
          freeSolo
          id="bid-title"
          options={getBidTitleOptions(bidForm.phaseId, currentProjectPhases)}
          value={bidForm.title}
          onChange={(event, newValue) => {
            const trimmedValue = (newValue || '').trim().slice(0, 100);
            handleChangeBidForm('title', trimmedValue);

            if (newValue && BID_SCOPE_TEMPLATES[newValue]) {
              handleChangeBidForm('scope', BID_SCOPE_TEMPLATES[newValue]);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Bid Title"
              placeholder="Select or type a custom title"
              required
              error={!!bidFormErrors.title}
              helperText={bidFormErrors.title || `${bidForm.title.length}/100 characters`}
              size="small"
              inputProps={{
                ...params.inputProps,
                maxLength: 100,
              }}
            />
          )}
          renderOption={(props, option) => (
            <Tooltip title="Click to select this title" placement="right">
              <li {...props}>{option}</li>
            </Tooltip>
          )}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <DatePicker
          label="Submission Deadline"
          value={bidForm.submissionDeadline || null}
          onChange={(date) => handleChangeBidForm('submissionDeadline', date)}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: 'outlined',
              size: 'small',
              InputProps: { sx: { borderRadius: 1 } }
            }
          }}
        />
      </Grid>
    </Grid>
  </Box>
);

export default BidDetailsSection;
