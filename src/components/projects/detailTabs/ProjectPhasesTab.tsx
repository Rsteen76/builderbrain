import React, { useState } from 'react';
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
  useTheme
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
  const getPhaseExpenses = (phaseId: string) => {
    return expenses.filter(expense => expense.phaseId === phaseId);
  };

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
          {phases.map((phase, index) => (
            <Grid item xs={12} key={phase.id}>
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
                    }
                  }}
                >
                  {/* Status Badge */}
                  <Box 
                    sx={{
                      position: 'absolute',
                      top: -12, 
                      right: 24,
                      zIndex: 2,
                    }}
                  >
                    <Chip
                      icon={getStatusIcon(phase.status)}
                      label={getStatusText(phase.status)}
                      size="medium"
                      sx={{
                        fontWeight: 600,
                        bgcolor: alpha(getStatusColor(phase.status), 0.1),
                        color: getStatusColor(phase.status),
                        borderRadius: 2,
                        boxShadow: `0 2px 6px ${alpha(getStatusColor(phase.status), 0.3)}`
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
                          width: 46,
                          height: 46,
                          boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.15)}`,
                          fontSize: '1.2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        fontSize: '1.25rem',
                        mb: 0.5,
                        background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${alpha(theme.palette.text.primary, 0.7)})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        {phase.name}
                      </Typography>
                    }
                    subheader={
                      <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.text.secondary }}>
                        <ScheduleIcon sx={{ fontSize: '0.9rem', mr: 1, opacity: 0.7 }} />
                        <Typography variant="body2" component="span">
                          {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    action={
                      <Stack direction="row" spacing={1}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleUpdatePhase(phase.id)}
                          sx={{ 
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            borderRadius: 2,
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeletePhase(phase.id)}
                          sx={{ 
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            borderRadius: 2,
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                    sx={{ 
                      pb: 1,
                      '& .MuiCardHeader-content': { 
                        overflow: 'hidden' 
                      },
                    }}
                  />

                  {/* Progress Bar */}
                  <Box sx={{ px: 2, pt: 1, pb: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 1 
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          fontWeight: 500,
                        }}
                      >
                        <ConstructionIcon sx={{ fontSize: '0.9rem', mr: 1 }} />
                        Progress
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{
                          color: phase.progress > 70 
                            ? theme.palette.success.main 
                            : phase.progress > 30 
                              ? theme.palette.warning.main 
                              : theme.palette.info.main,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {phase.progress >= 100 ? <CheckCircleIcon fontSize="small" /> : null}
                        {phase.progress}%
                      </Typography>
                    </Box>

                    <LinearProgress 
                      variant="determinate" 
                      value={phase.progress} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        mb: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.07),
                        '& .MuiLinearProgress-bar': {
                          background: phase.progress >= 100
                            ? `linear-gradient(45deg, ${theme.palette.success.main}, ${alpha(theme.palette.success.main, 0.7)})`
                            : `linear-gradient(45deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
                          borderRadius: 5,
                        }
                      }} 
                    />
                  </Box>

                  <Divider sx={{ mx: 2, opacity: 0.6 }} />
                  
                  {/* Content Section */}
                  <CardContent sx={{ pt: 2, px: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        {/* Description Box */}
                        <Box sx={{ 
                          mb: 2,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                          color: theme.palette.text.secondary,
                          fontSize: '0.9rem',
                          lineHeight: 1.5
                        }}>
                          {phase.description}
                        </Box>

                        {/* Phase Stats */}
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                          <Grid item xs={4}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 1.5, 
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
                                  mb: 0.5
                                }} 
                              />
                              <Typography 
                                variant="h6" 
                                color="text.primary" 
                                sx={{ fontSize: '1.2rem', fontWeight: 700 }}
                              >
                                {phase.tasks?.length || 0}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">Tasks</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={4}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 1.5, 
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
                                  mb: 0.5
                                }} 
                              />
                              <Typography 
                                variant="h6" 
                                color="text.primary" 
                                sx={{ fontSize: '1.2rem', fontWeight: 700 }}
                              >
                                {formatCurrency(phase.budget)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">Budget</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={4}>
                            <Paper 
                              elevation={0} 
                              sx={{ 
                                p: 1.5, 
                                textAlign: 'center',
                                borderRadius: 2,
                                bgcolor: phase.actualCost > phase.budget 
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
                                  color: phase.actualCost > phase.budget
                                    ? theme.palette.error.main
                                    : theme.palette.success.main,
                                  fontSize: '1.6rem',
                                  mb: 0.5
                                }} 
                              />
                              <Typography 
                                variant="h6" 
                                color={phase.actualCost > phase.budget ? "error" : "text.primary"}
                                sx={{ fontSize: '1.2rem', fontWeight: 700 }}
                              >
                                {formatCurrency(phase.actualCost)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">Actual Cost</Typography>
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
                          startIcon={expandedPhases[phase.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ 
                            borderRadius: 2,
                            mb: 1,
                            fontWeight: 500,
                            borderWidth: '1px',
                            '&:hover': {
                              borderWidth: '1px',
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                            }
                          }}
                        >
                          {expandedPhases[phase.id] ? 'Hide Details' : 'Show Details'}
                        </Button>
                        
                        {/* Collapsible Content */}
                        <Collapse in={expandedPhases[phase.id]} timeout="auto">
                          <Box sx={{ mt: 2 }}>
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
                                  }}
                                >
                                  <BusinessIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                                  Bids 
                                  <Chip 
                                    label={getPhaseBids(phase.id).length}
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
                              
                              {getPhaseBids(phase.id).length > 0 ? (
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
                                    label={getPhaseExpenses(phase.id).length}
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
                              
                              {getPhaseExpenses(phase.id).length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {getPhaseExpenses(phase.id)
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
                                  
                                  {getPhaseExpenses(phase.id).length > 3 && (
                                    <Button 
                                      onClick={() => handleViewPhaseDetails(phase.id)}
                                      sx={{ alignSelf: 'center', mt: 1 }}
                                    >
                                      +{getPhaseExpenses(phase.id).length - 3} more expenses
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
                      
                      <Grid item xs={12} md={4}>
                        <Box sx={{ 
                          height: 220,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center'
                        }}>
                          <Box sx={{ 
                            height: 180, 
                            width: 180,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                                    { name: 'Actual', value: Math.max(phase.actualCost, 0), color: theme.palette.error.main }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="value"
                                  strokeWidth={0}
                                >
                                  {[
                                    { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                                    { name: 'Actual', value: Math.max(phase.actualCost, 0), color: 
                                      phase.actualCost > phase.budget 
                                        ? theme.palette.error.main 
                                        : theme.palette.success.main 
                                    }
                                  ].map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.color} 
                                      stroke="none"
                                      fillOpacity={index === 0 ? 0.9 : 0.7}
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
                                textAlign: 'center'
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: 'block', mb: 0.5 }}
                              >
                                Spent
                              </Typography>
                              <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                color={
                                  phase.actualCost > phase.budget 
                                    ? theme.palette.error.main
                                    : theme.palette.text.primary
                                }
                              >
                                {Math.round((phase.actualCost / phase.budget) * 100)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                of budget
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Budget vs Actual Legend */}
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 3, 
                            justifyContent: 'center',
                            mt: 1.5 
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: theme.palette.primary.main,
                                  mr: 1 
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary">
                                Budget: {formatCurrency(phase.budget)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: phase.actualCost > phase.budget 
                                    ? theme.palette.error.main 
                                    : theme.palette.success.main,
                                  mr: 1 
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary">
                                Actual: {formatCurrency(phase.actualCost)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                  
                  {/* Card footer */}
                  <Box 
                    sx={{ 
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      py: 1.5,
                      px: 2,
                      textAlign: 'right',
                      bgcolor: alpha(theme.palette.background.default, 0.4),
                      borderBottomLeftRadius: 3,
                      borderBottomRightRadius: 3,
                    }}
                  >
                    <Button 
                      variant="contained" 
                      size="medium"
                      onClick={() => handleViewPhaseDetails(phase.id)}
                      sx={{ 
                        px: 3,
                        borderRadius: 2,
                        background: 'transparent',
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        position: 'relative',
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.05),
                          border: `1px solid ${theme.palette.primary.main}`,
                        },
                      }}
                    >
                      View Phase Details
                    </Button>
                  </Box>
                </Card>
              </Fade>
            </Grid>
          ))}
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