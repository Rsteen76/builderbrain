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
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Bid, BidSummary, BidPaymentStage } from '../../types';

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

// Type guard to check if bid is a full Bid or just a BidSummary
const isFullBid = (bid: BidSummary | Bid): bid is Bid => {
  return 'scope' in bid || 
         'paymentSchedule' in bid || 
         'attachments' in bid;
};

// Safe date formatter to handle possibly null/undefined dates
const safeFormatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  return formatDate(new Date(date));
};

export interface BidCardProps {
  bid: BidSummary | Bid;
  onView: (bid: BidSummary | Bid) => void;
  onEdit: (bid: BidSummary | Bid) => void;
  onDeleteRequest: (bid: BidSummary | Bid) => void;
  onDuplicate: (bid: BidSummary | Bid) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onStatusChange?: (bid: BidSummary | Bid, newStatus: string) => void;
  onAddPayment?: (bid: BidSummary | Bid) => void;
  onViewDocument?: (documentId: string) => void;
  onSendEmail?: (bid: BidSummary | Bid) => void;
  onAddNote?: (bid: BidSummary | Bid, note: string) => void;
  onGenerateContract?: (bid: BidSummary | Bid) => void;
  fullBidData?: boolean;
}

const BidCard: React.FC<BidCardProps> = ({ 
  bid, 
  onView, 
  onEdit, 
  onDeleteRequest, 
  onDuplicate,
  onMenuOpen,
  onStatusChange,
  onAddPayment,
  onViewDocument,
  onSendEmail,
  onAddNote,
  onGenerateContract,
  fullBidData = false,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [note, setNote] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const open = Boolean(anchorEl);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use type guard to check if we have full bid data
  const hasFull = isFullBid(bid);

  const handleToggleExpand = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent card click through
    setAnchorEl(event.currentTarget);
    if (onMenuOpen) onMenuOpen(event);
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
  };

  const handleAddNote = () => {
    if (onAddNote && note.trim()) {
      onAddNote(bid, note);
      setNote("");
    }
    setShowNoteDialog(false);
  };

  const handleStatusChange = (newStatus: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(bid, newStatus);
    }
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

  // Get payment progress
  const paymentProgress = useMemo(() => {
    if (hasFull && 'paymentProgress' in bid && bid.paymentProgress) {
      return {
        percentage: bid.totalAmount > 0 
          ? Math.round((bid.paymentProgress.paid / bid.totalAmount) * 100) 
          : 0,
        paid: bid.paymentProgress.paid,
        remaining: bid.paymentProgress.remaining
      };
    }
    return { percentage: 0, paid: 0, remaining: bid.totalAmount };
  }, [bid, hasFull]);

  // Get payment schedule
  const paymentSchedule = useMemo(() => {
    if (hasFull && 'paymentSchedule' in bid && Array.isArray(bid.paymentSchedule)) {
      return bid.paymentSchedule || [];
    }
    return [];
  }, [bid, hasFull]);

  // Get documents
  const documents = useMemo(() => {
    if (hasFull && 'attachments' in bid && Array.isArray(bid.attachments)) {
      return bid.attachments || [];
    }
    return [];
  }, [bid, hasFull]);

  // Get bid details
  const bidDetails = useMemo(() => {
    return {
      scope: hasFull && 'scope' in bid ? bid.scope : undefined,
      notes: hasFull && 'notes' in bid ? bid.notes : undefined,
      phaseId: hasFull && 'phaseId' in bid ? bid.phaseId : undefined,
      phaseName: hasFull && 'phaseName' in bid ? bid.phaseName : undefined,
      startDate: hasFull && 'startDate' in bid ? bid.startDate : undefined,
      completionDate: hasFull && 'completionDate' in bid ? bid.completionDate : undefined,
    };
  }, [bid, hasFull]);

  // Get notes
  const notesList = useMemo(() => {
    const notes = bidDetails.notes;
    if (!notes) return [];

    // If notes is a string, convert to an array with a single note object
    if (typeof notes === 'string') {
      return [{
        id: '1',
        content: notes,
        createdAt: bid.createdAt,
        createdBy: hasFull && 'createdBy' in bid ? bid.createdBy : 'System'
      }];
    }
    
    // If it's already an array, return it
    if (Array.isArray(notes)) {
      return notes;
    }
    
    return [];
  }, [bid, bidDetails.notes, hasFull]);

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 1,
        border: '1px solid',
        borderColor: expanded 
          ? safeAlpha(theme.palette.primary.main, 0.4) 
          : safeAlpha(theme.palette.divider, 0.1),
        boxShadow: expanded ? theme.shadows[3] : theme.shadows[1],
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          transform: expanded ? 'none' : 'translateY(-2px)',
          boxShadow: expanded ? theme.shadows[4] : theme.shadows[3],
          '.action-menu-button': { 
            opacity: 1,
            backgroundColor: safeAlpha(theme.palette.grey[200], 0.5)
          },
        },
        ...(isDeadlineClose && {
          borderColor: expanded 
            ? safeAlpha(theme.palette.warning.main, 0.6) 
            : safeAlpha(theme.palette.warning.main, 0.4),
        }),
        ...(bid.priority === 'urgent' && {
          borderLeft: `4px solid ${theme.palette.error.main}`,
        })
      }}
    >
      <CardContent 
        sx={{ 
          pb: 1, 
          '&:last-child': { pb: 1 },
          pt: 2,
          cursor: 'pointer',
        }}
        onClick={() => !expanded && onView(bid)}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Bid Header - Always visible */}
          <Grid item xs={12} sm={expanded ? 8 : 6}>
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
                onClick={e => {
                  e.stopPropagation();
                  onView(bid);
                }}
              >
                {bid.title || 'Untitled Bid'}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mb: 1 }}
              >
                Project: {bid.projectName || 'N/A'}
                {bidDetails.phaseId && ` • Phase: ${bidDetails.phaseName || 'N/A'}`}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                <Chip 
                  size="small" 
                  label={STATUS_DISPLAY[bid.status] || bid.status} 
                  color={bidStatusColors[bid.status] as any} 
                  sx={{ fontWeight: 500 }}
                  onClick={e => e.stopPropagation()}
                />
                {bid.priority && (
                  <Chip 
                    size="small" 
                    label={PRIORITY_DISPLAY[bid.priority] || bid.priority} 
                    color={bidPriorityColors[bid.priority] as any} 
                    sx={{ fontWeight: 500 }}
                    onClick={e => e.stopPropagation()}
                  />
                )}
                {isDeadlineClose && (
                  <Chip 
                    size="small" 
                    label="Deadline Soon" 
                    color="warning" 
                    sx={{ fontWeight: 500 }}
                    onClick={e => e.stopPropagation()}
                  />
                )}
                {bidDetails.scope && (
                  <Chip 
                    size="small" 
                    label={bidDetails.scope} 
                    variant="outlined"
                    onClick={e => e.stopPropagation()}
                  />
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={expanded ? 2 : 3}>
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
          <Grid item xs={10} sm={expanded ? 1 : 2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Amount
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                {formatCurrency(bid.totalAmount)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={2} sm={1} sx={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title={expanded ? "Collapse" : "Expand"}>
              <IconButton
                aria-label={expanded ? "collapse" : "expand"}
                onClick={handleToggleExpand}
                size="small"
                sx={{ boxShadow: 1, bgcolor: 'background.paper' }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
            <IconButton
              aria-label="actions"
              onClick={handleMenuClick}
              size="small"
              className="action-menu-button"
              sx={{ 
                opacity: { xs: 1, sm: 0.5 }, 
                transition: 'opacity 0.2s, background-color 0.2s',
                boxShadow: 1, 
                bgcolor: 'background.paper'
              }} 
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="bid-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
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
              <Divider />
              {bid.status === 'draft' && onStatusChange && (
                <MenuItem onClick={handleStatusChange('submitted')}>
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Submit Bid</ListItemText>
                </MenuItem>
              )}
              {bid.status === 'submitted' && onStatusChange && (
                <>
                  <MenuItem onClick={handleStatusChange('accepted')}>
                    <ListItemIcon>
                      <CheckCircleIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText>Accept Bid</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleStatusChange('rejected')}>
                    <ListItemIcon>
                      <CancelIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Reject Bid</ListItemText>
                  </MenuItem>
                </>
              )}
              {onGenerateContract && (
                <MenuItem onClick={(e) => handleAction(onGenerateContract, e)}>
                  <ListItemIcon>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Generate Contract</ListItemText>
                </MenuItem>
              )}
              {onSendEmail && (
                <MenuItem onClick={(e) => handleAction(onSendEmail, e)}>
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Send Email</ListItemText>
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={(e) => handleAction(onDeleteRequest, e)}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>

        {/* Expanded View */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            {/* Quick Action Buttons */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(bid);
                }}
              >
                Edit
              </Button>
              
              {bid.status === 'draft' && onStatusChange && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                  startIcon={<EmailIcon />}
                  onClick={handleStatusChange('submitted')}
                >
                  Submit
                </Button>
              )}
              
              {bid.status === 'submitted' && onStatusChange && (
                <>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleStatusChange('accepted')}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleStatusChange('rejected')}
                  >
                    Reject
                  </Button>
                </>
              )}
              
              {onAddPayment && bid.status === 'accepted' && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="primary"
                  startIcon={<AttachMoneyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPayment(bid);
                  }}
                >
                  Add Payment
                </Button>
              )}
              
              {onGenerateContract && (
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<DescriptionIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateContract(bid);
                  }}
                >
                  Generate Contract
                </Button>
              )}
              
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<NoteIcon />}
                onClick={handleShowNoteDialog}
              >
                Add Note
              </Button>
            </Box>
            
            {/* Payment Progress */}
            {bid.status === 'accepted' && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2">Payment Progress</Typography>
                  <Typography variant="body2">
                    {formatCurrency(paymentProgress.paid)} / {formatCurrency(bid.totalAmount)} ({paymentProgress.percentage}%)
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={paymentProgress.percentage} 
                  color={paymentProgress.percentage === 100 ? "success" : "primary"} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
            
            {/* Detailed Information in Tabs */}
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={handleChangeTab}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab icon={<AssignmentIcon fontSize="small" />} iconPosition="start" label="Details" />
                {bid.status === 'accepted' && <Tab icon={<AttachMoneyIcon fontSize="small" />} iconPosition="start" label="Payments" />}
                <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Documents" />
                <Tab icon={<NoteIcon fontSize="small" />} iconPosition="start" label="Notes" />
              </Tabs>
              
              {/* Details Tab */}
              <Box role="tabpanel" hidden={activeTab !== 0} sx={{ p: 2 }}>
                {activeTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Scope</Typography>
                          <Typography variant="body1">{bidDetails.scope || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Description</Typography>
                          <Typography variant="body1">
                            {hasFull && 'notes' in bid ? (bid.notes as string) || 'No description provided' : 'No description provided'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Timeline</Typography>
                          <Typography variant="body1">
                            {safeFormatDate(bidDetails.startDate)} - {safeFormatDate(bidDetails.completionDate)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Budget</Typography>
                          <Typography variant="body1">
                            {hasFull && 'bidAmount' in bid ? formatCurrency(bid.bidAmount || 0) : 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Bid Amount</Typography>
                          <Typography variant="body1" fontWeight={500} color="primary.main">
                            {formatCurrency(bid.totalAmount)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Subcontractor</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body1">{bid.subcontractorName || 'N/A'}</Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                )}
              </Box>
              
              {/* Payments Tab */}
              <Box role="tabpanel" hidden={activeTab !== 1} sx={{ p: 2 }}>
                {activeTab === 1 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Payment Schedule</Typography>
                      {onAddPayment && (
                        <Button 
                          size="small" 
                          startIcon={<AddIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddPayment(bid);
                          }}
                        >
                          Add Payment
                        </Button>
                      )}
                    </Box>
                    
                    {paymentSchedule.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Stage</TableCell>
                              <TableCell align="right">Amount</TableCell>
                              <TableCell align="right">Percentage</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Due Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentSchedule.map((stage: BidPaymentStage) => (
                              <TableRow key={stage.id}>
                                <TableCell>
                                  <Tooltip title={stage.description || ''}>
                                    <Typography variant="body2" noWrap>{stage.name}</Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="right">{formatCurrency(stage.amount)}</TableCell>
                                <TableCell align="right">{stage.percentage}%</TableCell>
                                <TableCell>
                                  <Chip 
                                    size="small" 
                                    label={stage.status.charAt(0).toUpperCase() + stage.status.slice(1)} 
                                    color={stage.status === 'paid' ? 'success' : 'default'}
                                  />
                                </TableCell>
                                <TableCell>
                                  {stage.dueDate ? formatDate(new Date(stage.dueDate)) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                        No payment stages defined.
                      </Typography>
                    )}
                  </>
                )}
              </Box>
              
              {/* Documents Tab */}
              <Box role="tabpanel" hidden={activeTab !== 2} sx={{ p: 2 }}>
                {activeTab === 2 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Documents</Typography>
                      <Button 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(bid); // Navigate to detail view for document upload
                        }}
                      >
                        Add Document
                      </Button>
                    </Box>
                    
                    {documents.length > 0 ? (
                      <Stack spacing={1} sx={{ maxHeight: 220, overflow: 'auto' }}>
                        {documents.map((doc: any, index: number) => (
                          <Paper
                            key={doc.id || doc.url || index}
                            variant="outlined"
                            sx={{
                              p: 1.5, 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon color="primary" fontSize="small" />
                              <Box>
                                <Typography variant="body2" fontWeight={500}>{doc.name || `Document ${index + 1}`}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {doc.type || 'File'} • {doc.createdAt ? formatDate(new Date(doc.createdAt)) : formatDate(new Date(bid.createdAt))}
                                </Typography>
                              </Box>
                            </Box>
                            <Box>
                              {onViewDocument && doc.id && (
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDocument(doc.id);
                                  }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              )}
                              {!doc.id && doc.url && (
                                <IconButton 
                                  size="small" 
                                  component="a"
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                        No documents attached.
                      </Typography>
                    )}
                  </>
                )}
              </Box>
              
              {/* Notes Tab */}
              <Box role="tabpanel" hidden={activeTab !== 3} sx={{ p: 2 }}>
                {activeTab === 3 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">Notes</Typography>
                      <Button 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={handleShowNoteDialog}
                      >
                        Add Note
                      </Button>
                    </Box>
                    
                    {notesList.length > 0 ? (
                      <Stack spacing={1} sx={{ maxHeight: 220, overflow: 'auto' }}>
                        {notesList.map((note: any, index: number) => (
                          <Paper
                            key={note.id || index}
                            variant="outlined"
                            sx={{ p: 1.5 }}
                          >
                            <Typography variant="body2">{note.content || note}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                By: {note.createdBy || 'System'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {note.createdAt ? formatDate(new Date(note.createdAt)) : formatDate(new Date(bid.createdAt))}
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                        No notes added.
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </Paper>
            
            {bid.status === 'accepted' && hasFull && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Key Dates</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    size="small" 
                    icon={<ScheduleIcon fontSize="small" />} 
                    label={`Accepted: ${formatDate(new Date(bid.updatedAt))}`} 
                  />
                  {bidDetails.startDate && (
                    <Chip 
                      size="small" 
                      icon={<ScheduleIcon fontSize="small" />} 
                      label={`Start: ${safeFormatDate(bidDetails.startDate)}`} 
                    />
                  )}
                  {bidDetails.completionDate && (
                    <Chip 
                      size="small" 
                      icon={<ScheduleIcon fontSize="small" />} 
                      label={`Completion: ${safeFormatDate(bidDetails.completionDate)}`} 
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
      
      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onClose={() => setShowNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note to Bid</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="note"
            label="Note"
            type="text"
            fullWidth
            variant="outlined"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNoteDialog(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!note.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default BidCard;