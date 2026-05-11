import React from 'react';
import { useTheme } from '@mui/material';
import { FlagCircle as FlagIcon } from '@mui/icons-material';
import { getStatusType, type DisplayStatus } from './projectListUtils';

export const useProjectListThemeUtils = () => {
  const theme = useTheme();

  const getStatusColor = (status: string): string => {
    const statusType = getStatusType(status);
    const colorMap: Record<DisplayStatus, string> = {
      Planning: theme.palette.info.main,
      Active: theme.palette.primary.main,
      Completed: theme.palette.success.main,
      'On Hold': theme.palette.warning.main,
      Cancelled: theme.palette.error.main,
    };

    return colorMap[statusType];
  };

  const getPriorityColor = (priority?: string): string => {
    if (!priority) return theme.palette.info.main;

    const priorityMap: Record<string, string> = {
      low: theme.palette.info.main,
      medium: theme.palette.success.main,
      high: theme.palette.warning.main,
      urgent: theme.palette.error.main,
    };

    return priorityMap[priority.toLowerCase()] || theme.palette.info.main;
  };

  const getPriorityIcon = (priority?: string) => {
    if (!priority) return <FlagIcon />;

    switch (priority.toLowerCase()) {
      case 'urgent':
        return <FlagIcon color="error" />;
      case 'high':
        return <FlagIcon color="warning" />;
      case 'medium':
        return <FlagIcon color="success" />;
      case 'low':
        return <FlagIcon color="info" />;
      default:
        return <FlagIcon color="info" />;
    }
  };

  return {
    getStatusColor,
    getPriorityColor,
    getPriorityIcon,
  };
};
