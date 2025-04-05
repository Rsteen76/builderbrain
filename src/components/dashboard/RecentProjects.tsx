import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Grid,
  Button,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../projects/ProjectCard';

interface Project {
  id: string;
  name: string;
  status: string;
  endDate: string;
  budget: number | { total: number; spent: number; remaining: number };
  team: string[];
  location: string | { address: string; city: string; state: string };
  updatedAt: string;
  tasks: Array<{
    id: string;
    status: string;
  }>;
}

interface RecentProjectsProps {
  projects: Project[];
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Format project data for display
  const formatProjectForDisplay = (project: Project) => {
    // Determine project status
    let status: 'on-track' | 'at-risk' | 'completed' = 'on-track';
    
    if (project.status === 'completed') {
      status = 'completed';
    } else if (project.status === 'on_hold' || project.status === 'cancelled') {
      status = 'at-risk';
    } else {
      // Check if project is at risk based on end date
      if (project.endDate) {
        const endDate = new Date(project.endDate);
        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        
        if (endDate < today) {
          status = 'at-risk'; // Past due date
        } else if (endDate <= oneWeekFromNow) {
          status = 'at-risk'; // Due within a week
        }
      }
    }
    
    // Calculate progress as percentage of completed tasks
    let progress = 0;
    if (project.tasks && project.tasks.length > 0) {
      const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
      progress = Math.round((completedTasks / project.tasks.length) * 100);
    }
    
    return {
      title: project.name,
      progress,
      status,
      dueDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No due date',
      budget: typeof project.budget === 'object' 
        ? `$${project.budget.total.toLocaleString()}`
        : `$${project.budget.toLocaleString()}`,
      team: project.team?.length || 0,
      projectId: project.id,
      location: typeof project.location === 'string' 
        ? project.location 
        : project.location?.address || `${project.location?.city || ''}, ${project.location?.state || ''}` || 'No location'
    };
  };

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
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <HomeIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Projects
          </Typography>
        </Stack>
        <Button
          variant="text"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/projects')}
          sx={{ color: theme.palette.primary.main }}
        >
          View All
        </Button>
      </Stack>
      
      <Grid container spacing={2}>
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                py: { xs: 1.5, sm: 2 },
                px: { xs: 2, sm: 3 },
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              No projects found. Create a new project to get started.
            </Alert>
          </Grid>
        ) : (
          projects
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 6)
            .map((project) => {
              const displayProject = formatProjectForDisplay(project);
              return (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <ProjectCard
                    title={displayProject.title}
                    progress={displayProject.progress}
                    status={displayProject.status}
                    dueDate={displayProject.dueDate}
                    budget={displayProject.budget}
                    team={displayProject.team}
                    projectId={displayProject.projectId}
                    location={displayProject.location}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                </Grid>
              );
            })
        )}
      </Grid>
    </Paper>
  );
};

export default RecentProjects; 