import { useQuery, useMutation, useQueryClient } from 'react-query';
import { taskService } from '../api';
import { Task, TaskStatus, TaskPriority } from '../types';

export const TASKS_QUERY_KEY = 'tasks';

type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  phaseId?: string;
};

export function useProjectTasks(projectId: string, filters?: TaskFilters) {
  return useQuery(
    [TASKS_QUERY_KEY, 'project', projectId, filters],
    async () => {
      const response = await taskService.getTasksByProject(projectId, filters);
      
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch tasks for project ${projectId}`);
      }
      
      return response.data;
    },
    {
      enabled: !!projectId,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useAssigneeTasks(assigneeId: string, status?: TaskStatus) {
  return useQuery(
    [TASKS_QUERY_KEY, 'assignee', assigneeId, status],
    async () => {
      const response = await taskService.getTasksByAssignee(assigneeId, status);
      
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch tasks for assignee ${assigneeId}`);
      }
      
      return response.data;
    },
    {
      enabled: !!assigneeId,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function usePhaseTasks(phaseId: string) {
  return useQuery(
    [TASKS_QUERY_KEY, 'phase', phaseId],
    async () => {
      const response = await taskService.getTasksByPhase(phaseId);
      
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch tasks for phase ${phaseId}`);
      }
      
      return response.data;
    },
    {
      enabled: !!phaseId,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useTask(taskId: string) {
  return useQuery(
    [TASKS_QUERY_KEY, taskId],
    async () => {
      const response = await taskService.getById(taskId);
      
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch task with ID ${taskId}`);
      }
      
      return response.data;
    },
    {
      enabled: !!taskId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (taskData: Omit<Task, 'id'>) => {
      const response = await taskService.create(taskData);
      
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to create task');
      }
      
      return response.data;
    },
    {
      onSuccess: (newTask: Task) => {
        // Invalidate related queries
        queryClient.invalidateQueries([TASKS_QUERY_KEY, 'project', newTask.projectId]);
        
        if (newTask.assigneeId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'assignee', newTask.assigneeId]);
        }
        
        if (newTask.phaseId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'phase', newTask.phaseId]);
        }
        
        // Add the new task to the cache
        queryClient.setQueryData(
          [TASKS_QUERY_KEY, newTask.id],
          newTask
        );
      },
    }
  );
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ id, data }: { id: string; data: Partial<Task> }) => {
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
    {
      onSuccess: (updatedTask: Task) => {
        // Update the task in the cache
        queryClient.setQueryData(
          [TASKS_QUERY_KEY, updatedTask.id],
          updatedTask
        );
        
        // Invalidate related queries
        queryClient.invalidateQueries([TASKS_QUERY_KEY, 'project', updatedTask.projectId]);
        
        if (updatedTask.assigneeId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'assignee', updatedTask.assigneeId]);
        }
        
        if (updatedTask.phaseId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'phase', updatedTask.phaseId]);
        }
      },
    }
  );
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (taskId: string) => {
      const response = await taskService.completeTask(taskId);
      
      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to complete task with ID ${taskId}`);
      }
      
      return response.data;
    },
    {
      onSuccess: (completedTask: Task) => {
        // Update the task in the cache
        queryClient.setQueryData(
          [TASKS_QUERY_KEY, completedTask.id],
          completedTask
        );
        
        // Invalidate related queries
        queryClient.invalidateQueries([TASKS_QUERY_KEY, 'project', completedTask.projectId]);
        
        if (completedTask.assigneeId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'assignee', completedTask.assigneeId]);
        }
        
        if (completedTask.phaseId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'phase', completedTask.phaseId]);
        }
      },
    }
  );
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ id, task }: { id: string; task: Task }) => {
      const response = await taskService.delete(id);
      
      if (response.status === 'error') {
        throw new Error(response.error || `Failed to delete task with ID ${id}`);
      }
      
      return { id, task };
    },
    {
      onSuccess: ({ id, task }: { id: string; task: Task }) => {
        // Remove the task from the cache
        queryClient.removeQueries([TASKS_QUERY_KEY, id]);
        
        // Invalidate related queries
        queryClient.invalidateQueries([TASKS_QUERY_KEY, 'project', task.projectId]);
        
        if (task.assigneeId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'assignee', task.assigneeId]);
        }
        
        if (task.phaseId) {
          queryClient.invalidateQueries([TASKS_QUERY_KEY, 'phase', task.phaseId]);
        }
      },
    }
  );
} 