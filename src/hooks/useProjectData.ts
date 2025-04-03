import { useState, useEffect, useCallback } from 'react';
import { ProjectService } from '../services/project';
import { ExpenseService } from '../services/expense';
import { BidService } from '../services/bid';
import { Project, Expense, Bid, Phase, ProjectPhase, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Define ProjectPhase locally if not already globally available in types
// interface ProjectPhase extends Phase {
//   id: string;
//   name: string;
//   startDate: Date | string;
//   endDate: Date | string;
//   status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
//   progress: number;
//   budget: number;
//   actualCost: number;
//   tasks: any[]; // Replace 'any' with Task[] if Task type is defined
// }

interface UseProjectDataReturn {
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  refreshAllProjectData: () => Promise<void>;
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>; // Allow external updates if needed
}

export const useProjectData = (projectId: string | undefined): UseProjectDataReturn => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async (currentProjectId: string) => {
    if (!user?.uid) return [];
    try {
      const projectData = await ProjectService.getProject(currentProjectId, user.uid);
      if (projectData && projectData.phases && projectData.phases.length > 0) {
        // Ensure phases have IDs, potentially adding them if missing (though ideally they should come from DB)
        const phasesWithIds = projectData.phases.map((phase, index) => ({ 
          ...phase, 
          id: phase.id || `temp-phase-${index}` // Example temporary ID
        })) as ProjectPhase[];
        return phasesWithIds;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Error fetching phases:', err);
      setError('Failed to load phases');
      return [];
    }
  }, [user?.uid]);

  const fetchBids = useCallback(async (currentProjectId: string) => {
    if (!user?.uid) return [];
    try {
      const bidFilters = { projectId: currentProjectId };
      const bidData = await BidService.getBids(user.uid, bidFilters);
      return bidData;
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError('Failed to load bids');
      return [];
    }
  }, [user?.uid]);

  const fetchExpenses = useCallback(async (currentProjectId: string) => {
    if (!user?.uid) return [];
    try {
      const expenseData = await ExpenseService.getProjectExpenses(user.uid, currentProjectId);
      return expenseData;
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
      return [];
    }
  }, [user?.uid]);

  const fetchProjectData = useCallback(async (currentProjectId: string) => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const projectData = await ProjectService.getProject(currentProjectId, user.uid);
      if (!projectData) {
        setError('Project not found');
        setProject(null);
        setPhases([]);
        setBids([]);
        setExpenses([]);
      } else {
        setProject(projectData);
        // Fetch related data in parallel
        const [fetchedPhases, fetchedBids, fetchedExpenses] = await Promise.all([
          fetchPhases(currentProjectId),
          fetchBids(currentProjectId),
          fetchExpenses(currentProjectId),
        ]);
        setPhases(fetchedPhases);
        setBids(fetchedBids);
        setExpenses(fetchedExpenses);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data');
      setProject(null);
      setPhases([]);
      setBids([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, fetchPhases, fetchBids, fetchExpenses]);

  const refreshAllProjectData = useCallback(async () => {
    if (!projectId || !user?.uid) return;
    setLoading(true); // Indicate loading during refresh
    setError(null);
    try {
      const [fetchedPhases, fetchedBids, fetchedExpenses] = await Promise.all([
        fetchPhases(projectId),
        fetchBids(projectId),
        fetchExpenses(projectId),
      ]);
      setPhases(fetchedPhases);
      setBids(fetchedBids);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error refreshing project data:', error);
      setError('Failed to refresh project data');
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.uid, fetchPhases, fetchBids, fetchExpenses]);

  // Initial fetch when projectId or user changes
  useEffect(() => {
    if (projectId && user?.uid) {
      fetchProjectData(projectId);
    }
  }, [projectId, user?.uid, fetchProjectData]);

  return {
    project,
    phases,
    bids,
    expenses,
    loading,
    error,
    refreshAllProjectData,
    setPhases, // Expose setter if needed
  };
}; 