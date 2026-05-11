import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  LinearProgress,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Alarm as AlarmIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  LocalOffer as LocalOfferIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import { Bid, BidSummary } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import {
  bidStatusColors,
  getPaletteColor,
  getStatusIcon,
  NormalizedPaymentStage,
  PaymentProgressDisplay,
  safeFormatDate,
  STATUS_DISPLAY,
} from './bidCardUtils';

interface BidCardHeaderContentProps {
  bid: BidSummary | Bid;
  expanded: boolean;
  isDeadlineClose: boolean;
  paymentProgress: PaymentProgressDisplay;
  upcomingPayment: NormalizedPaymentStage | null;
  theme: any;
}

const BidCardHeaderContent: React.FC<BidCardHeaderContentProps> = ({
  bid,
  expanded,
  isDeadlineClose,
  paymentProgress,
  upcomingPayment,
  theme,
}) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      position: 'relative',
      '&::before': expanded ? {
        content: '""',
        position: 'absolute',
        left: -8,
        top: 0,
        bottom: 0,
        width: 4,
        borderRadius: 4,
        backgroundColor: getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'),
      } : {},
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            flexGrow: 1
          }}
        >
          <Avatar
            sx={{
              bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.9),
              color: getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey', 'contrastText'),
              mr: 1.5,
              width: 46,
              height: 46,
              boxShadow: `0 3px 5px ${alpha(theme.palette.common.black, 0.2)}`
            }}
          >
            {getStatusIcon(bid.status)}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 0.5,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {bid.title || bid.projectName}
              {bid.priority === 'high' && (
                <PriorityHighIcon
                  color="error"
                  fontSize="small"
                  sx={{ ml: 1 }}
                  titleAccess="High Priority"
                />
              )}
              {isDeadlineClose && (
                <Tooltip title="Deadline Approaching">
                  <AlarmIcon
                    color="warning"
                    fontSize="small"
                    sx={{ ml: 1 }}
                  />
                </Tooltip>
              )}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LocalOfferIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              {formatCurrency(bid.totalAmount)} •
              <AccessTimeIcon fontSize="inherit" sx={{ mx: 0.5 }} />
              {safeFormatDate((bid as any).submissionDate || new Date().toISOString())}
              {bid.subcontractorName && (
                <>
                  <BusinessIcon fontSize="inherit" sx={{ mx: 0.5 }} />
                  {bid.subcontractorName}
                </>
              )}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={STATUS_DISPLAY[bid.status] || bid.status}
          size="small"
          sx={{
            bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.15),
            color: getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'),
            fontWeight: 600,
            borderRadius: '4px',
            mr: 1,
            '&:hover': {
              bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.25),
            }
          }}
        />
      </Box>

      {bid.status === 'rejected' && (bid as any).rejectionReason && (
        <Alert severity="error" sx={{ mb: 1, py: 0 }}>
          {(bid as any).rejectionReason}
        </Alert>
      )}

      {bid.status === 'accepted' && upcomingPayment && (
        <Alert severity="info" sx={{ mb: 1, py: 0 }}>
          Payment of {formatCurrency(upcomingPayment.amount || 0)} due on {safeFormatDate(upcomingPayment.dueDate || '')}
        </Alert>
      )}

      <Box sx={{ mt: 1 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5
        }}>
          <Typography variant="body2" color="text.secondary">
            {paymentProgress.percentage === 100 ? 'Payment Completed' : 'Payment Progress'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="medium">
              <Box component="span" sx={{ color: 'success.main' }}>
                {formatCurrency(paymentProgress.paid)}
              </Box>
              {paymentProgress.remaining > 0 && (
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {' / '}{formatCurrency(paymentProgress.paid + paymentProgress.remaining)}
                </Box>
              )}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "600",
                color: paymentProgress.percentage === 100
                  ? 'success.main'
                  : 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 36,
                height: 20,
                borderRadius: 1,
                fontSize: '0.75rem',
                bgcolor: paymentProgress.percentage === 100
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.1),
                px: 0.5
              }}
            >
              {Math.round(paymentProgress.percentage)}%
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(paymentProgress.percentage, 100)}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: alpha(theme.palette.grey[300], 0.8),
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundImage: paymentProgress.percentage === 100
                ? `linear-gradient(90deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`
                : `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
            }
          }}
        />
        {expanded || (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 1,
            opacity: 0.7,
            color: 'text.secondary'
          }}>
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontStyle: 'italic'
              }}
            >
              <ExpandMoreIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              Click to expand for details
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BidCardHeaderContent;
