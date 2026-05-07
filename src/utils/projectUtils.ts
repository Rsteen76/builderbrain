import { ProjectPhase } from '../types'; // Adjusted path, assuming types/index.ts exports ProjectPhase

// This file will store utility functions related to project data and manipulation.

// Ensures all required fields are present according to types/index.ts
export const mapToProjectPhase = (phaseData: any): ProjectPhase => {
  const id = phaseData.id!;
  const name = phaseData.name!;

  // Provide default values for required fields
  const startDate = phaseData.startDate ? new Date(phaseData.startDate) : new Date();
  const endDate = phaseData.endDate ? new Date(phaseData.endDate) : new Date();
  const status = phaseData.status || 'not_started';
  const progress = typeof phaseData.progress === 'number' ? phaseData.progress : 0;
  const budget = typeof phaseData.budget === 'number' ? phaseData.budget : 0;
  const actualCost = typeof phaseData.actualCost === 'number' ? phaseData.actualCost : 0;
  const description = phaseData.description || '';
  // Preserve tasks if they exist or provide empty array
  const tasks = phaseData.tasks || [];
  const order = phaseData.order || 0;

  return {
    id,
    name,
    description,
    startDate,
    endDate,
    status,
    progress,
    budget,
    actualCost,
    tasks,
    order,
    projectId: phaseData.projectId // Add the projectId from the project data
  };
};
