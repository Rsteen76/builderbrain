export type ProjectHealth = 'over_budget' | 'behind_schedule' | 'on_track';

export const PROJECT_HEALTH_LABELS: Record<ProjectHealth, string> = {
  over_budget: 'Over budget',
  behind_schedule: 'Behind schedule',
  on_track: 'On track',
};

interface HealthPhase {
  status: string;
  endDate?: Date | { toDate(): Date } | null;
}

interface ProjectHealthInput {
  /** Spent so far (see calculateSpent). */
  spent: number;
  /** Total budget; a project with no budget is never called over budget. */
  budget: number;
  /** The project's own status, such as active, on_hold or completed. */
  status: string;
  phases: ReadonlyArray<HealthPhase>;
  /** Today, so the answer can be tested on any day. */
  now?: Date;
}

const toDate = (value: HealthPhase['endDate']): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : typeof value.toDate === 'function' ? value.toDate() : null;
  return date && !isNaN(date.getTime()) ? date : null;
};

/**
 * Whether the project is behind schedule: fewer phases are complete than the number of
 * phases whose end date has already passed. A phase ending today has not passed. Phases with
 * no end date are ignored. Only a project still in progress gets a schedule verdict, so a
 * project with no phases, or one that is on hold, cancelled or completed, gets none.
 */
export const isBehindSchedule = (
  { status, phases }: Pick<ProjectHealthInput, 'status' | 'phases'>,
  now: Date = new Date()
): boolean => {
  if (status === 'on_hold' || status === 'cancelled' || status === 'completed') return false;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ended = phases.filter((phase) => {
    const end = toDate(phase.endDate);
    return end !== null && end.getTime() < startOfToday;
  }).length;
  const completed = phases.filter((phase) => phase.status === 'completed').length;

  return completed < ended;
};

/**
 * Over budget when spent exceeds the budget; otherwise behind schedule by the rule above;
 * otherwise on track. When there is no schedule verdict, only the budget decides.
 */
export const calculateProjectHealth = ({
  spent,
  budget,
  status,
  phases,
  now,
}: ProjectHealthInput): ProjectHealth => {
  if (budget > 0 && spent > budget) return 'over_budget';
  if (isBehindSchedule({ status, phases }, now)) return 'behind_schedule';
  return 'on_track';
};
