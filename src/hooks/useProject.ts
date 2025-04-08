import { useState, useEffect } from 'react';
import { ProjectService } from '../services/project';
import { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseProjectResult {
  project: Project | null;
  loading: boolean;
  error: string | null;
  fetchProject: () => Promise<void>; // Add a function to manually refetch if needed
}

/**
 * Custom hook to fetch and manage a single project's data.
 * @param projectId The ID of the project to fetch.
 * @returns An object containing the project data, loading state, error state, and a refetch function.
 */
export const useProject = (projectId: string | undefined): UseProjectResult => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    if (!projectId || !user?.uid) {
      // Reset state if projectId or user is invalid
      setProject(null);
      setLoading(false);
      setError(projectId ? 'User not authenticated' : 'Project ID is missing');
      return;
    }

    console.log(`useProject: Fetching project with ID: ${projectId}`);
    setLoading(true);
    setError(null);

    try {
      const projectData = await ProjectService.getProject(projectId, user.uid);
      if (!projectData) {
        console.warn(`useProject: Project not found for ID: ${projectId}`);
        setError('Project not found');
        setProject(null);
      } else {
        console.log(`useProject: Successfully fetched project: ${projectData.name}`);
        setProject(projectData);
      }
    } catch (err) {
      console.error('useProject: Error fetching project:', err);
      setError('Failed to load project');
      setProject(null); // Clear project data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user?.uid]); // Dependency array includes projectId and user.uid

  return { project, loading, error, fetchProject };
};