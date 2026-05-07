import { useState, useEffect, useCallback } from 'react';
import { Project, Expense, Bid, ProjectPhase, Subcontractor } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SubcontractorService } from '../services/subcontractor';

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
  subcontractors: Subcontractor[];
  loading: boolean; // Combined loading state
  error: string | null; // Combined error state
  refreshAllProjectData: () => Promise<void>;
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>; // Keep for optimistic updates
  // Make setters required
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
}

export const useProjectData = (projectId: string | undefined): UseProjectDataReturn => {
  const { user } = useAuth();
  
  // Use the individual hooks
  const { project, loading: projectLoading, error: projectError, fetchProject } = useProject(projectId);
  const { phases, loading: phasesLoading, error: phasesError, fetchPhases, setPhases } = useProjectPhases(projectId);
  const { bids, loading: bidsLoading, error: bidsError, fetchBids, setBids } = useProjectBids(projectId);
  const { expenses, loading: expensesLoading, error: expensesError, fetchExpenses, setExpenses } = useProjectExpenses(projectId);

  // ---> ADD Subcontractor State & Fetch Logic Directly <----
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [subcontractorsLoading, setSubcontractorsLoading] = useState<boolean>(true);
  const [subcontractorsError, setSubcontractorsError] = useState<string | null>(null);

  const fetchSubcontractors = useCallback(async () => {
    if (!user?.uid) {
      setSubcontractorsLoading(false);
      setSubcontractors([]);
      return;
    }
    setSubcontractorsLoading(true);
    setSubcontractorsError(null);
    try {
      const fetchedData = await SubcontractorService.getSubcontractors(user.uid);
      setSubcontractors(fetchedData);
    } catch (err) {
      console.error('useProjectData: Error fetching subcontractors:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch subcontractors';
      setSubcontractorsError(errorMsg);
      setSubcontractors([]);
    } finally {
      setSubcontractorsLoading(false);
    }
  }, [user?.uid]);

  // Fetch subcontractors initially and when user changes
  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);
  // ---> END Subcontractor Logic <----

  // Combine loading states
  const loading = projectLoading || phasesLoading || bidsLoading || expensesLoading || subcontractorsLoading;

  // Combine error states
  const error = projectError || phasesError || bidsError || expensesError || subcontractorsError;

  // Combined refresh function
  const refreshAllProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      // Call individual fetch functions in parallel
      await Promise.all([
        fetchProject(),
        fetchPhases(),
        fetchBids(),
        fetchExpenses(),
        fetchSubcontractors(),
      ]);
    } catch (refreshError) {
      console.error(`useProjectData: Error during refreshAllProjectData for project ${projectId}:`, refreshError);
      // Error state will be set by the individual hook that failed
    }
  }, [projectId, fetchProject, fetchPhases, fetchBids, fetchExpenses, fetchSubcontractors]);

  // No need for the initial useEffect here, as individual hooks handle their own fetching

  return {
    project,
    phases,
    bids,
    expenses,
    subcontractors,
    loading,
    error,
    refreshAllProjectData,
    setPhases, // Pass through the setter from useProjectPhases
    // Optionally pass through other setters if needed
    setBids, 
    setExpenses,
    setSubcontractors,
  };
};
