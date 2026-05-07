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
  Collapse,
  Button,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardHeader,
  CardActions,
  Link,
  Alert,
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Note as NoteIcon,
  Alarm as AlarmIcon,
  CalendarToday as CalendarIcon,
  ReceiptLong as ReceiptLongIcon,
  FolderOpen as FolderOpenIcon,
  AccountCircle as AccountCircleIcon,
  PriorityHigh as PriorityHighIcon,
  AccessTime as AccessTimeIcon,
  LocalOffer as LocalOfferIcon,
  Timeline as TimelineIcon,
  Business as BusinessIcon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Bid, BidSummary, BidPaymentStage } from '../../types';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SendIcon from '@mui/icons-material/Send';
import MoneyIcon from '@mui/icons-material/Money';
import { darken } from '@mui/material/styles';

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

// Helper function for safe palette access with string keys
const getPaletteColor = (theme: any, colorKey: string, variant: string = 'main') => {
  try {
    // First try to access as a direct palette property
    if (colorKey === 'default') {
      return theme.palette.grey[500];
    }
    if (theme.palette[colorKey as keyof typeof theme.palette]?.[variant]) {
      return theme.palette[colorKey as keyof typeof theme.palette][variant];
    }
    // Fallback to grey
    return theme.palette.grey[variant === 'main' ? 500 : 300];
  } catch (e) {
    console.warn('Error accessing palette color:', e);
    return theme.palette.grey[500];
  }
};

// Type guard to check if bid is a full Bid or just a BidSummary
const isFullBid = (bid: BidSummary | Bid): bid is Bid => {
  // Check for specific properties that only exist in the full Bid interface
  return !!(bid as Bid).paymentSchedule || !!(bid as Bid).paymentProgress || !!(bid as Bid).attachments;
};

// Safe date formatter to handle possibly null/undefined dates
const safeFormatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    return formatDate(date);
  } catch (e) {
    console.warn('Error formatting date:', e);
    return 'Invalid date';
  }
};

// Generate status chip props
const getStatusChipProps = (status: string, theme: any) => {
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

export interface BidCardProps {
  bid: BidSummary | Bid;
  onView: (bid: BidSummary | Bid) => void;
  onEdit: (bid: BidSummary | Bid) => void;
  onDeleteRequest: (bid: BidSummary | Bid) => void;
  onDuplicate: (bid: BidSummary | Bid) => void;
  onStatusChange?: (bid: BidSummary | Bid, newStatus: string) => void;
  onAddPayment?: (bid: BidSummary | Bid) => void;
  onViewDocument?: (documentUrl: string, documentName?: string) => void;
  onSendEmail?: (bid: BidSummary | Bid) => void;
  onAddNote?: (bid: BidSummary | Bid, note: string) => void;
  onGenerateContract?: (bid: BidSummary | Bid) => void;
}

// Interface for TabPanel props
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

// TabPanel component
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`bid-tabpanel-${index}`}
      aria-labelledby={`bid-tab-${index}`}
      sx={{ p: 2, maxHeight: 320, overflow: 'auto' }}
    >
      {value === index && children}
    </Box>
  );
};

const BidCard: React.FC<BidCardProps> = ({ 
  bid, 
  onView, 
  onEdit, 
  onDeleteRequest, 
  onDuplicate,
  onStatusChange,
  onAddPayment,
  onViewDocument,
  onSendEmail,
  onAddNote,
  onGenerateContract,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [note, setNote] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use type guard to check if we have full bid data
  const hasFull = isFullBid(bid);
  // Cast to Bid if full features are needed, otherwise use BidSummary properties
  const fullBid = hasFull ? bid as Bid : null;

  const handleToggleExpand = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: (bid: BidSummary | Bid) => void, event?: React.MouseEvent<HTMLElement>) => {
    event?.stopPropagation();
    action(bid);
    handleMenuClose();
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleShowNoteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNoteDialog(true);
    handleMenuClose(); // Close menu when dialog opens
  };

  const handleInternalAddNote = () => {
    if (onAddNote && note.trim()) {
      onAddNote(bid, note);
      setNote("");
    }
    setShowNoteDialog(false);
  };

  const handleGenerateContract = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGenerateContract) {
      onGenerateContract(bid);
    }
    handleMenuClose();
  };

  const handleSendEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSendEmail) {
      onSendEmail(bid);
    }
    handleMenuClose();
  };

  // Calculate if deadline is close (within 3 days)
  const isDeadlineClose = useMemo(() => {
    if (!bid.submissionDeadline) {
      return false;
    }
    const now = new Date();
    const deadlineDate = new Date(bid.submissionDeadline);
    if (isNaN(deadlineDate.getTime())) return false; // Invalid date
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }, [bid.submissionDeadline]);

  // Get payment progress with improved calculation
  const paymentProgress = useMemo(() => {
    // Default values if no payment progress is available
    const totalAmount = bid.totalAmount || 0;
    
    // Calculate from payment schedule if payment progress is not available but schedule is
    if (!fullBid?.paymentProgress && fullBid?.paymentSchedule && fullBid.paymentSchedule.length > 0) {
      let paid = 0;
      let pending = 0;

      fullBid.paymentSchedule.forEach(stage => {
        const isStagePaid = stage.isPaid === true || stage.status === 'paid';
        const isStagePending = !isStagePaid && (stage.status === 'pending' || stage.status === 'in_progress');
        
        // Calculate amount based on either percentage or fixed amount
        // Use the amount already present if it exists, otherwise calculate percentage
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
        remaining: Math.max(0, totalAmount - paid) // Ensure remaining isn't negative
      };
    }
    
    // Use existing paymentProgress object if available
    if (fullBid?.paymentProgress && totalAmount > 0) {
      const paid = fullBid.paymentProgress.paid || 0;
      return {
        percentage: Math.round((paid / totalAmount) * 100),
        paid,
        pending: fullBid.paymentProgress.pending || 0,
        remaining: Math.max(0, fullBid.paymentProgress.remaining ?? (totalAmount - paid)) // Ensure remaining isn't negative
      };
    }
    
    // We always return a valid object with defaults
    return { 
      percentage: 0, 
      paid: 0,
      pending: 0,
      remaining: totalAmount 
    };
  }, [bid.totalAmount, fullBid]);

  // Get payment schedule with improved normalization
  const paymentSchedule = useMemo(() => {
    if (!fullBid?.paymentSchedule) return [];
    
    return fullBid.paymentSchedule.map(stage => {
      const isPaid = stage.isPaid === true || stage.status === 'paid';
      const isPending = !isPaid && (stage.status === 'pending' || stage.status === 'in_progress');

      // Calculate amount if not explicitly set
      let calculatedAmount = stage.amount;
      if (!stage.isFixedAmount && !calculatedAmount && stage.percentage) {
        calculatedAmount = (fullBid.totalAmount * stage.percentage) / 100;
      }
      
      return {
        ...stage,
        amount: calculatedAmount, // Use the calculated or existing amount
        paid: isPaid,
        pending: isPending,
        isFixedAmount: stage.isFixedAmount || false,
        fixedAmount: stage.fixedAmount || 0,
        hasPhase: !!(stage.phaseId && stage.phaseName),
        dueDateFormatted: stage.dueDate ? safeFormatDate(stage.dueDate) : 'N/A',
        paymentDateFormatted: stage.paymentDate ? safeFormatDate(stage.paymentDate) : null
      };
    });
  }, [fullBid]);

  // Get documents
  const documents = useMemo(() => {
    if (fullBid?.attachments) {
      if (Array.isArray(fullBid.attachments)) {
        return fullBid.attachments.map(att => {
          if (typeof att === 'string') {
            // Try to extract a name from URL, otherwise use 'Attachment'
            const name = att.substring(att.lastIndexOf('/') + 1).split('?')[0] || 'Attachment';
            return { url: att, name: decodeURIComponent(name) };
          } else if (att && typeof att === 'object' && att.url) {
            return { url: att.url, name: att.name || 'Attachment' };
          }
          return null;
        }).filter(Boolean) as { name: string; url: string }[];
      }
    }
    return [];
  }, [fullBid]);

  const statusChipProps = getStatusChipProps(bid.status, theme);

  const renderHeaderContent = () => {
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
          
          {/* Status badge */}
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
        
        {/* Alert for rejected bids */}
        {bid.status === 'rejected' && (bid as any).rejectionReason && (
          <Alert severity="error" sx={{ mb: 1, py: 0 }}>
            {(bid as any).rejectionReason}
          </Alert>
        )}
        
        {/* Alert for accepted bids with upcoming payments */}
        {bid.status === 'accepted' && getUpcomingPayment() && (
          <Alert severity="info" sx={{ mb: 1, py: 0 }}>
            Payment of {formatCurrency(getUpcomingPayment()?.amount || 0)} due on {safeFormatDate(getUpcomingPayment()?.dueDate || '')}
          </Alert>
        )}
        
        {/* Progress section with better visualization */}
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
  
  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
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
  
  // Helper function to get upcoming payment
  const getUpcomingPayment = () => {
    if (!paymentSchedule || !paymentSchedule.length) return null;
    
    return paymentSchedule
      .filter(stage => !stage.paid && stage.dueDate && new Date(stage.dueDate).getTime() > new Date().getTime())
      .sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      })[0];
  };

  return (
    <Card
      sx={{
        position: 'relative',
        mb: 2,
        borderRadius: '12px',
        boxShadow: expanded 
          ? `0 10px 30px ${alpha(theme.palette.common.black, 0.15)}` 
          : `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        overflow: 'visible',
        transition: theme.transitions.create(['box-shadow', 'transform', 'border-color'], {
          duration: theme.transitions.duration.shorter
        }),
        transform: expanded ? 'scale(1.01)' : 'scale(1)',
        border: '1px solid',
        borderColor: expanded
          ? alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.3)
          : alpha(theme.palette.divider, 0.5),
        '&:hover': {
          boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          borderColor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.2),
          cursor: 'pointer'
        }
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <CardHeader
        sx={{
          p: 2,
          bgcolor: expanded 
            ? alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.05)
            : 'transparent',
          transition: 'background 0.3s ease',
          borderBottom: expanded ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
        }}
        title={renderHeaderContent()}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e);
              }}
              aria-label="more actions"
              size="small"
              sx={{
                bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.1),
                '&:hover': {
                  bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.2),
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={handleToggleExpand}
              aria-expanded={expanded}
              aria-label="show more"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: theme.transitions.create('transform', {
                  duration: theme.transitions.duration.shorter
                }),
                bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.1),
                '&:hover': {
                  bgcolor: alpha(getPaletteColor(theme, bidStatusColors[bid.status] as string || 'grey'), 0.2),
                }
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Stack>
        }
      />
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0, pb: 2 }}>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            {/* Bid Details */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1
              }}>
                <BusinessIcon fontSize="small" color="primary" />
                Bid Details
                          </Typography>
              
              <Table size="small">
                <TableBody>
                  {bid.subcontractorName && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                        Subcontractor
                      </TableCell>
                      <TableCell sx={{ py: 1, borderBottom: 'none' }}>
                        {bid.subcontractorName}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                      Total Amount
                    </TableCell>
                    <TableCell sx={{ py: 1, borderBottom: 'none', fontWeight: 'medium' }}>
                      {formatCurrency(bid.totalAmount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                      Submission Date
                    </TableCell>
                    <TableCell sx={{ py: 1, borderBottom: 'none' }}>
                      {safeFormatDate((bid as any).submissionDate || new Date().toISOString())}
                    </TableCell>
                  </TableRow>
                  {(bid as any).approvalDate && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                        Approval Date
                      </TableCell>
                      <TableCell sx={{ py: 1, borderBottom: 'none' }}>
                        {safeFormatDate((bid as any).approvalDate)}
                      </TableCell>
                    </TableRow>
                  )}
                  {(bid as any).rejectionDate && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                        Rejection Date
                      </TableCell>
                      <TableCell sx={{ py: 1, borderBottom: 'none' }}>
                        {safeFormatDate((bid as any).rejectionDate)}
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Add payment summary row */}
                  {paymentProgress && (paymentProgress.paid > 0 || paymentProgress.pending > 0) && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                        Payment Summary
                      </TableCell>
                      <TableCell sx={{ py: 1, borderBottom: 'none' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">
                            <Chip label="Paid" size="small" sx={{ mr: 0.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, height: 18 }} />
                             {formatCurrency(paymentProgress.paid)}
                          </Typography>
                          {paymentProgress.pending > 0 && (
                            <Typography variant="body2">
                              <Chip label="Pending" size="small" sx={{ mr: 0.5, bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, height: 18 }} />
                               {formatCurrency(paymentProgress.pending)}
                          </Typography>
                          )}
                          <Typography variant="body2">
                            <Chip label="Remaining" size="small" sx={{ mr: 0.5, bgcolor: alpha(theme.palette.grey[500], 0.1), color: theme.palette.text.secondary, height: 18 }} />
                            {formatCurrency(paymentProgress.remaining)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                  {(bid as any).tags && Array.isArray((bid as any).tags) && (bid as any).tags.length > 0 && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 500, width: '40%', py: 1, borderBottom: 'none' }}>
                        Tags
                      </TableCell>
                      <TableCell sx={{ py: 1, borderBottom: 'none' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(bid as any).tags.map((tag: string) => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                          size="small" 
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: alpha(theme.palette.grey[500], 0.1)
                              }} 
                            />
                          ))}
                    </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Grid>
            
            {/* Payment Schedule */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1
              }}>
                <AttachMoneyIcon fontSize="small" color="primary" />
                Payment Schedule
              </Typography>
              
              {paymentSchedule && paymentSchedule.length > 0 ? (
                <TableContainer sx={{ 
                  maxHeight: 220,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                      <TableRow sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      }}>
                        <TableCell sx={{ fontWeight: 600 }}>Stage</TableCell>
                        <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                      {paymentSchedule.map((stage, index) => (
                        <TableRow 
                          key={stage.id || index} 
                          sx={{
                            bgcolor: stage.paid ? alpha(theme.palette.success.main, 0.03) : 
                                    stage.pending ? alpha(theme.palette.warning.main, 0.03) : 'transparent',
                            '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) }
                          }}
                        >
                          <TableCell>
                            <Tooltip title={stage.description || ''}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {stage.name || stage.description || `Payment ${index + 1}`}
                                {stage.hasPhase && (
                                  <Chip 
                                    label={stage.phaseName} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.65rem',
                                      borderColor: alpha(theme.palette.info.main, 0.3),
                                      color: theme.palette.info.dark
                                    }}
                                  />
                                )}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ 
                            fontWeight: 'medium',
                            color: stage.isFixedAmount ? theme.palette.primary.dark : 'inherit',
                            textAlign: 'right' // Align amount right
                          }}>
                            {formatCurrency(stage.amount || stage.fixedAmount || 0)}
                            {stage.isFixedAmount && (
                              <Chip 
                                label="Fixed" 
                                size="small" 
                                variant="outlined"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  ml: 0.5,
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  color: theme.palette.primary.dark
                                }}
                              />
                            )}
                            {!stage.isFixedAmount && stage.percentage != null && (
                              <Chip 
                                label={`${stage.percentage}%`} 
                                size="small" 
                                variant="outlined"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  ml: 0.5,
                                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                                  color: theme.palette.secondary.dark
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {isNearDueDate(stage.dueDate) && !stage.paid ? (
                              <Tooltip title="Upcoming Payment">
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AccessTimeIcon 
                                    color="warning" 
                                    sx={{ mr: 0.5, fontSize: '0.9rem' }}
                                  />
                                  {stage.dueDateFormatted}
                                </Box>
                              </Tooltip>
                            ) : (
                              stage.dueDateFormatted
                            )}
                            {stage.paid && stage.paymentDateFormatted && (
                              <Tooltip title="Payment Date">
                                <Typography variant="caption" display="block" sx={{ color: 'success.dark' }}>
                                  Paid: {stage.paymentDateFormatted}
                                </Typography>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={stage.paid 
                                ? "Paid" 
                                : stage.pending 
                                  ? "In Progress" 
                                  : "Pending"}
                              icon={stage.paid ? <CheckCircleIcon fontSize="inherit"/> : stage.pending ? <TimelineIcon fontSize="inherit"/> : undefined}
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                bgcolor: stage.paid 
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : stage.pending
                                    ? alpha(theme.palette.warning.main, 0.1) 
                                    : alpha(theme.palette.grey[500], 0.1),
                                color: stage.paid 
                                  ? theme.palette.success.dark
                                  : stage.pending 
                                    ? theme.palette.warning.dark
                                    : theme.palette.grey[700],
                                '& .MuiChip-icon': {
                                  marginLeft: '4px',
                                  marginRight: '-2px',
                                  fontSize: '0.8rem'
                                }
                              }}
                            />
                            {stage.expenseId && (
                              <Tooltip title="Linked to expense">
                                <Chip
                                  size="small"
                                  label="Exp"
                                  icon={<ReceiptLongIcon fontSize="inherit"/>}
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.65rem',
                                    height: 18,
                                    ml: 0.5,
                                    borderColor: alpha(theme.palette.info.main, 0.3),
                                    color: theme.palette.info.dark,
                                    '& .MuiChip-icon': {
                                      marginLeft: '3px',
                                      marginRight: '-1px',
                                      fontSize: '0.7rem'
                                    }
                                  }}
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No payment schedule defined
                      </Typography>
                      <Button 
                        startIcon={<AddIcon />}
                    size="small"
                    sx={{ mt: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                      onAddPayment && onAddPayment(bid);
                        }}
                    variant="outlined"
                      >
                    Add Payment Schedule
                      </Button>
                </Paper>
              )}
            </Grid>
            
            {/* Description */}
            {(bid as any).description && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <DescriptionIcon fontSize="small" color="primary" />
                  Description
                </Typography>
                          <Paper
                            variant="outlined"
                            sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    maxHeight: 120,
                    overflow: 'auto',
                    borderColor: alpha(theme.palette.divider, 0.5)
                  }}
                >
                  <Typography variant="body2">{(bid as any).description}</Typography>
                          </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Collapse>

      {/* Floating Action Speed Dial */}
      {expanded && (
        <SpeedDial
          ariaLabel="Bid actions"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
          icon={<SpeedDialIcon />}
          FabProps={{
            size: "medium",
            sx: { 
              bgcolor: getPaletteColor(theme, bidStatusColors[bid.status] as string || 'primary'),
              '&:hover': {
                bgcolor: getPaletteColor(theme, bidStatusColors[bid.status] as string || 'primary', 'dark')
              }
            }
          }}
        >
          {/* Draft actions */}
          {bid.status === 'draft' && [
            <SpeedDialAction
              key="edit"
              icon={<EditIcon />}
              tooltipTitle="Edit Bid"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bid);
              }}
            />,
            <SpeedDialAction
              key="submit"
              icon={<SendIcon />}
              tooltipTitle="Submit Bid"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange && onStatusChange(bid, 'submitted');
              }}
            />,
            <SpeedDialAction
              key="delete"
              icon={<DeleteIcon />}
              tooltipTitle="Delete Bid"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(bid);
              }}
            />
          ]}
          
          {/* Submitted actions */}
          {bid.status === 'submitted' && [
            <SpeedDialAction
              key="accept"
              icon={<CheckCircleIcon />}
              tooltipTitle="Accept Bid"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange && onStatusChange(bid, 'accepted');
              }}
            />,
            <SpeedDialAction
              key="reject"
              icon={<CancelIcon />}
              tooltipTitle="Reject Bid"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange && onStatusChange(bid, 'rejected');
              }}
            />,
            <SpeedDialAction
              key="email"
              icon={<EmailIcon />}
              tooltipTitle="Send Email"
              onClick={(e) => {
                e.stopPropagation();
                onSendEmail && onSendEmail(bid);
              }}
            />
          ]}
          
          {/* Accepted actions */}
          {bid.status === 'accepted' && [
            <SpeedDialAction
              key="payment"
              icon={<PaymentsIcon />}
              tooltipTitle="Record Payment"
              onClick={(e) => {
                e.stopPropagation();
                onAddPayment && onAddPayment(bid);
              }}
            />,
            <SpeedDialAction
              key="contract"
              icon={<DescriptionIcon />}
              tooltipTitle="Generate Contract"
              onClick={(e) => {
                e.stopPropagation();
                onGenerateContract && onGenerateContract(bid);
              }}
            />,
            <SpeedDialAction
              key="note"
              icon={<NoteIcon />}
              tooltipTitle="Add Note"
              onClick={(e) => {
                e.stopPropagation();
                handleShowNoteDialog(e);
              }}
            />
          ]}
          
          {/* Rejected actions */}
          {bid.status === 'rejected' && [
            <SpeedDialAction
              key="edit"
              icon={<EditIcon />}
              tooltipTitle="Edit Bid"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bid);
              }}
            />,
            <SpeedDialAction
              key="email"
              icon={<EmailIcon />}
              tooltipTitle="Send Email"
              onClick={(e) => {
                e.stopPropagation();
                onSendEmail && onSendEmail(bid);
              }}
            />,
            <SpeedDialAction
              key="delete"
              icon={<DeleteIcon />}
              tooltipTitle="Delete Bid"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(bid);
              }}
            />
          ]}
        </SpeedDial>
      )}
      
      {/* Notes Dialog */}
      <Dialog open={showNoteDialog} onClose={() => setShowNoteDialog(false)} onClick={(e) => e.stopPropagation()}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Note"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNoteDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleInternalAddNote} color="primary" disabled={!note.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={(e) => handleAction(onView, e)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => handleAction(onEdit, e)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => handleAction(onDuplicate, e)}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        {onAddNote && (
          <MenuItem onClick={handleShowNoteDialog}>
            <ListItemIcon>
              <NoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add Note</ListItemText>
          </MenuItem>
        )}
        {onSendEmail && (
          <MenuItem onClick={handleSendEmail}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Email</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={(e) => handleAction(onDeleteRequest, e)} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Helper to check if a date is coming up soon (within 7 days)
const isNearDueDate = (dateStr: string | Date | null | undefined): boolean => {
  if (!dateStr) return false;

  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
};

export default BidCard;
