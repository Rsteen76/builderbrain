import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { useProjectWizard, BudgetItem } from '../../contexts/ProjectWizardContext';
import { getCostModelDescription } from '../../data/constructionCostModel';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';

const ReviewStep: React.FC = () => {
  const { state } = useProjectWizard();
  const { projectInfo, schedule, phases, budget, team } = state;

  // Calculate budget summary
  const totalBudgeted = budget.reduce((sum: number, item: BudgetItem) => sum + item.estimatedCost, 0);
  const totalBudget = projectInfo.totalBudget || 0;
  const budgetPercentage = totalBudget > 0 ? (totalBudgeted / totalBudget) * 100 : 0;
  const constructionBudget = Math.max(0, totalBudget - (projectInfo.landAcquisitionPrice || 0));

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Project Review
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Review all project information before submission. You can go back to previous steps to make changes if needed.
      </Typography>

      {/* Project Information */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Project Information</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Project Name:</Typography>
              <Typography variant="body1" gutterBottom>{projectInfo.name || 'Not specified'}</Typography>

              <Typography variant="subtitle2">Type:</Typography>
              <Typography variant="body1" gutterBottom>{projectInfo.projectType || 'Not specified'}</Typography>

              <Typography variant="subtitle2">Location:</Typography>
              <Typography variant="body1" gutterBottom>{projectInfo.location || 'Not specified'}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Start Date:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectInfo.estimatedStartDate
                  ? format(new Date(projectInfo.estimatedStartDate), 'MMM dd, yyyy')
                  : 'Not specified'}
              </Typography>

              <Typography variant="subtitle2">End Date:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectInfo.estimatedEndDate
                  ? format(new Date(projectInfo.estimatedEndDate), 'MMM dd, yyyy')
                  : 'Not specified'}
              </Typography>

              <Typography variant="subtitle2">Budget:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectInfo.currency || 'USD'} {totalBudget.toLocaleString()}
              </Typography>

              <Typography variant="subtitle2">Land Acquisition:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectInfo.currency || 'USD'} {(projectInfo.landAcquisitionPrice || 0).toLocaleString()}
              </Typography>

              <Typography variant="subtitle2">Construction Allocation:</Typography>
              <Typography variant="body1" gutterBottom>
                {projectInfo.currency || 'USD'} {constructionBudget.toLocaleString()}
              </Typography>

              <Typography variant="subtitle2">Cost Assumptions:</Typography>
              <Typography variant="body1" gutterBottom>
                {getCostModelDescription(projectInfo.costMarket, projectInfo.finishLevel)}
              </Typography>
            </Grid>

            {projectInfo.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description:</Typography>
                <Typography variant="body1" paragraph>{projectInfo.description}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EventIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Schedule</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {phases.length === 0 ? (
            <Alert severity="info">No phases added to this project.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2">Phase</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Dates</Typography></TableCell>
                    <TableCell align="right"><Typography variant="subtitle2">Budget</Typography></TableCell>
                    <TableCell align="center"><Typography variant="subtitle2">Starter Tasks</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phases.map((phase) => (
                    <TableRow key={phase.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{phase.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{phase.description}</Typography>
                      </TableCell>
                      <TableCell>
                        {format(new Date(phase.startDate), 'MMM dd')} - {format(new Date(phase.endDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell align="right">
                        {projectInfo.currency || 'USD'} {(phase.budget || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">{phase.tasks.length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {schedule.milestones.length === 0 ? (
            <Alert severity="info">No key milestones added to this project.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2">Milestone</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Due Date</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedule.milestones
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell>{milestone.title}</TableCell>
                        <TableCell>
                          {milestone.dueDate ? format(new Date(milestone.dueDate), 'MMM dd, yyyy') : 'No date'}
                        </TableCell>
                        <TableCell>{milestone.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Budget</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Total Budget:</Typography>
              <Typography variant="body1">
                {projectInfo.currency || 'USD'} {totalBudget.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Allocated:</Typography>
              <Typography variant="body1">
                {projectInfo.currency || 'USD'} {totalBudgeted.toLocaleString()} ({budgetPercentage.toFixed(1)}%)
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2">Remaining:</Typography>
              <Typography variant="body1" color={totalBudgeted > totalBudget ? 'error' : 'inherit'}>
                {projectInfo.currency || 'USD'} {(totalBudget - totalBudgeted).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>

          {budget.length === 0 ? (
            <Alert severity="info">No budget items added to this project.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
                    <TableCell><Typography variant="subtitle2">Category</Typography></TableCell>
                    <TableCell align="right"><Typography variant="subtitle2">Amount</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budget
                    .sort((a, b) => a.category.localeCompare(b.category) || a.description.localeCompare(b.description))
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right">
                          {projectInfo.currency || 'USD'} {item.estimatedCost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {projectInfo.currency || 'USD'} {totalBudgeted.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Team */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Team</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {team.members.length === 0 ? (
            <Alert severity="info">No team members added to this project.</Alert>
          ) : (
            <>
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.from(new Set(team.members.map(m => m.role))).map(role => (
                  <Chip
                    key={role}
                    label={`${role}: ${team.members.filter(m => m.role === role).length}`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              <List>
                {team.members.map((member) => (
                  <ListItem key={member.id} divider>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          {member.name} <Chip size="small" label={member.role} />
                        </>
                      }
                      secondary={
                        <>
                          {member.company && `Company: ${member.company}`}
                          {member.email && <Box component="span" sx={{ display: 'block' }}>Email: {member.email}</Box>}
                          {member.phone && <Box component="span" sx={{ display: 'block' }}>Phone: {member.phone}</Box>}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submission check */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Please verify all project information before submitting. Once submitted, a new project will be created with the details provided above.
      </Alert>
    </Box>
  );
};

export default ReviewStep;
