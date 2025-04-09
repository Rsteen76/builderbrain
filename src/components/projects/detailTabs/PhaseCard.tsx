import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
  Button,
  LinearProgress,
  alpha,
  useTheme,
  Theme,
  Grid // Keep Grid for the item wrapper
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  ReceiptLong as ReceiptLongIcon,
  Handshake as HandshakeIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { ProjectPhase } from '../../../types'; // Adjusted path
import { formatCurrency, formatDate, truncateText, safelyParseDate } from '../../../utils/formatters'; // Adjusted path
import PhaseMetricsDisplay from './PhaseMetricsDisplay'; // Use the extracted component
import PhaseBudgetPieChart from '../charts/PhaseBudgetPieChart'; // Use the extracted component

// Helper functions (can be moved to utils later if shared)
const getPhaseInitials = (phaseName: string): string => {
  if (!phaseName) return '?';
  return phaseName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getStatusText = (status: string) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// TODO: Consider moving formatPhaseDate to formatters utils if not already there
const formatPhaseDate = (date: Date | string | { toDate(): Date } | null): string => {
  try {
    // Assuming safelyParseDate handles various input types and returns a Date
    const parsedDate = safelyParseDate(date);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
         // Example format, adjust as needed
        return parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'N/A';
  } catch (error) {
    console.error('Error formatting phase date:', error);
    return 'Invalid Date';
  }
};

interface PhaseCardProps {
  phase: ProjectPhase;
  proposedCost: number;
  actualCost: number;
  // Callbacks for actions
  onStatusMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  onPhaseMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  onOpenQuickExpenseDialog: (phaseId: string) => void;
  onOpenQuickBidDialog: (phaseId: string) => void;
  onViewPhaseDetails: (phaseId: string) => void;
  // Helpers passed down
  getStatusColor: (status: string) => string;
  formatCurrency: (value: number) => string;
  // Potentially pass theme or rely on useTheme
}

const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  proposedCost,
  actualCost,
  onStatusMenuOpen,
  onPhaseMenuOpen,
  onOpenQuickExpenseDialog,
  onOpenQuickBidDialog,
  onViewPhaseDetails,
  getStatusColor,
  formatCurrency,
}) => {
  const theme = useTheme();
  const budget = phase.budget || 0;
  const budgetUsedPercentage = budget > 0 ? Math.min((actualCost / budget) * 100, 100) : 0;
  const isOverBudget = budget > 0 && actualCost > budget;

  return (
    // The Grid item wrapper remains in the parent component (ProjectPhasesTab)
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 5
        },
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
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
                event.stopPropagation(); // Prevent card click if necessary
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
      <CardContent
        sx={{
          p: 1.5,
          pt: 0.5,
          pb: '8px !important',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Use extracted Metrics Display */}
        <PhaseMetricsDisplay
          phase={phase}
          proposedCost={proposedCost}
          actualCost={actualCost}
          formatCurrency={formatCurrency}
        />

        {/* Budget progress indicator */}
        <Box
          sx={{
            width: '100%',
            mt: 0.5,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={budgetUsedPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(
                    isOverBudget ? theme.palette.error.light : theme.palette.success.light, // Use lighter background based on budget status
                     0.3 // Adjust opacity for background
                ),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor:
                    isOverBudget
                      ? theme.palette.error.main
                      : theme.palette.success.main,
                },
              }}
            />
          </Box>
          <Typography
            variant="body2"
            fontWeight="bold"
            color={isOverBudget ? "error.main" : "text.primary"}
            sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}
          >
            {budget > 0 ? `${Math.round(budgetUsedPercentage)}%` : 'N/A'}
          </Typography>
        </Box>

        {/* Use extracted Pie Chart */}
        <PhaseBudgetPieChart
          budget={budget}
          proposedCost={proposedCost}
          actualCost={actualCost}
        />

        {/* Phase description - truncated */}
        {phase.description && (
            <Box sx={{
              mt: 1.5, // Add some margin top
              maxHeight: '60px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              position: 'relative',
              WebkitLineClamp: 3, // Standard CSS for line clamping
              display: '-webkit-box', // Needed for line clamping
              WebkitBoxOrient: 'vertical', // Needed for line clamping
            }}>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8rem' }}
            >
                {phase.description}
            </Typography>
            {/* Optional fade effect if needed
            <Box sx={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0, height: '20px',
                background: `linear-gradient(to bottom, transparent, ${theme.palette.background.paper})`
            }}/> */}
            </Box>
        )}

        {/* Footer actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto', // Push to bottom
            pt: 1.5 // Add padding top
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Add expense">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onOpenQuickExpenseDialog(phase.id);
                }}
                sx={{ p: 0.5 }}
              >
                <ReceiptLongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add bid">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onOpenQuickBidDialog(phase.id);
                }}
                sx={{ p: 0.5 }}
              >
                <HandshakeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            size="small"
            endIcon={<ChevronRightIcon />}
            onClick={() => onViewPhaseDetails(phase.id)}
            sx={{
              textTransform: 'none',
              fontSize: '0.75rem',
              py: 0.3,
              px: 0.8
            }}
          >
            Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PhaseCard; 