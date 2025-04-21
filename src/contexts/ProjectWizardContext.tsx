import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define types for the project info
export interface ProjectInfo {
  id?: string;
  name: string;
  description?: string;
  location: string;
  projectType: string;
  size?: string;
  totalBudget?: number;
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
  budget: BudgetItem[];
  team: {
    members: TeamMember[];
  };
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
}

// Define action types
type ActionType = 
  | { type: 'UPDATE_PROJECT_INFO'; payload: Partial<ProjectInfo> }
  | { type: 'ADD_SCHEDULE_MILESTONE'; payload: ScheduleMilestone }
  | { type: 'UPDATE_SCHEDULE_MILESTONE'; payload: { index: number; milestone: ScheduleMilestone } }
  | { type: 'REMOVE_SCHEDULE_MILESTONE'; payload: string }
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
  | { type: 'SUBMIT_PROJECT_SUCCESS' }
  | { type: 'SUBMIT_PROJECT_ERROR'; payload: string }
  | { type: 'RESET_WIZARD' }
  | { type: 'VALIDATE_STEP'; payload: WizardStep };

// Initial state
const initialState: ProjectWizardState = {
  projectInfo: {
    name: '',
    location: '',
    projectType: '',
    size: '',
    totalBudget: 0,
    currency: 'USD',
    startDate: null,
    estimatedStartDate: null,
    estimatedEndDate: null,
  },
  schedule: {
    milestones: []
  },
  budget: [],
  team: {
    members: []
  },
  currentStep: 'project_info',
  completedSteps: new Set(),
  isSubmitting: false,
  isSubmitted: false,
  error: null,
};

// Reducer function
const projectWizardReducer = (state: ProjectWizardState, action: ActionType): ProjectWizardState => {
  switch (action.type) {
    case 'UPDATE_PROJECT_INFO':
      return {
        ...state,
        projectInfo: {
          ...state.projectInfo,
          ...action.payload,
        },
      };
    
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
                   !!state.projectInfo.size &&
                   !!state.projectInfo.description;
          break;
        case 'schedule':
          isValid = state.schedule.milestones.length > 0;
          break;
        case 'budget':
          isValid = state.budget.length > 0;
          break;
        case 'team':
          isValid = state.team.members.length > 0;
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
      };
    
    case 'SUBMIT_PROJECT_ERROR':
      return {
        ...state,
        isSubmitting: false,
        error: action.payload,
      };
    
    case 'RESET_WIZARD':
      return initialState;
    
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
}

export const ProjectWizardProvider: React.FC<ProjectWizardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(projectWizardReducer, initialState);

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
    return isStepComplete(state.currentStep);
  };

  // Submit function (to be implemented with API integration)
  const submitProject = async (): Promise<void> => {
    dispatch({ type: 'SUBMIT_PROJECT_START' });
    
    try {
      // Here you would make an API call to save the project
      // For now, we'll simulate a successful submission after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch({ type: 'SUBMIT_PROJECT_SUCCESS' });
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