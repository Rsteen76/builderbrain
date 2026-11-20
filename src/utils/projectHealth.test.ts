import { calculateProjectHealth } from './projectHealth';

// 100-day project so elapsed days read directly as percent of time.
const health = (overrides: Partial<Parameters<typeof calculateProjectHealth>[0]>) =>
  calculateProjectHealth({
    spent: 0,
    budget: 100000,
    progressPercent: 0,
    elapsedDays: 0,
    totalDays: 100,
    ...overrides,
  });

describe('calculateProjectHealth', () => {
  it('reads the seeded Hillside project (20% of phases, 17% of time, 10.1% of budget) as on track', () => {
    expect(
      calculateProjectHealth({
        spent: 85800,
        budget: 850000,
        progressPercent: 20,
        elapsedDays: 42,
        totalDays: 252,
      })
    ).toBe('on_track');
  });

  it('is over budget as soon as spent exceeds the budget, and not at exactly the budget', () => {
    expect(health({ spent: 100001 })).toBe('over_budget');
    expect(health({ spent: 100000 })).toBe('on_track');
  });

  it('puts over budget ahead of behind schedule', () => {
    expect(health({ spent: 150000, progressPercent: 0, elapsedDays: 90 })).toBe('over_budget');
  });

  it('is behind schedule when phases complete trail time elapsed by more than 10 points', () => {
    expect(health({ progressPercent: 20, elapsedDays: 31 })).toBe('behind_schedule');
  });

  it('is on track at a gap of exactly 10 points', () => {
    expect(health({ progressPercent: 20, elapsedDays: 30 })).toBe('on_track');
  });

  it('is on track when ahead of the clock', () => {
    expect(health({ progressPercent: 60, elapsedDays: 20 })).toBe('on_track');
  });

  it('does not depend on rounding: 30.4% of time against 20% is a 10.4 point gap', () => {
    expect(
      calculateProjectHealth({ spent: 0, budget: 1, progressPercent: 20, elapsedDays: 76, totalDays: 250 })
    ).toBe('behind_schedule');
  });

  it('is on track with no dates and never over budget with no budget set', () => {
    expect(health({ totalDays: 0 })).toBe('on_track');
    expect(health({ budget: 0, spent: 500 })).toBe('on_track');
  });

  it('is on track for a finished project whose time has run out', () => {
    expect(health({ progressPercent: 100, elapsedDays: 100 })).toBe('on_track');
  });
});
