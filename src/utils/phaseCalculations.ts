import { ProjectPhase, Bid, Expense } from '../types'; // Adjust path if needed

/**
 * Calculates the total proposed costs (sum of accepted bids) for each phase.
 * 
 * @param phases An array of project phase objects.
 * @param bids An array of bid objects for the project.
 * @returns A record mapping phase IDs to their total proposed costs.
 */
export const calculatePhaseProposedCosts = (
  phases: ProjectPhase[],
  bids: Bid[]
): Record<string, number> => {
  const proposedCosts: Record<string, number> = {};
  
  phases.forEach((phase: ProjectPhase) => {
    proposedCosts[phase.id] = 0;
  });
  
  bids.forEach((bid: Bid) => {
    if (bid.phaseId && bid.status === 'accepted') {
      const bidAmount = (bid as any).amount || 0; // Assuming Bid might miss amount, use assertion
      proposedCosts[bid.phaseId] = (proposedCosts[bid.phaseId] || 0) + bidAmount;
    }
  });
  
  return proposedCosts;
};

/**
 * Calculates the total actual costs (sum of expenses) for each phase.
 * 
 * @param phases An array of project phase objects.
 * @param expenses An array of expense objects for the project.
 * @returns A record mapping phase IDs to their total actual costs.
 */
export const calculatePhaseActualCosts = (
  phases: ProjectPhase[],
  expenses: Expense[]
): Record<string, number> => {
  const actualCosts: Record<string, number> = {};
  
  phases.forEach((phase: ProjectPhase) => {
    actualCosts[phase.id] = 0;
  });
  
  expenses.forEach((expense: Expense) => {
    if (expense.phaseId) {
      actualCosts[expense.phaseId] = (actualCosts[expense.phaseId] || 0) + (expense.amount || 0);
    }
  });
  
  return actualCosts;
};

/**
 * Calculates the overall project progress based on completed phases.
 * 
 * @param phases An array of project phase objects.
 * @returns A number representing the percentage of completed phases (0-100).
 */
export const calculateProjectProgress = (phases: ProjectPhase[]): number => {
  const totalPhases = phases.length;
  if (totalPhases === 0) return 0;
  const completedPhases = phases.filter((p: ProjectPhase) => p.status === 'completed').length;
  return Math.round((completedPhases / totalPhases) * 100);
}; 