import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BudgetProjection } from '../types';

type TimestampLike = Timestamp & { toDate: () => Date };

interface ProjectionIdOptions {
  now?: () => number;
  random?: () => number;
}

interface CreateProjectionOptions extends ProjectionIdOptions {
  createdAt?: Date;
}

type NewBudgetProjection = Omit<BudgetProjection, 'id' | 'createdAt'>;

const isTimestamp = (value: unknown): value is TimestampLike => (
  value instanceof Timestamp ||
  Boolean(value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function')
);

export const createBudgetProjectionId = (options: ProjectionIdOptions = {}): string => {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;

  return `projection-${now()}-${random().toString(36).substring(2, 7)}`;
};

export const normalizeBudgetProjection = (projection: BudgetProjection): BudgetProjection => ({
  ...projection,
  notes: projection.notes || null,
  createdAt: isTimestamp(projection.createdAt)
    ? projection.createdAt.toDate()
    : projection.createdAt instanceof Date
      ? projection.createdAt
      : new Date(projection.createdAt),
});

export const serializeBudgetProjection = (projection: BudgetProjection): BudgetProjection => ({
  ...projection,
  notes: projection.notes || null,
  createdAt: isTimestamp(projection.createdAt)
    ? projection.createdAt
    : Timestamp.fromDate(projection.createdAt instanceof Date ? projection.createdAt : new Date(projection.createdAt)),
});

export const serializeBudgetProjections = (projections: BudgetProjection[]): BudgetProjection[] => (
  projections.map(serializeBudgetProjection)
);

export const createBudgetProjection = (
  projection: NewBudgetProjection,
  options: CreateProjectionOptions = {},
): BudgetProjection => ({
  ...projection,
  notes: projection.notes || null,
  id: createBudgetProjectionId(options),
  createdAt: options.createdAt ?? new Date(),
});

export const saveProjectProjections = async (
  projectId: string,
  projections: BudgetProjection[],
): Promise<void> => {
  await updateDoc(doc(db, 'projects', projectId), {
    projections: serializeBudgetProjections(projections),
  });
};

export const addProjectProjection = async (
  projectId: string,
  currentProjections: BudgetProjection[],
  projection: NewBudgetProjection,
  options: CreateProjectionOptions = {},
): Promise<BudgetProjection> => {
  const newProjection = createBudgetProjection(projection, options);
  await saveProjectProjections(projectId, [...currentProjections, newProjection]);

  return newProjection;
};

export const updateProjectBudget = async (
  projectId: string,
  budget: number | null,
): Promise<void> => {
  await updateDoc(doc(db, 'projects', projectId), {
    budget,
    updatedAt: Timestamp.now(),
  });
};
