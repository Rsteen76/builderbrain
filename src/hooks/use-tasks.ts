import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../api';
import { Task, TaskStatus, TaskPriority } from '../types';

export const TASKS_QUERY_KEY = 'tasks';

type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  phaseId?: string;
};

export function useProjectTasks(projectId: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'project', projectId, filters],
    queryFn: async () => {
      const response = await taskService.getTasksByProject(projectId, filters);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch tasks for project ${projectId}`);
      }

      return response.data;
    },
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAssigneeTasks(assigneeId: string, status?: TaskStatus) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'assignee', assigneeId, status],
    queryFn: async () => {
      const response = await taskService.getTasksByAssignee(assigneeId, status);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch tasks for assignee ${assigneeId}`);
      }

      return response.data;
    },
    enabled: !!assigneeId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePhaseTasks(phaseId: string) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'phase', phaseId],
    queryFn: async () => {
      const response = await taskService.getTasksByPhase(phaseId);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch tasks for phase ${phaseId}`);
      }

      return response.data;
    },
    enabled: !!phaseId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, taskId],
    queryFn: async () => {
      const response = await taskService.getById(taskId);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch task with ID ${taskId}`);
      }

      return response.data;
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: Omit<Task, 'id'>) => {
      const response = await taskService.create(taskData);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to create task');
      }

      return response.data;
    },
    onSuccess: (newTask: Task) => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'project', newTask.projectId] });

        if (newTask.assigneeId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'assignee', newTask.assigneeId] });
        }

        if (newTask.phaseId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'phase', newTask.phaseId] });
        }

        // Add the new task to the cache
        queryClient.setQueryData(
          [TASKS_QUERY_KEY, newTask.id],
          newTask
        );
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const response = await taskService.update(id, data);

      if (response.status === 'error') {
        throw new Error(response.error || `Failed to update task with ID ${id}`);
      }

      // Since the update endpoint doesn't return the updated task,
      // we need to fetch it to update the cache
      const updatedTask = await taskService.getById(id);

      if (updatedTask.status === 'error' || !updatedTask.data) {
        throw new Error(updatedTask.error || `Failed to fetch updated task with ID ${id}`);
      }

      return updatedTask.data;
    },
    onSuccess: (updatedTask: Task) => {
        // Update the task in the cache
        queryClient.setQueryData(
          [TASKS_QUERY_KEY, updatedTask.id],
          updatedTask
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'project', updatedTask.projectId] });

        if (updatedTask.assigneeId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'assignee', updatedTask.assigneeId] });
        }

        if (updatedTask.phaseId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'phase', updatedTask.phaseId] });
        }
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await taskService.completeTask(taskId);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to complete task with ID ${taskId}`);
      }

      return response.data;
    },
    onSuccess: (completedTask: Task) => {
        // Update the task in the cache
        queryClient.setQueryData(
          [TASKS_QUERY_KEY, completedTask.id],
          completedTask
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'project', completedTask.projectId] });

        if (completedTask.assigneeId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'assignee', completedTask.assigneeId] });
        }

        if (completedTask.phaseId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'phase', completedTask.phaseId] });
        }
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, task }: { id: string; task: Task }) => {
      const response = await taskService.delete(id);

      if (response.status === 'error') {
        throw new Error(response.error || `Failed to delete task with ID ${id}`);
      }

      return { id, task };
    },
    onSuccess: ({ id, task }: { id: string; task: Task }) => {
        // Remove the task from the cache
        queryClient.removeQueries({ queryKey: [TASKS_QUERY_KEY, id] });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'project', task.projectId] });

        if (task.assigneeId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'assignee', task.assigneeId] });
        }

        if (task.phaseId) {
          queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, 'phase', task.phaseId] });
        }
    },
  });
}
