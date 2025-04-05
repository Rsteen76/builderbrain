import React, { ReactNode } from 'react';
import { Box, Theme } from '@mui/material';
import { Project, ProjectPhase, Bid, Expense } from '../../../types';

// Import tab components
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectPhasesTab from './ProjectPhasesTab';
import ProjectBidsTab from './ProjectBidsTab';
import ProjectExpensesTab from './ProjectExpensesTab';
import ProjectDocumentsTab from './ProjectDocumentsTab';
import ProjectTaskManager from '../ProjectTaskManager';

// Import formatters
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface TabContentProps {
  tabValue: number;
  project: Project;
  phases: ProjectPhase[];
  bids: Bid[];
  recentBids: Bid[];
  expenses: Expense[];
  expensesData: { name: string; value: number; color: string }[];
  combinedExpenses: { name: string; budget: number; actual: number }[];
  budgetData: {
    totalBudget: number;
    totalActual: number;
    difference: number;
    percentUsed: number;
  };
  phaseProposedCosts: Record<string, number>;
  phaseActualCosts: Record<string, number>;
  theme: Theme;
  userId: string;
  getStatusColor: (status: string) => string;
  handleAddPhase: () => void;
  handleUpdatePhase: (phaseId: string) => void;
  handleDeletePhase: (phaseId: string) => void;
  handleAddBid: () => void;
  handleEditBid: (bidId: string) => void;
  handleOpenQuickBidDialog: (phaseId: string) => void;
  handleOpenQuickExpenseDialog: (phaseId?: string) => void;
  handleOpenTemplateAdjuster: () => void;
  handleProjectUpdate: (updatedProject: Project) => void;
  handleViewPhaseDetails: (phaseId: string) => void;
  children?: ReactNode;
}

const TabContent: React.FC<TabContentProps> = ({
  tabValue,
  project,
  phases,
  bids,
  recentBids,
  expenses,
  expensesData,
  combinedExpenses,
  budgetData,
  phaseProposedCosts,
  phaseActualCosts,
  theme,
  userId,
  getStatusColor,
  handleAddPhase,
  handleUpdatePhase,
  handleDeletePhase,
  handleAddBid,
  handleEditBid,
  handleOpenQuickBidDialog,
  handleOpenQuickExpenseDialog,
  handleOpenTemplateAdjuster,
  handleProjectUpdate,
  handleViewPhaseDetails,
  children,
}) => {
  if (children) {
    return (
      <Box sx={{ mt: 2 }}>
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {tabValue === 0 && (
        <ProjectOverviewTab
          project={project}
          phases={phases}
          expenses={expenses} 
          budgetData={budgetData} 
          expensesData={expensesData}
          handleAddPhase={handleAddPhase}
          combinedExpenses={combinedExpenses} 
          theme={theme}
          bids={bids}
          handleOpenTemplateAdjuster={handleOpenTemplateAdjuster}
        />
      )}
      {tabValue === 1 && (
        <ProjectPhasesTab
          phases={phases}
          bids={bids}
          expenses={expenses}
          phaseProposedCosts={phaseProposedCosts}
          phaseActualCosts={phaseActualCosts}
          theme={theme}
          handleAddPhase={handleAddPhase}
          handleUpdatePhase={handleUpdatePhase}
          handleDeletePhase={handleDeletePhase}
          handleOpenQuickBidDialog={handleOpenQuickBidDialog}
          handleOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
          handleViewPhaseDetails={handleViewPhaseDetails}
          handleOpenTemplateAdjuster={handleOpenTemplateAdjuster}
          getStatusColor={getStatusColor}
          formatCurrency={formatCurrency}
        />
      )}
      {tabValue === 2 && (
        <ProjectBidsTab
          projectId={project.id}
          bids={bids}
          recentBids={recentBids}
          theme={theme}
          handleAddBid={handleAddBid}
          handleEditBid={handleEditBid}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
      {tabValue === 3 && (
        <ProjectExpensesTab
          projectId={project.id}
          expenses={expenses}
          expensesData={expensesData}
          phases={phases}
          theme={theme}
          handleOpenQuickExpenseDialog={handleOpenQuickExpenseDialog}
          formatCurrency={formatCurrency}
        />
      )}
      {tabValue === 4 && (
        <ProjectTaskManager 
          project={project} 
          onProjectUpdate={handleProjectUpdate}
          userId={userId}
        />
      )}
      {tabValue === 5 && (
        <ProjectDocumentsTab /> 
      )}
    </Box>
  );
};

export default TabContent; 