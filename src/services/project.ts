import { db } from '../config/firebase';
import { isDevAuthBypassEnabled } from '../config/devMode';
import {
  createDevProject,
  deleteDevProject,
  getDevProjectById,
  listDevProjects,
  updateDevProject,
} from './devDataStore';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { Project } from '../types';
import { StorageService } from './storage';
import { convertFirestoreData, convertToProjectData } from './project/mappers';
import { createResidentialPhases, getResidentialProjectEndDate } from './project/residential';
import type { FirestoreProject } from './project/types';

export type { FirestoreProject } from './project/types';

// Define as a non-export class here
class ProjectService {
  // Collection reference
  private static collection = collection(db, 'projects');
  private static relatedProjectCollections = [
    'expenses',
    'expense_transactions',
    'bids',
    'tasks',
    'documents',
  ];

  private static async deleteDocsInBatches(
    docsToDelete: QueryDocumentSnapshot<DocumentData>[],
    projectId: string
  ): Promise<void> {
    const projectRef = doc(this.collection, projectId);
    const refsToDelete = [
      ...docsToDelete.map(docSnapshot => docSnapshot.ref),
      projectRef,
    ];

    for (let i = 0; i < refsToDelete.length; i += 500) {
      const batch = writeBatch(db);
      refsToDelete.slice(i, i + 500).forEach(ref => batch.delete(ref));
      await batch.commit();
    }
  }

  private static async getOwnedRelatedProjectDocs(
    projectId: string,
    userId: string
  ): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    const snapshots = await Promise.all(
      this.relatedProjectCollections.map(async (collectionName) => {
        const relatedQuery = query(
          collection(db, collectionName),
          where('projectId', '==', projectId),
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(relatedQuery);
        return snapshot.docs;
      })
    );

    return snapshots.flat();
  }

  static async createProject(userId: string, projectData: Partial<Project>): Promise<Project> {
    if (isDevAuthBypassEnabled) {
      return createDevProject(userId, projectData);
    }

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
    if (isDevAuthBypassEnabled) {
      return getDevProjectById(id);
    }

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
    if (isDevAuthBypassEnabled) {
      return listDevProjects(userId);
    }

    try {
      const projectsQuery = query(this.collection, where("userId", "==", userId));
      const querySnapshot = await getDocs(projectsQuery);
      
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreProject;
        projects.push(convertToProjectData({
          ...data,
          id: doc.id,
        }));
      });
      
      return projects;
    } catch (error) {
      console.error("Error getting user projects:", error);
      throw error;
    }
  }

  static async updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    if (isDevAuthBypassEnabled) {
      const project = updateDevProject(projectId, projectData);
      if (!project) {
        throw new Error('Failed to retrieve updated project');
      }
      return project;
    }

    try {
      const projectRef = doc(this.collection, projectId);

      const { id: _id, ...projectFields } = projectData;
      const updatedData: Partial<FirestoreProject> = {
        ...(projectFields as Partial<FirestoreProject>),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if ('startDate' in projectData) {
        updatedData.startDate = projectData.startDate ? Timestamp.fromDate(projectData.startDate) : undefined;
      }

      if ('endDate' in projectData) {
        updatedData.endDate = projectData.endDate ? Timestamp.fromDate(projectData.endDate) : undefined;
      }

      if ('budget' in projectData) {
        updatedData.budget = typeof projectData.budget === 'number' ? {
          total: projectData.budget,
          spent: 0,
          remaining: projectData.budget
        } : projectData.budget;
      }

      if ('location' in projectData) {
        updatedData.location = typeof projectData.location === 'string' ? {
          address: projectData.location,
          city: '',
          state: '',
          zipCode: ''
        } : projectData.location;
      }

      Object.keys(updatedData).forEach((key) => {
        if (updatedData[key as keyof FirestoreProject] === undefined) {
          delete updatedData[key as keyof FirestoreProject];
        }
      });

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
    if (isDevAuthBypassEnabled) {
      deleteDevProject(projectId);
      return;
    }

    try {
      const projectRef = doc(this.collection, projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        return;
      }

      const projectData = projectSnap.data() as FirestoreProject;
      const relatedDocs = await this.getOwnedRelatedProjectDocs(projectId, projectData.userId);

      await StorageService.deleteProjectFiles(projectId);
      await this.deleteDocsInBatches(relatedDocs, projectId);
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
    if (isDevAuthBypassEnabled) {
      return listDevProjects(userId, {
        ...filters,
        startDate:
          filters?.startDate instanceof Timestamp
            ? filters.startDate.toDate()
            : filters?.startDate || null,
        endDate:
          filters?.endDate instanceof Timestamp
            ? filters.endDate.toDate()
            : filters?.endDate || null,
      });
    }

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

    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreProject;
      return convertFirestoreData(data, doc.id);
    });
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
      const project = await this.createProject(userId, {
        ...projectData,
        projectType: 'Residential Construction'
      });

      const totalBudget = typeof projectData.budget === 'number'
        ? projectData.budget
        : (projectData.budget?.total || 0);
      const projectStartDate = projectData.startDate || new Date();
      const projectEndDate = getResidentialProjectEndDate(projectStartDate, projectData.endDate);
      const residentialPhases = createResidentialPhases(
        userId,
        project.id,
        projectStartDate,
        projectEndDate,
        totalBudget
      );
      const allTasks = residentialPhases.flatMap(phase => phase.tasks || []);

      const updatedProject = {
        ...project,
        phases: residentialPhases,
        tasks: [...(project.tasks || []), ...allTasks],
        startDate: projectStartDate,
        endDate: projectEndDate,
      };
      
      await this.updateProject(project.id, { 
        phases: residentialPhases.map(phase => ({
          ...phase,
          id: phase.id,
          projectId: project.id,
          startDate: phase.startDate ?? undefined,
          endDate: phase.endDate ?? undefined,
        })),
        tasks: updatedProject.tasks,
        startDate: updatedProject.startDate,
        endDate: updatedProject.endDate
      });
      return await this.getProjectById(project.id) as Project;
    } catch (error) {
      console.error('Error creating residential project:', error);
      throw error;
    }
  }

  static async getProject(projectId: string, userId: string): Promise<Project | null> {
    if (isDevAuthBypassEnabled) {
      const project = getDevProjectById(projectId);
      return project?.userId === userId ? project : null;
    }

    const project = await this.getProjectById(projectId);
    return project?.userId === userId ? project : null;
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
