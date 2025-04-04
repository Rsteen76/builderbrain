import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  alpha,
  Theme,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BidSummary } from '../../types';

interface BidRowProps {
  bid: BidSummary;
  onView: (bid: BidSummary) => void;
  onEdit: (bid: BidSummary) => void;
  onDeleteRequest: (bid: BidSummary) => void;
  onDuplicate: (bid: BidSummary) => void;
  theme: Theme;
}

const BidRow: React.FC<BidRowProps> = ({
  bid,
  onView,
  onEdit,
  onDeleteRequest,
  onDuplicate,
  theme,
}) => {
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      case 'draft':
        return theme.palette.grey[500];
      case 'submitted':
        return theme.palette.info.main;
      default:
        return theme.palette.warning.main;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderColor: 'transparent',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {bid.title || 'Untitled Bid'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Project: {bid.projectName || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contractor: {bid.subcontractorName || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={bid.status}
              size="small"
              sx={{
                bgcolor: alpha(getStatusColor(bid.status), 0.1),
                color: getStatusColor(bid.status),
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Amount: {formatCurrency(bid.totalAmount)}
            </Typography>
            {bid.submissionDeadline && (
              <Typography variant="body2" color="text.secondary">
                Due: {formatDate(bid.submissionDeadline)}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Bid">
            <IconButton size="small" onClick={() => onView(bid)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Bid">
            <IconButton size="small" onClick={() => onEdit(bid)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Bid">
            <IconButton size="small" onClick={() => onDeleteRequest(bid)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate Bid">
            <IconButton size="small" onClick={() => onDuplicate(bid)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default BidRow; 