import React from 'react';
import {
  Grid,
  Typography,
  Theme,
} from '@mui/material';

import { Project, ProjectPhase, Expense } from '../../../types';

// Import section components
import ProjectSummarySection from './overviewSections/ProjectSummarySection';
import ProgressChartSection from './overviewSections/ProgressChartSection';
import BudgetVsActualsSection from './overviewSections/BudgetVsActualsSection';
import ExpenseDistributionSection from './overviewSections/ExpenseDistributionSection';

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
  theme: Theme;
}

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ 
  project,
  phases,
  expenses,
  budgetData,
  expensesData,
  handleAddPhase,
  combinedExpenses,
  theme
}) => {
  if (!project) {
    return <Typography>No project data available.</Typography>;
  }

  return (
    <Grid container spacing={3}>
      {/* Project Summary */}
      <Grid item xs={12} md={6}>
        <ProjectSummarySection project={project} theme={theme} />
      </Grid>
      
      {/* Progress Chart */}
      <Grid item xs={12} md={6}>
        <ProgressChartSection 
          phases={phases} 
          theme={theme}
          handleAddPhase={handleAddPhase}
        />
      </Grid>
      
      {/* Budget & Expenses */}
      <Grid item xs={12} md={6}>
        <BudgetVsActualsSection 
          combinedExpenses={combinedExpenses}
          theme={theme}
        />
      </Grid>
      
      {/* Expense Distribution */}
      <Grid item xs={12} md={6}>
        <ExpenseDistributionSection 
          expensesData={expensesData}
          theme={theme}
        />
      </Grid>
    </Grid>
  );
};

export default ProjectOverviewTab; 