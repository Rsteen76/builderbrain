import React, { useState, Suspense } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Stack,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  useMediaQuery,
  Divider,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  ViewKanban as KanbanIcon,
  ViewTimeline as TimelineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Task } from '../../types';

// Lazy load components to avoid circular dependencies
const TasksList = React.lazy(() => import('./TasksList'));
const TaskFormModal = React.lazy(() => import('./TaskFormModal'));

type ViewMode = 'list' | 'kanban' | 'timeline';

const Tasks: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab options
  const tabs = [
    { label: 'All Tasks', count: 0 },
    { label: 'My Tasks', count: 0 },
    { label: 'High Priority', count: 0 },
    { label: 'Due Soon', count: 0 },
  ];

  // Handlers
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleOpenTaskForm = () => {
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
  };

  const handleTaskSubmitSuccess = (task: Task) => {
    // Handle successful task submission
    // This will be implemented when we add task state management
    console.log('Task submitted successfully:', task);
    handleCloseTaskForm();
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please sign in to view tasks.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 3,
          p: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack spacing={3}>
          {/* Title and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Tasks
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  {isRefreshing ? (
                    <CircularProgress size={24} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Filter Tasks">
                <IconButton 
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenTaskForm}
                sx={{ borderRadius: 1.5 }}
              >
                New Task
              </Button>
            </Stack>
          </Box>

          {/* View Mode Toggle */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="List View">
              <IconButton
                onClick={() => handleViewModeChange('list')}
                sx={{
                  color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                }}
              >
                <ListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kanban View">
              <IconButton
                onClick={() => handleViewModeChange('kanban')}
                sx={{
                  color: viewMode === 'kanban' ? 'primary.main' : 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                }}
              >
                <KanbanIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Timeline View">
              <IconButton
                onClick={() => handleViewModeChange('timeline')}
                sx={{
                  color: viewMode === 'timeline' ? 'primary.main' : 'text.secondary',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                }}
              >
                <TimelineIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.label}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Badge 
                      badgeContent={tab.count} 
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }
                      }}
                    />
                  </Box>
                }
                value={index}
              />
            ))}
          </Tabs>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        }}
      >
        <Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>}>
          {viewMode === 'list' && <TasksList />}
          {viewMode === 'kanban' && (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              Kanban view coming soon...
            </Box>
          )}
          {viewMode === 'timeline' && (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              Timeline view coming soon...
            </Box>
          )}
        </Suspense>
      </Paper>

      {/* Task Form Modal */}
      <Suspense fallback={null}>
        <TaskFormModal
          open={isTaskFormOpen}
          onClose={handleCloseTaskForm}
          onSubmitSuccess={handleTaskSubmitSuccess}
          projectId="general" // For now, we'll use a general project ID for tasks not associated with a specific project
          userId={user.uid}
        />
      </Suspense>
    </Container>
  );
};

export default Tasks; 