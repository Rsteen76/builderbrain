import type { Project } from '../../types';
import { addDays, timestampToDate } from './dates';
import type { FirestoreProject } from './types';

export const convertToProjectData = (data: FirestoreProject): Project => {
  const phases = (data.phases || []).map(phase => ({
    ...phase,
    startDate: timestampToDate(phase.startDate),
    endDate: timestampToDate(phase.endDate),
  }));

  return {
    id: data.id || '',
    userId: data.userId,
    name: data.name || '',
    description: data.description || '',
    status: data.status || 'estimate',
    startDate: data.startDate ? data.startDate.toDate() : new Date(),
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
    progress: data.progress || 0,
  };
};

export const convertFirestoreData = (data: FirestoreProject, id: string): Project => {
  const convertedPhases = data.phases?.map((phase) => {
    const startDate = timestampToDate(phase.startDate);
    const endDate =
      timestampToDate(phase.endDate) ??
      (startDate ? addDays(startDate, 30) : null);

    return {
      ...phase,
      projectId: phase.projectId || id,
      startDate,
      endDate,
    };
  }) || [];

  const project: Project = {
    ...data,
    id,
    userId: data.userId,
    startDate: data.startDate?.toDate() || new Date(),
    endDate: data.endDate ? data.endDate.toDate() : null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    budget: data.budget || {
      total: 0,
      spent: 0,
      remaining: 0,
    },
    location: data.location || {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
    lineItems: data.lineItems || [],
    bids: data.bids || [],
    tasks: data.tasks || [],
    team: data.team || [],
    phases: convertedPhases,
    keyMilestones: data.keyMilestones || [],
    requirements: data.requirements || { permits: [], inspections: [], documents: [] },
    projections: data.projections || [],
    progress: data.progress || 0,
  };

  return project;
};
