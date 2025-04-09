import React from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Project } from '../../types'; // Assuming Project type

interface ProjectDetailHeaderProps {
  project: Project;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>) => void; // Callback to open parent's menu
  // Potentially add other props like status display, breadcrumbs etc.
}

const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ 
  project, 
  onOpenMenu 
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {project.name}
        {/* TODO: Maybe add status indicator here */}
      </Typography>
      <Box>
        {/* Any other header actions like Edit button could go here */}
        <IconButton onClick={onOpenMenu} aria-label="Project Actions">
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ProjectDetailHeader; 