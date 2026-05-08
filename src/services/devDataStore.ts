import { v4 as uuidv4 } from 'uuid';
import { createSeedState } from '../data/dev/seedState';
import {
  Bid,
  BidPaymentStage,
  BidVersion,
  Expense,
  Project,
  ProjectPhase,
  Subcontractor,
  Task,
} from '../types';
import type { BidFilter, BidSort } from './bid';
import { withPaymentProgress } from './devDataStore/paymentProgress';
import { loadDevDataState, saveDevDataState } from './devDataStore/storage';
import type { DevDataState } from './devDataStore/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortByDateDesc = <T>(items: T[], getter: (item: T) => Date | null) =>
  [...items].sort((a, b) => {
    const aDate = getter(a)?.getTime() || 0;
    const bDate = getter(b)?.getTime() || 0;
    return bDate - aDate;
  });

const hydrateTask = (task: Task): Task => ({
  ...task,
  createdAt: asDate(task.createdAt) || new Date(),
  updatedAt: asDate(task.updatedAt) || new Date(),
  dueDate: asDate(task.dueDate) || null,
  completedAt: asDate(task.completedAt) || null,
});

const hydrateExpense = (expense: Expense): Expense => ({
  ...expense,
  date: asDate(expense.date) || new Date(),
  createdAt: asDate(expense.createdAt) || new Date(),
  updatedAt: asDate(expense.updatedAt) || new Date(),
  dueDate: asDate(expense.dueDate) || null,
  lastPaymentDate: asDate(expense.lastPaymentDate) || null,
});

const hydrateBidVersion = (version: BidVersion): BidVersion => ({
  ...version,
  createdAt: asDate(version.createdAt) || new Date(),
});

const hydrateBidStage = (stage: BidPaymentStage): BidPaymentStage => ({
  ...stage,
  dueDate: asDate(stage.dueDate) || undefined,
  paymentDate: asDate(stage.paymentDate) || undefined,
  createdAt: asDate(stage.createdAt) || new Date(),
  updatedAt: asDate(stage.updatedAt) || new Date(),
});

const hydrateBid = (bid: Bid): Bid =>
  withPaymentProgress({
    ...bid,
    createdAt: asDate(bid.createdAt) || new Date(),
    updatedAt: asDate(bid.updatedAt) || new Date(),
    submissionDeadline: asDate(bid.submissionDeadline) || null,
    startDate: asDate(bid.startDate) || null,
    completionDate: asDate(bid.completionDate) || null,
    versions: (bid.versions || []).map(hydrateBidVersion),
    paymentSchedule: (bid.paymentSchedule || []).map(hydrateBidStage),
  });

const hydrateSubcontractor = (subcontractor: Subcontractor): Subcontractor => ({
  ...subcontractor,
  createdAt: asDate(subcontractor.createdAt) || new Date(),
  updatedAt: asDate(subcontractor.updatedAt) || new Date(),
  lastBid: subcontractor.lastBid
    ? {
        ...subcontractor.lastBid,
        date: asDate(subcontractor.lastBid.date) || new Date(),
      }
    : null,
});

const hydratePhase = (phase: ProjectPhase): ProjectPhase => ({
  ...phase,
  startDate: asDate(phase.startDate) || new Date(),
  endDate: asDate(phase.endDate) || addDays(new Date(), 30),
  tasks: [],
});

const hydrateProject = (project: Project): Project => ({
  ...project,
  startDate: asDate(project.startDate) || new Date(),
  endDate: asDate(project.endDate) || null,
  createdAt: asDate(project.createdAt) || new Date(),
  updatedAt: asDate(project.updatedAt) || new Date(),
  keyMilestones: (project.keyMilestones || []).map((milestone) => ({
    ...milestone,
    date: asDate(milestone.date) || null,
  })),
  phases: (project.phases || []).map((phase) => hydratePhase(phase as ProjectPhase)),
  lineItems: (project.lineItems || []).map((item) => ({
    ...item,
    createdAt: asDate(item.createdAt) || undefined,
    updatedAt: asDate(item.updatedAt) || undefined,
  })),
});

const loadState = (): DevDataState => loadDevDataState(createSeedState);

const saveState = (state: DevDataState) => {
  saveDevDataState(state);
};

const getHydratedState = (): DevDataState => {
  const raw = loadState();
  const tasks = raw.tasks.map(hydrateTask);
  const bids = raw.bids.map(hydrateBid);
  const expenses = raw.expenses.map(hydrateExpense);
  const subcontractors = raw.subcontractors.map(hydrateSubcontractor);

  const projects = raw.projects.map((project) => {
    const hydratedProject = hydrateProject(project);
    const projectTasks = sortByDateDesc(
      tasks.filter((task) => task.projectId === hydratedProject.id),
      (task) => asDate(task.dueDate) || asDate(task.updatedAt)
    );
    const projectBids = sortByDateDesc(
      bids.filter((bid) => bid.projectId === hydratedProject.id),
      (bid) => asDate(bid.updatedAt)
    );
    const projectExpenses = sortByDateDesc(
      expenses.filter((expense) => expense.projectId === hydratedProject.id),
      (expense) => asDate(expense.date)
    );
    const spent = projectExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalBudget =
      typeof hydratedProject.budget === 'number'
        ? hydratedProject.budget
        : hydratedProject.budget.total;

    const phases = hydratedProject.phases.map((phase) => {
      const phaseTasks = projectTasks.filter((task) => task.phaseId === phase.id);
      const phaseExpenses = projectExpenses.filter((expense) => expense.phaseId === phase.id);
      const completedTasks = phaseTasks.filter((task) => task.status === 'completed').length;
      const progress = phaseTasks.length
        ? Math.round((completedTasks / phaseTasks.length) * 100)
        : phase.progress || 0;

      return {
        ...phase,
        tasks: phaseTasks,
        actualCost: phaseExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
        progress,
      };
    });

    const completedProjectTasks = projectTasks.filter(
      (task) => task.status === 'completed'
    ).length;
    const progress = projectTasks.length
      ? Math.round((completedProjectTasks / projectTasks.length) * 100)
      : hydratedProject.progress || 0;

    return {
      ...hydratedProject,
      phases,
      tasks: projectTasks,
      bids: projectBids,
      expenses: projectExpenses,
      actualCost: spent,
      budget:
        typeof hydratedProject.budget === 'number'
          ? { total: totalBudget, spent, remaining: totalBudget - spent }
          : {
              ...hydratedProject.budget,
              total: totalBudget,
              spent,
              remaining: totalBudget - spent,
            },
      progress,
    };
  });

  return {
    ...raw,
    projects,
    tasks,
    bids,
    expenses,
    subcontractors,
  };
};

export const ensureDevDataSeeded = () => {
  getHydratedState();
};

const updateState = (updater: (state: DevDataState) => DevDataState) => {
  const nextState = updater(loadState());
  saveState(nextState);
  return getHydratedState();
};

export const resetDevDataSeed = () => {
  const seeded = createSeedState();
  saveState(seeded);
  return getHydratedState();
};

export const listDevProjects = (userId: string, filters?: {
  status?: Project['status'];
  clientId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}) => {
  const state = getHydratedState();
  return state.projects
    .filter((project) => project.userId === userId)
    .filter((project) => !filters?.status || project.status === filters.status)
    .filter((project) => !filters?.clientId || project.clientId === filters.clientId)
    .filter((project) => !filters?.startDate || (project.startDate && project.startDate >= filters.startDate))
    .filter((project) => !filters?.endDate || (!!project.endDate && project.endDate <= filters.endDate))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDevProjectById = (projectId: string) =>
  getHydratedState().projects.find((project) => project.id === projectId) || null;

export const createDevProject = (userId: string, projectData: Partial<Project>) => {
  const now = new Date();
  const projectId = projectData.id || uuidv4();
  const project: Project = {
    id: projectId,
    userId,
    name: projectData.name || 'Untitled Project',
    description: projectData.description || '',
    status: projectData.status || 'draft',
    priority: projectData.priority || 'medium',
    startDate: asDate(projectData.startDate) || new Date(),
    endDate: asDate(projectData.endDate) || null,
    budget:
      typeof projectData.budget === 'number'
        ? { total: projectData.budget, spent: 0, remaining: projectData.budget }
        : projectData.budget || { total: 0, spent: 0, remaining: 0 },
    actualCost: 0,
    location:
      typeof projectData.location === 'string'
        ? { address: projectData.location, city: '', state: '', zipCode: '' }
        : projectData.location || { address: '', city: '', state: '', zipCode: '' },
    createdAt: now,
    updatedAt: now,
    team: projectData.team || [],
    projectType: projectData.projectType,
    estimatedDuration: projectData.estimatedDuration,
    phases: (projectData.phases as ProjectPhase[]) || [],
    keyMilestones: projectData.keyMilestones || [],
    requirements: projectData.requirements || { permits: [], inspections: [], documents: [] },
    lineItems: projectData.lineItems || [],
    tasks: [],
    bids: [],
    expenses: [],
    projections: projectData.projections || [],
    progress: projectData.progress || 0,
    clientId: projectData.clientId,
    contractorId: projectData.contractorId,
  };

  const state = updateState((current) => ({
    ...current,
    projects: [...current.projects, project],
  }));
  return state.projects.find((item) => item.id === projectId)!;
};

export const updateDevProject = (projectId: string, projectData: Partial<Project>) => {
  const hydrated = getHydratedState();
  const existing = hydrated.projects.find((project) => project.id === projectId);
  if (!existing) return null;

  const incomingTasks = (projectData.tasks || []).map((task) => ({
    ...hydrateTask(task),
    projectId,
  }));

  const incomingPhaseTasks = (projectData.phases || [])
    .flatMap((phase) => (phase.tasks || []).map((task) => ({
      ...hydrateTask(task),
      projectId,
      phaseId: phase.id,
      phaseName: phase.name,
    })));

  const nextTasks =
    incomingTasks.length > 0
      ? [...hydrated.tasks.filter((task) => task.projectId !== projectId), ...incomingTasks]
      : incomingPhaseTasks.length > 0
      ? [
          ...hydrated.tasks.filter(
            (task) =>
              task.projectId !== projectId ||
              !incomingPhaseTasks.some((incoming) => incoming.id === task.id)
          ),
          ...incomingPhaseTasks,
        ]
      : hydrated.tasks;

  const strippedPhases = (projectData.phases as ProjectPhase[] | undefined)?.map((phase) => ({
    ...phase,
    tasks: [],
  }));

  const updatedProject: Project = {
    ...existing,
    ...projectData,
    id: projectId,
    userId: existing.userId,
    startDate: asDate(projectData.startDate) || existing.startDate,
    endDate:
      projectData.endDate === null
        ? null
        : asDate(projectData.endDate) || existing.endDate,
    updatedAt: new Date(),
    phases: strippedPhases || existing.phases,
  };

  const state = updateState((current) => ({
    ...current,
    tasks: nextTasks,
    projects: current.projects.map((project) =>
      project.id === projectId ? updatedProject : project
    ),
  }));
  return state.projects.find((project) => project.id === projectId) || null;
};

export const deleteDevProject = (projectId: string) => {
  updateState((current) => ({
    ...current,
    projects: current.projects.filter((project) => project.id !== projectId),
    tasks: current.tasks.filter((task) => task.projectId !== projectId),
    bids: current.bids.filter((bid) => bid.projectId !== projectId),
    expenses: current.expenses.filter((expense) => expense.projectId !== projectId),
  }));
};

export const listDevTasks = (userId: string, filters?: {
  projectId?: string;
  status?: Task['status'];
  assigneeId?: string;
  priority?: Task['priority'];
  sortBy?: keyof Omit<Task, 'id'>;
  sortDirection?: 'asc' | 'desc';
}) => {
  const tasks = getHydratedState().tasks
    .filter((task) => task.userId === userId)
    .filter((task) => !filters?.projectId || task.projectId === filters.projectId)
    .filter((task) => !filters?.status || task.status === filters.status)
    .filter((task) => !filters?.assigneeId || task.assigneeId === filters.assigneeId)
    .filter((task) => !filters?.priority || task.priority === filters.priority);

  const sortBy = filters?.sortBy || 'createdAt';
  const sortDirection = filters?.sortDirection || 'desc';

  return [...tasks].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction * (aValue.getTime() - bValue.getTime());
    }
    return direction * String(aValue || '').localeCompare(String(bValue || ''));
  });
};

export const getDevTask = (userId: string, taskId: string) =>
  getHydratedState().tasks.find((task) => task.id === taskId && task.userId === userId) ||
  null;

export const createDevTask = (
  userId: string,
  taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const task: Task = {
    ...taskData,
    id: uuidv4(),
    userId,
    createdAt: now,
    updatedAt: now,
    dueDate: asDate(taskData.dueDate) || null,
    completedAt: asDate(taskData.completedAt) || null,
  };

  updateState((current) => ({
    ...current,
    tasks: [...current.tasks, task],
  }));
  return task;
};

export const updateDevTask = (taskId: string, taskData: Partial<Task>) => {
  updateState((current) => ({
    ...current,
    tasks: current.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...taskData,
            dueDate:
              taskData.dueDate === null
                ? null
                : asDate(taskData.dueDate) || task.dueDate,
            completedAt:
              taskData.completedAt === null
                ? null
                : asDate(taskData.completedAt) || task.completedAt,
            updatedAt: new Date(),
          }
        : task
    ),
  }));
};

export const deleteDevTask = (taskId: string) => {
  updateState((current) => ({
    ...current,
    tasks: current.tasks.filter((task) => task.id !== taskId),
  }));
};

export const listDevExpenses = (userId: string, filters?: {
  projectId?: string;
  category?: Expense['category'];
  startDate?: Date;
  endDate?: Date;
  status?: Expense['status'] | Expense['status'][];
  phaseId?: string;
  subcontractorId?: string;
}) => {
  return sortByDateDesc(
    getHydratedState().expenses
      .filter((expense) => expense.userId === userId)
      .filter((expense) => !filters?.projectId || expense.projectId === filters.projectId)
      .filter((expense) => !filters?.category || expense.category === filters.category)
      .filter((expense) => !filters?.phaseId || expense.phaseId === filters.phaseId)
      .filter(
        (expense) =>
          !filters?.subcontractorId ||
          expense.subcontractorId === filters.subcontractorId
      )
      .filter((expense) => {
        if (!filters?.status) return true;
        return Array.isArray(filters.status)
          ? filters.status.includes(expense.status)
          : expense.status === filters.status;
      })
      .filter((expense) => !filters?.startDate || (asDate(expense.date) && asDate(expense.date)! >= filters.startDate))
      .filter((expense) => !filters?.endDate || (asDate(expense.date) && asDate(expense.date)! <= filters.endDate)),
    (expense) => asDate(expense.date)
  );
};

export const getDevExpense = (userId: string, expenseId: string) =>
  getHydratedState().expenses.find(
    (expense) => expense.id === expenseId && expense.userId === userId
  ) || null;

export const createDevExpense = (
  userId: string,
  expenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const project = getDevProjectById(expenseData.projectId);
  const subcontractor = expenseData.subcontractorId
    ? getHydratedState().subcontractors.find(
        (item) => item.id === expenseData.subcontractorId
      )
    : null;

  const expense: Expense = {
    ...expenseData,
    id: uuidv4(),
    userId,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    projectName: expenseData.projectName || project?.name,
    subcontractorName:
      expenseData.subcontractorName || subcontractor?.name || null,
    date: asDate(expenseData.date) || now,
    dueDate: asDate(expenseData.dueDate) || null,
    lastPaymentDate: asDate(expenseData.lastPaymentDate) || null,
    amountPaid: expenseData.amountPaid || 0,
    amountRemaining:
      expenseData.amountRemaining ??
      Math.max((expenseData.amount || 0) - (expenseData.amountPaid || 0), 0),
  };

  updateState((current) => ({
    ...current,
    expenses: [...current.expenses, expense],
  }));
  return expense;
};

export const updateDevExpense = (expenseId: string, expenseData: Partial<Expense>) => {
  updateState((current) => ({
    ...current,
    expenses: current.expenses.map((expense) => {
      if (expense.id !== expenseId) return expense;
      const nextAmount = expenseData.amount ?? expense.amount;
      const nextAmountPaid = expenseData.amountPaid ?? expense.amountPaid ?? 0;
      return {
        ...expense,
        ...expenseData,
        date: asDate(expenseData.date) || asDate(expense.date) || new Date(),
        dueDate:
          expenseData.dueDate === null
            ? null
            : asDate(expenseData.dueDate) || asDate(expense.dueDate) || null,
        lastPaymentDate:
          expenseData.lastPaymentDate === null
            ? null
            : asDate(expenseData.lastPaymentDate) ||
              asDate(expense.lastPaymentDate) ||
              null,
        amountPaid: nextAmountPaid,
        amountRemaining:
          expenseData.amountRemaining ?? Math.max(nextAmount - nextAmountPaid, 0),
        updatedAt: new Date(),
      };
    }),
  }));
};

export const deleteDevExpense = (expenseId: string) => {
  updateState((current) => ({
    ...current,
    expenses: current.expenses.filter((expense) => expense.id !== expenseId),
  }));
};

export const listDevSubcontractors = (userId: string, filters?: {
  specialtyArea?: string;
  companyName?: string;
  active?: boolean;
}) => {
  return getHydratedState().subcontractors
    .filter((subcontractor) => subcontractor.userId === userId)
    .filter(
      (subcontractor) =>
        !filters?.specialtyArea ||
        subcontractor.specialty === filters.specialtyArea
    )
    .filter(
      (subcontractor) =>
        !filters?.companyName ||
        subcontractor.name === filters.companyName
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDevSubcontractor = (userId: string, subcontractorId: string) =>
  getHydratedState().subcontractors.find(
    (subcontractor) =>
      subcontractor.id === subcontractorId && subcontractor.userId === userId
  ) || null;

export const createDevSubcontractor = (
  userId: string,
  subcontractorData: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const subcontractor: Subcontractor = {
    ...subcontractorData,
    id: uuidv4(),
    userId,
    createdAt: now,
    updatedAt: now,
  };

  updateState((current) => ({
    ...current,
    subcontractors: [...current.subcontractors, subcontractor],
  }));
  return subcontractor;
};

export const updateDevSubcontractor = (
  subcontractorId: string,
  subcontractorData: Partial<Subcontractor>
) => {
  updateState((current) => ({
    ...current,
    subcontractors: current.subcontractors.map((subcontractor) =>
      subcontractor.id === subcontractorId
        ? {
            ...subcontractor,
            ...subcontractorData,
            updatedAt: new Date(),
          }
        : subcontractor
    ),
  }));
};

export const deleteDevSubcontractor = (subcontractorId: string) => {
  updateState((current) => ({
    ...current,
    subcontractors: current.subcontractors.filter(
      (subcontractor) => subcontractor.id !== subcontractorId
    ),
  }));
};

export const listDevBids = (
  userId: string,
  filters?: BidFilter,
  sort?: BidSort,
  pageSize = 50
) => {
  let bids = getHydratedState().bids.filter((bid) => bid.userId === userId);
  const minAmount = filters?.minAmount;
  const maxAmount = filters?.maxAmount;

  if (filters?.projectId) bids = bids.filter((bid) => bid.projectId === filters.projectId);
  if (filters?.subcontractorId) {
    bids = bids.filter((bid) => bid.subcontractorId === filters.subcontractorId);
  }
  if (filters?.status) {
    bids = bids.filter((bid) =>
      Array.isArray(filters.status)
        ? filters.status.includes(bid.status)
        : bid.status === filters.status
    );
  }
  if (filters?.priority) bids = bids.filter((bid) => bid.priority === filters.priority);
  if (minAmount !== undefined) bids = bids.filter((bid) => bid.totalAmount >= minAmount);
  if (maxAmount !== undefined) bids = bids.filter((bid) => bid.totalAmount <= maxAmount);
  if (filters?.submissionDeadlineFrom) {
    bids = bids.filter((bid) => {
      const value = asDate(bid.submissionDeadline);
      return !!value && value >= filters.submissionDeadlineFrom!;
    });
  }
  if (filters?.submissionDeadlineTo) {
    bids = bids.filter((bid) => {
      const value = asDate(bid.submissionDeadline);
      return !!value && value <= filters.submissionDeadlineTo!;
    });
  }
  if (filters?.tags?.length) {
    bids = bids.filter((bid) =>
      filters.tags!.some((tag) => (bid.tags || []).includes(tag))
    );
  }

  const sorted = [...bids].sort((a, b) => {
    const direction = sort?.direction === 'asc' ? 1 : -1;
    const field = sort?.field || 'updatedAt';
    const aValue = (a as unknown as Record<string, unknown>)[field];
    const bValue = (b as unknown as Record<string, unknown>)[field];
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction * (aValue.getTime() - bValue.getTime());
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction * (aValue - bValue);
    }
    return direction * String(aValue || '').localeCompare(String(bValue || ''));
  });

  return sorted.slice(0, pageSize);
};

export const getDevBid = (userId: string, bidId: string) =>
  getHydratedState().bids.find((bid) => bid.id === bidId && bid.userId === userId) ||
  null;

export const createDevBid = (
  userId: string,
  bidData: Omit<Bid, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'>
) => {
  const now = new Date();
  const project = getDevProjectById(bidData.projectId);
  const subcontractor = bidData.subcontractorId
    ? getHydratedState().subcontractors.find(
        (item) => item.id === bidData.subcontractorId
      )
    : null;
  const versionId = uuidv4();
  const baseVersion: BidVersion = {
    id: versionId,
    versionNumber: 1,
    createdAt: now,
    totalAmount: bidData.totalAmount || 0,
    notes: bidData.notes || 'Initial version',
    lineItems: [],
    attachments: [],
  };

  const bid = withPaymentProgress({
    ...bidData,
    id: uuidv4(),
    userId,
    projectName: bidData.projectName || project?.name,
    subcontractorName: bidData.subcontractorName || subcontractor?.name,
    currentVersionId: versionId,
    versions: [baseVersion],
    createdAt: now,
    updatedAt: now,
    paymentSchedule: (bidData.paymentSchedule || []).map((stage) => ({
      ...stage,
      id: stage.id || uuidv4(),
      createdAt: asDate(stage.createdAt) || now,
      updatedAt: asDate(stage.updatedAt) || now,
      dueDate: asDate(stage.dueDate) || undefined,
      paymentDate: asDate(stage.paymentDate) || undefined,
      status: stage.status || 'pending',
      paidAmount: stage.paidAmount || 0,
    })),
  });

  updateState((current) => ({
    ...current,
    bids: [...current.bids, bid],
  }));
  return bid;
};

export const updateDevBid = (bidId: string, bidData: Partial<Bid>) => {
  updateState((current) => ({
    ...current,
    bids: current.bids.map((bid) =>
      bid.id === bidId
        ? withPaymentProgress({
            ...bid,
            ...bidData,
            submissionDeadline:
              bidData.submissionDeadline === null
                ? null
                : asDate(bidData.submissionDeadline) || bid.submissionDeadline || null,
            startDate:
              bidData.startDate === null
                ? null
                : asDate(bidData.startDate) || bid.startDate || null,
            completionDate:
              bidData.completionDate === null
                ? null
                : asDate(bidData.completionDate) || bid.completionDate || null,
            versions: (bidData.versions || bid.versions || []).map(hydrateBidVersion),
            paymentSchedule: (bidData.paymentSchedule || bid.paymentSchedule || []).map(
              (stage) => ({
                ...hydrateBidStage(stage),
                updatedAt: new Date(),
              })
            ),
            updatedAt: new Date(),
          })
        : bid
    ),
  }));
};

export const deleteDevBid = (bidId: string) => {
  updateState((current) => ({
    ...current,
    bids: current.bids.filter((bid) => bid.id !== bidId),
  }));
};

export const createDevBidVersion = (
  userId: string,
  bidId: string,
  versionData: Omit<BidVersion, 'id' | 'createdAt'>,
  updateBid = true
) => {
  const bid = getDevBid(userId, bidId);
  if (!bid) {
    throw new Error(`Bid with ID ${bidId} not found`);
  }

  const version: BidVersion = {
    ...versionData,
    id: uuidv4(),
    createdAt: new Date(),
    versionNumber: versionData.versionNumber || (bid.versions?.length || 0) + 1,
  };

  if (updateBid) {
    updateDevBid(bidId, {
      versions: [...(bid.versions || []), version],
      currentVersionId: version.id,
      totalAmount: version.totalAmount,
      status: 'revision_requested',
    });
  }

  return version;
};

export const updateDevBidPaymentStage = (
  userId: string,
  bidId: string,
  stageId: string,
  stageData: Partial<BidPaymentStage>
) => {
  const bid = getDevBid(userId, bidId);
  if (!bid || !bid.paymentSchedule) {
    throw new Error(`Bid ${bidId} or payment schedule not found`);
  }

  const paymentSchedule = bid.paymentSchedule.map((stage) =>
    stage.id === stageId
      ? {
          ...stage,
          ...stageData,
          dueDate:
            stageData.dueDate === null
              ? undefined
              : asDate(stageData.dueDate) || stage.dueDate,
          paymentDate:
            stageData.paymentDate === null
              ? undefined
              : asDate(stageData.paymentDate) || stage.paymentDate,
          updatedAt: new Date(),
        }
      : stage
  );

  updateDevBid(bidId, { paymentSchedule });
};
