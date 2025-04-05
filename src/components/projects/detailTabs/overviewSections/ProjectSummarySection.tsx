import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  Box,
  alpha,
  Theme,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Project } from '../../../../types';

interface ProjectSummarySectionProps {
  project: Project;
  theme: Theme;
}

const ProjectSummarySection: React.FC<ProjectSummarySectionProps> = ({
  project,
  theme
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        height: '100%'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <BusinessIcon sx={{ mr: 1 }} /> Project Summary
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Project Type
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {project.projectType || 'Not specified'}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Client
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {project.clientId ? 'Client ID: ' + project.clientId : 'Not assigned'}
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Location
          </Typography>
          <Typography variant="body1" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationIcon sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }} />
            {typeof project.location === 'string' 
              ? project.location 
              : project.location
                ? `${project.location?.address || ''}, ${project.location?.city || ''}, ${project.location?.state || ''}`
                : 'No location specified'}
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1">
            {project.description || 'No description provided'}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProjectSummarySection; 