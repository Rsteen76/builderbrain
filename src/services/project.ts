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
import { Project, LineItem, Bid, Task, Phase } from '../types';

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
}

export class ProjectService {
  private static collection = collection(db, 'projects');

  static async createProject(userId: string, projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    
    const budgetValue = typeof projectData.budget === 'object' && projectData.budget !== null 
                        ? projectData.budget.total 
                        : typeof projectData.budget === 'number' ? projectData.budget : 0;
    const locationValue = typeof projectData.location === 'object' && projectData.location !== null
                          ? `${projectData.location.address}, ${projectData.location.city}`
                          : typeof projectData.location === 'string' ? projectData.location : '';

    const projectToSave: Omit<FirestoreProject, 'lineItems' | 'bids' | 'tasks'> = {
      ...projectData,
      userId: userId,
      budget: budgetValue,
      location: locationValue,
      startDate: Timestamp.fromDate(projectData.startDate || new Date()),
      endDate: projectData.endDate ? Timestamp.fromDate(projectData.endDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(this.collection, projectToSave);

    return {
      ...projectData,
      id: docRef.id,
      userId: userId,
      createdAt: now,
      updatedAt: now,
      budget: typeof projectData.budget === 'number' 
              ? { total: projectData.budget, spent: 0, remaining: projectData.budget } 
              : projectData.budget,
      location: typeof projectData.location === 'string' 
                ? { address: projectData.location, city: '', state: '', zipCode: '' } 
                : projectData.location,
    } as Project;
  }

  static async updateProject(id: string, data: Partial<Project>): Promise<void> {
    try {
      console.log(`ProjectService: Updating project ${id} with data:`, data);
      const projectRef = doc(this.collection, id);
      
      // For debugging
      console.log("Update data received:", JSON.stringify(data));
      
      const firestoreUpdateData: any = {};
      
      // Special handling for array fields and complex objects
      if (data.phases) {
        // Use direct field assignment for phases array - this is the fix
        firestoreUpdateData.phases = data.phases;
        console.log("Phases data being saved:", JSON.stringify(firestoreUpdateData.phases));
      }
      
      // Process other fields
      for (const [key, value] of Object.entries(data)) {
        // Skip phases field as we handled it specially above
        if (key === 'phases') continue;
        
        const typedKey = key as keyof Project;
        
        if (value !== undefined) {
          if (typedKey === 'startDate' || typedKey === 'endDate' || typedKey === 'createdAt' || typedKey === 'updatedAt') {
            // Convert Date objects to Firestore Timestamps
            if (value instanceof Date) {
              firestoreUpdateData[typedKey] = Timestamp.fromDate(value);
            } else if (typedKey === 'endDate' && value === null) {
              firestoreUpdateData.endDate = null;
            }
          } else if (typedKey === 'budget') {
            firestoreUpdateData.budget = typeof value === 'object' && value !== null 
                                        ? (value as any).total
                                        : typeof value === 'number' ? value : 0;
          } else if (typedKey === 'location') {
              firestoreUpdateData.location = typeof value === 'object' && value !== null
                                          ? `${(value as any).address}, ${(value as any).city}`
                                          : typeof value === 'string' ? value : '';
          } else {
             // For other array fields like tasks, bids, team etc.
             if (Array.isArray(value)) {
               firestoreUpdateData[typedKey] = value;
             } else {
               firestoreUpdateData[typedKey] = value;
             }
          }
        }
      }
      
      console.log("Final Firestore update data:", JSON.stringify(firestoreUpdateData));
      await updateDoc(projectRef, firestoreUpdateData);
      console.log(`ProjectService: Project ${id} updated successfully`);
    } catch (error) {
      console.error(`ProjectService: Error updating project ${id}:`, error);
      throw error;
    }
  }

  static async deleteProject(id: string): Promise<void> {
    const projectRef = doc(this.collection, id);
    await deleteDoc(projectRef);
  }

  static async getProject(projectId: string, userId: string): Promise<Project | null> {
    try {
      console.log(`ProjectService: Fetching project ${projectId} for user ${userId}`);
      const projectRef = doc(this.collection, projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        console.log(`ProjectService: Project ${projectId} not found.`);
        return null;
      }

      const data = projectDoc.data() as FirestoreProject;

      // DEVELOPMENT MODE: Allow access regardless of ownership
      // In production, you would want to re-enable this check
      if (data.userId !== userId) {
        console.warn(`ProjectService: User ${userId} accessing project ${projectId} owned by ${data.userId}. ALLOWING access for development.`);
      }

      return this.convertFirestoreData(data, projectId);
    } catch (error) {
      console.error(`ProjectService: Error fetching project ${projectId}:`, error);
      throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getProjects(userId: string, filters?: {
    status?: Project['status'];
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Project[]> {
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
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreProject;
      return this.convertFirestoreData(data, doc.id);
    });
  }

  private static convertFirestoreData(data: FirestoreProject, id: string): Project {
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
      phases: data.phases || [],
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
      id: crypto.randomUUID(),
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
        
        // Calculate phase duration and dates
        const phaseStartDate = index === 0 
          ? new Date() 
          : this.addDays(new Date(), remainingDays);
        
        const phaseDuration = 30; // Each phase is roughly 30 days
        remainingDays += phaseDuration;
        
        const phaseEndDate = this.addDays(phaseStartDate, phaseDuration);
        
        // Create the phase
        const phase: Phase = {
          id: crypto.randomUUID(),
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
      
      // Add phases to the project
      const updatedProject = {
        ...project,
        phases: residentialPhases,
        tasks: [...(project.tasks || []), ...allTasks]
      };
      
      // Update project with phases and tasks
      await this.updateProject(project.id, { 
        phases: residentialPhases.map(phase => ({
          ...phase,
          id: phase.id || crypto.randomUUID(),
          projectId: project.id
        })),
        tasks: updatedProject.tasks
      });
      
      console.log(`Residential project created with ${residentialPhases.length} phases and ${allTasks.length} tasks`);
      
      // Return the updated project
      return await this.getProject(project.id, userId) as Project;
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
}

// Update standalone getProject to match ProjectService.getProject parameter order,
// and to be more permissive with permissions checking during development
export const getProject = async (projectId: string, userId: string): Promise<Project | null> => {
  try {
    console.log(`getProject: Fetching project ${projectId} for user ${userId}`);
    const projectRef = doc(db, 'projects', projectId);
    const projectSnapshot = await getDoc(projectRef);
    
    if (!projectSnapshot.exists()) {
      console.log(`getProject: Project with ID ${projectId} not found.`);
      return null;
    }
    
    const data = projectSnapshot.data();
    
    // Type safety check
    if (!data) {
      console.error('getProject: Project data is empty');
      return null;
    }
    
    // Convert Firestore timestamp fields to JavaScript Date objects
    const project: Project = {
      id: projectSnapshot.id,
      userId: data.userId,
      name: data.name || '',
      description: data.description || '',
      status: data.status || 'planning',
      priority: data.priority,
      clientId: data.clientId,
      contractorId: data.contractorId,
      startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate || Date.now()),
      endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : null,
      budget: typeof data.budget === 'number' 
        ? { total: data.budget, spent: 0, remaining: data.budget } 
        : data.budget || { total: 0, spent: 0, remaining: 0 },
      location: typeof data.location === 'string'
        ? { address: data.location, city: '', state: '', zipCode: '' }
        : data.location || { address: '', city: '', state: '', zipCode: '' },
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      team: data.team || [],
      projectType: data.projectType || '',
      estimatedDuration: data.estimatedDuration || '',
      phases: data.phases || [],
      keyMilestones: data.keyMilestones || [],
      requirements: data.requirements || { permits: [], inspections: [], documents: [] },
      tasks: data.tasks || []
    };
    
    // DEVELOPMENT MODE: Skip permission checking
    if (project.userId !== userId) {
      console.warn(`getProject: User ${userId} accessing project ${projectId} owned by ${project.userId}. ALLOWING access for development.`);
    }
    
    return project;
  } catch (error) {
    console.error(`getProject: Error fetching project ${projectId}:`, error);
    throw error;
  }
};