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
import { Project, LineItem, Bid, Task, Phase, BudgetProjection } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface FirestoreProject extends Omit<Project, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'budget' | 'location' | 'lineItems' | 'bids' | 'tasks' | 'team' | 'keyMilestones' | 'projections'> {
  id?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    contingency?: number;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  lineItems: LineItem[];
  bids: Bid[];
  tasks: Task[];
  team: string[];
  keyMilestones: {
    name: string;
    date: Date | null;
    description: string;
  }[];
  projections: BudgetProjection[];
  status: 'estimate' | 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'draft' | 'active' | 'cancelled';
  progress: number;
}

// Define as a non-export class here
class ProjectService {
  // Collection reference
  private static collection = collection(db, 'projects');

  // Utility function to safely convert dates to Firestore Timestamps
  private static dateToTimestamp(date: Date | string | Timestamp | null): Timestamp | null {
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

  // Utility function to safely convert Timestamps or Date objects to JavaScript Date
  private static convertTimestampToDate(value: any): Date | null {
    if (!value) return null;
    
    if (value instanceof Timestamp && typeof value.toDate === 'function') {
      return value.toDate();
    } else if (value instanceof Date) {
      return value;
    } else if (typeof value === 'string') {
      try {
        return new Date(value);
      } catch (e) {
        console.error('Failed to convert string to Date:', e);
        return null;
      }
    }
    
    return null;
  }

  private static convertToProjectData(data: FirestoreProject): Project {
    const phases = (data.phases || []).map(phase => ({
      ...phase,
      startDate: this.convertTimestampToDate(phase.startDate),
      endDate: this.convertTimestampToDate(phase.endDate)
    }));

    return {
      id: data.id || '',
      userId: data.userId,
      name: data.name || '',
      description: data.description || '',
      status: data.status || 'estimate',
      startDate: data.startDate ? data.startDate.toDate() : null,
      endDate: data.endDate ? data.endDate.toDate() : null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      budget: data.budget,
      location: data.location,
      phases,
      lineItems: data.lineItems || [],
      bids: data.bids || [],
      tasks: data.tasks || [],
      team: data.team || [],
      keyMilestones: data.keyMilestones || [],
      projections: data.projections || [],
      progress: data.progress || 0
    };
  }

  // Process phases to ensure dates are Firestore Timestamps
  private static processPhasesDates(phases: Phase[] = []): Phase[] {
    return phases.map(phase => ({
      ...phase,
      startDate: phase.startDate ? (phase.startDate instanceof Date ? Timestamp.fromDate(phase.startDate) : phase.startDate) : Timestamp.fromDate(new Date()),
      endDate: phase.endDate ? (phase.endDate instanceof Date ? Timestamp.fromDate(phase.endDate) : phase.endDate) : 
        Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() + 30)))
    }));
  }

  static async createProject(userId: string, projectData: Partial<Project>): Promise<Project> {
    try {
      // Add user ID and required fields to project data
      const completeProjectData: Partial<FirestoreProject> = {
        ...projectData,
        userId,
        name: projectData.name || '',
        description: projectData.description || '',
        status: projectData.status || 'estimate',
        startDate: projectData.startDate ? Timestamp.fromDate(projectData.startDate) : undefined,
        endDate: projectData.endDate ? Timestamp.fromDate(projectData.endDate) : undefined,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        budget: typeof projectData.budget === 'number' ? {
          total: projectData.budget,
          spent: 0,
          remaining: projectData.budget
        } : projectData.budget,
        location: typeof projectData.location === 'string' ? {
          address: projectData.location,
          city: '',
          state: '',
          zipCode: ''
        } : projectData.location,
        lineItems: projectData.lineItems || [],
        bids: projectData.bids || [],
        tasks: projectData.tasks || [],
        team: projectData.team || [],
        keyMilestones: projectData.keyMilestones || [],
        projections: projectData.projections || [],
        progress: projectData.progress || 0
      };

      // Add document to Firestore
      const docRef = await addDoc(this.collection, completeProjectData);
      
      // Convert Firestore data back to Project type
      const project = await this.getProjectById(docRef.id);
      if (!project) {
        throw new Error('Failed to retrieve created project');
      }
      return project;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  static async getProjectById(id: string): Promise<Project | null> {
    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreProject;
        const project: Project = {
          id: docSnap.id,
          userId: data.userId,
          name: data.name,
          description: data.description,
          status: data.status,
          budget: data.budget,
          location: data.location,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || null,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          lineItems: data.lineItems || [],
          bids: data.bids || [],
          tasks: data.tasks || [],
          team: data.team || [],
          keyMilestones: data.keyMilestones || [],
          projections: data.projections || [],
          progress: data.progress || 0,
          phases: data.phases || []
        };
        return project;
      }
      return null;
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
        const data = doc.data() as FirestoreProject;
        projects.push({
          id: doc.id,
          ...this.convertToProjectData(data)
        });
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
      const updatedData: Partial<FirestoreProject> = {
        ...projectData,
        startDate: projectData.startDate ? Timestamp.fromDate(projectData.startDate) : undefined,
        endDate: projectData.endDate ? Timestamp.fromDate(projectData.endDate) : undefined,
        updatedAt: Timestamp.fromDate(new Date()),
        budget: typeof projectData.budget === 'number' ? {
          total: projectData.budget,
          spent: 0,
          remaining: projectData.budget
        } : projectData.budget,
        location: typeof projectData.location === 'string' ? {
          address: projectData.location,
          city: '',
          state: '',
          zipCode: ''
        } : projectData.location,
        lineItems: projectData.lineItems || [],
        bids: projectData.bids || [],
        tasks: projectData.tasks || [],
        team: projectData.team || [],
        keyMilestones: projectData.keyMilestones || [],
        projections: projectData.projections || [],
        status: projectData.status || 'estimate',
        progress: projectData.progress || 0,
        phases: projectData.phases || []
      } as Partial<FirestoreProject>;

      // Update document in Firestore
      await updateDoc(projectRef, updatedData);

      // Convert Firestore data back to Project type
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Failed to retrieve updated project');
      }
      return project;
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
    startDate?: Date | Timestamp | null;
    endDate?: Date | Timestamp | null;
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
      const startDate = filters.startDate instanceof Timestamp ? filters.startDate : Timestamp.fromDate(filters.startDate);
      q = query(q, where('startDate', '>=', startDate));
    }

    if (filters?.endDate) {
      const endDate = filters.endDate instanceof Timestamp ? filters.endDate : Timestamp.fromDate(filters.endDate);
      q = query(q, where('endDate', '<=', endDate));
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
    // Convert Firestore Timestamps to Date objects
    const convertedPhases = data.phases?.map(phase => {
      const convertedPhase = {
        ...phase,
        startDate: phase.startDate ? this.dateToTimestamp(phase.startDate).toDate() : null,
        endDate: phase.endDate ? this.dateToTimestamp(phase.endDate).toDate() : null,
      };
      
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
    
    // Add common tasks for all phases
    tasks.push({
      id: uuidv4(),
      userId,
      projectId,
      title: `Create ${phaseName} plan`,
      status: 'todo',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    tasks.push({
      id: uuidv4(),
      userId,
      projectId,
      title: `Assign ${phaseName} tasks`,
      status: 'todo',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    tasks.push({
      id: uuidv4(),
      userId,
      projectId,
      title: `Track ${phaseName} progress`,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add phase-specific tasks
    switch(phaseName) {
      case 'Pre-Construction':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Obtain building permits',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Finalize architectural plans',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Conduct site survey',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Site Work & Foundation':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Clear and excavate site',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install footings',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Pour foundation',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Waterproof foundation',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Framing':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Frame exterior walls',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Frame interior walls',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install roof trusses',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install roof sheathing',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Exterior Finishing':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install roofing materials',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install exterior doors and windows',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install siding',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Rough-In Mechanical Systems':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install electrical rough-in',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install plumbing rough-in',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install HVAC rough-in',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Insulation & Drywall':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install insulation',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Hang drywall',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Tape and mud drywall',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Sand and prime drywall',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Interior Finishing':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Paint interior walls',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install interior doors',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install trim and molding',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install cabinets and countertops',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install flooring',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Mechanical Trim-Out':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install electrical fixtures',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install plumbing fixtures',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install HVAC registers and grilles',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install appliances',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Landscaping & Exterior Work':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Rough grade yard',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install driveway and walkways',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Install basic landscaping',
            status: 'todo',
            priority: 'low',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      case 'Final Inspection & Closeout':
        tasks.push(
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Schedule final inspections',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Complete punch list items',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Conduct final walk-through',
            status: 'todo',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            userId,
            projectId,
            title: 'Deliver project documentation',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        );
        break;
      default:
        throw new Error(`Unknown phase: ${phaseName}`);
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
        startDate: this.dateToTimestamp(projectStartDate),
        endDate: this.dateToTimestamp(projectEndDate)
      };
      
      // Update project with phases, tasks, and updated dates
      await this.updateProject(project.id, { 
        phases: residentialPhases.map(phase => ({
          ...phase,
          id: phase.id || uuidv4(),
          projectId: project.id,
          startDate: this.dateToTimestamp(phase.startDate),
          endDate: this.dateToTimestamp(phase.endDate)
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