import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../api';
import { Project, FilterOptions } from '../types';
import { ProjectStatus } from '../types/project.types';

export const PROJECTS_QUERY_KEY = 'projects';

type ProjectFilters = {
  status?: ProjectStatus;
  clientId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
};

export function useProjects(userId: string, filters?: ProjectFilters) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, userId, filters],
    queryFn: async () => {
      const response = await projectService.getProjectsByUser(userId, filters);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch projects');
      }

      return response.data;
    },
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(projectId: string, userId: string) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, projectId],
    queryFn: async () => {
      const response = await projectService.getById(projectId);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch project with ID ${projectId}`);
      }

      return response.data;
    },
    enabled: !!projectId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: Omit<Project, 'id'>) => {
      const response = await projectService.create(projectData);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to create project');
      }

      return response.data;
    },
    onSuccess: (newProject: Project) => {
        // Invalidate the projects list query to refetch
        queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY, newProject.userId] });

        // Add the new project to the cache
        queryClient.setQueryData(
          [PROJECTS_QUERY_KEY, newProject.id],
          newProject
        );
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const response = await projectService.update(id, data);

      if (response.status === 'error') {
        throw new Error(response.error || `Failed to update project with ID ${id}`);
      }

      // Since the update endpoint doesn't return the updated project,
      // we need to fetch it to update the cache
      const updatedProject = await projectService.getById(id);

      if (updatedProject.status === 'error' || !updatedProject.data) {
        throw new Error(updatedProject.error || `Failed to fetch updated project with ID ${id}`);
      }

      return updatedProject.data;
    },
    onSuccess: (updatedProject: Project) => {
        // Update the project in the cache
        queryClient.setQueryData(
          [PROJECTS_QUERY_KEY, updatedProject.id],
          updatedProject
        );

        // Invalidate the projects list query to refetch
        queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY, updatedProject.userId] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const response = await projectService.delete(id);

      if (response.status === 'error') {
        throw new Error(response.error || `Failed to delete project with ID ${id}`);
      }

      return { id, userId };
    },
    onSuccess: ({ id, userId }: { id: string; userId: string }) => {
        // Remove the project from the cache
        queryClient.removeQueries({ queryKey: [PROJECTS_QUERY_KEY, id] });

        // Invalidate the projects list query to refetch
        queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY, userId] });
    },
  });
}
