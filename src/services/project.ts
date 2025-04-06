import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { Project, LineItem, Bid, Task, Phase, ProjectStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface FirestoreProject extends Omit<Project, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'budget' | 'location' | 'lineItems' | 'bids' | 'tasks'> {
  userId: string;
  startDate: Timestamp;
  endDate?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  budget: number;
  location: string;
  lineItems?: LineItem[];
  bids?: Bid[];
  tasks?: Task[];
  phases?: Array<Omit<Phase, 'startDate' | 'endDate'> & {
    startDate: Timestamp | string | Date;
    endDate: Timestamp | string | Date;
  }>;
}

// Define as a non-export class here
class ProjectService {
  // Collection reference
  private static collection = collection(db, 'projects');

  // Utility function to safely convert dates to Firestore Timestamps
  private static dateToTimestamp(date: any): Timestamp | null {
    if (!date) return null;
    
    if (date instanceof Timestamp) {
      return date;
    } else if (date instanceof Date) {
      return Timestamp.fromDate(date);
    } else if (typeof date === 'string') {
      try {
        return Timestamp.fromDate(new Date(date));
      } catch (e) {
        console.error('Failed to convert string date to Timestamp:', e);
        return null;
      }
    }
    
    return null;
  }

  // Process phases to ensure dates are Firestore Timestamps
  private static processPhasesDates(phases: Phase[] = []): any[] {
    return phases.map(phase => {
      const processedPhase = { ...phase };
      
      // Convert dates to Timestamps
      processedPhase.startDate = this.dateToTimestamp(phase.startDate) || Timestamp.fromDate(new Date());
      processedPhase.endDate = this.dateToTimestamp(phase.endDate) || 
        this.dateToTimestamp(new Date(new Date().setDate(new Date().getDate() + 30)));
      
      return processedPhase;
    });
  }

  static async createProject(userId: string, projectData: Partial<Project>): Promise<Project> {
    try {
      // Add user ID to project data
      const completeProjectData = {
        ...projectData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add document to Firestore
      const docRef = await addDoc(this.collection, completeProjectData);
      
      // Return the complete project with ID
      return {
        id: docRef.id,
        ...completeProjectData
      } as Project;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  static async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await getDoc(doc(this.collection, projectId));
      
      if (!projectDoc.exists()) {
        return null;
      }
      
      return {
        id: projectDoc.id,
        ...projectDoc.data()
      } as Project;
    } catch (error) {
      console.error("Error getting project:", error);
      throw error;
    }
  }

  static async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const projectsQuery = query(this.collection, where("userId", "==", userId));
      const querySnapshot = await getDocs(projectsQuery);
      
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        projects.push({
          id: doc.id,
          ...doc.data()
        } as Project);
      });
      
      return projects;
    } catch (error) {
      console.error("Error getting user projects:", error);
      throw error;
    }
  }

  static async updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    try {
      const projectRef = doc(this.collection, projectId);
      
      // Add updated timestamp
      const updatedData = {
        ...projectData,
        updatedAt: new Date()
      };
      
      await updateDoc(projectRef, updatedData);
      
      // Get the updated project
      const updatedProject = await this.getProjectById(projectId);
      
      if (!updatedProject) {
        throw new Error("Project not found after update");
      }
      
      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  static async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.collection, projectId));
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  static async getProjects(userId: string, filters?: {
    status?: Project['status'];
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Project[]> {
    console.log(`ProjectService: Fetching projects for user: ${userId}, with filters:`, filters);
    
    if (!userId) {
      console.error("ProjectService: No userId provided to getProjects");
      return [];
    }
    
    let q = query(this.collection, where('userId', '==', userId));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters?.clientId) {
      q = query(q, where('clientId', '==', filters.clientId));
    }

    if (filters?.startDate) {
      q = query(q, where('startDate', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters?.endDate) {
      q = query(q, where('endDate', '<=', Timestamp.fromDate(filters.endDate)));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    console.log(`ProjectService: Found ${querySnapshot.docs.length} projects`);
    
    if (querySnapshot.empty) {
      console.log("ProjectService: No projects found for user:", userId);
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreProject;
      return this.convertFirestoreData(data, doc.id);
    });
  }

  private static convertFirestoreData(data: FirestoreProject, id: string): Project {
    // Convert phase dates from Firestore Timestamps to Date objects
    const convertedPhases = data.phases?.map(phase => {
      const convertedPhase = { ...phase };
      
      // Convert phase start date
      if (convertedPhase.startDate instanceof Timestamp) {
        convertedPhase.startDate = convertedPhase.startDate.toDate();
      } else if (typeof convertedPhase.startDate === 'string') {
        convertedPhase.startDate = new Date(convertedPhase.startDate);
      } else if (!convertedPhase.startDate) {
        convertedPhase.startDate = new Date();
      }
      
      // Convert phase end date
      if (convertedPhase.endDate instanceof Timestamp) {
        convertedPhase.endDate = convertedPhase.endDate.toDate();
      } else if (typeof convertedPhase.endDate === 'string') {
        convertedPhase.endDate = new Date(convertedPhase.endDate);
      } else if (!convertedPhase.endDate) {
        // If no end date, set it to 30 days after start date
        const endDate = new Date(convertedPhase.startDate);
        endDate.setDate(endDate.getDate() + 30);
        convertedPhase.endDate = endDate;
      }
      
      return convertedPhase;
    }) || [];
    
    console.log('Converting Firestore data with phases:', convertedPhases.map(p => ({
      name: p.name,
      startDate: p.startDate instanceof Date ? p.startDate.toISOString() : p.startDate,
      endDate: p.endDate instanceof Date ? p.endDate.toISOString() : p.endDate
    })));

    const project: Project = {
      ...data,
      id: id,
      userId: data.userId,
      startDate: data.startDate.toDate(),
      endDate: data.endDate ? data.endDate.toDate() : null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      budget: { 
          total: data.budget || 0, 
          spent: 0,
          remaining: data.budget || 0 
      }, 
      location: { 
          address: data.location || '',
          city: '', 
          state: '', 
          zipCode: '' 
      }, 
      lineItems: data.lineItems || [],
      bids: data.bids || [],
      tasks: data.tasks || [],
      team: data.team || [],
      phases: convertedPhases,
      keyMilestones: data.keyMilestones || [],
      requirements: data.requirements || { permits: [], inspections: [], documents: [] },
    };
    return project;
  }

  /**
   * Helper method to get phase description based on name
   */
  private static getPhasesDescription(phaseName: string): string {
    switch(phaseName) {
      case 'Pre-Construction':
        return 'Planning, permits, site preparation, and initial design work';
      case 'Site Work & Foundation':
        return 'Clearing the site, excavation, pouring footings and foundation';
      case 'Framing':
        return 'Building the skeleton of the house including walls, floors, and roof';
      case 'Exterior Finishing':
        return 'Roofing, siding, windows, and doors';
      case 'Rough-In Mechanical Systems':
        return 'Electrical, plumbing, and HVAC rough-in installation';
      case 'Insulation & Drywall':
        return 'Installing insulation and hanging and finishing drywall';
      case 'Interior Finishing':
        return 'Painting, trim, cabinets, countertops, and flooring';
      case 'Mechanical Trim-Out':
        return 'Installing fixtures, outlets, switches, and appliances';
      case 'Landscaping & Exterior Work':
        return 'Basic grading, driveways, walkways, and plantings';
      case 'Final Inspection & Closeout':
        return 'Final walk-through, punch list items, and project delivery';
      default:
        return 'Construction phase';
    }
  }
  
  /**
   * Helper method to create tasks based on phase name
   */
  private static createPhaseTasks(userId: string, projectId: string, phaseName: string): Task[] {
    const tasks: Task[] = [];
    
    // Common task structure
    const createTask = (title: string, priority: 'low' | 'medium' | 'high' = 'medium'): Task => ({
      id: uuidv4(),
      userId,
      projectId,
      title,
      status: 'todo',
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add phase-specific tasks
    switch(phaseName) {
      case 'Pre-Construction':
        tasks.push(
          createTask('Obtain building permits', 'high'),
          createTask('Finalize architectural plans', 'high'),
          createTask('Conduct site survey', 'medium')
        );
        break;
      case 'Site Work & Foundation':
        tasks.push(
          createTask('Clear and excavate site', 'high'),
          createTask('Install footings', 'high'),
          createTask('Pour foundation', 'high'),
          createTask('Waterproof foundation', 'high')
        );
        break;
      case 'Framing':
        tasks.push(
          createTask('Frame exterior walls', 'high'),
          createTask('Frame interior walls', 'high'),
          createTask('Install roof trusses', 'high'),
          createTask('Install roof sheathing', 'high')
        );
        break;
      case 'Exterior Finishing':
        tasks.push(
          createTask('Install roofing materials', 'high'),
          createTask('Install exterior doors and windows', 'high'),
          createTask('Install siding', 'medium')
        );
        break;
      case 'Rough-In Mechanical Systems':
        tasks.push(
          createTask('Install electrical rough-in', 'high'),
          createTask('Install plumbing rough-in', 'high'),
          createTask('Install HVAC rough-in', 'high')
        );
        break;
      case 'Insulation & Drywall':
        tasks.push(
          createTask('Install insulation', 'high'),
          createTask('Hang drywall', 'high'),
          createTask('Tape and mud drywall', 'medium'),
          createTask('Sand and prime drywall', 'medium')
        );
        break;
      case 'Interior Finishing':
        tasks.push(
          createTask('Paint interior walls', 'medium'),
          createTask('Install interior doors', 'medium'),
          createTask('Install trim and molding', 'medium'),
          createTask('Install cabinets and countertops', 'high'),
          createTask('Install flooring', 'high')
        );
        break;
      case 'Mechanical Trim-Out':
        tasks.push(
          createTask('Install electrical fixtures', 'high'),
          createTask('Install plumbing fixtures', 'high'),
          createTask('Install HVAC registers and grilles', 'medium'),
          createTask('Install appliances', 'medium')
        );
        break;
      case 'Landscaping & Exterior Work':
        tasks.push(
          createTask('Rough grade yard', 'medium'),
          createTask('Install driveway and walkways', 'medium'),
          createTask('Install basic landscaping', 'low')
        );
        break;
      case 'Final Inspection & Closeout':
        tasks.push(
          createTask('Schedule final inspections', 'high'),
          createTask('Complete punch list items', 'high'),
          createTask('Conduct final walk-through', 'high'),
          createTask('Deliver project documentation', 'medium')
        );
        break;
    }
    
    return tasks;
  }

  /**
   * Creates a new residential construction project with standard phases
   * @param userId The user ID creating the project
   * @param projectData Basic project data
   * @returns The created project with all phases
   */
  static async createResidentialProject(
    userId: string, 
    projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'phases'>
  ): Promise<Project> {
    try {
      // First create the basic project
      const project = await this.createProject(userId, {
        ...projectData,
        projectType: 'Residential Construction'
      });
      
      console.log("Creating residential project with base project:", project.id);
      
      // Calculate total budget from project data
      const totalBudget = typeof projectData.budget === 'number'
        ? projectData.budget
        : (projectData.budget?.total || 0);
      
      // Get project start date from projectData or use today if not provided
      const projectStartDate = projectData.startDate || new Date();
      console.log("Using project start date:", projectStartDate);
      
      // Get project end date if provided, or calculate it based on standard duration
      const hasUserProvidedEndDate = projectData.endDate !== undefined && projectData.endDate !== null;
      // If user provided an end date, use it directly
      const projectEndDate = hasUserProvidedEndDate 
        ? (projectData.endDate instanceof Date 
           ? projectData.endDate 
           : (typeof projectData.endDate === 'string' || typeof projectData.endDate === 'number')
             ? new Date(projectData.endDate)
             : this.addDays(new Date(projectStartDate), 270))
        : this.addDays(new Date(projectStartDate), 270); // Default to ~9 months if no end date specified
        
      console.log("Project end date:", projectEndDate, "User provided:", hasUserProvidedEndDate);
      
      // Calculate total project duration in days
      const totalProjectDays = Math.ceil((projectEndDate.getTime() - new Date(projectStartDate).getTime()) / (1000 * 60 * 60 * 24));
      console.log("Total project duration:", totalProjectDays, "days");
      
      // Adjust phase duration based on total project days
      const phaseDuration = Math.floor(totalProjectDays / 10); // Divide by number of phases for even distribution
      
      // Define standard residential construction phases with percentage allocations
      const phaseAllocations = [
        { name: 'Pre-Construction', percentage: 0.05 }, // 5%
        { name: 'Site Work & Foundation', percentage: 0.15 }, // 15%
        { name: 'Framing', percentage: 0.2 }, // 20%
        { name: 'Exterior Finishing', percentage: 0.1 }, // 10%
        { name: 'Rough-In Mechanical Systems', percentage: 0.1 }, // 10%
        { name: 'Insulation & Drywall', percentage: 0.08 }, // 8%
        { name: 'Interior Finishing', percentage: 0.15 }, // 15%
        { name: 'Mechanical Trim-Out', percentage: 0.07 }, // 7%
        { name: 'Landscaping & Exterior Work', percentage: 0.05 }, // 5%
        { name: 'Final Inspection & Closeout', percentage: 0.05 }, // 5%
      ];
      
      // Validate that percentages add up to 100%
      const totalPercentage = phaseAllocations.reduce((sum, phase) => sum + phase.percentage, 0);
      if (Math.abs(totalPercentage - 1) > 0.001) { // Allow for small floating point errors
        console.warn(`Phase budget allocations don't add up to 100% (actual: ${totalPercentage * 100}%). Normalizing values.`);
        // Normalize percentages to ensure they sum to exactly 1 (100%)
        phaseAllocations.forEach(phase => {
          phase.percentage = phase.percentage / totalPercentage;
        });
      }
      
      // Create phases with normalized budget allocations
      const residentialPhases: Phase[] = [];
      let remainingDays = 0;
      
      phaseAllocations.forEach((allocation, index) => {
        // Calculate exact budget based on percentage
        const phaseBudget = Math.round(totalBudget * allocation.percentage);
        
        // Calculate phase duration and dates based on project start date and total duration
        const phaseStartDate = index === 0 
          ? new Date(projectStartDate) 
          : this.addDays(new Date(projectStartDate), remainingDays);
        
        // Use calculated phaseDuration (minimum 7 days per phase)
        const actualPhaseDuration = Math.max(7, phaseDuration);
        remainingDays += actualPhaseDuration;
        
        const phaseEndDate = this.addDays(phaseStartDate, actualPhaseDuration);
        
        // Create the phase
        const phase: Phase = {
          id: uuidv4(),
          projectId: project.id,
          name: allocation.name,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          status: 'not_started',
          progress: 0,
          budget: phaseBudget,
          actualCost: 0,
          description: this.getPhasesDescription(allocation.name),
          tasks: this.createPhaseTasks(userId, project.id, allocation.name),
        };
        
        residentialPhases.push(phase);
      });
      
      // Verify total budget matches sum of phase budgets
      const totalPhaseBudget = residentialPhases.reduce((sum, phase) => sum + phase.budget, 0);
      console.log(`Total budget: ${totalBudget}, Sum of phase budgets: ${totalPhaseBudget}`);
      
      // Collect all tasks from phases to add to project tasks
      const allTasks: Task[] = [];
      residentialPhases.forEach(phase => {
        if (phase.tasks && phase.tasks.length > 0) {
          allTasks.push(...phase.tasks);
        }
      });
      
      console.log(`Collected ${allTasks.length} tasks from all phases`);
      console.log(`Project timeline: ${projectStartDate.toISOString()} to ${projectEndDate.toISOString()}`);
      
      // Add phases to the project
      const updatedProject = {
        ...project,
        phases: residentialPhases,
        tasks: [...(project.tasks || []), ...allTasks],
        startDate: projectStartDate instanceof Date ? projectStartDate : new Date(projectStartDate),
        endDate: projectEndDate
      };
      
      // Update project with phases, tasks, and updated dates
      await this.updateProject(project.id, { 
        phases: residentialPhases.map(phase => ({
          ...phase,
          id: phase.id || uuidv4(),
          projectId: project.id
        })),
        tasks: updatedProject.tasks,
        startDate: updatedProject.startDate,
        endDate: updatedProject.endDate
      });
      
      console.log(`Residential project created with ${residentialPhases.length} phases and ${allTasks.length} tasks`);
      
      // Return the updated project
      return await this.getProjectById(project.id) as Project;
    } catch (error) {
      console.error('Error creating residential project:', error);
      throw error;
    }
  }

  /**
   * Helper method to add days to a date
   * @param date The starting date
   * @param days Number of days to add
   * @returns A new date with days added
   */
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static async getProject(projectId: string, userId: string): Promise<Project | null> {
    // This is just a wrapper around getProjectById for backward compatibility
    return this.getProjectById(projectId);
  }

  // Method to create a kitchen remodel project
  static async createProjectWithTemplate(
    userId: string,
    projectData: Partial<Project>,
    templateType: string
  ): Promise<Project> {
    // Since we removed the specialized template handling, this now just calls createProject
    return this.createProject(userId, projectData);
  }
}

// Export the ProjectService class
export { ProjectService };

// Export a standalone wrapper for getProjectById for compatibility
export const getProjectById = async (projectId: string, userId: string): Promise<Project | null> => {
  return ProjectService.getProjectById(projectId);
};

// Export standalone functions that match the ProjectService class methods
export const createProject = async (userId: string, projectData: Partial<Project>): Promise<Project> => {
  return ProjectService.createProject(userId, projectData);
};

export const getProjects = async (userId: string, filters?: {
  status?: Project['status'];
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Project[]> => {
  return ProjectService.getProjects(userId, filters);
};

export const updateProject = async (projectId: string, projectData: Partial<Project>): Promise<Project> => {
  return ProjectService.updateProject(projectId, projectData);
};

export const deleteProject = async (projectId: string): Promise<void> => {
  return ProjectService.deleteProject(projectId);
};

export const getAllProjects = async (): Promise<Project[]> => {
  // This function should be defined in the class if it exists
  // For now, providing a simple implementation
  console.error('getAllProjects is not implemented');
  return [];
};

export const getProject = async (projectId: string, userId: string): Promise<Project | null> => {
  return ProjectService.getProject(projectId, userId);
};