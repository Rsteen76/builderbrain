import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../utils/logger';
import { Project } from '../../types';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../layout/PageLayout';
import ProjectResults from './list/ProjectResults';
import ProjectSearchTabs from './list/ProjectSearchTabs';
import ProjectSortMenu from './list/ProjectSortMenu';
import ProjectTemplateMenu, { type ProjectTemplateOption } from './list/ProjectTemplateMenu';
import {
  defaultProjectListFilterOptions,
  filterAndSortProjects,
  getProjectTabCounts,
  type ProjectListFilterOptions,
} from './list/projectListUtils';

// Main Projects Component with enhanced UI
const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterOptions, setFilterOptions] = useState<ProjectListFilterOptions>(defaultProjectListFilterOptions);
  
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectMenuAnchor, setNewProjectMenuAnchor] = useState<null | HTMLElement>(null);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  useEffect(() => {
    const fetchProjects = async (currentUserId: string) => {
      try {
        setLoading(true);
        setError(null);
        
        let statusFilter: Project['status'] | undefined = undefined;
        if (selectedTab === 1) statusFilter = 'active';
        if (selectedTab === 2) statusFilter = 'planning';
        if (selectedTab === 3) statusFilter = 'completed';
        if (selectedTab === 4) statusFilter = 'on_hold';
        
        const projectsData = await ProjectService.getProjects(currentUserId, { status: statusFilter });
        const validProjects = projectsData.filter(project => !!project.id);
        setProjects(validProjects);
      } catch (err) {
        logger.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.uid) {
      fetchProjects(user.uid);
    } else {
      logger.error('User is not authenticated');
      setError('Failed to load projects. Please try again.');
    }
  }, [selectedTab, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  };
  
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleSort = (sortBy: ProjectListFilterOptions['sortBy']) => {
    setFilterOptions(prev => ({
      ...prev,
      sortBy,
      sortDirection: prev.sortBy === sortBy && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
    handleFilterMenuClose();
  };

  const filteredProjects = useMemo(
    () => filterAndSortProjects(projects, searchQuery, filterOptions),
    [projects, searchQuery, filterOptions]
  );

  const tabCounts = useMemo(() => getProjectTabCounts(projects), [projects]);

  // Handle project actions menu
  const handleOpenContextMenu = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    event.preventDefault();
    setSelectedProjectId(projectId);
    setContextMenuAnchor(event.currentTarget);
  };

  const handleCloseContextMenu = () => {
    setContextMenuAnchor(null);
  };

  const handleProjectEdit = (projectId: string) => {
    navigate(`/projects/${projectId}/edit`);
    handleCloseContextMenu();
  };

  const handleProjectDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        // Fix the method call to match the expected arguments
        // Check your actual ProjectService API to see the correct usage
        await ProjectService.deleteProject(projectId);
        
        // Update the local state
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Show success message
        // ...
      } catch (err) {
        // Handle error
        logger.error('Error deleting project:', err);
        // Show error message
        // ...
      }
    }
    handleCloseContextMenu();
  };

  // New project dropdown handlers
  const handleNewProjectClick = (event: React.MouseEvent<HTMLElement>) => {
    setNewProjectMenuAnchor(event.currentTarget);
  };

  const handleNewProjectMenuClose = () => {
    setNewProjectMenuAnchor(null);
  };

  const handleTemplateSelect = (template: ProjectTemplateOption) => {
    if (template.params) {
      navigate(template.route, { state: template.params });
    } else {
      navigate(template.route);
    }
    handleNewProjectMenuClose();
  };

  return (
    <PageLayout
      title="Projects"
      subtitle={`Manage your construction projects (${projects.length})`}
      icon={BusinessIcon}
      actions={
        <Stack 
          direction={{ xs: 'row', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ 
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-end', sm: 'flex-end' },
            gap: { xs: 1, sm: 1.5 },
            width: '100%'
          }}
        >
          <Button
            variant="outlined"
            startIcon={!isMobile ? <FilterIcon fontSize="small" /> : undefined}
            size="small"
            onClick={handleFilterMenuOpen}
            sx={{ 
              borderRadius: 1.5, 
              minWidth: { xs: 40, sm: 'auto' },
              px: { xs: isMobile ? 1 : 1.5, sm: 2 },
              py: 0.75,
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: theme.palette.primary.main,
              fontWeight: 500,
              fontSize: '0.8rem',
              textTransform: 'none',
            }}
          >
            {isMobile ? <FilterIcon fontSize="small" /> : "Filter & Sort"}
          </Button>
          
          <IconButton 
            onClick={toggleViewMode}
            size="small"
            sx={{ 
              borderRadius: '50%', 
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              color: theme.palette.primary.main,
              width: 32,
              height: 32,
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            {viewMode === 'grid' ? <ViewListIcon fontSize="small" /> : <ViewModuleIcon fontSize="small" />}
          </IconButton>
          
          <Button
            variant="contained"
            startIcon={!isMobile ? <AddIcon /> : undefined}
            endIcon={!isMobile ? <ArrowForwardIcon fontSize="small" /> : undefined}
            onClick={handleNewProjectClick}
            sx={{ 
              borderRadius: 1.5,
              minWidth: { xs: 40, sm: 'auto' },
              px: { xs: isMobile ? 1 : 1.5, sm: 2 }, 
              py: 0.75,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          >
            {isMobile ? <AddIcon fontSize="small" /> : "New Project"}
          </Button>

          <ProjectTemplateMenu
            anchorEl={newProjectMenuAnchor}
            onClose={handleNewProjectMenuClose}
            onSelect={handleTemplateSelect}
          />
        </Stack>
      }
      sx={{ 
        px: { xs: 1, sm: 2, md: 3 }, 
        py: { xs: 1, sm: 2, md: 3 },
        maxWidth: '100%',
        overflowX: 'hidden'
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {/* Project Templates Section - removed */}

        <ProjectSearchTabs
          searchQuery={searchQuery}
          selectedTab={selectedTab}
          tabCounts={tabCounts}
          isMobile={isMobile}
          onSearchChange={setSearchQuery}
          onTabChange={handleTabChange}
        />

        {/* Project Grid/List - ensure responsive */}
        <Box sx={{ width: '100%' }}>
          <ProjectResults
            projects={filteredProjects}
            loading={loading}
            viewMode={viewMode}
            isMobile={isMobile}
            searchQuery={searchQuery}
            onProjectClick={(projectId) => navigate(`/projects/${projectId}`)}
            onProjectMenuClick={handleOpenContextMenu}
            onNewProjectClick={handleNewProjectClick}
          />
        </Box>

        {/* Context Menu for Projects - unchanged */}
        {/* ...existing menus code... */}
        <Menu
          anchorEl={contextMenuAnchor}
          open={Boolean(contextMenuAnchor)}
          onClose={handleCloseContextMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 2,
            sx: {
              minWidth: 180,
              borderRadius: 1.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }
          }}
        >
          <MenuItem 
            onClick={() => {
              navigate(`/projects/${selectedProjectId}`);
              handleCloseContextMenu();
            }}
            dense
          >
            View Project
          </MenuItem>
          <MenuItem 
            onClick={() => selectedProjectId && handleProjectEdit(selectedProjectId)} 
            dense
          >
            Edit Project
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem 
            onClick={() => selectedProjectId && handleProjectDelete(selectedProjectId)}
            sx={{ color: theme.palette.error.main }}
            dense
          >
            Delete Project
          </MenuItem>
        </Menu>

        <ProjectSortMenu
          anchorEl={filterMenuAnchor}
          filterOptions={filterOptions}
          onClose={handleFilterMenuClose}
          onSort={handleSort}
        />
      </Container>
    </PageLayout>
  );
};

export default Projects;
