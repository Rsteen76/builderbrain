import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { logger } from '../utils/logger';

export type ScheduleEventType = 'milestone' | 'task' | 'payment' | 'meeting' | 'delivery' | 'note';
export type SchedulePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: ScheduleEventType;
  projectId?: string;
  projectName?: string;
  completed?: boolean;
  status?: string;
  priority?: SchedulePriority;
}

export interface TimelineEvent {
  id: string;
  type: ScheduleEventType;
  date: string;
  title: string;
  description?: string;
  status?: string;
  priority?: SchedulePriority;
  amount?: number;
  projectId: string;
  projectName: string;
  completed?: boolean;
  createdBy?: string;
  createdAt: string;
  category?: string;
}

export interface TimelineProject {
  id: string;
  name: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  projects: TimelineProject[];
}

interface ProjectRecord {
  id: string;
  name?: string;
  keyMilestones?: Array<{
    name?: string;
    date?: FirestoreDate;
    description?: string;
  }>;
  createdAt?: FirestoreDate;
}

type FirestoreDate = Timestamp | Date | string | number | { toDate: () => Date } | null | undefined;

export const getScheduleRangeForMonth = (currentDate: Date): { startDate: Date; endDate: Date } => {
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  startDate.setDate(startDate.getDate() - 7);
  endDate.setDate(endDate.getDate() + 7);

  return { startDate, endDate };
};

const isTimestampLike = (value: FirestoreDate): value is { toDate: () => Date } => (
  Boolean(value) && typeof (value as { toDate?: unknown }).toDate === 'function'
);

export const scheduleDateToDate = (value: FirestoreDate, fallback = new Date()): Date => {
  if (!value) return fallback;
  if (isTimestampLike(value)) return value.toDate();
  if (value instanceof Date) return value;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? fallback : parsedDate;
};

const scheduleDateToIso = (value: FirestoreDate, fallback = new Date()): string => (
  scheduleDateToDate(value, fallback).toISOString()
);

export const buildProjectNameMap = (projects: TimelineProject[]): Map<string, string> => (
  new Map(projects.map(project => [project.id, project.name || 'Unnamed Project']))
);

export const resolveProjectName = (
  projectId: string | undefined,
  projectNames: Map<string, string>,
  fallback = 'Unknown Project'
): string => {
  if (!projectId) return fallback;
  return projectNames.get(projectId) || fallback;
};

const projectSnapshotToRecords = (snapshot: Awaited<ReturnType<typeof getDocs>>): ProjectRecord[] => (
  snapshot.docs.map(projectDoc => ({
    id: projectDoc.id,
    ...(projectDoc.data() as Record<string, unknown>),
  }))
);

const projectRecordsToList = (projects: ProjectRecord[]): TimelineProject[] => (
  projects.map(project => ({
    id: project.id,
    name: project.name || 'Unnamed Project',
  }))
);

const fetchProjectRecords = async (userId: string, ordered = false): Promise<ProjectRecord[]> => {
  const constraints = [where('userId', '==', userId)];
  const projectsQuery = ordered
    ? query(collection(db, 'projects'), ...constraints, orderBy('name', 'asc'))
    : query(collection(db, 'projects'), ...constraints);
  const projectsSnapshot = await getDocs(projectsQuery);

  return projectSnapshotToRecords(projectsSnapshot);
};

const appendProjectMilestones = (
  events: CalendarEvent[],
  projects: ProjectRecord[],
  startDate?: Date,
  endDate?: Date
) => {
  projects.forEach(project => {
    const projectName = project.name || 'Unnamed Project';

    if (!Array.isArray(project.keyMilestones)) return;

    project.keyMilestones.forEach(milestone => {
      if (!milestone.date) return;

      const milestoneDate = scheduleDateToDate(milestone.date);
      if (startDate && endDate && (milestoneDate < startDate || milestoneDate > endDate)) return;

      events.push({
        id: `milestone-${project.id}-${milestone.name}`,
        title: milestone.name || 'Untitled Milestone',
        description: milestone.description || '',
        date: milestoneDate,
        type: 'milestone',
        projectId: project.id,
        projectName,
      });
    });
  });
};

export class CalendarTimelineService {
  static async getCalendarEvents(userId: string, currentDate: Date): Promise<CalendarEvent[]> {
    if (!userId) return [];

    const { startDate, endDate } = getScheduleRangeForMonth(currentDate);
    const calendarEvents: CalendarEvent[] = [];
    const projects = await fetchProjectRecords(userId);
    const projectNames = buildProjectNameMap(projectRecordsToList(projects));

    try {
      const tasksSnapshot = await getDocs(query(
        collection(db, 'tasks'),
        where('userId', '==', userId),
        where('dueDate', '>=', Timestamp.fromDate(startDate)),
        where('dueDate', '<=', Timestamp.fromDate(endDate))
      ));

      tasksSnapshot.docs.forEach(taskDoc => {
        const task = taskDoc.data();
        if (!task.dueDate) return;

        calendarEvents.push({
          id: taskDoc.id,
          title: task.title || 'Untitled Task',
          description: task.description,
          date: scheduleDateToDate(task.dueDate),
          type: 'task',
          projectId: task.projectId,
          projectName: resolveProjectName(task.projectId, projectNames),
          completed: task.status === 'completed',
          status: task.status,
          priority: task.priority,
        });
      });
    } catch (error) {
      logger.error('Error fetching tasks:', error);
    }

    appendProjectMilestones(calendarEvents, projects, startDate, endDate);

    try {
      const paymentsSnapshot = await getDocs(query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        where('dueDate', '>=', Timestamp.fromDate(startDate)),
        where('dueDate', '<=', Timestamp.fromDate(endDate))
      ));

      paymentsSnapshot.docs.forEach(paymentDoc => {
        const payment = paymentDoc.data();
        if (!payment.dueDate) return;

        calendarEvents.push({
          id: paymentDoc.id,
          title: payment.description || `Payment: $${payment.amount}`,
          description: `${payment.paymentType || 'Payment'} - ${payment.status}`,
          date: scheduleDateToDate(payment.dueDate),
          type: 'payment',
          projectId: payment.projectId,
          projectName: resolveProjectName(payment.projectId, projectNames),
          completed: payment.status === 'paid',
          status: payment.status,
        });
      });
    } catch (error) {
      logger.error('Error fetching payments:', error);
    }

    try {
      const eventsSnapshot = await getDocs(query(
        collection(db, 'events'),
        where('userId', '==', userId),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate))
      ));

      eventsSnapshot.docs.forEach(eventDoc => {
        const event = eventDoc.data();
        if (!event.startDate) return;

        const projectId = event.projectId || '';

        calendarEvents.push({
          id: eventDoc.id,
          title: event.title || 'Untitled Event',
          description: event.description || '',
          date: scheduleDateToDate(event.startDate),
          type: 'meeting',
          projectId,
          projectName: event.projectName || resolveProjectName(projectId, projectNames, 'General'),
          completed: new Date() > scheduleDateToDate(event.startDate),
        });
      });
    } catch (error) {
      logger.error('Error fetching events:', error);
    }

    try {
      const deliveriesSnapshot = await getDocs(query(
        collection(db, 'deliveries'),
        where('userId', '==', userId),
        where('expectedDate', '>=', Timestamp.fromDate(startDate)),
        where('expectedDate', '<=', Timestamp.fromDate(endDate))
      ));

      deliveriesSnapshot.docs.forEach(deliveryDoc => {
        const delivery = deliveryDoc.data();
        if (!delivery.expectedDate) return;

        calendarEvents.push({
          id: deliveryDoc.id,
          title: `Delivery: ${delivery.materialName || 'Materials'}`,
          description: delivery.notes || `Quantity: ${delivery.quantity || 'Unknown'}`,
          date: scheduleDateToDate(delivery.expectedDate),
          type: 'delivery',
          projectId: delivery.projectId,
          projectName: resolveProjectName(delivery.projectId, projectNames),
          completed: delivery.status === 'delivered',
          status: delivery.status,
        });
      });
    } catch (error) {
      logger.error('Error fetching deliveries:', error);
    }

    return calendarEvents;
  }

  static async getTimelineData(userId: string): Promise<TimelineData> {
    if (!userId) return { events: [], projects: [] };

    const projects = await fetchProjectRecords(userId, true);
    const projectsList = projectRecordsToList(projects);
    const projectNames = buildProjectNameMap(projectsList);
    const timelineEvents: TimelineEvent[] = [];

    const tasksSnapshot = await getDocs(query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
    ));

    tasksSnapshot.docs.forEach(taskDoc => {
      const task = taskDoc.data();
      if (!task.dueDate) return;

      timelineEvents.push({
        id: taskDoc.id,
        type: 'task',
        date: scheduleDateToIso(task.dueDate),
        title: task.title || 'Untitled Task',
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        projectId: task.projectId || '',
        projectName: resolveProjectName(task.projectId, projectNames),
        completed: task.status === 'completed',
        createdBy: task.createdBy,
        createdAt: scheduleDateToIso(task.createdAt),
      });
    });

    projects.forEach(project => {
      if (!Array.isArray(project.keyMilestones)) return;

      project.keyMilestones.forEach(milestone => {
        if (!milestone.date) return;

        timelineEvents.push({
          id: `milestone-${project.id}-${milestone.name}`,
          type: 'milestone',
          date: scheduleDateToIso(milestone.date),
          title: milestone.name || 'Untitled Milestone',
          description: milestone.description || '',
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          createdAt: scheduleDateToIso(project.createdAt),
        });
      });
    });

    try {
      const paymentsSnapshot = await getDocs(query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
      ));

      paymentsSnapshot.docs.forEach(paymentDoc => {
        const payment = paymentDoc.data();
        if (!payment.dueDate) return;

        timelineEvents.push({
          id: paymentDoc.id,
          type: 'payment',
          date: scheduleDateToIso(payment.dueDate),
          title: payment.description || `Payment of $${payment.amount}`,
          description: `${payment.paymentType || 'Payment'} - ${payment.status}`,
          amount: payment.amount,
          status: payment.status,
          projectId: payment.projectId || '',
          projectName: resolveProjectName(payment.projectId, projectNames),
          completed: payment.status === 'paid',
          createdAt: scheduleDateToIso(payment.createdAt),
        });
      });
    } catch (error) {
      logger.error('Error fetching payments:', error);
    }

    try {
      const deliveriesSnapshot = await getDocs(query(
        collection(db, 'deliveries'),
        where('userId', '==', userId),
        orderBy('expectedDate', 'asc')
      ));

      deliveriesSnapshot.docs.forEach(deliveryDoc => {
        const delivery = deliveryDoc.data();
        if (!delivery.expectedDate) return;

        timelineEvents.push({
          id: deliveryDoc.id,
          type: 'delivery',
          date: scheduleDateToIso(delivery.expectedDate),
          title: `Delivery: ${delivery.materialName || 'Materials'}`,
          description: delivery.notes || `Quantity: ${delivery.quantity || 'Unknown'}`,
          status: delivery.status,
          projectId: delivery.projectId || '',
          projectName: resolveProjectName(delivery.projectId, projectNames),
          completed: delivery.status === 'delivered',
          createdAt: scheduleDateToIso(delivery.createdAt),
        });
      });
    } catch (error) {
      logger.error('Error fetching deliveries:', error);
    }

    try {
      const eventsSnapshot = await getDocs(query(
        collection(db, 'events'),
        where('userId', '==', userId),
        orderBy('startDate', 'asc')
      ));

      eventsSnapshot.docs.forEach(eventDoc => {
        const event = eventDoc.data();
        if (!event.startDate) return;

        const projectId = event.projectId || '';

        timelineEvents.push({
          id: eventDoc.id,
          type: 'meeting',
          date: scheduleDateToIso(event.startDate),
          title: event.title || 'Untitled Event',
          description: event.description || '',
          projectId,
          projectName: event.projectName || resolveProjectName(projectId, projectNames, 'General'),
          completed: new Date() > scheduleDateToDate(event.startDate),
          createdAt: scheduleDateToIso(event.createdAt),
        });
      });
    } catch (error) {
      logger.error('Error fetching events:', error);
    }

    timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      events: timelineEvents,
      projects: projectsList,
    };
  }
}
