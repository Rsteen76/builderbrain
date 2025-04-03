export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssigneeType = 'user' | 'subcontractor';

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeType?: AssigneeType;
  assigneeId?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  parentTaskId?: string;
  dependencies?: string[];
  attachments?: string[];
  phaseId?: string;
  phaseName?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  phaseId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
} 