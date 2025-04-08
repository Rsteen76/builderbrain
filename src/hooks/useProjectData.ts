import { useState, useEffect, useCallback } from 'react';
import { Project, Expense, Bid, ProjectPhase } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Import the individual hooks
import { useProject } from './useProject';
import { useProjectPhases } from './useProjectPhases';
import { useProjectBids } from './useProjectBids';
import { useProjectExpenses } from './useProjectExpenses';

interface UseProjectDataReturn {
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  loading: boolean; // Combined loading state
  error: string | null; // Combined error state
  refreshAllProjectData: () => Promise<void>;
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>; // Keep for optimistic updates
  // Make setters required
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

export const useProjectData = (projectId: string | undefined): UseProjectDataReturn => {
  const { user } = useAuth(); // Keep useAuth if needed by individual hooks or logic here
  
  // Use the individual hooks
  const { project, loading: projectLoading, error: projectError, fetchProject } = useProject(projectId);
  const { phases, loading: phasesLoading, error: phasesError, fetchPhases, setPhases } = useProjectPhases(projectId);
  const { bids, loading: bidsLoading, error: bidsError, fetchBids, setBids } = useProjectBids(projectId);
  const { expenses, loading: expensesLoading, error: expensesError, fetchExpenses, setExpenses } = useProjectExpenses(projectId);

  // Combine loading states
  const loading = projectLoading || phasesLoading || bidsLoading || expensesLoading;

  // Combine error states (show first error encountered)
  const error = projectError || phasesError || bidsError || expensesError;

  // Combined refresh function
  const refreshAllProjectData = useCallback(async () => {
    if (!projectId) return;
    console.log(`useProjectData: Refreshing all data for project ${projectId}`);
    try {
      // Call individual fetch functions in parallel
      await Promise.all([
        fetchProject(),
        fetchPhases(),
        fetchBids(),
        fetchExpenses(),
      ]);
      console.log(`useProjectData: Refresh complete for project ${projectId}`);
    } catch (refreshError) {
      console.error(`useProjectData: Error during refreshAllProjectData for project ${projectId}:`, refreshError);
      // Error state will be set by the individual hook that failed
    }
  }, [projectId, fetchProject, fetchPhases, fetchBids, fetchExpenses]);

  // No need for the initial useEffect here, as individual hooks handle their own fetching

  return {
    project,
    phases,
    bids,
    expenses,
    loading,
    error,
    refreshAllProjectData,
    setPhases, // Pass through the setter from useProjectPhases
    // Optionally pass through other setters if needed
    setBids, 
    setExpenses,
  };
}; 