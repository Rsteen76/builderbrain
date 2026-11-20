import { calculateBudgetData } from './projectMetrics';
import { Expense, Project } from '../types';

const makeProject = (budget: Project['budget']): Project => ({
  id: 'project-1',
  userId: 'user-1',
  name: 'Demo Project',
  description: '',
  status: 'active',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  budget,
  location: 'Boulder, CO',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  phases: [],
  progress: 0,
});

const expense = (amount: number): Expense => ({ amount } as Expense);

describe('calculateBudgetData', () => {
  it('reports $85,800 spent of $850,000 as 10.09 percent used, not 1,000', () => {
    const data = calculateBudgetData(makeProject(850000), [expense(47300), expense(38500)]);

    expect(data.totalBudget).toBe(850000);
    expect(data.totalActual).toBe(85800);
    expect(data.difference).toBe(764200);
    expect(data.percentUsed).toBeCloseTo(10.094, 3);
  });

  it('reads the total from an object budget', () => {
    const data = calculateBudgetData(
      makeProject({ total: 200000, spent: 0, remaining: 200000 }),
      [expense(50000)]
    );

    expect(data.totalBudget).toBe(200000);
    expect(data.percentUsed).toBe(25);
  });

  it('does not cap an over-budget project at 100 percent', () => {
    const data = calculateBudgetData(makeProject(850000), [expense(1020000)]);

    expect(data.difference).toBe(-170000);
    expect(data.percentUsed).toBeCloseTo(120, 5);
  });

  it('reports 0 percent when there is no budget or no project', () => {
    expect(calculateBudgetData(makeProject(0), [expense(100)]).percentUsed).toBe(0);
    expect(calculateBudgetData(null, []).percentUsed).toBe(0);
  });
});
