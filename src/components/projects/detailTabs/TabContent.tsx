import React, { ReactNode } from 'react';
import { Box, Theme } from '@mui/material';
// Removed unused type imports (Project, ProjectPhase, Bid, Expense)

// Import tab components
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectPhasesTab from './ProjectPhasesTab';
import ProjectBidsTab from './ProjectBidsTab';
import ProjectExpensesTab from './ProjectExpensesTab';
import ProjectDocumentsTab from './ProjectDocumentsTab';
import ProjectTaskManager from './ProjectTaskManager';

// Removed unused formatter imports

// Simplified Props: Only keep tabValue and children
interface TabContentProps {
  tabValue: number;
  children?: ReactNode;
  // Removed numerous props: project, phases, bids, expenses, calculated data, handlers, theme, userId, etc.
}

const TabContent: React.FC<TabContentProps> = ({
  tabValue,
  children,
  // Removed destructured props
}) => {
  // Handle children prop if provided (for custom tab content)
  if (children) {
    return (
      <Box sx={{ mt: 2 }}>
        {children}
      </Box>
    );
  }

  // Render specific tab component based on tabValue
  // Stop passing down props that components will get from context/hooks
  return (
    <Box sx={{ mt: 2 }}>
      {tabValue === 0 && (
        <ProjectOverviewTab />
        // Removed props: project, phases, expenses, budgetData, expensesData, 
        // handleAddPhase, combinedExpenses, theme, bids, handleOpenTemplateAdjuster
      )}
      {tabValue === 1 && (
        <ProjectPhasesTab />
        // Removed props: phases, bids, expenses, phaseProposedCosts, phaseActualCosts,
        // theme, handleAddPhase, onUpdatePhaseStatus, handleDeletePhase, 
        // handleOpenQuickBidDialog, handleOpenQuickExpenseDialog, handleViewPhaseDetails,
        // handleOpenTemplateAdjuster, getStatusColor, formatCurrency
      )}
      {tabValue === 2 && (
        <ProjectBidsTab />
        // Removed props: projectId, bids, recentBids, theme, handleAddBid, 
        // handleEditBid, formatCurrency, formatDate
      )}
      {tabValue === 3 && (
        <ProjectExpensesTab />
        // Removed props: projectId, expenses, expensesData, phases, theme,
        // handleOpenQuickExpenseDialog, formatCurrency
      )}
      {tabValue === 4 && (
        <ProjectTaskManager />
        // Removed props: project, onProjectUpdate, userId
        // Note: ProjectTaskManager might need refactoring to use context/hooks too
      )}
      {tabValue === 5 && (
        <ProjectDocumentsTab /> 
        // Assuming this doesn't need project context data yet
      )}
      {/* Add cases for other tabs as needed */}
    </Box>
  );
};

export default TabContent; 