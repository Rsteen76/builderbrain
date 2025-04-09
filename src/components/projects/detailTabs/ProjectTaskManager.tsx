import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { useAuth } from '../../../hooks/useAuth';

// Define Props - Empty for now as it uses context
interface ProjectTaskManagerProps {}

const ProjectTaskManager: React.FC<ProjectTaskManagerProps> = () => {
  const { projectId, loading: contextLoading, error: contextError } = useProjectDetail();
  const { user, loading: authLoading } = useAuth();

  // Handle loading states
  if (contextLoading || authLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />;
  }

  // Handle error states
  if (contextError) {
    return <Alert severity="error" sx={{ mt: 2 }}>Error loading project context: {contextError}</Alert>;
  }
  if (!user) {
     return <Alert severity="error" sx={{ mt: 2 }}>User not authenticated.</Alert>;
  }
   if (!projectId) {
    return <Alert severity="warning" sx={{ mt: 2 }}>Project context not available.</Alert>;
  }

  // TODO: Fetch tasks based on projectId and userId
  // TODO: Implement Task List, Add Task Form, Task Filtering/Sorting

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Project Task Manager
      </Typography>
      <Typography variant="body1" color="text.secondary">
        (Task management functionality coming soon...)
      </Typography>
      {/* Placeholder for Task List */}
      {/* Placeholder for Add Task Button/Form */}
    </Box>
  );
};

export default ProjectTaskManager; 