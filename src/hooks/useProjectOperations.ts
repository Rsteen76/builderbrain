import { useCallback, useState } from 'react';
import { ProjectService } from '../services/project'; // Correct path
import { Project } from '../types'; // Assuming Project type exists
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // For redirecting after delete

// Define options/arguments for the hook
interface UseProjectOperationsOptions {
  // Callback after a successful update
  onProjectUpdate?: (updatedProject: Project) => void;
  // Callback after successful deletion (usually involves navigation)
  onProjectDelete?: (deletedProjectId: string) => void;
}

// Define the return type of the hook
interface UseProjectOperationsReturn {
  isOperating: boolean; // Generic loading state
  updateProjectDetails: (projectId: string, projectData: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

/**
 * Hook to manage operations related to the project itself.
 */
export const useProjectOperations = (
  options: UseProjectOperationsOptions = {}
): UseProjectOperationsReturn => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOperating, setIsOperating] = useState(false);

  // Update Project Details
  const updateProjectDetails = useCallback(async (projectId: string, projectData: Partial<Project>) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }

    setIsOperating(true);
    try {
      const updatedProject = await ProjectService.updateProject(projectId, projectData);
      toast.success('Project details updated successfully!');
      if (options.onProjectUpdate) {
        options.onProjectUpdate(updatedProject);
      }
    } catch (error) {
      console.error('Error updating project details:', error);
      toast.error('Failed to update project details.');
    } finally {
      setIsOperating(false);
    }
  }, [user?.uid, options.onProjectUpdate]);

  // Delete Project
  const deleteProject = useCallback(async (projectId: string) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }

    // IMPORTANT: Add a robust confirmation dialog before proceeding!
    // This is a destructive action.
    const confirmed = window.confirm('Are you absolutely sure you want to delete this project and all associated data? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setIsOperating(true);
    try {
      await ProjectService.deleteProject(projectId);
      toast.success('Project deleted successfully.');
      if (options.onProjectDelete) {
        options.onProjectDelete(projectId);
      } else {
        // Default behavior: navigate away after delete
        navigate('/projects'); 
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project.');
    } finally {
      setIsOperating(false);
    }
  }, [user?.uid, options.onProjectDelete, navigate]);

  return {
    isOperating,
    updateProjectDetails,
    deleteProject,
  };
}; 