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

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: 'on-track' | 'at-risk' | 'completed';
    progress: number;
    dueDate: string;
    budget: string;
    team: number;
    location?: string;
    image?: string;
    completedTasks?: number;
    totalTasks?: number;
  };
  index: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  // Helper functions for visual styling
  const getProgressColor = () => {
    if (project.progress > 75) return theme.palette.success.main;
    if (project.progress > 40) return theme.palette.info.main;
    return theme.palette.warning.main;
  };
  
  const getStatusColor = () => {
    switch (project.status) {
      case 'on-track': return theme.palette.success.main;
      case 'at-risk': return theme.palette.warning.main;
      case 'completed': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };
  
  const statusColor = getStatusColor();
  const progressColor = getProgressColor();
  
  // Generate a themed gradient background if no image is provided
  const generateBackground = () => {
    const colors = [
      [theme.palette.primary.main, theme.palette.secondary.main],
      [theme.palette.success.main, theme.palette.info.main],
      [theme.palette.warning.main, theme.palette.error.main],
      [theme.palette.secondary.main, theme.palette.info.main],
      [theme.palette.info.main, theme.palette.success.main],
    ];
    const colorSet = colors[index % colors.length];
    return `linear-gradient(135deg, ${alpha(colorSet[0], 0.8)} 0%, ${alpha(colorSet[1], 0.8)} 100%)`;
  };
  
  return (
    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
      <Card
        elevation={isHovered ? 4 : 1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'all 0.3s ease',
          borderRadius: 3,
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-4px)' : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Project header/banner */}
        <Box
          sx={{
            height: 100,
            position: 'relative',
            background: project.image 
              ? `url(${project.image}) center/cover no-repeat`
              : generateBackground(),
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: project.image 
                ? 'rgba(0, 0, 0, 0.3)' 
                : 'transparent',
              zIndex: 1,
            }}
          />
          
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              display: 'flex',
              gap: 1,
            }}
          >
            <Chip
              label={project.status.replace('-', ' ')}
              size="small"
              icon={project.status === 'on-track' 
                ? <CheckCircleIcon /> 
                : project.status === 'at-risk' 
                  ? <WarningIcon />
                  : <StarIcon />}
              sx={{
                backgroundColor: alpha(statusColor, 0.8),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.6875rem',
                textTransform: 'capitalize',
                backdropFilter: 'blur(4px)',
                '& .MuiChip-icon': {
                  color: 'inherit',
                  fontSize: '0.75rem',
                },
              }}
            />
          </Box>
          
          <Typography
            variant="h6"
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              color: '#fff',
              fontWeight: 700,
              zIndex: 2,
              textShadow: '0px 1px 2px rgba(0,0,0,0.3)',
              width: '80%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </Typography>
        </Box>
        
        <CardContent sx={{ flexGrow: 1, pt: 2 }}>
          {project.location && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
              }}
            >
              <PlaceIcon sx={{ fontSize: '1rem' }} />
              {project.location}
            </Typography>
          )}
          
          {/* Progress section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 0.5 
            }}>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ fontSize: '0.75rem' }}
              >
                Progress
              </Typography>
              
              <Typography 
                variant="body2"
                fontWeight={600}
                sx={{ 
                  fontSize: '0.75rem',
                  color: progressColor,
                }}
              >
                {project.completedTasks || 0}/{project.totalTasks || 0} tasks · {project.progress}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={project.progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(progressColor, 0.12),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: progressColor,
                },
              }}
            />
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'flex-start',
              alignItems: 'center',
              mt: 2 
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
            }}>
              <AccessTimeIcon 
                sx={{ 
                  fontSize: '0.875rem', 
                  color: theme.palette.text.secondary 
                }} 
              />
              <Typography 
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                sx={{ fontSize: '0.75rem' }}
              >
                {project.dueDate}
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5
            }}>
              <MoneyIcon 
                sx={{ 
                  fontSize: '0.875rem', 
                  color: theme.palette.success.main 
                }} 
              />
              <Typography 
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                sx={{ fontSize: '0.75rem' }}
              >
                {project.budget}
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5
            }}>
              <GroupIcon 
                sx={{ 
                  fontSize: '0.875rem', 
                  color: theme.palette.warning.main 
                }} 
              />
              <Typography 
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                sx={{ fontSize: '0.75rem' }}
              >
                {project.team} members
              </Typography>
            </Box>
          </Box>
        </CardContent>
        
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Box 
            sx={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between' 
            }}
          >
            <Button
              variant="text"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => navigate(`/projects/${project.id}`)}
              sx={{ 
                fontSize: '0.75rem', 
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              View Details
            </Button>
            
            <Button
              variant="text"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/projects/${project.id}/edit`)}
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.secondary.main,
              }}
            >
              Edit
            </Button>
          </Box>
        </CardActions>
      </Card>
    </Zoom>
  );
};

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Helper function to format project for display
  const formatProjectForDisplay = (project: DashboardProject, index: number) => {
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
    let completedTasks = 0;
    const totalTasks = project.tasks?.length || 0;
    
    if (totalTasks > 0) {
      completedTasks = project.tasks.filter(t => t.status === 'completed').length;
      progress = Math.round((completedTasks / totalTasks) * 100);
    }
    
    // Format budget value
    const budget = typeof project.budget === 'object' 
      ? formatCurrency(project.budget.total || 0)
      : formatCurrency(project.budget || 0);
    
    // Format location
    const location = typeof project.location === 'string'
      ? project.location
      : project.location
        ? `${project.location.city || ''}, ${project.location.state || ''}`.trim()
        : undefined;
    
    // Sample project images (in a real app, these would come from the project data)
    const sampleImages = [
      'https://source.unsplash.com/featured/?construction,building',
      'https://source.unsplash.com/featured/?architecture',
      'https://source.unsplash.com/featured/?house',
      'https://source.unsplash.com/featured/?realestate',
      'https://source.unsplash.com/featured/?skyscraper',
    ];
    
    return {
      id: project.id,
      name: project.name,
      status,
      progress,
      dueDate: project.endDate ? formatDate(project.endDate) : 'No due date',
      budget,
      team: project.team?.length || 0,
      location,
      image: sampleImages[index % sampleImages.length],
      completedTasks,
      totalTasks,
    };
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
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2.5,
        px: 0.5,
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <AssessmentIcon 
              color="primary" 
              sx={{ fontSize: 20 }} 
            />
          </Box>
          
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: '1.125rem' }}
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
            onClick={() => navigate('/projects/new')}
          >
            Create New Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {recentProjects.map((project, index) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard 
                project={formatProjectForDisplay(project, index)} 
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
            onClick={() => navigate('/projects/new')}
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
  );
};

export default RecentProjects;