import React from 'react';
import { Grid, Theme } from '@mui/material';
import { Project } from '../../types';

// Import the card components
import StatusCard from './cards/StatusCard';
import BudgetCard from './cards/BudgetCard';
import TimelineCard from './cards/TimelineCard';
import TeamCard from './cards/TeamCard';

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
        <StatusCard
          project={project}
          projectProgress={projectProgress}
          theme={theme}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
        />
      </Grid>
      
      {/* Budget Card */}
      <Grid item xs={12} sm={6} md={3}>
        <BudgetCard
          budgetData={budgetData}
          expenseBreakdown={expenseBreakdown}
          theme={theme}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
      </Grid>
      
      {/* Timeline Card */}
      <Grid item xs={12} sm={6} md={3}>
        <TimelineCard
          timeline={timeline}
          theme={theme}
        />
      </Grid>
      
      {/* Team Card */}
      <Grid item xs={12} sm={6} md={3}>
        <TeamCard
          project={project}
          theme={theme}
          // onManageTeam - future implementation
        />
      </Grid>
    </Grid>
  );
};

export default ProjectMetricCards; 