import { useState, useEffect, useCallback } from 'react';
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
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjectData = useCallback(async () => {
    if (!projectId || !user?.uid) {
      setProject(null);
      setPhases([]);
      setBids([]);
      setExpenses([]);
      setSubcontractors([]);
      setLoading(false);
      setError(projectId ? 'User not authenticated' : 'Project ID is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detailData = await ProjectDetailDataService.getProjectDetailData(user.uid, projectId);
      setProject(detailData.project);
      setPhases(detailData.phases);
      setBids(detailData.bids);
      setExpenses(detailData.expenses);
      setSubcontractors(detailData.subcontractors);
      setError(detailData.project ? null : 'Project not found');
    } catch (err) {
      logger.error(`useProjectData: Error loading project detail data for ${projectId}:`, err);
      setProject(null);
      setPhases([]);
      setBids([]);
      setExpenses([]);
      setSubcontractors([]);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
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
