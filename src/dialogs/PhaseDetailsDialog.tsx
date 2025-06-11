import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Card,
  CardContent,
  Stack,
  Paper,
  useTheme,
  alpha,
  CircularProgress,
  Badge,
} from '@mui/material';
import { 
  Edit as EditIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  DonutLarge as DonutLargeIcon,
  HandshakeOutlined as HandshakeIcon,
  ReceiptOutlined as ReceiptIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Phase, Bid, Expense, Task, ProjectPhase } from '../types';
import { useProjectDetail } from '../contexts/ProjectDetailContext';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import { Timestamp } from 'firebase/firestore';

// Helper function to get phase status color
const getPhaseStatusColor = (status: string | undefined, theme: any): string => {
  if (!status) return theme.palette.grey[500];
  
  switch(status) {
    case 'completed': return theme.palette.success.main;
    case 'in_progress': return theme.palette.info.main;
    case 'not_started': return theme.palette.grey[600];
    case 'planning': return theme.palette.secondary.main;
    case 'on_hold': return theme.palette.warning.main;
    case 'delayed': return theme.palette.error.main;
    default: return theme.palette.grey[500];
  }
};

// Helper function to get phase status icon
const getPhaseStatusIcon = (status: string | undefined): React.ReactElement => {
  switch(status) {
    case 'completed': return <CheckCircleIcon />;
    case 'in_progress': return <PlayArrowIcon />;
    case 'not_started': return <DonutLargeIcon />;
    case 'planning': return <TimelineIcon />;
    case 'on_hold': return <PauseIcon />;
    case 'delayed': return <WarningIcon />;
    default: return <DonutLargeIcon />;
  }
};

// Tab Panel component for the tabbed interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`phase-tabpanel-${index}`}
      aria-labelledby={`phase-tab-${index}`}
      {...other}
      style={{ padding: 0 }}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface PhaseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  phase: Phase | null;
}

const PhaseDetailsDialog: React.FC<PhaseDetailsDialogProps> = ({
  open,
  onClose,
  phase,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const { bids, expenses, loading } = useProjectDetail();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter related data for this phase
  const phaseBids = useMemo(() => {
    if (!phase || !bids) return [];
    return bids.filter(bid => bid.phaseId === phase.id);
  }, [phase, bids]);

  const phaseExpenses = useMemo(() => {
    if (!phase || !expenses) return [];
    return expenses.filter(expense => expense.phaseId === phase.id);
  }, [phase, expenses]);

  const phaseBudgetUsage = useMemo(() => {
    if (!phase || typeof phase.budget !== 'number' || !phase.actualCost) return 0;
    return Math.min((phase.actualCost / phase.budget) * 100, 100);
  }, [phase]);

  const phaseStatus = useMemo(() => {
    if (!phase || !phase.status) return 'Unknown';
    // Convert from snake_case to Title Case
    return phase.status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [phase]);

  const phaseStatusColor = useMemo(() => {
    return getPhaseStatusColor(phase?.status, theme);
  }, [phase?.status, theme]);

  const phaseDateRange = useMemo(() => {
    if (!phase) return 'No dates available';
    
    const startDate = phase?.startDate ? (
      phase.startDate instanceof Date ? 
        phase.startDate : 
        typeof phase.startDate === 'object' && phase.startDate && 'toDate' in phase.startDate ?
          (phase.startDate as Timestamp).toDate() :
          new Date(String(phase.startDate))
    ) : null;
    
    const endDate = phase?.endDate ? (
      phase.endDate instanceof Date ? 
        phase.endDate : 
        typeof phase.endDate === 'object' && phase.endDate && 'toDate' in phase.endDate ?
          (phase.endDate as Timestamp).toDate() :
          new Date(String(phase.endDate))
    ) : null;

    if (startDate && endDate) {
      return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    } else if (startDate) {
      return `From ${format(startDate, 'MMM d, yyyy')}`;
    } else if (endDate) {
      return `Until ${format(endDate, 'MMM d, yyyy')}`;
    }
    
    return 'No dates available';
  }, [phase]);

  if (!phase) {
    return null; // Don't render if no phase is selected
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        }
      }}
    >
      {/* Header with fancy gradient background */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(45deg, ${alpha(phaseStatusColor, 0.8)} 30%, ${alpha(theme.palette.primary.main, 0.85)} 90%)`,
          color: 'white',
          py: 3,
          px: 3,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: alpha('#fff', 0.2),
              color: 'white',
              mr: 2,
              width: 56,
              height: 56,
            }}
          >
            {getPhaseStatusIcon(phase.status)}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h2" fontWeight="bold">
              {phase.name}
            </Typography>
            <Chip 
              label={phaseStatus} 
              size="small"
              icon={<Box sx={{ '& .MuiSvgIcon-root': { fontSize: '1rem !important', color: 'inherit !important' } }}>
                {getPhaseStatusIcon(phase.status)}
              </Box>}
              sx={{ 
                bgcolor: alpha('#fff', 0.2),
                color: 'white',
                fontWeight: 500,
                mt: 1,
                '& .MuiChip-icon': { color: 'white' }
              }} 
            />
          </Box>
        </Box>
        
        {/* Key metrics in header */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: '50%', 
                  bgcolor: alpha('#fff', 0.2),
                  display: 'flex',
                  mr: 1
                }}
              >
                <AttachMoneyIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Budget
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(phase.budget || 0)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: '50%', 
                  bgcolor: alpha('#fff', 0.2),
                  display: 'flex',
                  mr: 1
                }}
              >
                <DonutLargeIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Progress
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatPercentage(phase.progress || 0)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: '50%', 
                  bgcolor: alpha('#fff', 0.2),
                  display: 'flex',
                  mr: 1
                }}
              >
                <CalendarIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Timeline
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                  {phaseDateRange}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Budget progress bar */}
      <Box sx={{ px: 0 }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            Budget Usage: {formatCurrency(phase.actualCost || 0)} of {formatCurrency(phase.budget || 0)}
          </Typography>
          <Typography variant="body2" fontWeight="bold" color={phaseBudgetUsage > 90 ? 'error.main' : 'text.primary'}>
            {phaseBudgetUsage.toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={phaseBudgetUsage} 
          sx={{
            height: 8,
            borderRadius: 0,
            bgcolor: alpha(theme.palette.grey[300], 0.5),
            '& .MuiLinearProgress-bar': {
              bgcolor: phaseBudgetUsage > 90 ? theme.palette.error.main : theme.palette.success.main,
            }
          }}
        />
      </Box>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="phase details tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 500,
            },
            '& .Mui-selected': {
              fontWeight: 600,
            }
          }}
        >
          <Tab 
            label="Overview" 
            icon={<DescriptionIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Bids</span>
                <Badge badgeContent={phaseBids.length} color="primary" sx={{ ml: 1 }}>
                  <Box />
                </Badge>
              </Box>
            } 
            icon={<HandshakeIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>Expenses</span>
                <Badge badgeContent={phaseExpenses.length} color="primary" sx={{ ml: 1 }}>
                  <Box />
                </Badge>
              </Box>
            } 
            icon={<ReceiptIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Tab: Overview */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            {/* Description */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
                Description
              </Typography>
              <Typography variant="body1">
                {phase.description || 'No description provided.'}
              </Typography>
            </Paper>

            {/* Timeline */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
                Timeline
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Start Date</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {phase.startDate ? formatDate(phase.startDate) : 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">End Date</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {phase.endDate ? formatDate(phase.endDate) : 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Financial Summary */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
                Financial Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Budget</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(phase.budget || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Actual Cost</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(phase.actualCost || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Variance</Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      color={(phase.budget || 0) < (phase.actualCost || 0) ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency((phase.budget || 0) - (phase.actualCost || 0))}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Budget Used</Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      color={phaseBudgetUsage > 90 ? 'error.main' : 'text.primary'}
                    >
                      {phaseBudgetUsage.toFixed(0)}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </TabPanel>

        {/* Tab: Bids */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            {phaseBids.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${theme.palette.divider}` }}>
                <HandshakeIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No Bids Found</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  There are no bids associated with this phase yet.
                </Typography>
                <Button startIcon={<AddIcon />} variant="contained" color="primary">
                  Add New Bid
                </Button>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Phase Bids</Typography>
                  <Button startIcon={<AddIcon />} variant="contained" color="primary" size="small">
                    Add Bid
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {phaseBids.map((bid) => (
                    <Paper 
                      key={bid.id} 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle1" fontWeight="medium">{bid.title || 'Unnamed Bid'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bid.subcontractorName || 'No subcontractor'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(bid.totalAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={bid.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                            size="small"
                            sx={{ 
                              bgcolor: alpha(
                                bid.status === 'accepted' ? theme.palette.success.main :
                                bid.status === 'rejected' ? theme.palette.error.main :
                                bid.status === 'submitted' ? theme.palette.info.main :
                                theme.palette.grey[500]
                              , 0.1),
                              color: 
                                bid.status === 'accepted' ? theme.palette.success.main :
                                bid.status === 'rejected' ? theme.palette.error.main :
                                bid.status === 'submitted' ? theme.palette.info.main :
                                theme.palette.grey[700],
                              fontWeight: 500,
                            }} 
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Tab: Expenses */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            {phaseExpenses.length === 0 ? (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.6), border: `1px solid ${theme.palette.divider}` }}>
                <ReceiptIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No Expenses Found</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  There are no expenses associated with this phase yet.
                </Typography>
                <Button startIcon={<AddIcon />} variant="contained" color="primary">
                  Add New Expense
                </Button>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Phase Expenses</Typography>
                  <Button startIcon={<AddIcon />} variant="contained" color="primary" size="small">
                    Add Expense
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {phaseExpenses.map((expense) => (
                    <Paper 
                      key={expense.id} 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.1)}`,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <Typography variant="subtitle1" fontWeight="medium">{expense.description}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {expense.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {expense.vendor && ` • ${expense.vendor}`}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(expense.amount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="body2" color="text.secondary">Date</Typography>
                          <Typography variant="body2">
                            {typeof expense.date === 'string' ? expense.date : formatDate(expense.date)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={expense.status.replace(/\b\w/g, l => l.toUpperCase())} 
                            size="small"
                            sx={{ 
                              bgcolor: alpha(
                                expense.status === 'approved' ? theme.palette.success.main :
                                expense.status === 'rejected' ? theme.palette.error.main :
                                expense.status === 'pending' ? theme.palette.warning.main :
                                theme.palette.info.main
                              , 0.1),
                              color: 
                                expense.status === 'approved' ? theme.palette.success.main :
                                expense.status === 'rejected' ? theme.palette.error.main :
                                expense.status === 'pending' ? theme.palette.warning.main :
                                theme.palette.info.main,
                              fontWeight: 500,
                            }} 
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Edit Phase
          </Button>
          <Button 
            variant="contained"
            color="secondary"
            startIcon={getPhaseStatusIcon(phase.status)}
          >
            Update Status
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PhaseDetailsDialog; 