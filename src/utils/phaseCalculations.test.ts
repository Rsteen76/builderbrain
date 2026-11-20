import {
  calculatePhaseCommittedCosts,
  calculatePhaseProposedCosts,
  calculateProjectProgress,
  countCompletedPhases,
} from './phaseCalculations';
import { Bid, ProjectPhase } from '../types';

const phases: ProjectPhase[] = [
  {
    id: 'phase-foundation',
    name: 'Foundation',
    status: 'in_progress',
    progress: 25,
    budget: 10000,
  } as ProjectPhase,
  {
    id: 'phase-framing',
    name: 'Framing',
    status: 'not_started',
    progress: 0,
    budget: 20000,
  } as ProjectPhase,
];

const makeBid = (overrides: Partial<Bid>): Bid => ({
  id: overrides.id || 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  title: 'Test Bid',
  status: 'submitted',
  totalAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('phase cost calculations', () => {
  it('rolls linked bid totals into proposed phase costs', () => {
    const bids = [
      makeBid({ id: 'bid-1', phaseId: 'phase-foundation', status: 'submitted', totalAmount: 12000 }),
      makeBid({ id: 'bid-2', phaseId: 'phase-foundation', status: 'accepted', totalAmount: 8000 }),
      makeBid({ id: 'bid-3', phaseId: 'phase-foundation', status: 'rejected', totalAmount: 5000 }),
    ];

    expect(calculatePhaseProposedCosts(phases, bids)).toEqual({
      'phase-foundation': 20000,
      'phase-framing': 0,
    });
  });

  it('allocates scheduled bid payments to phases when the bid itself is not phase-linked', () => {
    const bids = [
      makeBid({
        id: 'bid-1',
        status: 'accepted',
        totalAmount: 15000,
        paymentSchedule: [
          {
            id: 'stage-1',
            name: 'Foundation draw',
            percentage: 40,
            amount: 6000,
            phaseId: 'phase-foundation',
            status: 'pending',
          },
          {
            id: 'stage-2',
            name: 'Framing draw',
            percentage: 60,
            amount: 9000,
            phaseId: 'phase-framing',
            status: 'pending',
          },
        ],
      }),
    ];

    expect(calculatePhaseProposedCosts(phases, bids)).toEqual({
      'phase-foundation': 6000,
      'phase-framing': 9000,
    });
  });

  it('separates committed accepted costs from submitted proposed costs', () => {
    const bids = [
      makeBid({ id: 'bid-1', phaseId: 'phase-foundation', status: 'submitted', totalAmount: 12000 }),
      makeBid({ id: 'bid-2', phaseId: 'phase-foundation', status: 'accepted', totalAmount: 8000 }),
    ];

    expect(calculatePhaseCommittedCosts(phases, bids)).toEqual({
      'phase-foundation': 8000,
      'phase-framing': 0,
    });
  });
});

describe('project progress', () => {
  const statuses = (...list: string[]) => list.map((status) => ({ status }));

  it('counts completed phases out of all phases', () => {
    const list = statuses('completed', 'in_progress', 'planning', 'planning', 'planning');

    expect(countCompletedPhases(list)).toEqual({ completed: 1, total: 5 });
    expect(calculateProjectProgress(list)).toBe(20);
  });

  it('is 100 when every phase is completed and 0 with no phases', () => {
    expect(calculateProjectProgress(statuses('completed', 'completed', 'completed'))).toBe(100);
    expect(calculateProjectProgress([])).toBe(0);
    expect(countCompletedPhases([])).toEqual({ completed: 0, total: 0 });
  });
});
