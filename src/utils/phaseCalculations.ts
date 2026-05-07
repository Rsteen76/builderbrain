// import React from 'react'; // Added for getStatusIcon
import { ProjectPhase, Bid, Expense } from '../types'; // Adjust path if needed
// import {
//   Done as DoneIcon,
//   Pending as PendingIcon,
//   Info as InfoIcon
//   // Add other icons if getStatusIcon logic expands
// } from '@mui/icons-material';

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
  const proposedStatuses = new Set<Bid['status']>(['submitted', 'accepted', 'revision_requested']);

  phases.forEach((phase: ProjectPhase) => {
    proposedCosts[phase.id] = 0;
  });

  bids.forEach((bid: Bid) => {
    if (!proposedStatuses.has(bid.status)) {
      return;
    }

    const bidAmount = bid.totalAmount || bid.bidAmount || 0;

    if (bid.phaseId) {
      proposedCosts[bid.phaseId] = (proposedCosts[bid.phaseId] || 0) + bidAmount;
      return;
    }

    bid.paymentSchedule?.forEach((payment) => {
      if (payment.phaseId) {
        proposedCosts[payment.phaseId] = (proposedCosts[payment.phaseId] || 0) + (payment.amount || 0);
      }
    });
  });

  return proposedCosts;
};

/**
 * Calculates committed costs (accepted bids only) for each phase.
 */
export const calculatePhaseCommittedCosts = (
  phases: ProjectPhase[],
  bids: Bid[]
): Record<string, number> => {
  const committedCosts: Record<string, number> = {};

  phases.forEach((phase: ProjectPhase) => {
    committedCosts[phase.id] = 0;
  });

  bids.forEach((bid: Bid) => {
    if (bid.status !== 'accepted') {
      return;
    }

    const bidAmount = bid.totalAmount || bid.bidAmount || 0;

    if (bid.phaseId) {
      committedCosts[bid.phaseId] = (committedCosts[bid.phaseId] || 0) + bidAmount;
      return;
    }

    bid.paymentSchedule?.forEach((payment) => {
      if (payment.phaseId) {
        committedCosts[payment.phaseId] = (committedCosts[payment.phaseId] || 0) + (payment.amount || 0);
      }
    });
  });

  return committedCosts;
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

/**
 * Retrieves all payment schedule entries associated with a specific phase ID from a list of bids.
 * Includes synthetic payments for bids linked via top-level phaseId for legacy support.
 */
export const getPhasePayments = (
  phaseId: string,
  bids: Bid[] // Pass bids as argument
): Array<{ bidId: string; bidTitle: string; subcontractorName: string; payment: any; }> => {
  const phasePayments: Array<{ bidId: string; bidTitle: string; subcontractorName: string; payment: any; }> = [];

  bids.forEach(bid => {
    if (bid.paymentSchedule?.length) {
      const paymentsForPhase = bid.paymentSchedule.filter(
        payment => payment.phaseId === phaseId
      );
      if (paymentsForPhase.length > 0) {
        paymentsForPhase.forEach(payment => {
          phasePayments.push({
            bidId: bid.id,
            bidTitle: bid.title || 'Unnamed Bid',
            subcontractorName: bid.subcontractorName || bid.contractorName || 'Unnamed',
            payment
          });
        });
      }
    }
    if (bid.phaseId === phaseId) {
      const hasMatchingPaymentInSchedule = Array.isArray(bid.paymentSchedule) &&
                                            bid.paymentSchedule.some(payment => payment.phaseId === phaseId);
      if (!hasMatchingPaymentInSchedule) {
        phasePayments.push({
          bidId: bid.id,
          bidTitle: bid.title || 'Unnamed Bid',
          subcontractorName: bid.subcontractorName || bid.contractorName || 'Unnamed',
          payment: {
            id: `synthetic-${bid.id}`,
            name: 'Full Payment',
            amount: bid.totalAmount,
            percentage: 100,
            phaseId: bid.phaseId
          }
        });
      }
    }
  });

  return phasePayments;
};

/**
 * Retrieves all full Bid objects associated with a specific phase ID.
 */
export const getPhaseBids = (
  phaseId: string,
  bids: Bid[] // Pass bids as argument
): Bid[] => {
  // Get unique bids from the payments list
  const phasePayments = getPhasePayments(phaseId, bids); // Pass bids down
  const bidIds = new Set(phasePayments.map(item => item.bidId));
  return bids.filter(bid => bidIds.has(bid.id));
};

/**
 * Retrieves all Expense objects associated with a specific phase ID.
 */
export const getPhaseExpenses = (
  phaseId: string,
  expenses: Expense[] // Pass expenses as argument
): Expense[] => {
  return expenses.filter(expense => expense.phaseId === phaseId);
};

// Removed getPhaseStatusIcon function definition
/*
export const getPhaseStatusIcon = (status: string): React.ReactElement => {
  switch (status?.toLowerCase()) { // Added safety check for status
    case 'completed':
      return <DoneIcon />;
    case 'in_progress':
      return <PendingIcon />; // Assuming PendingIcon is suitable, adjust if needed
    case 'not_started':
      return <PendingIcon />;
    case 'planning': // Added planning case
        return <PendingIcon />; // Or a different icon like Schedule?
    case 'on_hold': // Added on_hold case
        return <PendingIcon />; // Or a different icon?
    case 'delayed': // Added delayed case
        return <PendingIcon />; // Or a different icon?
    default:
      return <InfoIcon />;
  }
};
*/
