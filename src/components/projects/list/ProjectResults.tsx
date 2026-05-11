import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import type { Project } from '../../../types';
import ProjectCard from '../ProjectCard';
import ProjectListItem from './ProjectListItem';

interface ProjectResultsProps {
  projects: Project[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  isMobile: boolean;
  searchQuery: string;
  onProjectClick: (projectId: string) => void;
  onProjectMenuClick: (event: React.MouseEvent<HTMLElement>, projectId: string) => void;
  onNewProjectClick: (event: React.MouseEvent<HTMLElement>) => void;
}

const ProjectResults: React.FC<ProjectResultsProps> = ({
  projects,
  loading,
  viewMode,
  isMobile,
  searchQuery,
  onProjectClick,
  onProjectMenuClick,
  onNewProjectClick,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        {viewMode === 'grid' ? (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index} sx={{ width: '100%' }}>
                <Skeleton
                  variant="rectangular"
                  height={isMobile ? 220 : 260}
                  sx={{ borderRadius: 2, width: '100%' }}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack spacing={2}>
            {[...Array(5)].map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                height={isMobile ? 140 : 84}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          textAlign: 'center',
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: '#ffffff',
          width: '100%',
        }}
      >
        <Avatar
          sx={{
            width: { xs: 50, sm: 64 },
            height: { xs: 50, sm: 64 },
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            mx: 'auto',
            mb: 2,
          }}
        >
          <BusinessIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
        </Avatar>

        <Typography
          variant="h5"
          fontWeight={600}
          gutterBottom
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          No Projects Found
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ maxWidth: 500, mx: 'auto' }}
        >
          {searchQuery ? 'Try different search terms or filters' : 'Get started by creating your first project'}
        </Typography>

        {!searchQuery && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewProjectClick}
            sx={{ mt: 1, borderRadius: 1.5 }}
          >
            Create New Project
          </Button>
        )}
      </Paper>
    );
  }

  if (viewMode === 'grid') {
    return (
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {projects.map((project, index) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <ProjectCard
              project={project}
              onClick={() => onProjectClick(project.id)}
              onMenuClick={(event) => onProjectMenuClick(event, project.id)}
              index={index}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
      {projects.map((project) => (
        <ProjectListItem
          key={project.id}
          project={project}
          onClick={() => onProjectClick(project.id)}
          onMenuClick={(event) => onProjectMenuClick(event, project.id)}
        />
      ))}
    </Stack>
  );
};

export default ProjectResults;
