import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';

interface ProjectDocumentsTabProps {
  // Add any necessary props here if functionality grows
}

const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = () => {
  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Project Documents</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            size="small"
            sx={{ borderRadius: 1.5 }}
            // onClick={handleUploadDocument} // Add handler later
          >
            Upload Document
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          This section will allow you to manage project documents and files.
        </Alert>
        {/* Add document list/grid here later */}
      </Paper>
    </Box>
  );
};

export default ProjectDocumentsTab; 