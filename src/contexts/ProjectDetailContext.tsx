import React, { createContext, useContext, ReactNode } from 'react';
import { Project, ProjectPhase, Bid, Expense, BidSummary, Subcontractor } from '../types';
import { BidFormData } from '../types/form.types';
import { useProjectData } from '../hooks/useProjectData'; // Keep using this for core data
// Import necessary hooks FOR the provider
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { useBidFormDialog } from '../hooks/useBidFormDialog';
import { useBidOperations } from '../hooks/useBidOperations';
import { useExpenseFormDialog } from '../hooks/useExpenseFormDialog'; // Import expense dialog hook and type
// Import the remaining operation hooks
import { usePhaseOperations, PhaseStatusType } from '../hooks/usePhaseOperations';
import { useExpenseOperations } from '../hooks/useExpenseOperations';

// --- Context Shape ---
interface ProjectDetailContextState {
  // Core Data
  projectId: string | null;
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
  loading: boolean;
  error: string | null; // Error from useProjectData
  refreshAllProjectData: () => Promise<void>;
  // Phase setter for optimistic updates
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>;
  // Other Setters (if needed for optimistic updates outside context)
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;

  // Notification
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  NotificationComponent: React.FC; // Expose the component too

  // Bid Dialog State & Triggers
  isBidModalOpen: boolean;
  editingBidId: string | null;
  bidInitialData: Partial<BidFormData> | null;
  openNewBidDialog: (initialData?: Partial<BidFormData>) => void;
  openEditBidDialog: (bid: Bid | BidSummary) => Promise<void>;
  closeBidDialog: () => void;
  handleBidSubmitSuccess: (savedBid: Bid) => void; 
  isBidSubmitting: boolean; // Loading state from useBidFormDialog
  bidDialogError: string | null; // Error state from useBidFormDialog

  // Bid Operations
  isBidOperating: boolean; // Loading state from useBidOperations
  // Updated signatures based on useBidOperations.ts
  requestDeleteBid: (bid: Bid | BidSummary) => void; 
  duplicateBid: (bidToDuplicate: Bid | BidSummary) => Promise<void>; 
  // REMOVED bidOperationError - hook uses toasts internally

  // Expense Dialog State & Triggers
  isExpenseDialogOpen: boolean; // Renamed
  editingExpenseId: string | null;
  initialExpenseData: Partial<Expense> | null; // Use correct type
  openNewExpenseDialog: (defaultData?: Partial<Expense>) => void; // Use correct type and name
  openEditExpenseDialog: (expense: Expense) => void; // Correct signature
  closeExpenseDialog: () => void; // Renamed
  // Removed isExpenseSubmitting, expenseDialogError - hook doesn't provide them

  // Phase Operations State & Actions
  isUpdatingPhase: boolean;
  updatePhaseStatus: (phaseId: string, status: PhaseStatusType) => Promise<void>;
  addPhase: (phase: ProjectPhase) => Promise<ProjectPhase | null>;
  deletePhase: (phaseId: string) => Promise<void>;

  // Expense Operations State & Actions
  isExpenseOperating: boolean;
  addExpense: (expenseData: Partial<Expense>) => Promise<Expense | null>;
  updateExpense: (expenseId: string, expenseData: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
}

// --- Default Context Value ---
const defaultContextValue: ProjectDetailContextState = {
  projectId: null,
  project: null,
  phases: [],
  bids: [],
  expenses: [],
  subcontractors: [],
  loading: true,
  error: null,
  refreshAllProjectData: async () => { console.warn("refreshAllProjectData called on default context"); },
  setPhases: () => {},
  setBids: () => {},
  setExpenses: () => {},
  setSubcontractors: () => {},
  showNotification: () => { console.warn("showNotification called on default context"); },
  NotificationComponent: () => null, 
  isBidModalOpen: false,
  editingBidId: null,
  bidInitialData: null,
  openNewBidDialog: () => { console.warn("openNewBidDialog called on default context"); },
  openEditBidDialog: async () => { console.warn("openEditBidDialog called on default context"); },
  closeBidDialog: () => { console.warn("closeBidDialog called on default context"); },
  handleBidSubmitSuccess: () => { console.warn("handleBidSubmitSuccess called on default context"); },
  isBidSubmitting: false,
  bidDialogError: null,
  isBidOperating: false,
  requestDeleteBid: () => { console.warn("requestDeleteBid called on default context"); },
  duplicateBid: async () => { console.warn("duplicateBid called on default context"); },
  isExpenseDialogOpen: false,
  editingExpenseId: null,
  initialExpenseData: null,
  openNewExpenseDialog: () => { console.warn("openNewExpenseDialog called on default context"); },
  openEditExpenseDialog: () => { console.warn("openEditExpenseDialog called on default context"); },
  closeExpenseDialog: () => { console.warn("closeExpenseDialog called on default context"); },
  isUpdatingPhase: false,
  updatePhaseStatus: async () => { console.warn("updatePhaseStatus called on default context"); },
  addPhase: async () => { console.warn("addPhase called on default context"); return null; },
  deletePhase: async () => { console.warn("deletePhase called on default context"); },
  isExpenseOperating: false,
  addExpense: async () => { console.warn("addExpense called on default context"); return null; },
  updateExpense: async () => { console.warn("updateExpense called on default context"); },
  deleteExpense: async () => { console.warn("deleteExpense called on default context"); },
};

// --- Create Context ---
const ProjectDetailContext = createContext<ProjectDetailContextState>(defaultContextValue);

// --- Provider Component ---
interface ProjectDetailProviderProps {
  children: ReactNode;
  projectId?: string; // Accept projectId as prop
}

export const ProjectDetailProvider: React.FC<ProjectDetailProviderProps> = ({ children, projectId }) => {
  // === Instantiate Hooks ===
  const { user } = useAuth();
  const actualProjectId = projectId || ''; 

  // Core Data Hook
  const {
    project, phases, bids, expenses, subcontractors, loading, error,
    refreshAllProjectData,
    setPhases, setBids, setExpenses, setSubcontractors
  } = useProjectData(actualProjectId);

  // Notification Hook
  const { showNotification, NotificationComponent } = useNotification();

  // Bid Dialog Hook
  const bidFormDialog = useBidFormDialog(user?.uid, {
    projectId: actualProjectId,
    onSubmitSuccess: (savedBid: Bid) => {
       refreshAllProjectData();
       showNotification(bidFormDialog.editingBidId ? 'Bid updated successfully!' : 'Bid added successfully!', 'success');
       bidFormDialog.closeBidDialog();
    },
    onError: (msg: string) => showNotification(msg, 'error'), // Add type to msg
  });

  // Bid Operations Hook (Removed onError from options)
  const bidOperations = useBidOperations({
    projectId: actualProjectId,
    onBidUpdate: (affectedBidId, operation) => {
      showNotification(`Bid ${operation} successful!`, 'success');
      refreshAllProjectData();
    },
    // REMOVED onError: (msg) => showNotification(msg, 'error'),
  });

  // Instantiate Expense Dialog Hook (Corrected arguments and callbacks)
  const expenseFormDialog = useExpenseFormDialog(user?.uid, {
    projectId: actualProjectId, // Pass projectId in options
    onSubmitSuccess: (savedExpense: Expense) => {
      refreshAllProjectData();
      showNotification(expenseFormDialog.editingExpenseId ? 'Expense updated!' : 'Expense added!', 'success');
      expenseFormDialog.closeExpenseDialog(); // Use the correct close function name
    },
    onError: (msg: string) => showNotification(msg, 'error'), // Add type to msg
  });

  // Instantiate Phase Operations Hook
  const phaseOperations = usePhaseOperations({
    projectId: actualProjectId,
    phases,
    setPhases,
    onPhaseUpdate: (updatedPhase: ProjectPhase) => {
      // Hook uses toast, just refresh data
      refreshAllProjectData(); 
    },
    // Assuming no specific onError needed here as hook uses toast
  });

  // Instantiate Expense Operations Hook
  const expenseOperations = useExpenseOperations({
    projectId: actualProjectId,
    onExpenseUpdate: (expense: Expense, operation: 'add' | 'update') => {
       // Hook uses toast, just refresh data
      refreshAllProjectData();
    },
    onExpenseDelete: (deletedId: string) => {
       // Hook uses toast, just refresh data
      refreshAllProjectData();
    },
  });

  // === Construct Context Value ===
  const contextValue: ProjectDetailContextState = {
    projectId: actualProjectId,
    project,
    phases,
    bids,
    expenses,
    subcontractors,
    loading,
    error,
    refreshAllProjectData,
    setPhases,
    setBids,
    setExpenses,
    setSubcontractors,
    showNotification,
    NotificationComponent,
    isBidModalOpen: bidFormDialog.isModalOpen,
    editingBidId: bidFormDialog.editingBidId,
    bidInitialData: bidFormDialog.initialBidData,
    openNewBidDialog: bidFormDialog.openNewBidDialog,
    openEditBidDialog: bidFormDialog.openEditBidDialog,
    closeBidDialog: bidFormDialog.closeBidDialog,
    handleBidSubmitSuccess: bidFormDialog.handleBidSubmitSuccess, 
    isBidSubmitting: bidFormDialog.loading,
    bidDialogError: bidFormDialog.error,
    isBidOperating: bidOperations.isOperating,
    requestDeleteBid: bidOperations.requestDeleteBid,
    duplicateBid: bidOperations.duplicateBid,
    isExpenseDialogOpen: expenseFormDialog.isExpenseDialogOpen,
    editingExpenseId: expenseFormDialog.editingExpenseId,
    initialExpenseData: expenseFormDialog.initialExpenseData,
    openNewExpenseDialog: expenseFormDialog.openNewExpenseDialog,
    openEditExpenseDialog: expenseFormDialog.openEditExpenseDialog,
    closeExpenseDialog: expenseFormDialog.closeExpenseDialog,
    isUpdatingPhase: phaseOperations.isUpdatingPhase,
    updatePhaseStatus: phaseOperations.updatePhaseStatus,
    addPhase: phaseOperations.addPhase,
    deletePhase: phaseOperations.deletePhase,
    isExpenseOperating: expenseOperations.isOperating,
    addExpense: expenseOperations.addExpense,
    updateExpense: expenseOperations.updateExpense,
    deleteExpense: expenseOperations.deleteExpense,
  };

  return (
    <ProjectDetailContext.Provider value={contextValue}>
      {children}
    </ProjectDetailContext.Provider>
  );
};

// --- Consumer Hook ---
export const useProjectDetail = (): ProjectDetailContextState => {
  const context = useContext(ProjectDetailContext);
  if (context === defaultContextValue) {
    throw new Error('useProjectDetail must be used within a ProjectDetailProvider. Make sure the component is wrapped correctly.');
  }
  return context;
}; 
