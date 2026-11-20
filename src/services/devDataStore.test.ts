import { getDevProjectById } from './devDataStore';
import { clearDevDataMemoryState } from './devDataStore/storage';

describe('seeded dev data', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearDevDataMemoryState();
  });

  it('counts only paid and approved expenses as spent', () => {
    const kitchen = getDevProjectById('proj-kitchen');
    const budget = kitchen?.budget as { total: number; spent: number; remaining: number };

    // The kitchen seed has 12,900 paid, 6,200 approved and 15,000 pending.
    expect(budget.spent).toBe(19100);
    expect(budget.remaining).toBe(145000 - 19100);
  });

  it('keeps the Hillside seed at $85,800 spent of $850,000', () => {
    const hillside = getDevProjectById('proj-hillside');
    const budget = hillside?.budget as { total: number; spent: number; remaining: number };

    expect(budget).toMatchObject({ total: 850000, spent: 85800, remaining: 764200 });
  });
});
