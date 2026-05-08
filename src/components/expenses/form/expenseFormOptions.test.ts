import { formatCategoryName, getExpenseDescriptionOptions } from './expenseFormOptions';

describe('expense form options', () => {
  test('formats category labels without changing stored values', () => {
    expect(formatCategoryName('materials')).toBe('Materials');
    expect(formatCategoryName('subcontractor')).toBe('Subcontractor');
  });

  test('returns sorted common descriptions when no phase matches', () => {
    const options = getExpenseDescriptionOptions(undefined, []);

    expect(options).toEqual([...options].sort());
    expect(options).toContain('Project Management Fee');
    expect(options).not.toContain('Concrete Material');
  });

  test('adds targeted phase descriptions for matching phases', () => {
    const options = getExpenseDescriptionOptions('phase-1', [
      {
        id: 'phase-1',
        name: 'Foundation and Concrete',
        status: 'not_started',
        progress: 0,
        budget: 0,
        actualCost: 0,
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T00:00:00.000Z'),
      },
    ]);

    expect(options).toContain('Project Management Fee');
    expect(options).toContain('Concrete Material');
    expect(options).toEqual([...options].sort());
  });
});
