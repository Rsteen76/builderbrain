import React from 'react';
import { Box, Typography } from '@mui/material';
import { Project } from '../../types'; // Assuming Project type
import { ProjectActionsMenu } from './ProjectActionsMenu'; // Import the new menu component

interface ProjectDetailHeaderProps {
  project: Project;
  onEdit: (projectId: string) => void; // Added prop for edit action
  onArchive: (projectId: string) => void; // Added prop for archive action
}

const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ 
  project, 
  onEdit, 
  onArchive
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {project.name}
        {/* TODO: Maybe add status indicator here */}
      </Typography>
      <Box>
        <ProjectActionsMenu 
          projectId={project.id} 
          onEdit={onEdit} 
          onArchive={onArchive} 
        />
      </Box>
    </Box>
  );
};

export default ProjectDetailHeader; 