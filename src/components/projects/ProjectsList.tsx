import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  LinearProgress,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
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
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  // Project actions
  const handleCreateProject = () => {
    navigate('/projects/new');
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
      planning: 'info',
      in_progress: 'warning',
      completed: 'success',
      on_hold: 'error',
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
        >
          New Project
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              startIcon={<FilterListIcon />}
              sx={{ ml: { xs: 0, md: 2 } }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {project.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, project.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <Chip
                  label={project.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(project.status) as any}
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {project.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {project.progress}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Budget: {formatCurrency(project.budget)}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleViewProject(project.id)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedProject && handleEditProject(selectedProject)}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedProject && handleDeleteProject(selectedProject)}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectsList; 