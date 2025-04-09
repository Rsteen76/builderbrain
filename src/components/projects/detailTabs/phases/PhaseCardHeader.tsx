import React from 'react';
import {
  CardHeader,
  Typography,
  Box,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { ProjectPhase } from '../../../../types'; // Corrected path
import { formatPhaseDate, getPhaseInitials, getStatusText } from '../../../../utils/phaseUtils'; // Corrected path

interface PhaseCardHeaderProps {
  phase: ProjectPhase;
  getStatusColor: (status: string) => string;
  onStatusMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  onPhaseMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
}

const PhaseCardHeader: React.FC<PhaseCardHeaderProps> = ({
  phase,
  getStatusColor,
  onStatusMenuOpen,
  onPhaseMenuOpen,
}) => {
  const theme = useTheme();

  return (
    <CardHeader
      avatar={
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: getStatusColor(phase.status)
          }}
        >
          {getPhaseInitials(phase.name)}
        </Avatar>
      }
      action={
        <Box>
          <Chip
            label={getStatusText(phase.status)}
            size="small"
            sx={{
              backgroundColor: alpha(getStatusColor(phase.status), 0.1),
              color: getStatusColor(phase.status),
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 24,
              mr: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: alpha(getStatusColor(phase.status), 0.2),
              }
            }}
            onClick={(e) => onStatusMenuOpen(e, phase.id)}
          />
          <IconButton
            aria-label="more options"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onPhaseMenuOpen(event, phase.id);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      }
      title={
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            mb: 0,
            lineHeight: 1.3
          }}
        >
          {phase.name}
        </Typography>
      }
      subheader={
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
          <Tooltip title="Timeline">
            <CalendarTodayIcon
              fontSize="small"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.9rem',
                mr: 0.5
              }}
            />
          </Tooltip>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.8rem' }}
          >
            {formatPhaseDate(phase.startDate)} - {formatPhaseDate(phase.endDate)}
          </Typography>
        </Box>
      }
      sx={{
        p: 1.5,
        pb: 0.5,
        '.MuiCardHeader-content': { minWidth: 0 }
      }}
    />
  );
};

export default PhaseCardHeader; 