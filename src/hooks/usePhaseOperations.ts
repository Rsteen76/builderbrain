import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Project, ProjectPhase } from '../types';
import { useAuth } from './useAuth'; // To get userId
import { toast } from 'react-hot-toast';
import { ProjectService } from '../services/project';

// Define the status union type explicitly for clarity if desired, or use Phase['status']
export type PhaseStatusType = ProjectPhase['status'];

// Define options/arguments for the hook
interface UsePhaseOperationsOptions {
  projectId: string;
  phases?: ProjectPhase[];
  setPhases?: Dispatch<SetStateAction<ProjectPhase[]>>;
  onPhaseUpdate?: (updatedPhase: ProjectPhase) => void;
  onProjectUpdate?: (updatedProject: Project) => void;
}

// Define the return type of the hook
interface UsePhaseOperationsReturn {
  isUpdatingPhase: boolean;
  updatePhaseStatus: (phaseId: string, status: PhaseStatusType) => Promise<void>;
  addPhase: (phase: ProjectPhase) => Promise<ProjectPhase | null>;
  deletePhase: (phaseId: string) => Promise<void>;
}

/**
 * Hook to manage operations related to project phases.
 * NOTE: Actual implementation requires access to full project data and project update mechanism.
 */
export const usePhaseOperations = ({
  projectId,
  phases = [],
  setPhases,
  onPhaseUpdate,
  onProjectUpdate,
}: UsePhaseOperationsOptions): UsePhaseOperationsReturn => {
  const { user } = useAuth();
  const [isUpdatingPhase, setIsUpdatingPhase] = useState(false);

  const savePhases = useCallback(async (updatedPhases: ProjectPhase[]) => {
    const updatedProject = await ProjectService.updateProject(projectId, { phases: updatedPhases });
    setPhases?.(updatedProject.phases || updatedPhases);
    onProjectUpdate?.(updatedProject);
    return updatedProject;
  }, [onProjectUpdate, projectId, setPhases]);

  const updatePhaseStatus = useCallback(async (phaseId: string, status: PhaseStatusType) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }
    if (!projectId) {
      toast.error('Project context is required.');
      return;
    }

    setIsUpdatingPhase(true);
    try {
      const phaseToUpdate = phases.find((phase) => phase.id === phaseId);
      if (!phaseToUpdate) {
        toast.error('Phase not found.');
        return;
      }

      const updatedPhase: ProjectPhase = {
        ...phaseToUpdate,
        status,
        progress: status === 'completed' ? 100 : phaseToUpdate.progress,
      };
      const updatedPhases = phases.map((phase) => phase.id === phaseId ? updatedPhase : phase);

      await savePhases(updatedPhases);
      onPhaseUpdate?.(updatedPhase);
      toast.success('Phase status updated.');
    } catch (error) {
      console.error('usePhaseOperations: Error updating phase status:', error);
      toast.error('Failed to update phase status.');
    } finally {
      setIsUpdatingPhase(false);
    }
  }, [onPhaseUpdate, phases, projectId, savePhases, user?.uid]);

  const addPhase = useCallback(async (phase: ProjectPhase): Promise<ProjectPhase | null> => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return null;
    }
    if (!projectId) {
      toast.error('Project context is required.');
      return null;
    }

    setIsUpdatingPhase(true);
    try {
      const updatedPhases = [...phases, phase];
      await savePhases(updatedPhases);
      onPhaseUpdate?.(phase);
      toast.success('Phase added.');
      return phase;
    } catch (error) {
      console.error('usePhaseOperations: Error adding phase:', error);
      toast.error('Failed to add phase.');
      return null;
    } finally {
      setIsUpdatingPhase(false);
    }
  }, [onPhaseUpdate, phases, projectId, savePhases, user?.uid]);

  const deletePhase = useCallback(async (phaseId: string) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }
    if (!projectId) {
      toast.error('Project context is required.');
      return;
    }

    const phaseToDelete = phases.find((phase) => phase.id === phaseId);
    if (!phaseToDelete) {
      toast.error('Phase not found.');
      return;
    }

    setIsUpdatingPhase(true);
    try {
      const updatedPhases = phases.filter((phase) => phase.id !== phaseId);
      await savePhases(updatedPhases);
      toast.success('Phase deleted.');
    } catch (error) {
      console.error('usePhaseOperations: Error deleting phase:', error);
      toast.error('Failed to delete phase.');
    } finally {
      setIsUpdatingPhase(false);
    }
  }, [phases, projectId, savePhases, user?.uid]);

  return {
    isUpdatingPhase,
    updatePhaseStatus,
    addPhase,
    deletePhase,
  };
}; 
