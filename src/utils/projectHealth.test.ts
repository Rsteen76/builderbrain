import { calculateProjectHealth } from './projectHealth';

const now = new Date(2026, 10, 20, 15, 30);
const day = (offset: number) => new Date(2026, 10, 20 + offset, 9, 0);

type Input = Parameters<typeof calculateProjectHealth>[0];
const health = (overrides: Partial<Input>) =>
  calculateProjectHealth({ spent: 0, budget: 100000, status: 'active', phases: [], now, ...overrides });

const phase = (status: string, endOffset?: number) => ({
  status,
  endDate: endOffset === undefined ? undefined : day(endOffset),
});

describe('calculateProjectHealth', () => {
  it('reads the seeded Hillside project (one phase finished, one ended) as on track', () => {
    expect(
      health({
        spent: 85800,
        budget: 850000,
        phases: [phase('completed', -22), phase('in_progress', 14), phase('planning', 58), phase('planning', 106), phase('planning', 190)],
      })
    ).toBe('on_track');
  });

  it('reads the seeded kitchen project (no phase has ended yet) as on track', () => {
    expect(health({ status: 'planning', phases: [phase('in_progress', 4), phase('planning', 14), phase('planning', 45)] })).toBe('on_track');
  });

  it('reads the seeded completed tenant project as on track', () => {
    expect(
      health({ status: 'completed', phases: [phase('completed', -145), phase('completed', -40), phase('completed', -20)] })
    ).toBe('on_track');
  });

  it('is behind schedule when a phase ended yesterday and is not complete', () => {
    expect(health({ phases: [phase('in_progress', -1), phase('planning', 30)] })).toBe('behind_schedule');
  });

  it('is on track when the phase ends tomorrow, or today', () => {
    expect(health({ phases: [phase('in_progress', 1)] })).toBe('on_track');
    expect(health({ phases: [phase('in_progress', 0)] })).toBe('on_track');
  });

  it('counts completed phases against ended phases, not by name', () => {
    // Two ended, one of them complete: behind. A later phase finished early covers the gap.
    expect(health({ phases: [phase('completed', -10), phase('in_progress', -2)] })).toBe('behind_schedule');
    expect(health({ phases: [phase('completed', -10), phase('in_progress', -2), phase('completed', 30)] })).toBe('on_track');
  });

  it('ignores phases with no end date', () => {
    expect(health({ phases: [phase('in_progress'), phase('planning')] })).toBe('on_track');
    expect(health({ phases: [{ status: 'in_progress', endDate: null }] })).toBe('on_track');
  });

  it('reads Firestore-style timestamps', () => {
    const stamp = { toDate: () => day(-3) };
    expect(health({ phases: [{ status: 'in_progress', endDate: stamp }] })).toBe('behind_schedule');
  });

  it('gives a project with no phases no schedule verdict: budget only', () => {
    expect(health({ phases: [] })).toBe('on_track');
    expect(health({ phases: [], spent: 100001 })).toBe('over_budget');
  });

  it.each(['on_hold', 'cancelled', 'completed'])('gives a %s project no schedule verdict', (status) => {
    expect(health({ status, phases: [phase('in_progress', -30)] })).toBe('on_track');
  });

  it('is over budget as soon as spent exceeds the budget, and not at exactly the budget', () => {
    expect(health({ spent: 100001 })).toBe('over_budget');
    expect(health({ spent: 100000 })).toBe('on_track');
  });

  it('puts over budget ahead of behind schedule, and over budget applies to an on-hold project', () => {
    expect(health({ spent: 150000, phases: [phase('planning', -5)] })).toBe('over_budget');
    expect(health({ spent: 150000, status: 'on_hold' })).toBe('over_budget');
  });

  it('never calls a project with no budget over budget', () => {
    expect(health({ budget: 0, spent: 500 })).toBe('on_track');
  });
});
