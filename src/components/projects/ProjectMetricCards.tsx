import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Avatar,
  Tooltip,
  Button,
  alpha,
  Theme,
} from '@mui/material';
import {
  Person as PersonIcon,
} from '@mui/icons-material';
import { Project } from '../../types'; // Adjusted path

interface ProjectMetricCardsProps {
  project: Project | null;
  projectProgress: number;
  budgetData: {
    totalBudget: number;
    totalActual: number;
    difference: number;
    percentUsed: number;
  };
  expenseBreakdown: {
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    elapsedDays: number;
    totalDays: number;
    percentComplete: number;
  };
  theme: Theme;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

const ProjectMetricCards: React.FC<ProjectMetricCardsProps> = ({
  project,
  projectProgress,
  budgetData,
  expenseBreakdown,
  timeline,
  theme,
  getStatusIcon,
  getStatusColor,
  formatCurrency,
  formatPercentage,
}) => {
  if (!project) {
    // Optionally return null or a placeholder if project data is essential
    return null; 
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Project Status Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ 
          borderRadius: 2, 
          height: '100%',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip
                label={project.status.replace('_', ' ').toUpperCase()}
                icon={getStatusIcon(project.status) as React.ReactElement}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: alpha(getStatusColor(project.status), 0.1),
                  color: getStatusColor(project.status),
                  borderRadius: 1,
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Overall Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={projectProgress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }} 
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" fontWeight="bold" color="text.primary">
                  {projectProgress}%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Budget Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ 
          borderRadius: 2, 
          height: '100%',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Budget
            </Typography>
            <Typography variant="h6" component="div" fontWeight="bold">
              {formatCurrency(budgetData.totalBudget)}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Spent
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(budgetData.totalActual)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" align="right" display="block">
                  Remaining
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight={600} 
                  color={budgetData.difference < 0 ? 'error' : 'success.main'}
                >
                  {formatCurrency(budgetData.difference)}
                </Typography>
              </Box>
            </Box>
            
            {/* Expense Breakdown */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Grid container spacing={1}>
                <Grid item xs={7}>
                  <Typography variant="caption" color="text.secondary">
                    Pending
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="caption" align="right" display="block" color="warning.main" fontWeight={500}>
                    {formatCurrency(expenseBreakdown.pending)}
                  </Typography>
                </Grid>
                
                <Grid item xs={7}>
                  <Typography variant="caption" color="text.secondary">
                    Approved
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="caption" align="right" display="block" color="info.main" fontWeight={500}>
                    {formatCurrency(expenseBreakdown.approved)}
                  </Typography>
                </Grid>
                
                <Grid item xs={7}>
                  <Typography variant="caption" color="text.secondary">
                    Paid
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="caption" align="right" display="block" color="success.main" fontWeight={500}>
                    {formatCurrency(expenseBreakdown.paid)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(budgetData.percentUsed, 100)}
                color={budgetData.percentUsed > 100 ? 'error' : 'success'}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: alpha(
                    budgetData.percentUsed > 100 ? theme.palette.error.main : theme.palette.success.main, 
                    0.1
                  ),
                  mb: 0.5
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {formatPercentage(budgetData.percentUsed / 100)} of budget used
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Timeline Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ 
          borderRadius: 2, 
          height: '100%',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Timeline
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h6" component="div" fontWeight="bold" sx={{ mr: 1 }}>
                {timeline.elapsedDays} <Typography variant="body2" component="span">days elapsed</Typography>
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Start
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {timeline.startDate && !isNaN(timeline.startDate.getTime()) 
                    ? timeline.startDate.toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  End
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {timeline.endDate && !isNaN(timeline.endDate.getTime()) 
                    ? timeline.endDate.toLocaleDateString() 
                    : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {timeline.totalDays} days
                </Typography>
              </Box>
            </Stack>
            
            <Box>
              <LinearProgress 
                variant="determinate" 
                value={timeline.percentComplete} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                }} 
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {timeline.percentComplete}% of timeline elapsed
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Team Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={0} sx={{ 
          borderRadius: 2, 
          height: '100%',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Team
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" component="div" fontWeight="bold">
                {project.team?.length || 0} Members
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={-1} sx={{ mb: 2 }}>
              {(project.team || []).slice(0, 5).map((member, index) => {
                // Handle team member display - project.team can be array of strings or objects
                const memberName = typeof member === 'string' ? member : (member as any)?.name || '';
                
                return (
                  <Tooltip key={index} title={memberName || `Team Member ${index + 1}`}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: theme.palette.primary.main,
                        border: `2px solid ${theme.palette.background.paper}`
                      }}
                    >
                      {(memberName || 'U').charAt(0)}
                    </Avatar>
                  </Tooltip>
                );
              })}
              
              {(project.team?.length || 0) > 5 && (
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.grey[300],
                  border: `2px solid ${theme.palette.background.paper}`
                }}>
                  <Typography variant="caption">+{project.team!.length - 5}</Typography>
                </Avatar>
              )}
            </Stack>
            
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<PersonIcon />} 
              sx={{ borderRadius: 1.5 }}
              // onClick={handleManageTeam} // Add handler later
            >
              Manage Team
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ProjectMetricCards; 