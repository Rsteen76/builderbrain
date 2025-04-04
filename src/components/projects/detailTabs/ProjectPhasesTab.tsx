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
  useMediaQuery
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
  handleOpenTemplateAdjuster: () => void;
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
  const appTheme = useTheme();
  
  // Toggle expanded state for a phase
  const handleToggleExpand = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
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
            onClick={handleOpenTemplateAdjuster}
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
              <Grid item xs={12} md={6} key={phase.id}>
                <Fade in={true} timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
                      overflow: 'visible',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                        transform: 'translateY(-2px)',
                      },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Status Badge */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: -10, 
                        right: 20,
                        zIndex: 2,
                      }}
                    >
                      <Chip
                        icon={getStatusIcon(phase.status)}
                        label={getStatusText(phase.status)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: alpha(getStatusColor(phase.status), 0.1),
                          color: getStatusColor(phase.status),
                          borderRadius: 3,
                          boxShadow: `0 2px 6px ${alpha(getStatusColor(phase.status), 0.3)}`,
                          '& .MuiChip-icon': {
                            fontSize: '0.9rem',
                            mr: 0.3
                          }
                        }}
                      />
                    </Box>

                    {/* Phase Header */}
                    <CardHeader
                      avatar={
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            width: 42,
                            height: 42,
                            boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.15)}`,
                            fontSize: '1.1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          fontSize: '1.15rem',
                          mb: 0.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.7)})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          {phase.name}
                        </Typography>
                      }
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                          <ScheduleIcon sx={{ fontSize: '0.9rem', mr: 0.5, opacity: 0.7 }} />
                          <Typography variant="body2" component="span" sx={{ fontSize: '0.8rem' }}>
                            {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                      action={
                        <Stack direction="row" spacing={0.5}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleUpdatePhase(phase.id)}
                            sx={{ 
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              borderRadius: 1.5,
                              color: theme.palette.primary.main,
                              padding: '4px',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }
                            }}
                          >
                            <EditIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeletePhase(phase.id)}
                            sx={{ 
                              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                              borderRadius: 1.5,
                              color: theme.palette.error.main,
                              padding: '4px',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Stack>
                      }
                      sx={{ 
                        pb: 1,
                        pt: 2,
                        px: 2,
                        '& .MuiCardHeader-content': { 
                          overflow: 'hidden' 
                        },
                      }}
                    />

                    {/* Progress Bar */}
                    <Box sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 0.5
                      }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        >
                          <ConstructionIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                          Progress
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold" 
                          sx={{
                            color: progress > 100 
                              ? theme.palette.error.main 
                              : progress > 70 
                                ? theme.palette.success.main 
                                : progress > 30 
                                  ? theme.palette.warning.main 
                                  : theme.palette.info.main,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            bgcolor: progress > 100 
                              ? alpha(theme.palette.error.main, 0.1)
                              : progress > 70 
                                ? alpha(theme.palette.success.main, 0.1)
                                : progress > 30 
                                  ? alpha(theme.palette.warning.main, 0.1)
                                  : alpha(theme.palette.info.main, 0.1)
                          }}
                        >
                          {progress >= 100 ? <CheckCircleIcon fontSize="small" /> : null}
                          {progress.toFixed(0)}%
                        </Typography>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(budgetUsedPercentage, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 5,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: 
                              actualCost > budget
                                ? theme.palette.error.main
                                : theme.palette.success.main,
                          },
                        }}
                      />
                    </Box>

                    <Divider sx={{ mx: 2, opacity: 0.6 }} />
                    
                    {/* Content Section - Allow flex grow */}
                    <CardContent sx={{ pt: 2, px: 2.5, flexGrow: 1 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                          {/* Description Box */}
                          <Box sx={{ 
                            mb: 2.5,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                            color: theme.palette.text.secondary,
                            fontSize: '0.95rem',
                            lineHeight: 1.5,
                            maxHeight: '80px',
                            overflow: 'auto',
                            minHeight: '50px',
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            {phase.description || <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>No description</Typography>}
                          </Box>

                          {/* Phase Stats */}
                          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                            {/* Tasks */}
                            <Grid item xs={6}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
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
                                    fontSize: '1.6rem',
                                    mb: 0.75
                                  }} 
                                />
                                <Typography 
                                  variant="h6" 
                                  color="text.primary" 
                                  sx={{ fontSize: '1.3rem', fontWeight: 700 }}
                                >
                                  {phase.tasks?.length || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>Tasks</Typography>
                              </Paper>
                            </Grid>
                            
                            {/* Budget */}
                            <Grid item xs={6}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  textAlign: 'center',
                                  borderRadius: 2,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                }}
                              >
                                <AttachMoneyIcon 
                                  sx={{ 
                                    color: theme.palette.primary.main,
                                    fontSize: '1.6rem',
                                    mb: 0.75
                                  }} 
                                />
                                <Typography 
                                  variant="h6" 
                                  color="text.primary" 
                                  sx={{ fontSize: '1.3rem', fontWeight: 700 }}
                                >
                                  {formatCurrency(phase.budget)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>Budget</Typography>
                              </Paper>
                            </Grid>
                            
                            {/* Proposed Cost */}
                            <Grid item xs={6}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
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
                                    fontSize: '1.6rem',
                                    mb: 0.75
                                  }} 
                                />
                                <Typography 
                                  variant="h6" 
                                  color="text.primary" 
                                  sx={{ fontSize: '1.3rem', fontWeight: 700 }}
                                >
                                  {formatCurrency(proposedCost)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>Proposed</Typography>
                              </Paper>
                            </Grid>
                            
                            {/* Actual Cost */}
                            <Grid item xs={6}>
                              <Paper 
                                elevation={0} 
                                sx={{
                                  p: 2, 
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
                                    fontSize: '1.6rem',
                                    mb: 0.75
                                  }} 
                                />
                                <Typography 
                                  variant="h6" 
                                  color={actualCost > budget ? "error" : "text.primary"}
                                  sx={{ fontSize: '1.3rem', fontWeight: 700 }}
                                >
                                  {formatCurrency(actualCost)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>Actual</Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {/* Toggle Details Button */}
                          <Button 
                            variant="outlined" 
                            fullWidth
                            size="medium"
                            color="primary"
                            onClick={() => handleToggleExpand(phase.id)}
                            startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ 
                              borderRadius: 2,
                              my: 1.5,
                              py: 1,
                              fontWeight: 500,
                              fontSize: '0.95rem',
                              borderWidth: '1px',
                              '&:hover': {
                                borderWidth: '1px',
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                              }
                            }}
                          >
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </Button>
                          
                          {/* Collapsible Content */}
                          <Collapse in={isExpanded} timeout="auto">
                            <Box sx={{ mt: 1 }}>
                              {/* Bids Section */}
                              <Box sx={{ mb: 3 }}>
                                <Box sx={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1.5,
                                  pb: 1,
                                  borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                                }}>
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      fontWeight: 600,
                                      fontSize: '1rem'
                                    }}
                                  >
                                    <BusinessIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                    Bids 
                                    <Chip 
                                      label={phaseBids.length}
                                      size="small"
                                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon fontSize="small" />}
                                    onClick={() => handleOpenQuickBidDialog(phase.id)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ 
                                      borderRadius: 4,
                                      fontSize: '0.75rem',
                                      py: 0.5,
                                    }}
                                  >
                                    Add Bid
                                  </Button>
                                </Box>
                                
                                {phaseBids.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {getPhasePayments(phase.id)
                                      .slice(0, 4)
                                      .map((item, index) => (
                                        <Card
                                          key={`${item.bidId}-${item.payment.id || index}`}
                                          elevation={0}
                                          sx={{ 
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: theme.palette.background.paper,
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                              transform: 'translateX(4px)',
                                              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                                            }
                                          }}
                                        >
                                          <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                          }}>
                                            <Box sx={{ maxWidth: '60%' }}>
                                              <Typography 
                                                variant="body1" 
                                                noWrap 
                                                sx={{ fontWeight: 600 }}
                                              >
                                                {item.subcontractorName}
                                              </Typography>
                                              <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ display: 'block' }}
                                              >
                                                {item.bidTitle} - {item.payment.name}
                                              </Typography>
                                            </Box>
                                            <Badge
                                              color={
                                                item.payment.status === 'paid' ? 'success' :
                                                item.payment.status === 'overdue' ? 'error' :
                                                'primary'
                                              }
                                              badgeContent={
                                                item.payment.status === 'paid' ? 'PAID' :
                                                item.payment.status === 'overdue' ? 'DUE' :
                                                'PENDING'
                                              }
                                              sx={{ mr: 1 }}
                                            >
                                              <Typography 
                                                variant="body1" 
                                                fontWeight="bold"
                                                sx={{ 
                                                  color: 'text.primary',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                }}
                                              >
                                                {formatCurrency(item.payment.amount)}
                                              </Typography>
                                            </Badge>
                                          </Box>
                                        </Card>
                                      ))
                                    }
                                    
                                    {getPhasePayments(phase.id).length > 4 && (
                                      <Button 
                                        onClick={() => handleViewPhaseDetails(phase.id)}
                                        sx={{ alignSelf: 'center', mt: 1 }}
                                      >
                                        +{getPhasePayments(phase.id).length - 4} more payments
                                      </Button>
                                    )}
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    p: 2, 
                                    textAlign: 'center', 
                                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                                    borderRadius: 2,
                                    border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                                  }}>
                                    <Typography variant="body2" color="text.secondary">
                                      No bids yet for this phase
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {/* Expenses Section */}
                              <Box sx={{ mb: 1 }}>
                                <Box sx={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1.5,
                                  pb: 1,
                                  borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                                }}>
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      display: 'flex',
                                      alignItems: 'center',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <ReceiptIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                    Expenses 
                                    <Chip 
                                      label={phaseExpenses.length}
                                      size="small"
                                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                  </Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon fontSize="small" />}
                                    onClick={() => handleOpenQuickExpenseDialog(phase.id)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ 
                                      borderRadius: 4,
                                      fontSize: '0.75rem',
                                      py: 0.5,
                                    }}
                                  >
                                    Add Expense
                                  </Button>
                                </Box>
                                
                                {phaseExpenses.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {phaseExpenses
                                      .slice(0, 3)
                                      .map(expense => (
                                        <Card
                                          key={expense.id}
                                          elevation={0}
                                          sx={{ 
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: theme.palette.background.paper,
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                              transform: 'translateX(4px)',
                                              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                                            }
                                          }}
                                        >
                                          <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                          }}>
                                            <Box sx={{ maxWidth: '70%' }}>
                                              <Typography 
                                                variant="body1" 
                                                noWrap 
                                                sx={{ fontWeight: 600 }}
                                              >
                                                {expense.description || 'Unnamed expense'}
                                              </Typography>
                                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <Chip 
                                                  label={expense.category} 
                                                  size="small"
                                                  sx={{ 
                                                    height: 20, 
                                                    fontSize: '0.7rem',
                                                    mr: 1,
                                                    bgcolor: theme.palette.grey[100]
                                                  }}
                                                />
                                                {expense.vendor && (
                                                  <Typography variant="caption" color="text.secondary">
                                                    {expense.vendor}
                                                  </Typography>
                                                )}
                                              </Box>
                                            </Box>
                                            <Typography 
                                              variant="body1" 
                                              fontWeight="bold"
                                              sx={{ color: theme.palette.error.main }}
                                            >
                                              {formatCurrency(expense.amount)}
                                            </Typography>
                                          </Box>
                                        </Card>
                                      ))
                                    }
                                    
                                    {phaseExpenses.length > 3 && (
                                      <Button 
                                        onClick={() => handleViewPhaseDetails(phase.id)}
                                        sx={{ alignSelf: 'center', mt: 1 }}
                                      >
                                        +{phaseExpenses.length - 3} more expenses
                                      </Button>
                                    )}
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    p: 2, 
                                    textAlign: 'center', 
                                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                                    borderRadius: 2,
                                    border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                                  }}>
                                    <Typography variant="body2" color="text.secondary">
                                      No expenses yet for this phase
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Collapse>
                        </Grid>
                        
                        <Grid item xs={12} md={5}>
                          <Box sx={{ 
                            height: 250,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              height: 200, 
                              width: 200,
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart
                                  width={isXs ? 180 : 200}
                                  height={180}
                                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
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
                                    innerRadius={45}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    strokeWidth={0}
                                  >
                                    {[
                                      { name: 'Budget', value: budget, color: theme.palette.primary.main },
                                      { name: 'Proposed', value: proposedCost, color: theme.palette.warning.main },
                                      { name: 'Actual', value: Math.max(actualCost, 0), color: 
                                        actualCost > budget 
                                          ? theme.palette.error.main 
                                          : theme.palette.success.main 
                                      }
                                    ].map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color} 
                                        stroke="none"
                                        fillOpacity={index === 0 ? 0.9 : index === 1 ? 0.8 : 0.7}
                                      />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                                </PieChart>
                              </ResponsiveContainer>
                              
                              {/* Center content */}
                              <Box 
                                sx={{ 
                                  position: 'absolute',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                                  borderRadius: '50%',
                                  width: 80,
                                  height: 80,
                                  boxShadow: `0 0 10px ${alpha(theme.palette.common.black, 0.05)}`
                                }}
                              >
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ display: 'block', fontSize: '0.85rem' }}
                                >
                                  Spent
                                </Typography>
                                <Typography 
                                  variant="h6" 
                                  fontWeight="bold"
                                  color={
                                    actualCost > budget 
                                      ? theme.palette.error.main
                                      : theme.palette.text.primary
                                  }
                                  sx={{ lineHeight: 1.2, fontSize: '1.4rem' }}
                                >
                                  {budget > 0 ? Math.round((actualCost / budget) * 100) : 0}%
                                </Typography>
                              </Box>
                            </Box>
                            
                            {/* Budget vs Actual Legend */}
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap',
                              gap: 2.5,
                              justifyContent: 'center',
                              mt: 2.5 
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box 
                                  sx={{ 
                                    width: 14, 
                                    height: 14, 
                                    borderRadius: '50%', 
                                    bgcolor: theme.palette.primary.main,
                                    mr: 0.75 
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  Budget
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box 
                                  sx={{ 
                                    width: 14, 
                                    height: 14, 
                                    borderRadius: '50%', 
                                    bgcolor: theme.palette.warning.main,
                                    mr: 0.75
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  Proposed
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box 
                                  sx={{ 
                                    width: 14, 
                                    height: 14, 
                                    borderRadius: '50%', 
                                    bgcolor: actualCost > budget 
                                      ? theme.palette.error.main 
                                      : theme.palette.success.main,
                                    mr: 0.75
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                  Actual
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    
                    {/* Card footer - Pushed to bottom */}
                    <Box 
                      sx={{ 
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        py: 1.75,
                        px: 2.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: alpha(theme.palette.background.default, 0.4),
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                        marginTop: 'auto'
                      }}
                    >
                      <Box display="flex" gap={2}>
                        <Tooltip title="Add Bid">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenQuickBidDialog(phase.id)}
                            sx={{ 
                              color: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                              borderRadius: 1.5,
                              padding: '7px'
                            }}
                          >
                            <BusinessIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Expense">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenQuickExpenseDialog(phase.id)}
                            sx={{ 
                              color: theme.palette.error.main,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                              borderRadius: 1.5,
                              padding: '7px'
                            }}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Button 
                        variant="text" 
                        size="small"
                        onClick={() => handleViewPhaseDetails(phase.id)}
                        endIcon={<ExpandMoreIcon 
                          sx={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }} 
                        />}
                        sx={{ 
                          fontWeight: 500,
                          color: theme.palette.text.secondary,
                          fontSize: '0.9rem',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </Button>
                    </Box>
                  </Card>
                </Fade>
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
    </Box>
  );
};

export default ProjectPhasesTab;