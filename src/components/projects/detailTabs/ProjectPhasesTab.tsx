import React from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

import { ProjectPhase, Bid, Expense } from '../../../types'; // Corrected path

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
        if (!bid.paymentSchedule?.some(payment => payment.phaseId === phaseId)) {
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Project Phases</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Adjust project template phases">
            <Button
              startIcon={<EditIcon />}
              size="small"
              color="secondary"
              onClick={handleOpenTemplateAdjuster}
            >
              Adjust Template
            </Button>
          </Tooltip>
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={handleAddPhase}
          >
            Add Phase
          </Button>
        </Box>
      </Box>
      
      {/* Phase List */}
      {phases.length > 0 ? (
        <Stack spacing={2}>
          {phases.map((phase, index) => (
            <Paper 
              key={phase.id} 
              elevation={0}
              sx={{ 
                p: 0, 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden'
              }}
            >
              <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexGrow: 1,
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: alpha(getStatusColor(phase.status), 0.1),
                        color: getStatusColor(phase.status),
                        width: 28,
                        height: 28,
                        mr: 1.5,
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2 }}>
                        {phase.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: { xs: 'flex', sm: 'none' }, mt: { xs: 1, sm: 0 } }}>
                    <Chip
                      label={phase.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: alpha(getStatusColor(phase.status), 0.1),
                        color: getStatusColor(phase.status),
                        borderRadius: 1
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  mt: { xs: 2, sm: 0 },
                  gap: 2,
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'space-between', sm: 'flex-end' }
                }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Chip
                      label={phase.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        bgcolor: alpha(getStatusColor(phase.status), 0.1),
                        color: getStatusColor(phase.status),
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleUpdatePhase(phase.id)}
                      sx={{ 
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 1,
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeletePhase(phase.id)}
                      sx={{ 
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                        color: theme.palette.error.main,
                        borderRadius: 1,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
              
              <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={8}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress ({phase.progress}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={phase.progress} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          mb: 1,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }} 
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Tasks</Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {phase.tasks?.length || 0} tasks
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" align="right">Budget</Typography>
                          <Typography variant="body1" fontWeight="medium" align="right">
                            {formatCurrency(phase.budget)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" align="right">Actual Cost</Typography>
                          <Typography 
                            variant="body1" 
                            fontWeight="medium" 
                            align="right"
                            color={phase.actualCost > phase.budget ? 'error' : 'inherit'}
                          >
                            {formatCurrency(phase.actualCost)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Add section to display bids for this phase */}
                      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Bids ({getPhaseBids(phase.id).length})
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon fontSize="small" />}
                            onClick={() => handleOpenQuickBidDialog(phase.id)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Add Bid
                          </Button>
                        </Box>
                        
                        {getPhaseBids(phase.id).length > 0 ? (
                          <>
                            <Box sx={{ mt: 1 }}>
                              {getPhasePayments(phase.id)
                                .slice(0, 4) // Show only the first 4 payments to save space
                                .map((item, index) => (
                                  <Box 
                                    key={`${item.bidId}-${item.payment.id || index}`}
                                    sx={{ 
                                      display: 'flex', 
                                      flexDirection: 'column',
                                      mb: 2,
                                      p: 1,
                                      borderRadius: 1,
                                      bgcolor: alpha(theme.palette.background.paper, 0.5)
                                    }}
                                  >
                                    <Box sx={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mb: 1
                                    }}>
                                      <Box sx={{ maxWidth: '60%' }}>
                                        <Typography variant="body2" noWrap>
                                          {item.subcontractorName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {item.bidTitle} - {item.payment.name}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {formatCurrency(item.payment.amount)}
                                      </Typography>
                                    </Box>
                                    
                                    <Box sx={{ 
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      py: 0.5,
                                      px: 1,
                                      borderRadius: 0.5,
                                      bgcolor: alpha(theme.palette.background.paper, 0.3)
                                    }}>
                                      <Typography variant="caption">
                                        {item.payment.percentage}% of bid
                                      </Typography>
                                      <Typography variant="caption">
                                        Status: {item.payment.status || 'pending'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))
                              }
                              {getPhasePayments(phase.id).length > 4 && (
                                <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                                  +{getPhasePayments(phase.id).length - 4} more payments
                                </Typography>
                              )}
                            </Box>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            No bids yet for this phase
                          </Typography>
                        )}
                      </Box>

                      {/* Add section to display expenses for this phase */}
                      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Expenses ({expenses.filter(expense => expense.phaseId === phase.id).length})
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon fontSize="small" />}
                            onClick={() => handleOpenQuickExpenseDialog(phase.id)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Add Expense
                          </Button>
                        </Box>
                        
                        {(() => { 
                          console.log('Expenses for phase', phase.id, ':', expenses.filter(expense => expense.phaseId === phase.id));
                          return null; 
                        })()}
                        {expenses.filter(expense => expense.phaseId === phase.id).length > 0 ? (
                          <Box sx={{ mt: 1 }}>
                            {expenses.filter(expense => expense.phaseId === phase.id)
                              .slice(0, 2) // Show only the first 2 expenses to save space
                              .map(expense => (
                                <Box 
                                  key={expense.id}
                                  sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.background.paper, 0.5)
                                  }}
                                >
                                  <Box sx={{ maxWidth: '60%' }}>
                                    <Typography variant="body2" noWrap>
                                      {expense.description || 'Unnamed expense'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {expense.category} {expense.vendor ? `- ${expense.vendor}` : ''}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {formatCurrency(expense.amount)}
                                  </Typography>
                                </Box>
                              ))
                            }
                            {expenses.filter(expense => expense.phaseId === phase.id).length > 2 && (
                              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                                +{expenses.filter(expense => expense.phaseId === phase.id).length - 2} more expenses
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            No expenses yet for this phase
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ 
                      height: { xs: 100, sm: '100%' },
                      minHeight: { sm: 100 },
                      width: '100%'
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                              { name: 'Actual', value: phase.actualCost, color: theme.palette.success.main }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: 'Budget', value: phase.budget, color: theme.palette.primary.main },
                              { name: 'Actual', value: phase.actualCost, color: theme.palette.success.main }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ borderRadius: 1.5 }}
                    onClick={() => handleViewPhaseDetails(phase.id)}
                  >
                    View Phase Details
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 6 
        }}>
          <TimelineIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No phases defined</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start by adding project phases to track progress
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleAddPhase}
            sx={{ borderRadius: 1.5 }}
          >
            Add Phase
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProjectPhasesTab; 