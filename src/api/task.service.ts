import { Timestamp, DocumentData, where, query, getDocs, orderBy } from 'firebase/firestore';
import { BaseService } from './base.service';
import { Task, TaskStatus, TaskPriority, ApiResponse } from '../types';

export class TaskService extends BaseService<Task> {
  constructor() {
    super('tasks', {
      toFirestore: (task: Task): DocumentData => {
        const firestoreTask: DocumentData = {
          userId: task.userId,
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeType: task.assigneeType,
          assigneeId: task.assigneeId,
          parentTaskId: task.parentTaskId,
          dependencies: task.dependencies,
          attachments: task.attachments,
          phaseId: task.phaseId,
          phaseName: task.phaseName,
          
          // Convert dates to Timestamps
          createdAt: task.createdAt ? this.dateToTimestamp(task.createdAt) : Timestamp.now(),
          updatedAt: Timestamp.now(),
          dueDate: task.dueDate ? this.dateToTimestamp(task.dueDate) : null,
          completedAt: task.completedAt ? this.dateToTimestamp(task.completedAt) : null,
          
          // Additional fields
          createdBy: task.createdBy,
        };
        
        return firestoreTask;
      },
      
      fromFirestore: (data: DocumentData): Task => {
        // Convert timestamps to dates
        const createdAt = this.timestampToDate(data.createdAt) || new Date();
        const updatedAt = this.timestampToDate(data.updatedAt) || new Date();
        const dueDate = this.timestampToDate(data.dueDate);
        const completedAt = this.timestampToDate(data.completedAt);
        
        return {
          id: data.id,
          userId: data.userId,
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assigneeType: data.assigneeType,
          assigneeId: data.assigneeId,
          dueDate,
          completedAt,
          createdBy: data.createdBy,
          createdAt,
          updatedAt,
          parentTaskId: data.parentTaskId,
          dependencies: data.dependencies || [],
          attachments: data.attachments || [],
          phaseId: data.phaseId,
          phaseName: data.phaseName,
        };
      }
    });
  }
  
  /**
   * Get tasks for a specific project
   */
  async getTasksByProject(projectId: string, filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    phaseId?: string;
  }): Promise<ApiResponse<Task[]>> {
    try {
      const constraints = [
        where('projectId', '==', projectId),
        orderBy('dueDate', 'asc')
      ];
      
      if (filters?.status) {
        const statusQuery = query(this.collectionRef, 
          where('projectId', '==', projectId),
          where('status', '==', filters.status),
          orderBy('dueDate', 'asc')
        );
        const querySnapshot = await getDocs(statusQuery);
        
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const task = this.converter!.fromFirestore({
            ...data,
            id: doc.id
          });
          tasks.push(task);
        });
        
        return {
          data: tasks,
          status: 'success',
        };
      }
      
      if (filters?.phaseId) {
        const phaseQuery = query(this.collectionRef, 
          where('projectId', '==', projectId),
          where('phaseId', '==', filters.phaseId),
          orderBy('dueDate', 'asc')
        );
        const querySnapshot = await getDocs(phaseQuery);
        
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const task = this.converter!.fromFirestore({
            ...data,
            id: doc.id
          });
          tasks.push(task);
        });
        
        return {
          data: tasks,
          status: 'success',
        };
      }
      
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const task = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        tasks.push(task);
      });
      
      return {
        data: tasks,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Task[]>(error, 'getTasksByProject');
    }
  }
  
  /**
   * Get tasks assigned to a specific user
   */
  async getTasksByAssignee(assigneeId: string, status?: TaskStatus): Promise<ApiResponse<Task[]>> {
    try {
      const constraints = [where('assigneeId', '==', assigneeId)];
      
      if (status) {
        constraints.push(where('status', '==', status));
      }
      
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const task = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        tasks.push(task);
      });
      
      return {
        data: tasks,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Task[]>(error, 'getTasksByAssignee');
    }
  }
  
  /**
   * Get tasks by phase
   */
  async getTasksByPhase(phaseId: string): Promise<ApiResponse<Task[]>> {
    try {
      const q = query(
        this.collectionRef, 
        where('phaseId', '==', phaseId),
        orderBy('dueDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const task = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        tasks.push(task);
      });
      
      return {
        data: tasks,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Task[]>(error, 'getTasksByPhase');
    }
  }
  
  /**
   * Mark a task as completed
   */
  async completeTask(taskId: string): Promise<ApiResponse<Task>> {
    try {
      const taskResponse = await this.getById(taskId);
      
      if (taskResponse.status === 'error' || !taskResponse.data) {
        return {
          error: taskResponse.error || `Task with ID ${taskId} not found`,
          status: 'error',
        };
      }
      
      const updateResponse = await this.update(taskId, {
        status: 'completed',
        completedAt: new Date(),
      });
      
      if (updateResponse.status === 'error') {
        return {
          error: updateResponse.error,
          status: 'error',
        };
      }
      
      // Get the updated task
      const updatedTask = await this.getById(taskId);
      return updatedTask;
    } catch (error) {
      return this.handleError<Task>(error, 'completeTask');
    }
  }
} 
