export type ProjectHealth = 'over_budget' | 'behind_schedule' | 'on_track';

/** How many points the share of phases complete may trail the share of time elapsed. */
export const BEHIND_SCHEDULE_MARGIN_POINTS = 10;

export const PROJECT_HEALTH_LABELS: Record<ProjectHealth, string> = {
  over_budget: 'Over budget',
  behind_schedule: 'Behind schedule',
  on_track: 'On track',
};

interface ProjectHealthInput {
  /** Paid plus approved expenses. */
  spent: number;
  /** Total budget; a project with no budget is never called over budget. */
  budget: number;
  /** Share of phases complete, 0 to 100. */
  progressPercent: number;
  elapsedDays: number;
  totalDays: number;
}

/**
 * Over budget when spent exceeds the budget; otherwise behind schedule when the share of
 * phases complete trails the share of time elapsed by more than 10 points; otherwise on track.
 * It reads the exact day counts, so it does not change with rounding.
 */
export const calculateProjectHealth = ({
  spent,
  budget,
  progressPercent,
  elapsedDays,
  totalDays,
}: ProjectHealthInput): ProjectHealth => {
  if (budget > 0 && spent > budget) return 'over_budget';

  const timePercent = totalDays > 0 ? (Math.min(elapsedDays, totalDays) / totalDays) * 100 : 0;
  if (timePercent - progressPercent > BEHIND_SCHEDULE_MARGIN_POINTS) return 'behind_schedule';

  return 'on_track';
};
