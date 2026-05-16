import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Expense, Bid, ProjectPhase, Subcontractor } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ProjectDetailDataService } from '../services/project-detail-data';
import { logger } from '../utils/logger';

interface UseProjectDataReturn {
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
  loading: boolean;
  error: string | null;
  refreshAllProjectData: () => Promise<void>;
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>;
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setSubcontractors: React.Dispatch<React.SetStateAction<Subcontractor[]>>;
}

export const useProjectData = (projectId: string | undefined): UseProjectDataReturn => {
  const { user } = useAuth();
  const loadSequenceRef = useRef(0);
  const loadedProjectIdRef = useRef<string | undefined>(undefined);
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjectData = useCallback(async () => {
    const loadSequence = loadSequenceRef.current + 1;
    loadSequenceRef.current = loadSequence;
    const isCurrentLoad = () => loadSequenceRef.current === loadSequence;

    if (!projectId || !user?.uid) {
      setProject(null);
      setPhases([]);
      setBids([]);
      setExpenses([]);
      setSubcontractors([]);
      setLoading(false);
      setError(projectId ? 'User not authenticated' : 'Project ID is missing');
      loadedProjectIdRef.current = undefined;
      return;
    }

    const isProjectSwitch = loadedProjectIdRef.current !== projectId;
    if (isProjectSwitch) {
      setProject(null);
      setPhases([]);
      setBids([]);
      setExpenses([]);
      setSubcontractors([]);
    }

    setLoading(true);
    setError(null);

    try {
      const shellData = await ProjectDetailDataService.getProjectShellDetailData(user.uid, projectId);
      if (!isCurrentLoad()) return;

      setProject(shellData.project);
      setPhases(shellData.phases);
      setError(shellData.project ? null : 'Project not found');
      loadedProjectIdRef.current = shellData.project ? projectId : undefined;

      if (!shellData.project) {
        setBids([]);
        setExpenses([]);
        setSubcontractors([]);
        return;
      }

      setLoading(false);

      const relatedData = await ProjectDetailDataService.getRelatedProjectDetailData(user.uid, projectId);
      if (!isCurrentLoad()) return;

      setBids(relatedData.bids);
      setExpenses(relatedData.expenses);
      setSubcontractors(relatedData.subcontractors);
    } catch (err) {
      if (!isCurrentLoad()) return;

      logger.error(`useProjectData: Error loading project detail data for ${projectId}:`, err);
      setProject(null);
      setPhases([]);
      setBids([]);
      setExpenses([]);
      setSubcontractors([]);
      setError('Failed to load project data');
    } finally {
      if (isCurrentLoad()) {
        setLoading(false);
      }
    }
  }, [projectId, user?.uid]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  return {
    project,
    phases,
    bids,
    expenses,
    subcontractors,
    loading,
    error,
    refreshAllProjectData: loadProjectData,
    setPhases,
    setBids,
    setExpenses,
    setSubcontractors,
  };
};
