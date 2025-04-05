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

export class ProjectService {
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

  static async createProject(userId: string, projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    console.log(`ProjectService: Creating project for user: ${userId}`);
    
    const budgetValue = typeof projectData.budget === 'object' && projectData.budget !== null 
                        ? projectData.budget.total 
                        : typeof projectData.budget === 'number' ? projectData.budget : 0;
    const locationValue = typeof projectData.location === 'object' && projectData.location !== null
                          ? `${projectData.location.address}, ${projectData.location.city}`
                          : typeof projectData.location === 'string' ? projectData.location : '';

    // Process phases to ensure dates are Firestore Timestamps
    const processedPhases = this.processPhasesDates(projectData.phases || []);

    const projectToSave: Omit<FirestoreProject, 'lineItems' | 'bids' | 'tasks'> = {
      ...projectData,
      userId: userId,
      budget: budgetValue,
      location: locationValue,
      phases: processedPhases,
      startDate: Timestamp.fromDate(projectData.startDate || new Date()),
      endDate: projectData.endDate ? Timestamp.fromDate(projectData.endDate) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    console.log("Saving project to Firestore with data:", JSON.stringify({
      ...projectToSave,
      startDate: projectToSave.startDate.toDate().toISOString(),
      endDate: projectToSave.endDate ? projectToSave.endDate.toDate().toISOString() : null,
      createdAt: projectToSave.createdAt.toDate().toISOString(),
      updatedAt: projectToSave.updatedAt.toDate().toISOString(),
    }));

    const docRef = await addDoc(this.collection, projectToSave);
    console.log(`Project created with ID: ${docRef.id}`);

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
        // Convert dates in phases to Firestore Timestamps
        firestoreUpdateData.phases = this.processPhasesDates(data.phases);
        
        console.log("Phases data being saved with proper date conversion:", 
          JSON.stringify(firestoreUpdateData.phases.map((p: any) => ({
            name: p.name,
            startDate: p.startDate instanceof Timestamp ? p.startDate.toDate().toISOString() : p.startDate,
            endDate: p.endDate instanceof Timestamp ? p.endDate.toDate().toISOString() : p.endDate
          }))));
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

      // Define realistic phase allocations with variable durations, dependencies, and potential overlaps
      // Values are based on industry standards for residential construction
      const phaseDefinitions = [
        {
          name: 'Pre-Construction',
          budgetPercentage: 0.05, // 5%
          durationPercentage: 0.10, // 10% of total time
          dependsOn: null, // No dependencies
          canOverlapWith: ['Site Work & Foundation'], // Can overlap with next phase
          overlapPercentage: 0.2, // 20% overlap with next phase
          description: this.getPhasesDescription('Pre-Construction')
        },
        {
          name: 'Site Work & Foundation',
          budgetPercentage: 0.15, // 15%
          durationPercentage: 0.12, // 12% of total time
          dependsOn: 'Pre-Construction',
          dependencyOffset: -0.2, // Start when previous phase is 80% complete
          canOverlapWith: [], // No overlap
          description: this.getPhasesDescription('Site Work & Foundation')
        },
        {
          name: 'Framing',
          budgetPercentage: 0.20, // 20%
          durationPercentage: 0.15, // 15% of total time
          dependsOn: 'Site Work & Foundation',
          dependencyOffset: 0, // Start after previous phase
          canOverlapWith: [], // No overlap
          description: this.getPhasesDescription('Framing')
        },
        {
          name: 'Exterior Finishing',
          budgetPercentage: 0.10, // 10%
          durationPercentage: 0.12, // 12% of total time
          dependsOn: 'Framing',
          dependencyOffset: -0.1, // Start when framing is 90% complete
          canOverlapWith: ['Rough-In Mechanical Systems'], // Can overlap with next phase
          overlapPercentage: 0.4, // 40% overlap with next phase
          description: this.getPhasesDescription('Exterior Finishing')
        },
        {
          name: 'Rough-In Mechanical Systems',
          budgetPercentage: 0.10, // 10%
          durationPercentage: 0.12, // 12% of total time
          dependsOn: 'Framing',
          dependencyOffset: -0.1, // Start when framing is 90% complete
          canOverlapWith: ['Exterior Finishing', 'Insulation & Drywall'], // Can overlap with prev and next phase
          overlapPercentage: 0.3, // 30% overlap with next phase
          description: this.getPhasesDescription('Rough-In Mechanical Systems')
        },
        {
          name: 'Insulation & Drywall',
          budgetPercentage: 0.08, // 8%
          durationPercentage: 0.10, // 10% of total time
          dependsOn: 'Rough-In Mechanical Systems',
          dependencyOffset: -0.3, // Start when rough-in is 70% complete
          canOverlapWith: [], // No overlap
          description: this.getPhasesDescription('Insulation & Drywall')
        },
        {
          name: 'Interior Finishing',
          budgetPercentage: 0.15, // 15%
          durationPercentage: 0.15, // 15% of total time
          dependsOn: 'Insulation & Drywall',
          dependencyOffset: 0, // Start after previous phase
          canOverlapWith: ['Mechanical Trim-Out'], // Can overlap with next phase
          overlapPercentage: 0.5, // 50% overlap with next phase
          description: this.getPhasesDescription('Interior Finishing')
        },
        {
          name: 'Mechanical Trim-Out',
          budgetPercentage: 0.07, // 7%
          durationPercentage: 0.08, // 8% of total time
          dependsOn: 'Interior Finishing',
          dependencyOffset: -0.5, // Start when interior finishing is 50% complete
          canOverlapWith: ['Landscaping & Exterior Work'], // Can overlap with next phase
          overlapPercentage: 0.3, // 30% overlap with next phase
          description: this.getPhasesDescription('Mechanical Trim-Out')
        },
        {
          name: 'Landscaping & Exterior Work',
          budgetPercentage: 0.05, // 5%
          durationPercentage: 0.06, // 6% of total time
          dependsOn: 'Mechanical Trim-Out',
          dependencyOffset: -0.3, // Start when mechanical trim-out is 70% complete
          canOverlapWith: [], // No overlap
          description: this.getPhasesDescription('Landscaping & Exterior Work')
        },
        {
          name: 'Final Inspection & Closeout',
          budgetPercentage: 0.05, // 5%
          durationPercentage: 0.05, // 5% of total time
          dependsOn: 'Landscaping & Exterior Work',
          dependencyOffset: -0.2, // Start when landscaping is 80% complete
          canOverlapWith: [], // No overlap
          description: this.getPhasesDescription('Final Inspection & Closeout')
        },
      ];
      
      // Map of phase name to phase object for dependency lookups
      const phaseMap: Record<string, {startDate: Date, endDate: Date, phase: Phase}> = {};
      
      // Create phases with proper timing based on dependencies
      const residentialPhases: Phase[] = [];
      
      // First pass: calculate durations and create phases
      phaseDefinitions.forEach((phaseDef, index) => {
        // Calculate exact budget based on percentage
        const phaseBudget = Math.round(totalBudget * phaseDef.budgetPercentage);
        
        // Calculate phase duration in days
        const phaseDuration = Math.max(7, Math.round(totalProjectDays * phaseDef.durationPercentage));
        
        // Default start date is project start date (will be adjusted in second pass)
        const phaseStartDate = new Date(projectStartDate);
        const phaseEndDate = this.addDays(new Date(phaseStartDate), phaseDuration);
        
        // Create the phase
        const phase: Phase = {
          id: uuidv4(),
          projectId: project.id,
          name: phaseDef.name,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          status: 'not_started',
          progress: 0,
          budget: phaseBudget,
          actualCost: 0,
          description: phaseDef.description,
          tasks: this.createPhaseTasks(userId, project.id, phaseDef.name),
        };
        
        // Store in map (we'll adjust dates in the second pass)
        phaseMap[phaseDef.name] = {
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          phase
        };
        
        residentialPhases.push(phase);
      });
      
      // Simpler, more direct approach: distribute phases across project timeline
      let currentDate = new Date(projectStartDate);
      
      // Calculate cumulative duration percentages for positioning
      let cumulativeDuration = 0;
      const phasePositions = phaseDefinitions.map(phase => {
        const startPosition = cumulativeDuration;
        cumulativeDuration += phase.durationPercentage;
        return {
          name: phase.name,
          startPosition,
          endPosition: cumulativeDuration,
          duration: phase.durationPercentage
        };
      });
      
      // Normalize to ensure we use exactly 100% of time
      const totalDurationPercentage = phasePositions[phasePositions.length - 1].endPosition;
      phasePositions.forEach(position => {
        position.startPosition = position.startPosition / totalDurationPercentage;
        position.endPosition = position.endPosition / totalDurationPercentage;
      });
      
      // Position phases across the timeline based on normalized positions
      const timelineStart = projectStartDate.getTime();
      const timelineEnd = projectEndDate.getTime();
      const timelineDuration = timelineEnd - timelineStart;
      
      console.log("Phase positions across timeline:");
      phasePositions.forEach((position, index) => {
        const phaseName = position.name;
        const phaseData = phaseMap[phaseName];
        
        if (phaseData) {
          // Calculate dates based on position in timeline
          const phaseStartTime = timelineStart + (timelineDuration * position.startPosition);
          const phaseEndTime = timelineStart + (timelineDuration * position.endPosition);
          
          // Set new dates
          phaseData.startDate = new Date(phaseStartTime);
          phaseData.endDate = new Date(phaseEndTime);
          
          // Update phase object
          phaseData.phase.startDate = phaseData.startDate;
          phaseData.phase.endDate = phaseData.endDate;
          
          console.log(`${index + 1}. ${phaseName}: ${phaseData.startDate.toLocaleDateString()} - ${phaseData.endDate.toLocaleDateString()}`);
        }
      });
      
      // Verify all phase dates are within project timeline
      residentialPhases.forEach(phase => {
        const phaseStart = phase.startDate instanceof Date ? phase.startDate : new Date(phase.startDate);
        const phaseEnd = phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate);
        
        // Adjust if phase start is before project start
        if (phaseStart < projectStartDate) {
          phase.startDate = new Date(projectStartDate);
        }
        
        // Adjust if phase end is after project end
        if (phaseEnd > projectEndDate) {
          phase.endDate = new Date(projectEndDate);
        }
        
        // Ensure phase duration is at least 3 days
        const minPhaseDays = 3;
        const phaseDuration = Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24));
        if (phaseDuration < minPhaseDays) {
          phase.endDate = this.addDays(new Date(phase.startDate), minPhaseDays);
        }
        
        // Sort the phases by start date to ensure proper ordering
        residentialPhases.sort((a, b) => {
          const aStart = a.startDate instanceof Date ? a.startDate.getTime() : new Date(a.startDate).getTime();
          const bStart = b.startDate instanceof Date ? b.startDate.getTime() : new Date(b.startDate).getTime();
          return aStart - bStart;
        });
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