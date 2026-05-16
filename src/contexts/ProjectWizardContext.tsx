import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { ProjectService } from '../services/project';
import type { ProjectPhase, Task } from '../types';
import {
  buildTemplateBudgetItems,
  buildTemplateMilestones,
  buildTemplatePhases,
  getProjectWizardTemplate,
  type ProjectTemplateId,
} from '../data/projectWizardTemplates';
import {
  allocateConstructionPhaseBudgets,
  DEFAULT_COST_MARKET_ID,
  DEFAULT_FINISH_LEVEL_ID,
  type CostMarketId,
  type FinishLevelId,
} from '../data/constructionCostModel';

// Define types for the project info
export interface ProjectInfo {
  id?: string;
  name: string;
  description?: string;
  location: string;
  projectType: string;
  size?: string;
  totalBudget?: number;
  landAcquisitionPrice?: number;
  costMarket?: CostMarketId;
  finishLevel?: FinishLevelId;
  currency?: string;
  status?: string;
  client?: string;
  startDate: Date | null;
  estimatedStartDate?: Date | null;
  estimatedEndDate?: Date | null;
  estimatedDuration?: number;
  completionDate?: Date | null;
  notes?: string;
}

// Define types for team members
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

// Define types for schedule milestones
export interface ScheduleMilestone {
  id: string;
  title: string;
  dueDate: Date;
  description?: string;
  isCompleted?: boolean;
}

export interface WizardProjectPhase {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: ProjectPhase['status'];
  progress: number;
  budget: number;
  actualCost: number;
  budgetPercentage: number;
  tasks: Array<Partial<Task> & Pick<Task, 'id' | 'title' | 'status' | 'priority'>>;
}

// Define types for budget items
export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
}

// Define the steps in the wizard
export type WizardStep = 'project_info' | 'schedule' | 'budget' | 'team' | 'review';

// Define the state shape
export interface ProjectWizardState {
  projectInfo: ProjectInfo;
  schedule: {
    milestones: ScheduleMilestone[];
  };
  selectedTemplateId?: ProjectTemplateId;
  phases: WizardProjectPhase[];
  hasCustomizedPhases: boolean;
  budget: BudgetItem[];
  team: {
    members: TeamMember[];
  };
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  createdProjectId: string | null;
  error: string | null;
}

// Define action types
type ActionType =
  | { type: 'UPDATE_PROJECT_INFO'; payload: Partial<ProjectInfo> }
  | { type: 'ADD_SCHEDULE_MILESTONE'; payload: ScheduleMilestone }
  | { type: 'UPDATE_SCHEDULE_MILESTONE'; payload: { index: number; milestone: ScheduleMilestone } }
  | { type: 'REMOVE_SCHEDULE_MILESTONE'; payload: string }
  | { type: 'APPLY_TEMPLATE'; payload: { templateId: ProjectTemplateId } }
  | { type: 'ADD_PHASE'; payload: WizardProjectPhase }
  | { type: 'UPDATE_PHASE'; payload: { id: string; updates: Partial<WizardProjectPhase> } }
  | { type: 'REMOVE_PHASE'; payload: string }
  | { type: 'ADD_BUDGET_ITEM'; payload: BudgetItem }
  | { type: 'UPDATE_BUDGET_ITEM'; payload: { index: number; item: BudgetItem } }
  | { type: 'REMOVE_BUDGET_ITEM'; payload: string }
  | { type: 'ADD_TEAM_MEMBER'; payload: TeamMember }
  | { type: 'UPDATE_TEAM_MEMBER'; payload: { index: number; member: TeamMember } }
  | { type: 'REMOVE_TEAM_MEMBER'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: WizardStep }
  | { type: 'MARK_STEP_COMPLETE'; payload: WizardStep }
  | { type: 'MARK_STEP_INCOMPLETE'; payload: WizardStep }
  | { type: 'SUBMIT_PROJECT_START' }
  | { type: 'SUBMIT_PROJECT_SUCCESS'; payload: { projectId: string } }
  | { type: 'SUBMIT_PROJECT_ERROR'; payload: string }
  | { type: 'RESET_WIZARD' }
  | { type: 'VALIDATE_STEP'; payload: WizardStep };

const createInitialState = (): ProjectWizardState => ({
  projectInfo: {
    name: '',
    location: '',
    projectType: '',
    size: '',
    totalBudget: 0,
    landAcquisitionPrice: 0,
    costMarket: DEFAULT_COST_MARKET_ID,
    finishLevel: DEFAULT_FINISH_LEVEL_ID,
    currency: 'USD',
    startDate: null,
    estimatedStartDate: null,
    estimatedEndDate: null,
  },
  schedule: {
    milestones: []
  },
  selectedTemplateId: undefined,
  phases: [],
  hasCustomizedPhases: false,
  budget: [],
  team: {
    members: []
  },
  currentStep: 'project_info',
  completedSteps: new Set(),
  isSubmitting: false,
  isSubmitted: false,
  createdProjectId: null,
  error: null,
});

// Initial state
const initialState: ProjectWizardState = createInitialState();

const getWizardStartDate = (projectInfo: ProjectInfo): Date =>
  projectInfo.estimatedStartDate || projectInfo.startDate || new Date();

const getWizardEndDate = (projectInfo: ProjectInfo): Date => {
  if (projectInfo.estimatedEndDate) return projectInfo.estimatedEndDate;
  const startDate = getWizardStartDate(projectInfo);
  return new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);
};

const LAND_ACQUISITION_BUDGET_ITEM_ID = 'land-acquisition-budget-item';
const LAND_ACQUISITION_CATEGORY_ID = 'acquisition-purchase';

const getConstructionBudget = (projectInfo: ProjectInfo, totalBudget: number): number =>
  Math.max(0, totalBudget - (projectInfo.landAcquisitionPrice || 0));

const applyCostModelToPhases = (
  phases: WizardProjectPhase[],
  projectInfo: ProjectInfo,
  constructionBudget: number
): WizardProjectPhase[] =>
  allocateConstructionPhaseBudgets(
    phases,
    constructionBudget,
    projectInfo.costMarket,
    projectInfo.finishLevel
  );

const withLandAcquisitionBudgetItem = (
  budget: BudgetItem[],
  projectInfo: ProjectInfo
): BudgetItem[] => {
  const landAcquisitionPrice = projectInfo.landAcquisitionPrice || 0;
  const budgetWithoutLand = budget.filter(item => item.id !== LAND_ACQUISITION_BUDGET_ITEM_ID);

  if (landAcquisitionPrice <= 0) {
    return budgetWithoutLand;
  }

  return [
    {
      id: LAND_ACQUISITION_BUDGET_ITEM_ID,
      category: 'Land Acquisition',
      description: 'Land acquisition price',
      estimatedCost: landAcquisitionPrice,
      actualCost: 0,
    },
    ...budgetWithoutLand,
  ];
};

const applyTemplateToState = (
  state: ProjectWizardState,
  templateId: ProjectTemplateId
): ProjectWizardState => {
  const template = getProjectWizardTemplate(templateId);
  const totalBudget = state.projectInfo.totalBudget || 0;
  const projectInfo = {
    ...state.projectInfo,
    projectType: state.projectInfo.projectType || template.projectType,
    totalBudget,
  };
  const constructionBudget = getConstructionBudget(projectInfo, totalBudget || 0);
  const phases = applyCostModelToPhases(
    buildTemplatePhases(
      template,
      getWizardStartDate(projectInfo),
      getWizardEndDate(projectInfo),
      constructionBudget
    ),
    projectInfo,
    constructionBudget
  );

  const completedSteps = new Set(state.completedSteps);
  completedSteps.add('schedule');
  if (phases.length > 0) {
    completedSteps.add('budget');
  }

  return {
    ...state,
    projectInfo,
    selectedTemplateId: template.id,
    phases,
    schedule: {
      milestones: buildTemplateMilestones(template, phases),
    },
    budget: withLandAcquisitionBudgetItem(buildTemplateBudgetItems(phases), projectInfo),
    completedSteps,
  };
};

const rebalancePhaseBudgets = (
  phases: WizardProjectPhase[],
  totalBudget: number
): WizardProjectPhase[] =>
  phases.map(phase => ({
    ...phase,
    budget: Math.round(totalBudget * ((phase.budgetPercentage || 0) / 100)),
  }));

const refreshTemplateSchedule = (
  state: ProjectWizardState,
  projectInfo: ProjectInfo,
  totalBudget: number
): Pick<ProjectWizardState, 'phases' | 'schedule' | 'budget'> | null => {
  if (!state.selectedTemplateId || state.hasCustomizedPhases) {
    return null;
  }

  const template = getProjectWizardTemplate(state.selectedTemplateId);
  const constructionBudget = getConstructionBudget(projectInfo, totalBudget);
  const phases = applyCostModelToPhases(
    buildTemplatePhases(
      template,
      getWizardStartDate(projectInfo),
      getWizardEndDate(projectInfo),
      constructionBudget
    ),
    projectInfo,
    constructionBudget
  );

  return {
    phases,
    schedule: {
      milestones: buildTemplateMilestones(template, phases),
    },
    budget: withLandAcquisitionBudgetItem(buildTemplateBudgetItems(phases), projectInfo),
  };
};

// Reducer function
const projectWizardReducer = (state: ProjectWizardState, action: ActionType): ProjectWizardState => {
  switch (action.type) {
    case 'UPDATE_PROJECT_INFO':
    {
      const nextProjectInfo = {
        ...state.projectInfo,
        ...action.payload,
      };
      const nextTotalBudget =
        'totalBudget' in action.payload
          ? action.payload.totalBudget || 0
          : nextProjectInfo.totalBudget || 0;
      const projectInfo = {
        ...nextProjectInfo,
        totalBudget: nextTotalBudget,
      };
      const refreshedTemplate = refreshTemplateSchedule(state, projectInfo, nextTotalBudget);

      if (refreshedTemplate) {
        return {
          ...state,
          projectInfo,
          ...refreshedTemplate,
        };
      }

      const shouldRebalanceBudget =
        nextTotalBudget !== state.projectInfo.totalBudget ||
        projectInfo.landAcquisitionPrice !== state.projectInfo.landAcquisitionPrice ||
        projectInfo.costMarket !== state.projectInfo.costMarket ||
        projectInfo.finishLevel !== state.projectInfo.finishLevel;
      const constructionBudget = getConstructionBudget(projectInfo, nextTotalBudget);
      const phases = shouldRebalanceBudget && !state.hasCustomizedPhases
        ? applyCostModelToPhases(
            rebalancePhaseBudgets(state.phases, constructionBudget),
            projectInfo,
            constructionBudget
          )
        : state.phases;
      const budget = shouldRebalanceBudget && !state.hasCustomizedPhases
        ? buildTemplateBudgetItems(phases)
        : state.budget;

      return {
        ...state,
        projectInfo,
        phases,
        budget: withLandAcquisitionBudgetItem(budget, projectInfo),
      };
    }

    case 'ADD_SCHEDULE_MILESTONE':
      return {
        ...state,
        schedule: {
          ...state.schedule,
          milestones: [...state.schedule.milestones, action.payload]
        }
      };

    case 'UPDATE_SCHEDULE_MILESTONE':
      return {
        ...state,
        schedule: {
          ...state.schedule,
          milestones: state.schedule.milestones.map((milestone, index) =>
            index === action.payload.index ? action.payload.milestone : milestone
          )
        }
      };

    case 'REMOVE_SCHEDULE_MILESTONE':
      return {
        ...state,
        schedule: {
          ...state.schedule,
          milestones: state.schedule.milestones.filter(milestone => milestone.id !== action.payload)
        }
      };

    case 'APPLY_TEMPLATE':
      return {
        ...applyTemplateToState(state, action.payload.templateId),
        hasCustomizedPhases: false,
      };

    case 'ADD_PHASE':
      return {
        ...state,
        phases: [...state.phases, action.payload],
        hasCustomizedPhases: true,
      };

    case 'UPDATE_PHASE': {
      const phases = state.phases.map(phase =>
        phase.id === action.payload.id ? { ...phase, ...action.payload.updates } : phase
      );
      return {
        ...state,
        phases,
        hasCustomizedPhases: true,
        budget: withLandAcquisitionBudgetItem(buildTemplateBudgetItems(phases), state.projectInfo),
      };
    }

    case 'REMOVE_PHASE': {
      const phases = state.phases.filter(phase => phase.id !== action.payload);
      return {
        ...state,
        phases,
        hasCustomizedPhases: true,
        budget: withLandAcquisitionBudgetItem(buildTemplateBudgetItems(phases), state.projectInfo),
      };
    }

    case 'ADD_BUDGET_ITEM':
      return {
        ...state,
        budget: [...state.budget, action.payload],
      };

    case 'UPDATE_BUDGET_ITEM':
      return {
        ...state,
        budget: state.budget.map((item, index) =>
          index === action.payload.index ? action.payload.item : item
        ),
      };

    case 'REMOVE_BUDGET_ITEM':
      return {
        ...state,
        budget: state.budget.filter(item => item.id !== action.payload),
      };

    case 'ADD_TEAM_MEMBER':
      return {
        ...state,
        team: {
          ...state.team,
          members: [...state.team.members, action.payload]
        }
      };

    case 'UPDATE_TEAM_MEMBER':
      return {
        ...state,
        team: {
          ...state.team,
          members: state.team.members.map((member, index) =>
            index === action.payload.index ? action.payload.member : member
          )
        }
      };

    case 'REMOVE_TEAM_MEMBER':
      return {
        ...state,
        team: {
          ...state.team,
          members: state.team.members.filter(member => member.id !== action.payload)
        }
      };

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };

    case 'MARK_STEP_COMPLETE': {
      const updatedCompletedSteps = new Set(state.completedSteps);
      updatedCompletedSteps.add(action.payload);
      return {
        ...state,
        completedSteps: updatedCompletedSteps,
      };
    }

    case 'MARK_STEP_INCOMPLETE': {
      const updatedCompletedSteps = new Set(state.completedSteps);
      updatedCompletedSteps.delete(action.payload);
      return {
        ...state,
        completedSteps: updatedCompletedSteps,
      };
    }

    case 'VALIDATE_STEP': {
      // Automatically mark step as complete based on validation logic
      let isValid = false;
      const step = action.payload;

      switch (step) {
        case 'project_info':
          isValid = !!state.projectInfo.name &&
                   !!state.projectInfo.location &&
                   !!state.projectInfo.projectType &&
                   !!state.projectInfo.description;
          break;
        case 'schedule':
          isValid = state.phases.length > 0 || state.schedule.milestones.length > 0;
          break;
        case 'budget':
          isValid = state.phases.length > 0 || state.budget.length > 0;
          break;
        case 'team':
          isValid = true;
          break;
        case 'review':
          isValid = true; // Review is always valid if we got here
          break;
        default:
          isValid = false;
      }

      if (isValid) {
        const updatedCompletedSteps = new Set(state.completedSteps);
        updatedCompletedSteps.add(step);
        return {
          ...state,
          completedSteps: updatedCompletedSteps,
        };
      }
      return state;
    }

    case 'SUBMIT_PROJECT_START':
      return {
        ...state,
        isSubmitting: true,
        error: null,
      };

    case 'SUBMIT_PROJECT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        isSubmitted: true,
        createdProjectId: action.payload.projectId,
      };

    case 'SUBMIT_PROJECT_ERROR':
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };

    case 'RESET_WIZARD':
      return createInitialState();

    default:
      return state;
  }
};

// Create context
type ProjectWizardContextType = {
  state: ProjectWizardState;
  dispatch: React.Dispatch<ActionType>;
  updateProjectInfo: (info: Partial<ProjectInfo>) => void;
  addMilestone: (milestone: ScheduleMilestone) => void;
  updateMilestone: (index: number, milestone: ScheduleMilestone) => void;
  removeMilestone: (id: string) => void;
  applyTemplate: (templateId: ProjectTemplateId) => void;
  addPhase: (phase?: Partial<WizardProjectPhase>) => void;
  updatePhase: (id: string, updates: Partial<WizardProjectPhase>) => void;
  removePhase: (id: string) => void;
  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (index: number, item: BudgetItem) => void;
  removeBudgetItem: (id: string) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (index: number, member: TeamMember) => void;
  removeTeamMember: (id: string) => void;
  setCurrentStep: (step: WizardStep) => void;
  markStepComplete: (step: WizardStep) => void;
  markStepIncomplete: (step: WizardStep) => void;
  validateStep: (step: WizardStep) => void;
  resetWizard: () => void;
  submitProject: () => Promise<void>;
  isStepComplete: (step: WizardStep) => boolean;
  canProceedToNextStep: () => boolean;
};

const ProjectWizardContext = createContext<ProjectWizardContextType | undefined>(undefined);

// Provider component
interface ProjectWizardProviderProps {
  children: ReactNode;
  initialTemplateId?: ProjectTemplateId;
}

const createEmptyPhase = (index: number, projectInfo: ProjectInfo): WizardProjectPhase => {
  const startDate = getWizardStartDate(projectInfo);
  const phaseStartDate = new Date(startDate.getTime() + index * 14 * 24 * 60 * 60 * 1000);
  return {
    id: `custom-phase-${Date.now()}-${index + 1}`,
    name: `Phase ${index + 1}`,
    description: '',
    startDate: phaseStartDate,
    endDate: new Date(phaseStartDate.getTime() + 14 * 24 * 60 * 60 * 1000),
    status: 'not_started',
    progress: 0,
    budget: 0,
    actualCost: 0,
    budgetPercentage: 0,
    tasks: [],
  };
};

export const ProjectWizardProvider: React.FC<ProjectWizardProviderProps> = ({ children, initialTemplateId }) => {
  const [state, dispatch] = useReducer(projectWizardReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    if (initialTemplateId) {
      dispatch({ type: 'APPLY_TEMPLATE', payload: { templateId: initialTemplateId } });
    }
  }, [initialTemplateId]);

  // Helper functions to dispatch actions
  const updateProjectInfo = (info: Partial<ProjectInfo>) => {
    dispatch({ type: 'UPDATE_PROJECT_INFO', payload: info });
  };

  const addMilestone = (milestone: ScheduleMilestone) => {
    dispatch({ type: 'ADD_SCHEDULE_MILESTONE', payload: milestone });
  };

  const updateMilestone = (index: number, milestone: ScheduleMilestone) => {
    dispatch({ type: 'UPDATE_SCHEDULE_MILESTONE', payload: { index, milestone } });
  };

  const removeMilestone = (id: string) => {
    dispatch({ type: 'REMOVE_SCHEDULE_MILESTONE', payload: id });
  };

  const applyTemplate = (templateId: ProjectTemplateId) => {
    dispatch({ type: 'APPLY_TEMPLATE', payload: { templateId } });
  };

  const addPhase = (phase?: Partial<WizardProjectPhase>) => {
    dispatch({
      type: 'ADD_PHASE',
      payload: {
        ...createEmptyPhase(state.phases.length, state.projectInfo),
        ...phase,
      },
    });
  };

  const updatePhase = (id: string, updates: Partial<WizardProjectPhase>) => {
    dispatch({ type: 'UPDATE_PHASE', payload: { id, updates } });
  };

  const removePhase = (id: string) => {
    dispatch({ type: 'REMOVE_PHASE', payload: id });
  };

  const addBudgetItem = (item: BudgetItem) => {
    dispatch({ type: 'ADD_BUDGET_ITEM', payload: item });
  };

  const updateBudgetItem = (index: number, item: BudgetItem) => {
    dispatch({ type: 'UPDATE_BUDGET_ITEM', payload: { index, item } });
  };

  const removeBudgetItem = (id: string) => {
    dispatch({ type: 'REMOVE_BUDGET_ITEM', payload: id });
  };

  const addTeamMember = (member: TeamMember) => {
    dispatch({ type: 'ADD_TEAM_MEMBER', payload: member });
  };

  const updateTeamMember = (index: number, member: TeamMember) => {
    dispatch({ type: 'UPDATE_TEAM_MEMBER', payload: { index, member } });
  };

  const removeTeamMember = (id: string) => {
    dispatch({ type: 'REMOVE_TEAM_MEMBER', payload: id });
  };

  const setCurrentStep = (step: WizardStep) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  };

  const markStepComplete = (step: WizardStep) => {
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: step });
  };

  const markStepIncomplete = (step: WizardStep) => {
    dispatch({ type: 'MARK_STEP_INCOMPLETE', payload: step });
  };

  const validateStep = (step: WizardStep) => {
    dispatch({ type: 'VALIDATE_STEP', payload: step });
  };

  const resetWizard = () => {
    dispatch({ type: 'RESET_WIZARD' });
  };

  // Function to check if a step is complete
  const isStepComplete = (step: WizardStep): boolean => {
    return state.completedSteps.has(step);
  };

  // Function to check if the user can proceed to the next step
  const canProceedToNextStep = (): boolean => {
    if (state.currentStep === 'review') {
      return true;
    }

    return isStepComplete(state.currentStep);
  };

  const submitProject = async (): Promise<void> => {
    dispatch({ type: 'SUBMIT_PROJECT_START' });

    try {
      if (!user?.uid) {
        throw new Error('You must be signed in to create a project');
      }

      const startDate = getWizardStartDate(state.projectInfo);
      const endDate = getWizardEndDate(state.projectInfo);
      const totalBudget = state.projectInfo.totalBudget || 0;
      const landAcquisitionPrice = state.projectInfo.landAcquisitionPrice || 0;

      const createdProject = await ProjectService.createProject(user.uid, {
        name: state.projectInfo.name,
        description: state.projectInfo.description || '',
        status: 'planning',
        priority: 'medium',
        projectType: state.projectInfo.projectType,
        startDate,
        endDate,
        location: state.projectInfo.location,
        budget: {
          total: totalBudget,
          spent: 0,
          remaining: totalBudget,
        },
        keyMilestones: state.schedule.milestones.map(milestone => ({
          name: milestone.title,
          date: milestone.dueDate,
          description: milestone.description || '',
        })),
        team: state.team.members.map(member => member.name),
        clientId: state.projectInfo.client,
        progress: 0,
      });

      const projectPhases: ProjectPhase[] = state.phases.map((phase, index) => {
        const phaseId = uuidv4();
        return {
          id: phaseId,
          projectId: createdProject.id,
          name: phase.name,
          description: phase.description,
          startDate: phase.startDate,
          endDate: phase.endDate,
          status: phase.status,
          progress: phase.progress,
          order: index + 1,
          budget: phase.budget || 0,
          actualCost: 0,
          tasks: phase.tasks.map(task => ({
            id: uuidv4(),
            userId: user.uid,
            projectId: createdProject.id,
            phaseId,
            phaseName: phase.name,
            title: task.title,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Task)),
        };
      });

      const projectUpdate: Partial<Awaited<ReturnType<typeof ProjectService.createProject>>> = {};

      if (projectPhases.length > 0) {
        projectUpdate.phases = projectPhases;
        projectUpdate.tasks = projectPhases.flatMap(phase => phase.tasks || []);
      }

      if (landAcquisitionPrice > 0) {
        projectUpdate.projections = [
          ...(createdProject.projections || []),
          {
            id: LAND_ACQUISITION_BUDGET_ITEM_ID,
            categoryId: LAND_ACQUISITION_CATEGORY_ID,
            amount: landAcquisitionPrice,
            notes: 'Land acquisition price',
            createdAt: new Date(),
            userId: user.uid,
            projectId: createdProject.id,
          },
        ];
      }

      if (Object.keys(projectUpdate).length > 0) {
        await ProjectService.updateProject(createdProject.id, {
          ...projectUpdate,
        });
      }

      dispatch({ type: 'SUBMIT_PROJECT_SUCCESS', payload: { projectId: createdProject.id } });
    } catch (error) {
      dispatch({
        type: 'SUBMIT_PROJECT_ERROR',
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  return (
    <ProjectWizardContext.Provider
      value={{
        state,
        dispatch,
        updateProjectInfo,
        addMilestone,
        updateMilestone,
        removeMilestone,
        applyTemplate,
        addPhase,
        updatePhase,
        removePhase,
        addBudgetItem,
        updateBudgetItem,
        removeBudgetItem,
        addTeamMember,
        updateTeamMember,
        removeTeamMember,
        setCurrentStep,
        markStepComplete,
        markStepIncomplete,
        validateStep,
        resetWizard,
        submitProject,
        isStepComplete,
        canProceedToNextStep
      }}
    >
      {children}
    </ProjectWizardContext.Provider>
  );
};

// Custom hook to use the context
export const useProjectWizard = (): ProjectWizardContextType => {
  const context = useContext(ProjectWizardContext);
  if (!context) {
    throw new Error('useProjectWizard must be used within a ProjectWizardProvider');
  }
  return context;
};
