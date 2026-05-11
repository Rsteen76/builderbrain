import { v4 as uuidv4 } from 'uuid';
import type { Phase, Task } from '../../types';
import { addDays } from './dates';
import { logger } from '../../utils/logger';

export interface PhaseAllocation {
  name: string;
  percentage: number;
}

export const STANDARD_RESIDENTIAL_PHASE_ALLOCATIONS: PhaseAllocation[] = [
  { name: 'Pre-Construction', percentage: 0.05 },
  { name: 'Site Work & Foundation', percentage: 0.15 },
  { name: 'Framing', percentage: 0.2 },
  { name: 'Exterior Finishing', percentage: 0.1 },
  { name: 'Rough-In Mechanical Systems', percentage: 0.1 },
  { name: 'Insulation & Drywall', percentage: 0.08 },
  { name: 'Interior Finishing', percentage: 0.15 },
  { name: 'Mechanical Trim-Out', percentage: 0.07 },
  { name: 'Landscaping & Exterior Work', percentage: 0.05 },
  { name: 'Final Inspection & Closeout', percentage: 0.05 },
];

const PHASE_DESCRIPTIONS: Record<string, string> = {
  'Pre-Construction': 'Planning, permits, site preparation, and initial design work',
  'Site Work & Foundation': 'Clearing the site, excavation, pouring footings and foundation',
  Framing: 'Building the skeleton of the house including walls, floors, and roof',
  'Exterior Finishing': 'Roofing, siding, windows, and doors',
  'Rough-In Mechanical Systems': 'Electrical, plumbing, and HVAC rough-in installation',
  'Insulation & Drywall': 'Installing insulation and hanging and finishing drywall',
  'Interior Finishing': 'Painting, trim, cabinets, countertops, and flooring',
  'Mechanical Trim-Out': 'Installing fixtures, outlets, switches, and appliances',
  'Landscaping & Exterior Work': 'Basic grading, driveways, walkways, and plantings',
  'Final Inspection & Closeout': 'Final walk-through, punch list items, and project delivery',
};

const PHASE_SPECIFIC_TASK_TITLES: Record<string, Array<{ title: string; priority: Task['priority'] }>> = {
  'Pre-Construction': [
    { title: 'Obtain building permits', priority: 'high' },
    { title: 'Finalize architectural plans', priority: 'high' },
    { title: 'Conduct site survey', priority: 'medium' },
  ],
  'Site Work & Foundation': [
    { title: 'Clear and excavate site', priority: 'high' },
    { title: 'Install footings', priority: 'high' },
    { title: 'Pour foundation', priority: 'high' },
    { title: 'Waterproof foundation', priority: 'high' },
  ],
  Framing: [
    { title: 'Frame exterior walls', priority: 'high' },
    { title: 'Frame interior walls', priority: 'high' },
    { title: 'Install roof trusses', priority: 'high' },
    { title: 'Install roof sheathing', priority: 'high' },
  ],
  'Exterior Finishing': [
    { title: 'Install roofing materials', priority: 'high' },
    { title: 'Install exterior doors and windows', priority: 'high' },
    { title: 'Install siding', priority: 'medium' },
  ],
  'Rough-In Mechanical Systems': [
    { title: 'Install electrical rough-in', priority: 'high' },
    { title: 'Install plumbing rough-in', priority: 'high' },
    { title: 'Install HVAC rough-in', priority: 'high' },
  ],
  'Insulation & Drywall': [
    { title: 'Install insulation', priority: 'high' },
    { title: 'Hang drywall', priority: 'high' },
    { title: 'Tape and mud drywall', priority: 'medium' },
    { title: 'Sand and prime drywall', priority: 'medium' },
  ],
  'Interior Finishing': [
    { title: 'Paint interior walls', priority: 'medium' },
    { title: 'Install interior doors', priority: 'medium' },
    { title: 'Install trim and molding', priority: 'medium' },
    { title: 'Install cabinets and countertops', priority: 'high' },
    { title: 'Install flooring', priority: 'high' },
  ],
  'Mechanical Trim-Out': [
    { title: 'Install electrical fixtures', priority: 'high' },
    { title: 'Install plumbing fixtures', priority: 'high' },
    { title: 'Install HVAC registers and grilles', priority: 'medium' },
    { title: 'Install appliances', priority: 'medium' },
  ],
  'Landscaping & Exterior Work': [
    { title: 'Rough grade yard', priority: 'medium' },
    { title: 'Install driveway and walkways', priority: 'medium' },
    { title: 'Install basic landscaping', priority: 'low' },
  ],
  'Final Inspection & Closeout': [
    { title: 'Schedule final inspections', priority: 'high' },
    { title: 'Complete punch list items', priority: 'high' },
    { title: 'Conduct final walk-through', priority: 'high' },
    { title: 'Deliver project documentation', priority: 'medium' },
  ],
};

export const normalizePhaseAllocations = (phaseAllocations: PhaseAllocation[]): PhaseAllocation[] => {
  const totalPercentage = phaseAllocations.reduce((sum, phase) => sum + phase.percentage, 0);

  if (Math.abs(totalPercentage - 1) <= 0.001) {
    return phaseAllocations.map(phase => ({ ...phase }));
  }

  logger.warn(`Phase budget allocations don't add up to 100% (actual: ${totalPercentage * 100}%). Normalizing values.`);
  return phaseAllocations.map(phase => ({
    ...phase,
    percentage: phase.percentage / totalPercentage,
  }));
};

export const getPhaseDescription = (phaseName: string): string =>
  PHASE_DESCRIPTIONS[phaseName] || 'Construction phase';

const createTask = (
  userId: string,
  projectId: string,
  title: string,
  priority: Task['priority']
): Task => ({
  id: uuidv4(),
  userId,
  projectId,
  title,
  status: 'todo',
  priority,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createPhaseTasks = (userId: string, projectId: string, phaseName: string): Task[] => {
  const phaseSpecificTasks = PHASE_SPECIFIC_TASK_TITLES[phaseName];

  if (!phaseSpecificTasks) {
    throw new Error(`Unknown phase: ${phaseName}`);
  }

  const commonTasks = [
    { title: `Create ${phaseName} plan`, priority: 'high' as const },
    { title: `Assign ${phaseName} tasks`, priority: 'high' as const },
    { title: `Track ${phaseName} progress`, priority: 'medium' as const },
  ];

  return [...commonTasks, ...phaseSpecificTasks].map(task =>
    createTask(userId, projectId, task.title, task.priority)
  );
};

export const getResidentialProjectEndDate = (
  projectStartDate: Date | string | number,
  projectEndDate?: Date | string | number | null
): Date => {
  const hasUserProvidedEndDate = projectEndDate !== undefined && projectEndDate !== null;

  if (hasUserProvidedEndDate) {
    return projectEndDate instanceof Date
      ? projectEndDate
      : (typeof projectEndDate === 'string' || typeof projectEndDate === 'number')
        ? new Date(projectEndDate)
        : addDays(new Date(projectStartDate), 270);
  }

  return addDays(new Date(projectStartDate), 270);
};

export const createResidentialPhases = (
  userId: string,
  projectId: string,
  projectStartDate: Date | string | number,
  projectEndDate: Date,
  totalBudget: number
): Phase[] => {
  const totalProjectDays = Math.ceil((projectEndDate.getTime() - new Date(projectStartDate).getTime()) / (1000 * 60 * 60 * 24));
  const phaseDuration = Math.floor(totalProjectDays / 10);
  const phaseAllocations = normalizePhaseAllocations(STANDARD_RESIDENTIAL_PHASE_ALLOCATIONS);
  const residentialPhases: Phase[] = [];
  let remainingDays = 0;

  phaseAllocations.forEach((allocation, index) => {
    const phaseBudget = Math.round(totalBudget * allocation.percentage);
    const phaseStartDate = index === 0
      ? new Date(projectStartDate)
      : addDays(new Date(projectStartDate), remainingDays);
    const actualPhaseDuration = Math.max(7, phaseDuration);
    remainingDays += actualPhaseDuration;
    const phaseEndDate = addDays(phaseStartDate, actualPhaseDuration);

    residentialPhases.push({
      id: uuidv4(),
      projectId,
      name: allocation.name,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      status: 'not_started',
      progress: 0,
      budget: phaseBudget,
      actualCost: 0,
      description: getPhaseDescription(allocation.name),
      tasks: createPhaseTasks(userId, projectId, allocation.name),
    });
  });

  return residentialPhases;
};
