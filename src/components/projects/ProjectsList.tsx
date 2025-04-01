import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  alpha,
  useMediaQuery,
  Stack,
  Avatar,
  Skeleton,
  Divider,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  startDate: Date;
  endDate: Date;
  budget: number;
}

// Mock data - replace with actual API calls later
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Office Renovation',
    description: 'Complete renovation of main office space',
    status: 'in_progress',
    progress: 65,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    budget: 150000,
  },
  {
    id: '2',
    name: 'Residential Complex',
    description: 'New residential complex with 50 units',
    status: 'planning',
    progress: 25,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-03-01'),
    budget: 500000,
  },
];

const ProjectsList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    event.stopPropagation();
    setSelectedProject(projectId);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Project actions
  const handleCreateProject = () => {
    navigate('/projects/new');
    handleMenuClose();
  };

  const handleEditProject = (projectId: string) => {
    navigate(`/projects/${projectId}/edit`);
    handleMenuClose();
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(project => project.id !== projectId));
    handleMenuClose();
  };

  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // Status chip color mapping
  const getStatusColor = (status: Project['status']) => {
    const colors = {
      planning: theme.palette.info.main,
      in_progress: theme.palette.warning.main,
      completed: theme.palette.success.main,
      on_hold: theme.palette.error.main,
    };
    return colors[status];
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ 
      py: { xs: 1.5, sm: 2.5 }, 
      px: { xs: 1, sm: 2, md: 3 },
      maxWidth: '100%',
      margin: '0 auto',
      overflowX: 'hidden'
    }}>
      {/* Page Header */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: { xs: 2, sm: 2.5 },
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          width: '100%'
        }}
      >
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 0 },
          width: '100%'
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight={600}
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '1.75rem' }
            }}
          >
            Projects
          </Typography>

          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            gap: { xs: 1, sm: 1.5 }
          }}>
            <TextField 
              placeholder="Search projects..."
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                width: { xs: '100%', sm: 220 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.common.black, 0.02),
                }
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              startIcon={!isMobile && <AddIcon />}
              onClick={handleCreateProject}
              sx={{ 
                height: 40, 
                minWidth: { xs: '100%', sm: 'auto' },
                px: { xs: 1.5, sm: 2 },
                borderRadius: 1.5
              }}
            >
              {isMobile ? <AddIcon /> : "New Project"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ width: '100%', mt: 3 }}>
          <Grid container spacing={3}>
            {[...Array(3)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton 
                  variant="rectangular" 
                  height={280} 
                  sx={{ borderRadius: 2 }} 
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            textAlign: 'center', 
            py: 6, 
            px: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Typography variant="h6" fontWeight={500} gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm ? 'Try a different search term' : 'Get started by creating your first project'}
          </Typography>
          
          {!searchTerm && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateProject}
              sx={{ mt: 2 }}
            >
              Create Project
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} lg={4} key={project.id} sx={{ width: '100%' }}>
              <Card 
                sx={{ 
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 8px 16px rgba(0,0,0,0.12)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleViewProject(project.id)}
              >
                {/* Status indicator - top bar */}
                <Box 
                  sx={{ 
                    height: 4, 
                    width: '100%', 
                    backgroundColor: getStatusColor(project.status) 
                  }}
                />
                
                <CardContent sx={{ 
                  p: { xs: 1.5, sm: 2.5 }, 
                  flexGrow: 1, 
                  display: 'flex',
                  flexDirection: 'column',
                  '&:last-child': { pb: { xs: 1.5, sm: 2.5 } }
                }}>
                  {/* Header: Title and menu */}
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      fontWeight={600}
                      sx={{ 
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {project.name}
                    </Typography>
                    
                    <IconButton
                      size="small" 
                      sx={{ ml: 1, flexShrink: 0 }}
                      onClick={(e) => handleMenuOpen(e, project.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {/* Status chip */}
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={project.status.replace('_', ' ').toUpperCase()} 
                      size="small"
                      sx={{ 
                        fontWeight: 500,
                        backgroundColor: alpha(getStatusColor(project.status), 0.12),
                        color: getStatusColor(project.status),
                        borderRadius: 1
                      }}
                    />
                  </Box>
                  
                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{
                      mb: 2.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {project.description}
                  </Typography>
                  
                  {/* Progress Section */}
                  <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          Progress
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {project.progress}%
                        </Typography>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={project.progress} 
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Project details */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar 
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main
                            }}
                          >
                            <CalendarIcon sx={{ fontSize: '0.85rem' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Due
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {new Date(project.endDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar 
                            sx={{ 
                              width: 28, 
                              height: 28, 
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: theme.palette.success.main
                            }}
                          >
                            <BudgetIcon sx={{ fontSize: '0.85rem' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Budget
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(project.budget)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        id="project-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: { 
            mt: 0.5, 
            minWidth: 150,
            borderRadius: 1,
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)'
          }
        }}
      >
        <MenuItem onClick={() => {
          handleViewProject(selectedProject || '');
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          handleEditProject(selectedProject || '');
          handleMenuClose();
        }}>
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDeleteProject(selectedProject || '');
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectsList;