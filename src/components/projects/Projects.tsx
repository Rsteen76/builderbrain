import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Badge,
  Divider,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  title: string;
  client: string;
  location: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed' | 'planning';
  dueDate: string;
  budget: string;
  team: number;
  priority: 'high' | 'medium' | 'low';
  tasks: {
    total: number;
    completed: number;
    overdue: number;
  };
  documents: number;
  photos: number;
  timeline: {
    currentPhase: string;
    nextMilestone: string;
    daysUntilMilestone: number;
  };
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  client,
  location,
  progress,
  status,
  dueDate,
  budget,
  team,
  priority,
  tasks,
  documents,
  photos,
  timeline,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const statusColors = {
    'on-track': theme.palette.success.main,
    'at-risk': theme.palette.warning.main,
    completed: theme.palette.info.main,
    planning: theme.palette.primary.main,
  };

  const priorityColors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.success.main,
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={status.replace('-', ' ')}
            size="small"
            sx={{
              backgroundColor: alpha(statusColors[status], 0.1),
              color: statusColors[status],
            }}
          />
          <Chip
            label={priority}
            size="small"
            sx={{
              backgroundColor: alpha(priorityColors[priority], 0.1),
              color: priorityColors[priority],
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {dueDate}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {budget}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {team} members
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {location}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div">
                {tasks.completed}/{tasks.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tasks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div">
                {documents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Documents
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="div">
                {photos}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Photos
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, p: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Phase: {timeline.currentPhase}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Next Milestone: {timeline.nextMilestone} ({timeline.daysUntilMilestone} days)
          </Typography>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/projects/${title}`)}>
          <TimelineIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <AssessmentIcon sx={{ mr: 1 }} /> Generate Report
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CloudUploadIcon sx={{ mr: 1 }} /> Upload Documents
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PhotoCameraIcon sx={{ mr: 1 }} /> Add Photos
        </MenuItem>
      </Menu>
    </Card>
  );
};

const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [openNewProject, setOpenNewProject] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const projects = [
    {
      title: 'Office Building Renovation',
      client: 'TechCorp Inc.',
      location: 'Manhattan, NY',
      progress: 75,
      status: 'on-track' as const,
      dueDate: 'Dec 15, 2024',
      budget: '$1.2M',
      team: 12,
      priority: 'high' as const,
      tasks: {
        total: 48,
        completed: 36,
        overdue: 2,
      },
      documents: 24,
      photos: 156,
      timeline: {
        currentPhase: 'Interior Finishing',
        nextMilestone: 'HVAC Installation',
        daysUntilMilestone: 7,
      },
    },
    {
      title: 'Residential Complex',
      client: 'Urban Living Group',
      location: 'Brooklyn, NY',
      progress: 45,
      status: 'at-risk' as const,
      dueDate: 'Mar 30, 2025',
      budget: '$2.8M',
      team: 18,
      priority: 'high' as const,
      tasks: {
        total: 72,
        completed: 32,
        overdue: 5,
      },
      documents: 31,
      photos: 243,
      timeline: {
        currentPhase: 'Foundation Work',
        nextMilestone: 'Structural Steel',
        daysUntilMilestone: 14,
      },
    },
    {
      title: 'Shopping Mall Extension',
      client: 'Retail Properties LLC',
      location: 'Queens, NY',
      progress: 90,
      status: 'completed' as const,
      dueDate: 'Nov 30, 2024',
      budget: '$1.5M',
      team: 15,
      priority: 'medium' as const,
      tasks: {
        total: 64,
        completed: 64,
        overdue: 0,
      },
      documents: 42,
      photos: 312,
      timeline: {
        currentPhase: 'Final Inspection',
        nextMilestone: 'Handover',
        daysUntilMilestone: 3,
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Projects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track your construction projects
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewProject(true)}
            >
              New Project
            </Button>
          </Box>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="All Projects" />
          <Tab label="Active" />
          <Tab label="Planning" />
          <Tab label="Completed" />
          <Tab label="On Hold" />
        </Tabs>

        <Grid container spacing={3}>
          {projects.map((project, index) => (
            <Grid item xs={12} md={4} key={index}>
              <ProjectCard {...project} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>Status: All</MenuItem>
        <MenuItem onClick={handleFilterClose}>Status: Active</MenuItem>
        <MenuItem onClick={handleFilterClose}>Status: Completed</MenuItem>
        <MenuItem onClick={handleFilterClose}>Status: On Hold</MenuItem>
        <Divider />
        <MenuItem onClick={handleFilterClose}>Priority: High</MenuItem>
        <MenuItem onClick={handleFilterClose}>Priority: Medium</MenuItem>
        <MenuItem onClick={handleFilterClose}>Priority: Low</MenuItem>
        <Divider />
        <MenuItem onClick={handleFilterClose}>Budget: High to Low</MenuItem>
        <MenuItem onClick={handleFilterClose}>Budget: Low to High</MenuItem>
        <MenuItem onClick={handleFilterClose}>Due Date: Soonest</MenuItem>
        <MenuItem onClick={handleFilterClose}>Due Date: Latest</MenuItem>
      </Menu>

      <Dialog
        open={openNewProject}
        onClose={() => setOpenNewProject(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Stepper activeStep={0} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Basic Information</StepLabel>
            </Step>
            <Step>
              <StepLabel>Budget & Timeline</StepLabel>
            </Step>
            <Step>
              <StepLabel>Team & Resources</StepLabel>
            </Step>
          </Stepper>
          {/* Add form fields here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewProject(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenNewProject(false)}>
            Create Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects; 