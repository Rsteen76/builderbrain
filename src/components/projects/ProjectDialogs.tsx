import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { Project, ProjectPhase, Bid, Subcontractor } from '../../types';
import { Expense } from '../../types/expense.types';

// Import dialog components
import BidFormDialog from '../dialogs/BidFormDialog';
import QuickAddSubcontractorDialog from '../dialogs/QuickAddSubcontractorDialog';
import QuickBidDialog from '../dialogs/QuickBidDialog';
import ExpenseFormModal from '../expenses/ExpenseFormModal';
import TemplateAdjuster from './TemplateAdjuster';
import PhaseDetailsDialog from './dialogs/PhaseDetailsDialog';

interface ProjectDialogsProps {
  project: Project;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  theme: any;
  getStatusColor: (status: string) => string;
  
  // Dialog open states
  bidFormOpen: boolean;
  showQuickAddSubcontractor: boolean;
  newBidDialogOpen: boolean;
  newExpenseDialogOpen: boolean;
  templateAdjusterOpen: boolean;
  phaseDetailsDialogOpen: boolean;
  
  // Form data
  bidForm: any;
  editingBidId: string | null;
  currentPhaseForBid: string | null;
  currentPhaseForExpense: string | null;
  currentExpenseData: any;
  selectedPhaseId: string | null;
  isSaving: boolean;
  
  // Snackbar
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  };
  
  // Subcontractors
  subcontractors: Subcontractor[];
  
  // Handlers
  handleCloseBidForm: () => void;
  handleSubmitBid: (bidData: any) => Promise<void>;
  handleQuickAddSubcontractor: (data: any) => Promise<void>;
  handleAddQuickBid: (quickBid: any) => void;
  handleAddQuickExpense: (expense: any) => void;
  handleSnackbarClose: () => void;
  handleCloseTemplateAdjuster: () => void;
  handleProjectUpdate: (updatedProject: Project) => void;
  handleClosePhaseDetails: () => void;
  handleUpdatePhase: (phaseId: string) => void;
  setShowQuickAddSubcontractor: (show: boolean) => void;
  setNewBidDialogOpen: (open: boolean) => void;
  setCurrentPhaseForExpense: (phaseId: string | null) => void;
  setNewExpenseDialogOpen: (open: boolean) => void;
}

const ProjectDialogs: React.FC<ProjectDialogsProps> = ({
  project,
  phases,
  bids,
  expenses,
  theme,
  getStatusColor,
  
  // Dialog open states
  bidFormOpen,
  showQuickAddSubcontractor,
  newBidDialogOpen,
  newExpenseDialogOpen,
  templateAdjusterOpen,
  phaseDetailsDialogOpen,
  
  // Form data
  bidForm,
  editingBidId,
  currentPhaseForBid,
  currentPhaseForExpense,
  currentExpenseData,
  selectedPhaseId,
  isSaving,
  
  // Snackbar
  snackbar,
  
  // Subcontractors
  subcontractors,
  
  // Handlers
  handleCloseBidForm,
  handleSubmitBid,
  handleQuickAddSubcontractor,
  handleAddQuickBid,
  handleAddQuickExpense,
  handleSnackbarClose,
  handleCloseTemplateAdjuster,
  handleProjectUpdate,
  handleClosePhaseDetails,
  handleUpdatePhase,
  setShowQuickAddSubcontractor,
  setNewBidDialogOpen,
  setCurrentPhaseForExpense,
  setNewExpenseDialogOpen,
}) => {
  return (
    <>
      <BidFormDialog
        open={bidFormOpen}
        onClose={handleCloseBidForm}
        onSubmit={handleSubmitBid}
        phases={phases}
        subcontractors={subcontractors}
        initialBidData={bidForm}
        editingBidId={editingBidId}
        isSaving={isSaving}
        onAddSubcontractor={() => setShowQuickAddSubcontractor(true)}
      />

      <QuickAddSubcontractorDialog
        open={showQuickAddSubcontractor}
        onClose={() => setShowQuickAddSubcontractor(false)}
        onSubmit={handleQuickAddSubcontractor}
        isSaving={isSaving}
      />

      <QuickBidDialog
        open={newBidDialogOpen}
        onClose={() => setNewBidDialogOpen(false)}
        onSubmit={handleAddQuickBid}
        phaseId={currentPhaseForBid}
        isSaving={isSaving}
        phases={phases}
        subcontractors={subcontractors}
      />

      <ExpenseFormModal
        open={newExpenseDialogOpen}
        onClose={() => { 
          setNewExpenseDialogOpen(false); 
          setCurrentPhaseForExpense(null); 
        }}
        onSave={handleAddQuickExpense}
        projects={[{ id: project?.id || '', name: project?.name || '' }]}
        expense={currentExpenseData}
        projectPhases={phases}
      />
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
      
      <TemplateAdjuster 
        open={templateAdjusterOpen}
        onClose={handleCloseTemplateAdjuster}
        project={project} 
        onUpdateProject={handleProjectUpdate}
      />

      <PhaseDetailsDialog
        open={phaseDetailsDialogOpen}
        onClose={handleClosePhaseDetails}
        selectedPhaseId={selectedPhaseId}
        phases={phases}
        bids={bids}
        expenses={expenses}
        theme={theme}
        getStatusColor={getStatusColor}
        handleUpdatePhase={handleUpdatePhase}
      />
    </>
  );
};

export default ProjectDialogs; 