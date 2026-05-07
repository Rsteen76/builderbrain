import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  alpha,
  Stack,
  Chip,
  Button,
  LinearProgress,
  Card,
  Avatar,
  Tooltip,
  AvatarGroup,
  IconButton,
  CardMedia,
  CardContent,
  CardActions,
  Zoom,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Star as StarIcon,
  Place as PlaceIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ProjectCard from '../projects/ProjectCard';
import { PROJECT_WIZARD_ROUTE } from '../../constants/projectRoutes';

// Define needed types
interface DashboardProject {
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
    title: string;
    status: string;
    dueDate: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
  }>;
}

interface RecentProjectsProps {
  projects: DashboardProject[];
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Helper function to format project for display
  const formatProjectForDisplay = (project: DashboardProject, index: number) => {
    // Transform the project data for the ProjectCard component
    return {
      id: project.id,
      name: project.name,
      status: getProjectStatusForCard(project.status),
      progress: calculateProgress(project),
      dueDate: project.endDate ? formatDate(project.endDate) : 'No due date',
      budget: typeof project.budget === 'number' 
        ? formatCurrency(project.budget) 
        : formatCurrency(project.budget?.total || 0),
      team: project.team?.length || 0,
      location: typeof project.location === 'string' 
        ? project.location 
        : `${project.location.address}, ${project.location.city}`,
      completedTasks: project.tasks?.filter(t => t.status === 'completed').length || 0,
      totalTasks: project.tasks?.length || 0,
    };
  };

  // Helper function to map project status to card status
  const getProjectStatusForCard = (status: string): 'on-track' | 'at-risk' | 'completed' => {
    const statusMap: Record<string, 'on-track' | 'at-risk' | 'completed'> = {
      'planning': 'on-track',
      'estimate': 'on-track',
      'draft': 'on-track',
      'active': 'on-track',
      'in_progress': 'on-track',
      'on_hold': 'at-risk',
      'cancelled': 'at-risk',
      'completed': 'completed',
    };
    return statusMap[status.toLowerCase()] || 'on-track';
  };

  // Calculate progress for a project
  const calculateProgress = (project: DashboardProject): number => {
    if (project.status === 'completed') return 100;
    
    const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = project.tasks?.length || 0;
    
    if (totalTasks === 0) {
      // If no tasks, use a deterministic random value based on the project name
      const hash = project.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return Math.max(10, Math.min(95, hash % 100));
    }
    
    return Math.round((completedTasks / totalTasks) * 100);
  };
  
  // Show up to 6 most recent projects
  const recentProjects = projects
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Sort by most recently updated
    })
    .slice(0, 6);

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            px: 0.5,
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                }}
              >
                <AssessmentIcon 
                  color="primary" 
                  sx={{ fontSize: 24 }} 
                />
              </Box>
              
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ fontSize: '1.25rem' }}
              >
                Recent Projects
              </Typography>
            </Stack>
            
            <Button
              variant="text"
              size="small"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              onClick={() => navigate('/projects')}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: 'transparent',
                  color: theme.palette.primary.main,
                }
              }}
            >
              View All Projects
            </Button>
          </Box>

          {recentProjects.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 6,
                px: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                borderRadius: 3,
                border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <AssessmentIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.4), mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No projects found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                You haven't created any projects yet. Get started by creating your first construction project.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                disableElevation
                onClick={() => navigate(PROJECT_WIZARD_ROUTE)}
              >
                Create New Project
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {recentProjects.map((project, index) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                  <ProjectCard 
                    project={{
                      id: project.id,
                      name: project.name,
                      status: getProjectStatusForCard(project.status),
                      dueDate: project.endDate,
                      budget: project.budget,
                      teamMembers: project.team,
                      location: project.location
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    index={index}
                  />
                </Grid>
              ))}
            </Grid>
          )}
          
          {recentProjects.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined"
                color="primary"
                onClick={() => navigate(PROJECT_WIZARD_ROUTE)}
                sx={{
                  borderRadius: 6,
                  px: 3,
                }}
              >
                Create New Project
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RecentProjects;
