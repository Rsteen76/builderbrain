import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as BudgetIcon,
  Group as TeamIcon,
  Assignment as TaskIcon,
  Description as DocumentIcon,
  Receipt as ExpenseIcon,
  Flag as PriorityIcon,
} from '@mui/icons-material';

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
  team: string[];
  clientId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Mock data - replace with actual API calls later
const mockProject: Project = {
  id: '1',
  name: 'Office Renovation',
  description: 'Complete renovation of main office space including new flooring, lighting, and furniture',
  status: 'in_progress',
  progress: 65,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-06-30'),
  budget: 150000,
  team: ['John Doe', 'Jane Smith', 'Bob Johnson'],
  clientId: 'client123',
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project>(mockProject);
  const [tabValue, setTabValue] = useState(0);

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Project actions
  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  const handleDelete = () => {
    // Add confirmation dialog and delete logic
    navigate('/projects');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {project.name}
          </Typography>
          <Chip
            label={project.status.replace('_', ' ').toUpperCase()}
            color={getStatusColor(project.status) as any}
            sx={{ mr: 1 }}
          />
        </Box>
        <Box>
          <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={handleDelete} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Timeline</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Start: {formatDate(project.startDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                End: {formatDate(project.endDate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BudgetIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Budget</Typography>
              </Box>
              <Typography variant="h5" gutterBottom>
                {formatCurrency(project.budget)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={65}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TaskIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Tasks</Typography>
              </Box>
              <Typography variant="h5" gutterBottom>
                12/20
              </Typography>
              <LinearProgress
                variant="determinate"
                value={60}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TeamIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Team</Typography>
              </Box>
              <Typography variant="h5">
                {project.team.length} Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="Team" />
          <Tab label="Documents" />
          <Tab label="Expenses" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {project.description}
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                  Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
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
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Client"
                      secondary={project.clientId}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Start Date"
                      secondary={formatDate(project.startDate)}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="End Date"
                      secondary={formatDate(project.endDate)}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Budget"
                      secondary={formatCurrency(project.budget)}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="body1">
          Tasks content will be implemented in the Tasks component
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          Team content will be implemented in the Team component
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="body1">
          Documents content will be implemented in the Documents component
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Typography variant="body1">
          Expenses content will be implemented in the Expenses component
        </Typography>
      </TabPanel>
    </Box>
  );
};

export default ProjectDetails; 