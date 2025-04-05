import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  alpha,
  Theme,
} from '@mui/material';
import { Project } from '../../../types';

interface StatusCardProps {
  project: Project;
  projectProgress: number;
  theme: Theme;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  project,
  projectProgress,
  theme,
  getStatusIcon,
  getStatusColor,
}) => {
  return (
    <Card elevation={0} sx={{ 
      borderRadius: 2, 
      height: '100%',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip
            label={project.status.replace('_', ' ').toUpperCase()}
            icon={getStatusIcon(project.status) as React.ReactElement}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: alpha(getStatusColor(project.status), 0.1),
              color: getStatusColor(project.status),
              borderRadius: 1,
            }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
          Overall Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={projectProgress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }} 
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" fontWeight="bold" color="text.primary">
              {projectProgress}%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatusCard; 