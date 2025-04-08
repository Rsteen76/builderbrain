import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Project, ProjectPhase, Bid, Expense } from '../types'; // Adjust paths if needed
import { useProjectData } from '../hooks/useProjectData';

// 1. Define the Context Shape (based on useProjectData return)
interface ProjectDetailContextType {
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  refreshAllProjectData: () => Promise<void>;
  setPhases: React.Dispatch<React.SetStateAction<ProjectPhase[]>>;
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  projectId?: string; // Include projectId for reference
}

// 2. Create the Context with default values
const ProjectDetailContext = createContext<ProjectDetailContextType | undefined>(undefined);

// 3. Create the Provider Component
interface ProjectDetailProviderProps {
  projectId: string | undefined;
  children: ReactNode;
}

export const ProjectDetailProvider: React.FC<ProjectDetailProviderProps> = ({ projectId, children }) => {
  const projectData = useProjectData(projectId);

  // Use useMemo to prevent unnecessary re-renders of consumers when the provider itself re-renders
  const contextValue = useMemo(() => ({
    ...projectData,
    projectId,
  }), [projectData, projectId]);

  return (
    <ProjectDetailContext.Provider value={contextValue}>
      {children}
    </ProjectDetailContext.Provider>
  );
};

// 4. Create the Consumer Hook
export const useProjectDetail = (): ProjectDetailContextType => {
  const context = useContext(ProjectDetailContext);
  if (context === undefined) {
    throw new Error('useProjectDetail must be used within a ProjectDetailProvider');
  }
  return context;
}; 