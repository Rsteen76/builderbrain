import type { ExpenseCategory, ProjectPhase } from '../../../types';
import { PHASE_EXPENSE_DESCRIPTIONS } from '../../../data/expenseFormConstants';

export const availableExpenseCategories: ExpenseCategory[] = [
  'subcontractor',
  'labor',
  'materials',
  'equipment',
  'permits',
  'other',
];

export const formatCategoryName = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const getDescriptionCategoryKeyForPhaseName = (phaseName: string): string | null => {
  const phaseNameLower = phaseName.toLowerCase();

  if (
    phaseNameLower.includes('site work') ||
    phaseNameLower.includes('excavation') ||
    phaseNameLower.includes('demolition') ||
    phaseNameLower.includes('clearing')
  ) {
    return 'site_work';
  }

  if (
    phaseNameLower.includes('foundation') ||
    phaseNameLower.includes('concrete') ||
    phaseNameLower.includes('footings')
  ) {
    return 'foundation';
  }

  if (
    phaseNameLower.includes('framing') ||
    phaseNameLower.includes('structural') ||
    (phaseNameLower.includes('frame') && !phaseNameLower.includes('window'))
  ) {
    return 'framing';
  }

  if (
    phaseNameLower.includes('rough') ||
    phaseNameLower.includes('mech') ||
    phaseNameLower.includes('electrical rough') ||
    phaseNameLower.includes('plumbing rough')
  ) {
    return 'rough_ins';
  }

  if (
    phaseNameLower.includes('exterior') ||
    phaseNameLower.includes('siding') ||
    phaseNameLower.includes('roofing')
  ) {
    return 'exterior';
  }

  if (phaseNameLower.includes('interior') && !phaseNameLower.includes('finish')) {
    return 'interior';
  }

  if (
    phaseNameLower.includes('finish') ||
    phaseNameLower.includes('paint') ||
    phaseNameLower.includes('flooring') ||
    phaseNameLower.includes('trim')
  ) {
    return 'finishes';
  }

  if (
    phaseNameLower.includes('special') ||
    phaseNameLower.includes('pool') ||
    phaseNameLower.includes('theater') ||
    phaseNameLower.includes('automation')
  ) {
    return 'specialty';
  }

  if (phaseNameLower.includes('renovat') || phaseNameLower.includes('remodel')) {
    return 'renovation';
  }

  if (phaseNameLower.includes('maint') || phaseNameLower.includes('repair')) {
    return 'maintenance';
  }

  return null;
};

export const getExpenseDescriptionOptions = (
  phaseId: string | undefined,
  phases: ProjectPhase[]
): string[] => {
  const applicableKeys = ['common'];

  if (phaseId && phases.length > 0) {
    const phase = phases.find(p => p.id === phaseId);
    const categoryKey = phase ? getDescriptionCategoryKeyForPhaseName(phase.name) : null;

    if (categoryKey) {
      applicableKeys.push(categoryKey);
    }
  }

  const seenDescriptions = new Map<string, string>();

  for (const key of applicableKeys) {
    const descriptions = PHASE_EXPENSE_DESCRIPTIONS[key] || [];

    for (const desc of descriptions) {
      const lowerDesc = desc.toLowerCase().trim();

      if (!seenDescriptions.has(lowerDesc)) {
        seenDescriptions.set(lowerDesc, desc);
      }
    }
  }

  return Array.from(seenDescriptions.values()).sort();
};
