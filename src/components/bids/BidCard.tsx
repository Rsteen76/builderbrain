import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import { BidSummary } from '../../types';

// Status colors
const bidStatusColors: Record<string, string> = {
  draft: 'default',
  submitted: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
};

// Priority colors
const bidPriorityColors: Record<string, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

// Status display names
const STATUS_DISPLAY: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

// Priority display names
const PRIORITY_DISPLAY: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Helper function to safely apply alpha
const safeAlpha = (color: string, value: number) => {
  try {
    return alpha(color, value);
  } catch (e) {
    console.warn('Error applying alpha:', e);
    return color;
  }
};

export interface BidCardProps {
  bid: BidSummary;
  onView: (bid: BidSummary) => void;
  onEdit: (bid: BidSummary) => void;
  onDeleteRequest: (bid: BidSummary) => void;
  onDuplicate: (bid: BidSummary) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
}

const BidCard: React.FC<BidCardProps> = ({ 
  bid, 
  onView, 
  onEdit, 
  onDeleteRequest, 
  onDuplicate,
  onMenuOpen
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent card click through
    onMenuOpen(event);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: (bid: BidSummary) => void, event?: React.MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    action(bid);
    handleMenuClose();
  };

  // Calculate if deadline is close (within 3 days)
  const isDeadlineClose = useMemo(() => {
    if (!bid.submissionDeadline) {
      return false;
    }
    const now = new Date();
    const deadlineDate = new Date(bid.submissionDeadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }, [bid.submissionDeadline]);

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 1,
        border: '1px solid',
        borderColor: safeAlpha(theme.palette.divider, 0.1),
        boxShadow: theme.shadows[1],
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
          '.action-menu-button': { 
            opacity: 1,
            backgroundColor: safeAlpha(theme.palette.grey[200], 0.5)
          },
        },
        ...(isDeadlineClose && {
          borderColor: safeAlpha(theme.palette.warning.main, 0.6),
          // Optional: add a subtle background glow or different shadow
          // boxShadow: `0 0 0 1px ${safeAlpha(theme.palette.warning.main, 0.3)}, 0 3px 8px ${safeAlpha(theme.palette.grey[400], 0.1)}`,
        }),
        ...(bid.priority === 'urgent' && {
          borderLeft: `4px solid ${theme.palette.error.main}`,
        })
      }}
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 0.5, 
                  cursor: 'pointer', 
                  '&:hover': { color: theme.palette.primary.main },
                  wordBreak: 'break-word',
                  fontWeight: 500,
                  lineHeight: 1.2
                }}
                onClick={() => onView(bid)}
              >
                {bid.title || 'Untitled Bid'}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1 }}
              >
                Project: {bid.projectName || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                <Chip 
                  size="small" 
                  label={STATUS_DISPLAY[bid.status] || bid.status} 
                  color={bidStatusColors[bid.status] as any} 
                  sx={{ fontWeight: 500 }}
                />
                {bid.priority && (
                  <Chip 
                    size="small" 
                    label={PRIORITY_DISPLAY[bid.priority] || bid.priority} 
                    color={bidPriorityColors[bid.priority] as any} 
                    sx={{ fontWeight: 500 }}
                  />
                )}
                {isDeadlineClose && (
                  <Chip 
                    size="small" 
                    label="Deadline Soon" 
                    color="warning" 
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Subcontractor
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400 }}>
                {bid.subcontractorName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                Deadline
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 400 }}>
                {bid.submissionDeadline ? new Date(bid.submissionDeadline).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Amount
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                {formatCurrency(bid.totalAmount)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={1} sx={{ textAlign: 'right' }}>
            <IconButton
              aria-label="actions"
              onClick={handleMenuClick}
              size="small"
              className="action-menu-button"
              sx={{ opacity: { xs: 1, sm: 0.5 }, transition: 'opacity 0.2s, background-color 0.2s' }} 
            >
              <MoreVertIcon />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BidCard; 