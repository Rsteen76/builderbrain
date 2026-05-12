import {
  buildTemplateBudgetItems,
  buildTemplateMilestones,
  buildTemplatePhases,
  getDefaultBudgetForSize,
  getProjectWizardTemplate,
  PROJECT_WIZARD_TEMPLATES,
} from './projectWizardTemplates';

describe('projectWizardTemplates', () => {
  it('provides builder-grade templates for the visible project type menu', () => {
    expect(Object.keys(PROJECT_WIZARD_TEMPLATES)).toEqual(
      expect.arrayContaining([
        'residential',
        'commercial',
        'renovation',
        'kitchen-remodel',
        'landscaping',
        'custom',
      ])
    );

    expect(PROJECT_WIZARD_TEMPLATES.residential.phases).toHaveLength(10);
    expect(PROJECT_WIZARD_TEMPLATES['kitchen-remodel'].phases.map(phase => phase.name)).toEqual([
      'Design, Selections & Procurement',
      'Demolition & Protection',
      'Rough Framing & MEP',
      'Drywall, Paint & Finish Prep',
      'Cabinetry, Counters & Finish Install',
      'Punch & Closeout',
    ]);
  });

  it('keeps each template phase budget allocation balanced to 100 percent', () => {
    Object.values(PROJECT_WIZARD_TEMPLATES).forEach((template) => {
      const total = template.phases.reduce((sum, phase) => sum + phase.budgetPercentage, 0);
      expect(total).toBe(100);
    });
  });

  it('builds editable phases, milestones, and phase budget items from a template', () => {
    const template = getProjectWizardTemplate('residential');
    const phases = buildTemplatePhases(
      template,
      new Date('2026-01-01T00:00:00'),
      new Date('2026-11-01T00:00:00'),
      800000
    );

    expect(phases[0]).toMatchObject({
      name: 'Pre-Construction & Permits',
      budget: 40000,
      status: 'not_started',
    });
    expect(phases[0].tasks.length).toBeGreaterThan(0);

    const milestones = buildTemplateMilestones(template, phases);
    expect(milestones.map(milestone => milestone.title)).toContain('Dry-in complete');

    const budgetItems = buildTemplateBudgetItems(phases);
    expect(budgetItems[0]).toMatchObject({
      category: 'Phase Budget',
      description: 'Pre-Construction & Permits',
      estimatedCost: 40000,
    });
  });

  it('maps project size choices to reasonable default budgets', () => {
    expect(getDefaultBudgetForSize('Small (Under $50,000)')).toBe(45000);
    expect(getDefaultBudgetForSize('Medium ($50,000 - $250,000)')).toBe(150000);
    expect(getDefaultBudgetForSize('Large ($250,000 - $1,000,000)')).toBe(650000);
    expect(getDefaultBudgetForSize('Major (Over $1,000,000)')).toBe(1500000);
  });
});

