import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  alpha,
  Theme, // Import Theme type
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  BarChart as ChartIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Numbers as BudgetIcon,
  AttachMoney as ExpensesIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

import { Project, ProjectPhase, Expense } from '../../../types'; // Corrected path
import { formatCurrency } from '../../../utils/formatters'; // Corrected path

interface ProjectOverviewTabProps {
  project: Project | null;
  phases: ProjectPhase[];
  expenses: Expense[];
  budgetData: {
    totalBudget: number;
    totalActual: number;
    difference: number;
    percentUsed: number;
  };
  expensesData: { name: string; value: number; color: string }[];
  handleAddPhase: () => void;
  combinedExpenses: { name: string; budget: number; actual: number }[];
  theme: Theme; // Accept theme as a prop
}

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ 
  project,
  phases,
  expensesData,
  handleAddPhase,
  combinedExpenses,
  theme // Destructure theme from props
}) => {
  if (!project) {
    return <Typography>No project data available.</Typography>;
  }

  return (
    <Grid container spacing={3}>
      {/* Project Summary */}
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            height: '100%'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1 }} /> Project Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Project Type
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {project.projectType || 'Not specified'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Client
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {project.clientId ? 'Client ID: ' + project.clientId : 'Not assigned'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ fontSize: '1rem', mr: 0.5, opacity: 0.7 }} />
                {typeof project.location === 'string' 
                  ? project.location 
                  : project.location
                    ? `${project.location?.address || ''}, ${project.location?.city || ''}, ${project.location?.state || ''}`
                    : 'No location specified'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {project.description || 'No description provided'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {/* Progress Chart */}
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            height: '100%'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ChartIcon sx={{ mr: 1 }} /> Progress Overview
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {phases.length > 0 ? (
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={phases}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    style={{ fontSize: '0.75rem' }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [`${value}%`, name]} 
                    labelFormatter={(label: string) => `Phase: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="progress" 
                    name="Progress" 
                    fill={theme.palette.primary.main}
                    barSize={15}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <TimelineIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body1" color="text.secondary" align="center">
                No phases available to show progress
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                startIcon={<AddIcon />} 
                onClick={handleAddPhase}
                sx={{ mt: 1 }}
              >
                Add Project Phases
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* Budget & Expenses */}
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BudgetIcon sx={{ mr: 1 }} /> Budget vs Actuals
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {combinedExpenses.length > 0 ? (
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={combinedExpenses}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar 
                    dataKey="budget" 
                    name="Budget" 
                    fill={theme.palette.primary.main}
                    opacity={0.8}
                    barSize={20} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="actual" 
                    name="Actual" 
                    fill={theme.palette.success.main}
                    opacity={0.8} 
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <BudgetIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body1" color="text.secondary" align="center">
                No budget data available
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                startIcon={<AddIcon />} 
                onClick={handleAddPhase}
                sx={{ mt: 1 }}
              >
                Add Project Phases
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>
      
      {/* Expense Categories */}
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ExpensesIcon sx={{ mr: 1 }} /> Expense Distribution
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {expensesData.length > 0 ? (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    dataKey="value"
                    nameKey="name"
                    label={(entry: any) => `${entry.name}: ${((entry.value / expensesData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}
                  >
                    {expensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
              <ExpensesIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body1" color="text.secondary" align="center">
                No expense data available
              </Typography>
              <Button 
                variant="text" 
                size="small" 
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
              >
                Add Expenses
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ProjectOverviewTab; 