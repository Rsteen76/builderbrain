import React from 'react';
import {
  Assignment as AssignmentIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';
import { alpha } from '@mui/material';
import { formatDate } from '../../../utils/formatters';
import { logger } from '../../../utils/logger';
import { Bid, BidPaymentStage, BidSummary } from '../../../types';

export const bidStatusColors: Record<string, string> = {
  draft: 'default',
  submitted: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
};

export const STATUS_DISPLAY: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

export interface PaymentProgressDisplay {
  percentage: number;
  paid: number;
  pending: number;
  remaining: number;
}

export type NormalizedPaymentStage = BidPaymentStage & {
  paid: boolean;
  pending: boolean;
  hasPhase: boolean;
  dueDateFormatted: string;
  paymentDateFormatted: string | null;
};

export interface BidDocument {
  name: string;
  url: string;
}

export const getPaletteColor = (theme: any, colorKey: string, variant: string = 'main') => {
  try {
    if (colorKey === 'default') {
      return theme.palette.grey[500];
    }
    if (theme.palette[colorKey as keyof typeof theme.palette]?.[variant]) {
      return theme.palette[colorKey as keyof typeof theme.palette][variant];
    }
    return theme.palette.grey[variant === 'main' ? 500 : 300];
  } catch (e) {
    logger.warn('Error accessing palette color:', e);
    return theme.palette.grey[500];
  }
};

export const isFullBid = (bid: BidSummary | Bid): bid is Bid => {
  return !!(bid as Bid).paymentSchedule || !!(bid as Bid).paymentProgress || !!(bid as Bid).attachments;
};

export const safeFormatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    return formatDate(date);
  } catch (e) {
    logger.warn('Error formatting date:', e);
    return 'Invalid date';
  }
};

export const getStatusChipProps = (status: string, theme: any) => {
  let bgColor;
  let textColor;
  let icon: React.ReactElement | undefined;

  switch (status) {
    case 'draft':
      bgColor = alpha(theme.palette.grey[500], 0.2);
      textColor = theme.palette.text.secondary;
      icon = <DescriptionIcon sx={{ fontSize: '0.8rem' }} />;
      break;
    case 'submitted':
      bgColor = alpha(theme.palette.info.main, 0.2);
      textColor = theme.palette.info.dark;
      icon = <AssignmentIcon sx={{ fontSize: '0.8rem' }} />;
      break;
    case 'accepted':
      bgColor = alpha(theme.palette.success.main, 0.2);
      textColor = theme.palette.success.dark;
      icon = <CheckCircleIcon sx={{ fontSize: '0.8rem' }} />;
      break;
    case 'rejected':
      bgColor = alpha(theme.palette.error.main, 0.2);
      textColor = theme.palette.error.dark;
      icon = <CancelIcon sx={{ fontSize: '0.8rem' }} />;
      break;
    case 'expired':
      bgColor = alpha(theme.palette.warning.main, 0.2);
      textColor = theme.palette.warning.dark;
      icon = <ScheduleIcon sx={{ fontSize: '0.8rem' }} />;
      break;
    case 'revision_requested':
      bgColor = alpha(theme.palette.warning.main, 0.2);
      textColor = theme.palette.warning.dark;
      icon = <EditIcon sx={{ fontSize: '0.8rem' }} />;
      break;
    default:
      bgColor = alpha(theme.palette.grey[500], 0.2);
      textColor = theme.palette.text.secondary;
      icon = undefined;
  }

  return {
    label: STATUS_DISPLAY[status] || status,
    icon,
    size: 'small' as 'small',
    sx: {
      backgroundColor: bgColor,
      color: textColor,
      borderRadius: '4px',
      fontWeight: 600,
      '& .MuiChip-icon': {
        color: 'inherit',
        marginLeft: '4px',
      },
    },
  };
};

export const getStatusIcon = (status: string) => {
  switch(status) {
    case 'draft':
      return <EditIcon />;
    case 'submitted':
      return <SendIcon />;
    case 'accepted':
      return <CheckCircleIcon />;
    case 'rejected':
      return <CancelIcon />;
    default:
      return <EditIcon />;
  }
};

export const isDeadlineClose = (
  submissionDeadline: string | Date | null | undefined,
  now: Date = new Date()
): boolean => {
  if (!submissionDeadline) {
    return false;
  }
  const deadlineDate = new Date(submissionDeadline);
  if (isNaN(deadlineDate.getTime())) return false;
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
};

export const getPaymentProgress = (bid: BidSummary | Bid): PaymentProgressDisplay => {
  const totalAmount = bid.totalAmount || 0;
  const fullBid = isFullBid(bid) ? bid : null;

  if (!fullBid?.paymentProgress && fullBid?.paymentSchedule && fullBid.paymentSchedule.length > 0) {
    let paid = 0;
    let pending = 0;

    fullBid.paymentSchedule.forEach(stage => {
      const isStagePaid = stage.isPaid === true || stage.status === 'paid';
      const isStagePending = !isStagePaid && (stage.status === 'pending' || stage.status === 'in_progress');
      const stageAmount = stage.isFixedAmount
        ? (stage.fixedAmount || 0)
        : (stage.amount || (totalAmount * (stage.percentage || 0) / 100));

      if (isStagePaid) {
        paid += stageAmount;
      } else if (isStagePending) {
        pending += stageAmount;
      }
    });

    return {
      percentage: totalAmount > 0 ? Math.round((paid / totalAmount) * 100) : 0,
      paid,
      pending,
      remaining: Math.max(0, totalAmount - paid)
    };
  }

  if (fullBid?.paymentProgress && totalAmount > 0) {
    const paid = fullBid.paymentProgress.paid || 0;
    return {
      percentage: Math.round((paid / totalAmount) * 100),
      paid,
      pending: fullBid.paymentProgress.pending || 0,
      remaining: Math.max(0, fullBid.paymentProgress.remaining ?? (totalAmount - paid))
    };
  }

  return {
    percentage: 0,
    paid: 0,
    pending: 0,
    remaining: totalAmount
  };
};

export const getPaymentSchedule = (bid: BidSummary | Bid): NormalizedPaymentStage[] => {
  const fullBid = isFullBid(bid) ? bid : null;
  if (!fullBid?.paymentSchedule) return [];

  return fullBid.paymentSchedule.map(stage => {
    const paid = stage.isPaid === true || stage.status === 'paid';
    const pending = !paid && (stage.status === 'pending' || stage.status === 'in_progress');
    let calculatedAmount = stage.amount;
    if (!stage.isFixedAmount && !calculatedAmount && stage.percentage) {
      calculatedAmount = (fullBid.totalAmount * stage.percentage) / 100;
    }

    return {
      ...stage,
      amount: calculatedAmount,
      paid,
      pending,
      isFixedAmount: stage.isFixedAmount || false,
      fixedAmount: stage.fixedAmount || 0,
      hasPhase: !!(stage.phaseId && stage.phaseName),
      dueDateFormatted: stage.dueDate ? safeFormatDate(stage.dueDate) : 'N/A',
      paymentDateFormatted: stage.paymentDate ? safeFormatDate(stage.paymentDate) : null
    };
  });
};

export const getBidDocuments = (bid: BidSummary | Bid): BidDocument[] => {
  const fullBid = isFullBid(bid) ? bid : null;
  if (!fullBid?.attachments || !Array.isArray(fullBid.attachments)) {
    return [];
  }

  return fullBid.attachments.map(att => {
    if (typeof att === 'string') {
      const name = att.substring(att.lastIndexOf('/') + 1).split('?')[0] || 'Attachment';
      return { url: att, name: decodeURIComponent(name) };
    } else if (att && typeof att === 'object' && att.url) {
      return { url: att.url, name: att.name || 'Attachment' };
    }
    return null;
  }).filter(Boolean) as BidDocument[];
};

export const getUpcomingPayment = (
  paymentSchedule: NormalizedPaymentStage[],
  now: Date = new Date()
): NormalizedPaymentStage | null => {
  if (!paymentSchedule.length) return null;

  return paymentSchedule
    .filter(stage => !stage.paid && stage.dueDate && new Date(stage.dueDate).getTime() > now.getTime())
    .sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    })[0] || null;
};

export const isNearDueDate = (dateStr: string | Date | null | undefined): boolean => {
  if (!dateStr) return false;

  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
};
