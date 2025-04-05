import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  Chip,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  alpha,
  Theme,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { ProjectPhase, Bid, Expense } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface PhaseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedPhaseId: string | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  theme: Theme;
  getStatusColor: (status: string) => string;
  handleUpdatePhase: (phaseId: string) => void;
}

const PhaseDetailsDialog: React.FC<PhaseDetailsDialogProps> = ({
  open,
  onClose,
  selectedPhaseId,
  phases,
  bids,
  expenses,
  theme,
  getStatusColor,
  handleUpdatePhase,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="phase-details-dialog-title"
      aria-describedby="phase-details-dialog-description"
    >
      <DialogTitle id="phase-details-dialog-title">
        {selectedPhaseId && phases.find(p => p.id === selectedPhaseId)?.name}
      </DialogTitle>
      <DialogContent dividers>
        {selectedPhaseId && (() => {
          const phase = phases.find(p => p.id === selectedPhaseId);
          const phaseBids = bids.filter(bid => bid.phaseId === selectedPhaseId);
          const phaseExpenses = expenses.filter(expense => expense.phaseId === selectedPhaseId);
          
          if (!phase) return <Typography>Phase not found</Typography>;
          
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>Phase Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip
                        label={phase.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{ 
                          mt: 0.5,
                          fontWeight: 600,
                          bgcolor: alpha(getStatusColor(phase.status), 0.1),
                          color: getStatusColor(phase.status),
                          borderRadius: 1
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Progress</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={phase.progress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            flexGrow: 1,
                            mr: 1,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }} 
                        />
                        <Typography variant="body2" fontWeight="medium">{phase.progress}%</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Start Date</Typography>
                      <Typography variant="body1">{new Date(phase.startDate).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">End Date</Typography>
                      <Typography variant="body1">{new Date(phase.endDate).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Budget</Typography>
                      <Typography variant="body1" fontWeight="medium">{formatCurrency(phase.budget)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Actual Cost</Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight="medium" 
                        color={phase.actualCost > phase.budget ? 'error' : 'inherit'}
                      >
                        {formatCurrency(phase.actualCost)}
                      </Typography>
                    </Grid>
                    {phase.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Description</Typography>
                        <Typography variant="body1">{phase.description}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Bids ({phaseBids.length})
                </Typography>
                {phaseBids.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Contractor</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {phaseBids.map(bid => (
                          <TableRow key={bid.id}>
                            <TableCell>{bid.subcontractorName || bid.contractorName || 'Unnamed'}</TableCell>
                            <TableCell align="right">{formatCurrency(bid.totalAmount)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={bid.status.toUpperCase()} 
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  bgcolor: bid.status === 'accepted' 
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : bid.status === 'rejected'
                                      ? alpha(theme.palette.error.main, 0.1)
                                      : alpha(theme.palette.info.main, 0.1),
                                  color: bid.status === 'accepted' 
                                    ? theme.palette.success.main
                                    : bid.status === 'rejected'
                                      ? theme.palette.error.main
                                      : theme.palette.info.main,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => {/* handle editing bid */}}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No bids for this phase
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Expenses ({phaseExpenses.length})
                </Typography>
                {phaseExpenses.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {phaseExpenses.map(expense => (
                          <TableRow key={expense.id}>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={expense.status.toUpperCase()} 
                                size="small"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  bgcolor: expense.status === 'paid' 
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : expense.status === 'rejected'
                                      ? alpha(theme.palette.error.main, 0.1)
                                      : alpha(theme.palette.info.main, 0.1),
                                  color: expense.status === 'paid' 
                                    ? theme.palette.success.main
                                    : expense.status === 'rejected'
                                      ? theme.palette.error.main
                                      : theme.palette.info.main,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No expenses for this phase
                  </Typography>
                )}
              </Grid>
              
              {phase.tasks && phase.tasks.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    Tasks ({phase.tasks.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Task</TableCell>
                          <TableCell>Assigned To</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Due Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {phase.tasks.map(task => (
                          <TableRow key={task.id}>
                            <TableCell>{task.title}</TableCell>
                            <TableCell>{task.assigneeId || 'Unassigned'}</TableCell>
                            <TableCell>{task.status}</TableCell>
                            <TableCell align="right">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          );
        })()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          onClick={() => {
            onClose();
            if (selectedPhaseId) handleUpdatePhase(selectedPhaseId);
          }}
        >
          Edit Phase
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhaseDetailsDialog; 