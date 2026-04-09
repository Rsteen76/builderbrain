import { Timestamp, DocumentData, where, query, getDocs } from 'firebase/firestore';
import { BaseService } from './base.service';
import { Project, ProjectBudget, ProjectLocation, ApiResponse } from '../types';

export class ProjectService extends BaseService<Project> {
  constructor() {
    super('projects', {
      toFirestore: (project: Project): DocumentData => {
        const firestoreProject: DocumentData = {
          userId: project.userId,
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          clientId: project.clientId,
          contractorId: project.contractorId,
          projectType: project.projectType,
          estimatedDuration: project.estimatedDuration,
          team: project.team,
          
          // Convert complex objects to simple types for Firestore
          startDate: this.dateToTimestamp(project.startDate),
          endDate: project.endDate ? this.dateToTimestamp(project.endDate) : null,
          createdAt: project.createdAt ? this.dateToTimestamp(project.createdAt) : Timestamp.now(),
          updatedAt: Timestamp.now(),
          
          // Convert budget object to number
          budget: typeof project.budget === 'object' ? project.budget.total : project.budget,
          
          // Convert location object to string
          location: typeof project.location === 'object' 
            ? `${project.location.address}, ${project.location.city}, ${project.location.state} ${project.location.zipCode}`
            : project.location,
          
          // Handle complex arrays
          phases: project.phases?.map(phase => ({
            ...phase,
            startDate: phase.startDate ? (
              // If it's already a Timestamp, use it directly
              phase.startDate instanceof Timestamp ? phase.startDate :
              // Otherwise, convert to Date first, then to Timestamp
              typeof phase.startDate === 'string' ? 
                Timestamp.fromDate(new Date(phase.startDate)) : 
                phase.startDate instanceof Date ? 
                  this.dateToTimestamp(phase.startDate) : 
                  null
            ) : null,
            endDate: phase.endDate ? (
              // If it's already a Timestamp, use it directly
              phase.endDate instanceof Timestamp ? phase.endDate :
              // Otherwise, convert to Date first, then to Timestamp  
              typeof phase.endDate === 'string' ? 
                Timestamp.fromDate(new Date(phase.endDate)) : 
                phase.endDate instanceof Date ? 
                  this.dateToTimestamp(phase.endDate) : 
                  null
            ) : null,
          })),
          
          keyMilestones: project.keyMilestones?.map(milestone => ({
            ...milestone,
            date: milestone.date ? (
              // If it's already a Timestamp, use it directly
              milestone.date instanceof Timestamp ? milestone.date :
              // Otherwise, convert appropriately
              typeof milestone.date === 'string' ?
                Timestamp.fromDate(new Date(milestone.date)) :
                milestone.date instanceof Date ?
                  this.dateToTimestamp(milestone.date) :
                  null
            ) : null,
          })),
          
          // Simple arrays
          requirements: project.requirements,
          actualCost: project.actualCost,
        };
        
        return firestoreProject;
      },
      
      fromFirestore: (data: DocumentData): Project => {
        // Convert budget from number to object if needed
        let budget: ProjectBudget | number;
        if (typeof data.budget === 'number') {
          budget = {
            total: data.budget,
            spent: data.actualCost || 0,
            remaining: data.budget - (data.actualCost || 0)
          };
        } else {
          budget = data.budget;
        }
        
        // Convert location from string to object if needed
        let location: ProjectLocation | string;
        if (typeof data.location === 'string') {
          const parts = data.location.split(',').map(part => part.trim());
          if (parts.length >= 3) { // Format: "address, city, state zipcode"
            const stateParts = parts[2].split(' ');
            location = {
              address: parts[0],
              city: parts[1],
              state: stateParts[0],
              zipCode: stateParts.slice(1).join(' ')
            };
          } else {
            location = data.location;
          }
        } else {
          location = data.location;
        }
        
        // Convert dates from Timestamp to Date
        const startDate = this.timestampToDate(data.startDate) || new Date();
        const endDate = this.timestampToDate(data.endDate);
        const createdAt = this.timestampToDate(data.createdAt) || new Date();
        const updatedAt = this.timestampToDate(data.updatedAt) || new Date();
        
        // Convert phases if they exist
        const phases = data.phases?.map((phase: any) => ({
          ...phase,
          startDate: this.timestampToDate(phase.startDate),
          endDate: this.timestampToDate(phase.endDate),
          // Ensure tasks is properly handled as an array of objects
          tasks: Array.isArray(phase.tasks) ? phase.tasks.map((task: any) => ({
            ...task,
            // Convert any date fields if needed
            dueDate: this.timestampToDate(task.dueDate),
            completedAt: this.timestampToDate(task.completedAt),
            createdAt: this.timestampToDate(task.createdAt) || new Date(),
            updatedAt: this.timestampToDate(task.updatedAt) || new Date(),
          })) : []
        })) || [];
        
        // Convert milestones if they exist
        const keyMilestones = data.keyMilestones?.map((milestone: any) => ({
          ...milestone,
          date: this.timestampToDate(milestone.date),
        })) || [];
        
        return {
          id: data.id, // This is added by the base service
          userId: data.userId,
          name: data.name,
          description: data.description,
          status: data.status,
          priority: data.priority,
          clientId: data.clientId,
          contractorId: data.contractorId,
          startDate,
          endDate,
          budget,
          location,
          createdAt,
          updatedAt,
          team: data.team || [],
          projectType: data.projectType,
          estimatedDuration: data.estimatedDuration,
          phases,
          keyMilestones,
          requirements: data.requirements,
          lineItems: data.lineItems || [],
          tasks: data.tasks || [],
          expenses: data.expenses || [],
          bids: data.bids || [],
          actualCost: data.actualCost,
          progress: data.progress || 0,
        };
      }
    });
  }
  
  /**
   * Get projects by user ID with optional filters
   */
  async getProjectsByUser(
    userId: string, 
    filters?: {
      status?: Project['status'];
      clientId?: string;
      startDateFrom?: Date;
      startDateTo?: Date;
    }
  ): Promise<ApiResponse<Project[]>> {
    try {
      // Create query constraints
      const constraints = [where('userId', '==', userId)];
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters?.clientId) {
        constraints.push(where('clientId', '==', filters.clientId));
      }
      
      // Note: Date range filters would need composite indexes in Firestore
      
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const project = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        projects.push(project);
      });
      
      return {
        data: projects,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Project[]>(error, 'getProjectsByUser');
    }
  }
} 
