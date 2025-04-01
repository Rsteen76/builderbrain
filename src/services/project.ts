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
      
      // Define standard residential construction phases
      const residentialPhases: Phase[] = [
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Pre-Construction',
          startDate: new Date(),
          endDate: this.addDays(new Date(), 30),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.05  // 5% of total budget
            : (projectData.budget?.total || 0) * 0.05,
          actualCost: 0,
          description: 'Planning, permits, site preparation, and initial design work',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Obtain building permits',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Finalize architectural plans',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Conduct site survey',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Site Work & Foundation',
          startDate: this.addDays(new Date(), 30),
          endDate: this.addDays(new Date(), 60),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.15  // 15% of total budget
            : (projectData.budget?.total || 0) * 0.15,
          actualCost: 0,
          description: 'Clearing the site, excavation, pouring footings and foundation',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Clear and excavate site',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install footings',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Pour foundation',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Waterproof foundation',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Framing',
          startDate: this.addDays(new Date(), 60),
          endDate: this.addDays(new Date(), 90),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.20  // 20% of total budget
            : (projectData.budget?.total || 0) * 0.20,
          actualCost: 0,
          description: 'Building the skeleton of the house including walls, floors, and roof',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Frame exterior walls',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Frame interior walls',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install roof trusses',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install roof sheathing',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Exterior Finishing',
          startDate: this.addDays(new Date(), 90),
          endDate: this.addDays(new Date(), 120),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.10  // 10% of total budget
            : (projectData.budget?.total || 0) * 0.10,
          actualCost: 0,
          description: 'Roofing, siding, windows, and doors',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install roofing materials',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install windows and exterior doors',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install siding and exterior trim',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Rough-In Mechanical Systems',
          startDate: this.addDays(new Date(), 120),
          endDate: this.addDays(new Date(), 150),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.15  // 15% of total budget
            : (projectData.budget?.total || 0) * 0.15,
          actualCost: 0,
          description: 'Plumbing, electrical, and HVAC rough-in work',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Rough-in plumbing',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Rough-in electrical',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Rough-in HVAC',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Schedule rough-in inspections',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Insulation & Drywall',
          startDate: this.addDays(new Date(), 150),
          endDate: this.addDays(new Date(), 170),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.07  // 7% of total budget
            : (projectData.budget?.total || 0) * 0.07,
          actualCost: 0,
          description: 'Installing insulation, hanging and finishing drywall',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install insulation',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install drywall',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Tape and mud drywall',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Sand and prime drywall',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Interior Finishing',
          startDate: this.addDays(new Date(), 170),
          endDate: this.addDays(new Date(), 210),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.15  // 15% of total budget
            : (projectData.budget?.total || 0) * 0.15,
          actualCost: 0,
          description: 'Cabinets, trim, painting, flooring, and fixtures',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install interior doors and trim',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install kitchen and bathroom cabinets',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install countertops',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Interior painting',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install flooring',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Mechanical Trim-Out',
          startDate: this.addDays(new Date(), 210),
          endDate: this.addDays(new Date(), 230),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.08  // 8% of total budget
            : (projectData.budget?.total || 0) * 0.08,
          actualCost: 0,
          description: 'Final installation of plumbing fixtures, electrical fixtures, HVAC registers',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install plumbing fixtures',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install light fixtures and outlets',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install HVAC registers and thermostat',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install appliances',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Landscaping & Exterior Work',
          startDate: this.addDays(new Date(), 230),
          endDate: this.addDays(new Date(), 250),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.05  // 5% of total budget
            : (projectData.budget?.total || 0) * 0.05,
          actualCost: 0,
          description: 'Grading, driveways, patios, walkways, and basic landscaping',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Final grading',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Install driveway and walkways',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Basic landscaping',
              status: 'todo',
              priority: 'low',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          name: 'Final Inspection & Closeout',
          startDate: this.addDays(new Date(), 250),
          endDate: this.addDays(new Date(), 270),
          status: 'not_started',
          progress: 0,
          budget: typeof projectData.budget === 'number' 
            ? projectData.budget * 0.02  // 2% of total budget
            : (projectData.budget?.total || 0) * 0.02,
          actualCost: 0,
          description: 'Final inspections, punch list completion, and project handover',
          tasks: [
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Final cleaning',
              status: 'todo',
              priority: 'medium',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Schedule final inspections',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Complete punch list items',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Client walkthrough',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: crypto.randomUUID(),
              userId,
              projectId: project.id,
              title: 'Obtain certificate of occupancy',
              status: 'todo',
              priority: 'high',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ];
      
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