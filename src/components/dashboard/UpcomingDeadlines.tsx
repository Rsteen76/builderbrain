import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Box,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Alarm as AlarmIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface UpcomingDeadlinesProps {
  nextMilestone: {
    name: string;
    date: string;
    projectId: string;
  };
  tasksDue: number;
}

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ nextMilestone, tasksDue }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <CalendarTodayIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Upcoming Deadlines
        </Typography>
      </Stack>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s',
              '&:hover': {
                transform: nextMilestone.projectId ? 'translateY(-4px)' : 'none',
                boxShadow: nextMilestone.projectId ? '0 6px 12px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
              },
              cursor: nextMilestone.projectId ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (nextMilestone.projectId) {
                navigate(`/projects/${nextMilestone.projectId}`);
              }
            }}
          >
            <CardContent>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1.5}
                sx={{ mb: 1.5 }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    width: 36,
                    height: 36,
                  }}
                >
                  <FlagIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={600}>
                  Next Milestone
                </Typography>
              </Stack>
              
              <Typography 
                variant="body1" 
                fontWeight={500}
                sx={{ mb: 1 }}
              >
                {nextMilestone.name}
              </Typography>
              
              {nextMilestone.date && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <ScheduleIcon 
                    fontSize="small" 
                    sx={{ color: theme.palette.text.secondary }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {nextMilestone.date}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
              },
            }}
            onClick={() => navigate('/tasks')}
          >
            <CardContent>
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={1.5}
                sx={{ mb: 1.5 }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    width: 36,
                    height: 36,
                  }}
                >
                  <AlarmIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={600}>
                  Tasks Due Soon
                </Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <AssignmentIcon 
                  fontSize="small" 
                  sx={{ color: theme.palette.text.secondary }}
                />
                <Typography variant="body1" fontWeight={500}>
                  {tasksDue} tasks due in the next 7 days
                </Typography>
              </Stack>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center' 
                }}
              >
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontWeight: 500, p: 0 }}
                >
                  View all tasks
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default UpcomingDeadlines; 