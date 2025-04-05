import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  Tooltip,
  Button,
  alpha,
  Theme,
} from '@mui/material';
import {
  Person as PersonIcon,
} from '@mui/icons-material';
import { Project } from '../../../types';

interface TeamCardProps {
  project: Project;
  theme: Theme;
  onManageTeam?: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  project,
  theme,
  onManageTeam,
}) => {
  return (
    <Card elevation={0} sx={{ 
      borderRadius: 2, 
      height: '100%',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Team
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" component="div" fontWeight="bold">
            {project.team?.length || 0} Members
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={-1} sx={{ mb: 2 }}>
          {(project.team || []).slice(0, 5).map((member, index) => {
            // Handle team member display - project.team can be array of strings or objects
            const memberName = typeof member === 'string' ? member : (member as any)?.name || '';
            
            return (
              <Tooltip key={index} title={memberName || `Team Member ${index + 1}`}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.primary.main,
                    border: `2px solid ${theme.palette.background.paper}`
                  }}
                >
                  {(memberName || 'U').charAt(0)}
                </Avatar>
              </Tooltip>
            );
          })}
          
          {(project.team?.length || 0) > 5 && (
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: theme.palette.grey[300],
              border: `2px solid ${theme.palette.background.paper}`
            }}>
              <Typography variant="caption">+{project.team!.length - 5}</Typography>
            </Avatar>
          )}
        </Stack>
        
        <Button
          variant="outlined" 
          size="small" 
          startIcon={<PersonIcon />} 
          sx={{ borderRadius: 1.5 }}
          onClick={onManageTeam}
        >
          Manage Team
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamCard; 