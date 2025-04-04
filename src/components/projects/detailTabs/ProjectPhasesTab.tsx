import React, { useState, useCallback } from 'react';
import {
  Box,
  Stack,
  Paper,
  Typography,
  Button,
  Tooltip,
  IconButton,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  alpha,
  Theme,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Collapse,
  Badge,
  Fade,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  DonutLarge as DonutLargeIcon,
  AttachMoney as AttachMoneyIcon,
  Construction as ConstructionIcon,
  Pending as PendingIcon,
  Task as TaskIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon,
  Done as DoneIcon,
  Info as InfoIcon,
  Business as BusinessIcon, // Added missing BusinessIcon import
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Handshake as HandshakeIcon,
  Assignment as AssignmentIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart, 
  Area, 
  XAxis, 
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

import { ProjectPhase, Bid, Expense } from '../../../types';

// Helper functions
const getPhaseInitials = (phaseName: string): string => {
  if (!phaseName) return '?';
  return phaseName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const formatPhaseDate = (date: Date | string | number | undefined): string => {
  if (!date) return 'TBD';
  return new Date(date).toLocaleDateString();
};

interface ProjectPhasesTabProps {
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  phaseProposedCosts: Record<string, number>;
  phaseActualCosts: Record<string, number>;
  theme: Theme;
  handleAddPhase: () => void;
  handleUpdatePhase: (phaseId: string) => void;
  handleDeletePhase: (phaseId: string) => void;
  handleOpenQuickBidDialog: (phaseId: string) => void;
  handleOpenQuickExpenseDialog: (phaseId: string) => void;
  handleOpenTemplateAdjuster: (phaseId?: string) => void;
  handleViewPhaseDetails: (phaseId: string) => void;
  getStatusColor: (status: string) => string;
  formatCurrency: (value: number) => string;
}

const ProjectPhasesTab: React.FC<ProjectPhasesTabProps> = ({
  phases,
  bids,
  expenses,
  phaseProposedCosts,
  phaseActualCosts,
  theme,
  handleAddPhase,
  handleUpdatePhase,
  handleDeletePhase,
  handleOpenQuickBidDialog,
  handleOpenQuickExpenseDialog,
  handleOpenTemplateAdjuster,
  handleViewPhaseDetails,
  getStatusColor,
  formatCurrency,
}) => {
  // Get breakpoint for responsive design
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  
  // Add state for expanded details
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const appTheme = useTheme();
  
  // Toggle expanded state for a phase
  const handleToggleExpand = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  // Phase menu handling
  const handlePhaseMenuOpen = (event: React.MouseEvent<HTMLElement>, phaseId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPhaseId(phaseId);
  };

  const handlePhaseMenuClose = () => {
    setAnchorEl(null);
    setSelectedPhaseId(null);
  };

  // Function to get payments for a specific phase from all bids
  const getPhasePayments = (phaseId: string) => {
    const phasePayments: Array<{
      bidId: string;
      bidTitle: string;
      subcontractorName: string;
      payment: any;
    }> = [];
    
    bids.forEach(bid => {
      if (bid.paymentSchedule?.length) {
        // Find all payments in this bid that belong to this phase
        const paymentsForPhase = bid.paymentSchedule.filter(
          payment => payment.phaseId === phaseId
        );
        
        // If we found payments for this phase, add them to our results
        if (paymentsForPhase.length > 0) {
          paymentsForPhase.forEach(payment => {
            phasePayments.push({
              bidId: bid.id,
              bidTitle: bid.title || 'Unnamed Bid',
              subcontractorName: bid.subcontractorName || bid.contractorName || 'Unnamed',
              payment
            });
          });
        }
      }
      
      // Also check for top-level phaseId (legacy support)
      if (bid.phaseId === phaseId) {
        console.log(`Found bid ${bid.id} with top-level phaseId ${phaseId}`);
        // Add a synthetic payment for bids that have phaseId but no payment schedule
        
        // Ensure paymentSchedule exists AND is an array before calling .some()
        const hasMatchingPaymentInSchedule = Array.isArray(bid.paymentSchedule) && 
                                            bid.paymentSchedule.some(payment => payment.phaseId === phaseId);

        if (!hasMatchingPaymentInSchedule) {
          phasePayments.push({
            bidId: bid.id,
            bidTitle: bid.title || 'Unnamed Bid',
            subcontractorName: bid.subcontractorName || bid.contractorName || 'Unnamed',
            payment: {
              id: `synthetic-${bid.id}`,
              name: 'Full Payment',
              amount: bid.totalAmount,
              percentage: 100,
              phaseId: bid.phaseId
            }
          });
        }
      }
    });
    
    return phasePayments;
  };
  
  // Function to get all the bids associated with a phase
  const getPhaseBids = (phaseId: string) => {
    // Get unique bids from the payments list
    const phasePayments = getPhasePayments(phaseId);
    const bidIds = new Set(phasePayments.map(item => item.bidId));
    
    // Return the full bid objects for these IDs
    return bids.filter(bid => bidIds.has(bid.id));
  };
  
  // Get phase expenses
  const getPhaseExpenses = useCallback((phaseId: string) => {
    return expenses.filter(expense => expense.phaseId === phaseId);
  }, [expenses]);

  // Helper to get status text
  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <DoneIcon />;
      case 'in_progress':
        return <ConstructionIcon />;
      case 'not_started':
        return <PendingIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Calculate percentage of budget used for a phase
  const calculateBudgetPercentage = useCallback((phaseId: string, budget: number) => {
    if (budget === 0) return 0;
    return (phaseActualCosts[phaseId] || 0) / budget * 100;
  }, [phaseActualCosts]);

  return (
    <Box>
      {/* Header with title and actions */}
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          position: 'relative',
          pb: 2,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${alpha(appTheme.palette.primary.main, 0.7)} 0%, ${alpha(appTheme.palette.secondary.main, 0.5)} 100%)`,
            borderRadius: '3px'
          }
        }}
      >
        <Box display="flex" alignItems="center">
          <DonutLargeIcon sx={{ 
            fontSize: 38, 
            color: theme.palette.primary.main,
            mr: 2,
            filter: `drop-shadow(0 2px 3px ${alpha(theme.palette.primary.main, 0.3)})`
          }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>Project Phases</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track project milestones and phase completion
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            size="medium"
            color="secondary"
            onClick={() => handleOpenTemplateAdjuster()}
            sx={{ 
              borderRadius: 2,
              boxShadow: `0 2px 5px ${alpha(theme.palette.secondary.main, 0.2)}`,
              fontWeight: 500,
              '&:hover': {
                boxShadow: `0 4px 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
              }
            }}
          >
            Adjust Template
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="medium"
            onClick={handleAddPhase}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
              boxShadow: `0 3px 6px ${alpha(theme.palette.primary.main, 0.25)}`,
              fontWeight: 500,
              '&:hover': {
                boxShadow: `0 5px 10px ${alpha(theme.palette.primary.main, 0.35)}`,
              }
            }}
          >
            Add Phase
          </Button>
        </Box>
      </Box>
      
      {/* Project Timeline Visualization */}
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
          mb: 4,
          overflow: 'hidden',
          p: 0
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            background: `linear-gradient(45deg, ${alpha(theme.palette.background.default, 0.5)}, ${alpha(theme.palette.background.default, 0.8)})`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }}
        >
          <Typography variant="h6" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: theme.palette.primary.main }} />
            Project Timeline
          </Typography>
        </Box>
        
        <Box sx={{ p: 2, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={phases.map(phase => ({
                name: phase.name,
                budget: phase.budget,
                spent: phase.actualCost,
                progress: phase.progress,
                status: phase.status,
              }))}
              margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: theme.palette.text.secondary }} />
              <YAxis fontSize={12} tick={{ fill: theme.palette.text.secondary }} />
              <RechartsTooltip 
                formatter={(value: any, name: string) => [
                  `${formatCurrency(value)}`, 
                  name === 'budget' ? 'Budget' : 'Spent'
                ]}
                labelFormatter={(label) => `Phase: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="budget" 
                name="Budget" 
                stroke={theme.palette.primary.main} 
                fillOpacity={1} 
                fill="url(#colorBudget)" 
              />
              <Area 
                type="monotone" 
                dataKey="spent" 
                name="Spent" 
                stroke={theme.palette.secondary.main} 
                fillOpacity={1} 
                fill="url(#colorSpent)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card>
      
      {/* Phase Cards */}
      {phases.length > 0 ? (
        <Grid container spacing={3}>
          {phases.map((phase, index) => {
            const progress = phase.budget > 0 ? (phase.actualCost / phase.budget) * 100 : 0;
            const isExpanded = expandedPhases[phase.id];
            const phaseBids = getPhaseBids(phase.id);
            const phaseExpenses = getPhaseExpenses(phase.id);
            const proposedCost = phaseProposedCosts[phase.id] || 0;
            const actualCost = phaseActualCosts[phase.id] || 0;
            const budget = phase.budget || 0;
            const budgetUsedPercentage = calculateBudgetPercentage(phase.id, budget);

            return (
              <Grid item xs={12} md={6} lg={4} key={phase.id}>
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
                            mr: 1
                          }} 
                        />
                        <IconButton 
                          aria-label="more options" 
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePhaseMenuOpen(event, phase.id);
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
                    {/* Phase Stats - Compact row of key metrics */}
                    <Grid 
                      container 
                      spacing={1} 
                      sx={{ 
                        mb: 1.5,
                        mt: 0.5
                      }}
                    >
                      {/* Tasks Summary */}
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 0.75, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <TaskIcon 
                            sx={{ 
                              color: theme.palette.info.main,
                              fontSize: '1.2rem',
                              mb: 0.3
                            }} 
                          />
                          <Typography 
                            variant="h6" 
                            color="text.primary" 
                            sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}
                          >
                            {phase.tasks?.length || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Tasks</Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Budget */}
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 0.75, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <AccountBalanceWalletIcon 
                            sx={{ 
                              color: theme.palette.primary.main,
                              fontSize: '1.2rem',
                              mb: 0.3
                            }} 
                          />
                          <Typography 
                            variant="h6" 
                            color="text.primary" 
                            sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}
                          >
                            {formatCurrency(budget)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Budget</Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Proposed Cost */}
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 0.75, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <ConstructionIcon 
                            sx={{ 
                              color: theme.palette.warning.main,
                              fontSize: '1.2rem',
                              mb: 0.3
                            }} 
                          />
                          <Typography 
                            variant="h6" 
                            color="text.primary" 
                            sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}
                          >
                            {formatCurrency(proposedCost)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Proposed</Typography>
                        </Paper>
                      </Grid>
                      
                      {/* Actual Cost */}
                      <Grid item xs={6} sm={3}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 0.75, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: actualCost > budget 
                              ? alpha(theme.palette.error.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <ReceiptIcon 
                            sx={{ 
                              color: actualCost > budget
                                ? theme.palette.error.main
                                : theme.palette.success.main,
                              fontSize: '1.2rem',
                              mb: 0.3
                            }} 
                          />
                          <Typography 
                            variant="h6" 
                            color={actualCost > budget ? "error" : "text.primary"}
                            sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}
                          >
                            {formatCurrency(actualCost)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Actual</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

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
                          value={Math.min(budgetUsedPercentage, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: 
                                actualCost > budget
                                  ? theme.palette.error.main
                                  : theme.palette.success.main,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={
                          actualCost > budget 
                            ? theme.palette.error.main
                            : theme.palette.text.primary
                        }
                        sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}
                      >
                        {budget > 0 ? Math.round((actualCost / budget) * 100) : 0}%
                      </Typography>
                    </Box>

                    {/* Chart area */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      flexGrow: 1,
                      height: 160, 
                      mt: 0.5
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart
                          width={isXs ? 160 : 180}
                          height={160}
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                        >
                          <Pie
                            data={[
                              { name: 'Budget', value: budget, color: theme.palette.primary.main },
                              { name: 'Proposed', value: proposedCost, color: theme.palette.warning.main },
                              { name: 'Actual', value: Math.max(actualCost, 0), color: 
                                actualCost > budget 
                                  ? theme.palette.error.main 
                                  : theme.palette.success.main 
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {[
                              { name: 'Budget', value: budget, color: theme.palette.primary.main },
                              { name: 'Proposed', value: proposedCost, color: theme.palette.warning.main },
                              { name: 'Actual', value: Math.max(actualCost, 0), color: 
                                actualCost > budget 
                                  ? theme.palette.error.main 
                                  : theme.palette.success.main 
                              },
                            ].map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color}
                                stroke={alpha(entry.color, 0.2)}
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Legend 
                            verticalAlign="bottom" 
                            height={24}
                            iconSize={8}
                            iconType="circle"
                            wrapperStyle={{ 
                              fontSize: '0.75rem',
                              marginTop: '-20px'
                            }}
                          />
                          <RechartsTooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                              background: alpha(theme.palette.background.paper, 0.9),
                              borderRadius: 4,
                              fontSize: '0.8rem',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              border: 'none',
                              padding: '4px 8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Phase description - truncated */}
                    <Box sx={{ 
                      mt: 0.5,
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      position: 'relative',
                      display: phase.description ? 'block' : 'none'
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.8rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {phase.description}
                      </Typography>
                      <Box sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '20px',
                        background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.9))'
                      }}/>
                    </Box>

                    {/* Footer actions */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 'auto',
                        pt: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Add expense">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenQuickExpenseDialog(phase.id);
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
                              e.stopPropagation();
                              handleOpenQuickBidDialog(phase.id);
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
                        onClick={() => handleViewPhaseDetails(phase.id)}
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
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 8,
          borderRadius: 3,
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
          bgcolor: alpha(theme.palette.background.default, 0.5),
        }}>
          <TimelineIcon sx={{ 
            fontSize: 70, 
            color: alpha(theme.palette.primary.main, 0.5),
            mb: 2,
            filter: `drop-shadow(0 2px 5px ${alpha(theme.palette.primary.main, 0.2)})`
          }} />
          <Typography variant="h5" color="text.primary" sx={{ fontWeight: 600 }}>No phases defined</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, mt: 1, textAlign: 'center', maxWidth: 400 }}>
            Start by adding project phases to track progress, manage tasks, and monitor expenses.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="large"
            onClick={handleAddPhase}
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.8)})`,
              boxShadow: `0 3px 6px ${alpha(theme.palette.primary.main, 0.3)}`,
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                boxShadow: `0 5px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Add First Phase
          </Button>
        </Box>
      )}
      
      {/* Phase action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePhaseMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            p: 0.5,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (selectedPhaseId) {
              handleUpdatePhase(selectedPhaseId);
              handlePhaseMenuClose();
            }
          }}
          sx={{ borderRadius: 1, py: 1 }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Phase</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedPhaseId) {
              handleViewPhaseDetails(selectedPhaseId);
              handlePhaseMenuClose();
            }
          }}
          sx={{ borderRadius: 1, py: 1 }}
        >
          <ListItemIcon>
            <ChevronRightIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem 
          onClick={() => {
            if (selectedPhaseId) {
              handleDeletePhase(selectedPhaseId);
              handlePhaseMenuClose();
            }
          }}
          sx={{ borderRadius: 1, py: 1, color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Phase</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectPhasesTab;