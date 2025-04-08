import { useState, useEffect, useCallback } from 'react';
import { ProjectService } from '../services/project';
import { ProjectPhase } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { safelyParseDate } from '../utils/formatters'; // Assuming this utility exists

interface UseProjectPhasesResult {
  phases: ProjectPhase[];
  loading: boolean;
  error: string | null;
  fetchPhases: () => Promise<void>;
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>;
}

/**
 * Ensures all phases have valid start and end dates.
 * If dates are invalid, sets startDate to now and endDate to 30 days after startDate.
 * @param phases Array of ProjectPhase objects.
 * @returns Array of ProjectPhase objects with validated dates.
 */
const ensureValidPhaseDates = (phases: ProjectPhase[]): ProjectPhase[] => {
  return phases.map(phase => {
    let startDate = phase.startDate;
    let endDate = phase.endDate;

    // Check if startDate is valid
    if (!startDate || isNaN(safelyParseDate(startDate).getTime())) {
      console.warn(`Phase "${phase.name}" (ID: ${phase.id}) has invalid start date. Resetting.`);
      startDate = new Date();
    }

    // Check if endDate is valid
    if (!endDate || isNaN(safelyParseDate(endDate).getTime())) {
      console.warn(`Phase "${phase.name}" (ID: ${phase.id}) has invalid end date. Resetting.`);
      // Set endDate relative to the (potentially corrected) startDate
      const validStartDate = safelyParseDate(startDate);
      const newEndDate = new Date(validStartDate.getTime());
      newEndDate.setDate(validStartDate.getDate() + 30);
      endDate = newEndDate;
    } else {
      // Ensure endDate is not before startDate
      const validStartDate = safelyParseDate(startDate);
      const validEndDate = safelyParseDate(endDate);
      if (validEndDate < validStartDate) {
        console.warn(`Phase "${phase.name}" (ID: ${phase.id}) has end date before start date. Resetting end date.`);
        const newEndDate = new Date(validStartDate.getTime());
        newEndDate.setDate(validStartDate.getDate() + 30);
        endDate = newEndDate;
      }
    }

    return {
      ...phase,
      startDate,
      endDate
    };
  });
};


/**
 * Custom hook to fetch and manage project phases.
 * @param projectId The ID of the project whose phases are to be fetched.
 * @returns An object containing phases, loading state, error state, and a refetch function.
 */
export const useProjectPhases = (projectId: string | undefined): UseProjectPhasesResult => {
  const { user } = useAuth();
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhases = useCallback(async () => {
    if (!projectId || !user?.uid) {
      setPhases([]);
      setLoading(false);
      setError(projectId ? 'User not authenticated' : 'Project ID is missing');
      return;
    }

    console.log(`useProjectPhases: Fetching phases for project ID: ${projectId}`);
    setLoading(true);
    setError(null);

    try {
      // Fetch the project to get phases from it
      // Note: This fetches the *entire* project again just for phases.
      // Consider if a dedicated endpoint `ProjectService.getProjectPhases(projectId, userId)` would be more efficient.
      const projectData = await ProjectService.getProject(projectId, user.uid);

      if (projectData && projectData.phases && projectData.phases.length > 0) {
        // Fix any invalid dates before setting phases
        const phasesWithValidDates = ensureValidPhaseDates(projectData.phases as ProjectPhase[]);
        console.log(`useProjectPhases: Successfully fetched ${phasesWithValidDates.length} phases.`);
        setPhases(phasesWithValidDates);
      } else {
        console.log(`useProjectPhases: No phases found for project ID: ${projectId}`);
        setPhases([]);
      }
    } catch (err) {
      console.error('useProjectPhases: Error fetching phases:', err);
      setError('Failed to load project phases');
      setPhases([]); // Clear phases on error
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.uid]); // useCallback dependencies

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]); // useEffect depends on the memoized fetchPhases

  return { phases, loading, error, fetchPhases, setPhases };
};