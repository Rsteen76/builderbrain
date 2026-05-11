import React from 'react';
import {
  Avatar,
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { Project } from '../../../types';
import { formatDate } from '../../../utils/formatters';
import {
  calculateProjectProgress,
  formatProjectLocation,
  getProjectBudgetTotal,
  getStatusType,
} from './projectListUtils';
import { useProjectListThemeUtils } from './useProjectListThemeUtils';

interface ProjectListItemProps {
  project: Project;
  onClick?: () => void;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, onClick }) => {
  const theme = useTheme();
  const {
    getStatusColor,
    getPriorityColor,
    getPriorityIcon,
  } = useProjectListThemeUtils();

  const statusColor = getStatusColor(project.status);
  const statusText = getStatusType(project.status);
  const progress = calculateProjectProgress(project);

  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        cursor: 'pointer',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        mb: 2,
        overflow: 'hidden',
        '&:hover': {
          borderColor: alpha(statusColor, 0.5),
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          width: { xs: '100%', sm: 6 },
          height: { xs: 4, sm: '100%' },
          backgroundColor: statusColor,
        }}
      />

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        width: '100%',
        p: { xs: 2, sm: 2.5 },
        gap: { xs: 2, sm: 3 },
      }}>
        <Box sx={{ flex: '1 1 40%', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: alpha(project.priority ? getPriorityColor(project.priority) : theme.palette.primary.main, 0.12),
                color: project.priority ? getPriorityColor(project.priority) : theme.palette.primary.main,
              }}
            >
              {getPriorityIcon(project.priority)}
            </Avatar>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                fontSize: { xs: '0.95rem', sm: '1rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </Typography>
          </Box>

          {project.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 0.5 }}>
              <LocationIcon sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary, opacity: 0.7 }} />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatProjectLocation(project.location)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 20%',
          minWidth: { xs: '100%', sm: 140 },
        }}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Progress
              </Typography>
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{
                  fontSize: '0.75rem',
                  color: progress >= 80 ? theme.palette.success.main :
                    progress >= 40 ? theme.palette.primary.main :
                    theme.palette.text.secondary,
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.common.black, 0.05) }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progress}%`,
                  borderRadius: 3,
                  background: progress >= 80
                    ? `linear-gradient(90deg, ${theme.palette.success.main}, ${alpha(theme.palette.success.light, 0.8)})`
                    : `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.8)})`,
                }}
              />
            </Box>
          </Box>
        </Box>

        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          spacing={{ xs: 2, sm: 0.5 }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          justifyContent={{ xs: 'space-between', sm: 'center' }}
          sx={{ flex: '1 1 25%', minWidth: { sm: 120 } }}
        >
          <Chip
            size="small"
            label={statusText}
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              height: 22,
              backgroundColor: alpha(statusColor, 0.12),
              color: statusColor,
              borderRadius: '6px',
              minWidth: 80,
              justifyContent: 'center',
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon fontSize="small" sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary, opacity: 0.7 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {project.endDate ? formatDate(project.endDate) : 'No due date'}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: 'row', sm: 'column' }}
          spacing={{ xs: 2, sm: 0.5 }}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          justifyContent={{ xs: 'space-between', sm: 'center' }}
          sx={{ flex: '1 1 15%', minWidth: { sm: 100 } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon fontSize="small" sx={{ fontSize: '0.85rem', color: theme.palette.success.main, opacity: 0.9 }} />
            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
              ${getProjectBudgetTotal(project).toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon fontSize="small" sx={{ fontSize: '0.85rem', color: theme.palette.info.main, opacity: 0.9 }} />
            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
              {project.team?.length || 0} members
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};

export default ProjectListItem;
