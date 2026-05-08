import {
  createResidentialPhases,
  getPhaseDescription,
  getResidentialProjectEndDate,
  normalizePhaseAllocations,
  STANDARD_RESIDENTIAL_PHASE_ALLOCATIONS,
} from './residential';

describe('residential project helpers', () => {
  test('standard allocations already sum to the full project budget', () => {
    const allocations = normalizePhaseAllocations(STANDARD_RESIDENTIAL_PHASE_ALLOCATIONS);
    const total = allocations.reduce((sum, phase) => sum + phase.percentage, 0);

    expect(total).toBeCloseTo(1);
    expect(allocations).toEqual(STANDARD_RESIDENTIAL_PHASE_ALLOCATIONS);
    expect(allocations).not.toBe(STANDARD_RESIDENTIAL_PHASE_ALLOCATIONS);
  });

  test('normalizePhaseAllocations scales non-total percentages to 100%', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const allocations = normalizePhaseAllocations([
      { name: 'A', percentage: 2 },
      { name: 'B', percentage: 1 },
    ]);

    expect(allocations).toEqual([
      { name: 'A', percentage: 2 / 3 },
      { name: 'B', percentage: 1 / 3 },
    ]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  test('getResidentialProjectEndDate keeps provided end dates and defaults to 270 days', () => {
    const startDate = new Date('2024-01-01T00:00:00.000Z');
    const providedEndDate = new Date('2024-05-01T00:00:00.000Z');
    const defaultEndDate = new Date(startDate);
    defaultEndDate.setDate(defaultEndDate.getDate() + 270);

    expect(getResidentialProjectEndDate(startDate, providedEndDate)).toBe(providedEndDate);
    expect(getResidentialProjectEndDate(startDate)).toEqual(defaultEndDate);
  });

  test('createResidentialPhases builds standard phase schedule, budget, and tasks', () => {
    const phases = createResidentialPhases(
      'user-1',
      'project-1',
      new Date('2024-01-01T00:00:00.000Z'),
      new Date('2024-04-10T00:00:00.000Z'),
      100000
    );

    expect(phases).toHaveLength(10);
    expect(phases[0]).toMatchObject({
      projectId: 'project-1',
      name: 'Pre-Construction',
      description: getPhaseDescription('Pre-Construction'),
      budget: 5000,
      status: 'not_started',
      progress: 0,
      actualCost: 0,
    });
    expect(phases[0].startDate).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(phases[0].endDate).toEqual(new Date('2024-01-11T00:00:00.000Z'));
    expect(phases[0].tasks?.map(task => task.title)).toEqual([
      'Create Pre-Construction plan',
      'Assign Pre-Construction tasks',
      'Track Pre-Construction progress',
      'Obtain building permits',
      'Finalize architectural plans',
      'Conduct site survey',
    ]);
  });
});
