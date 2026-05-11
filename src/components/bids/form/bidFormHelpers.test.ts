import { ProjectPhase } from '../../../types';
import { BidFormData } from '../../../types/form.types';
import {
  createDefaultBidForm,
  createDefaultHookPaymentTerms,
  getBidTitleOptions,
  normalizeInitialPaymentTerms,
  validateBidForm,
} from './bidFormHelpers';

const phase = (overrides: Partial<ProjectPhase> = {}): ProjectPhase => ({
  id: 'phase-1',
  name: 'Foundation and Concrete',
  status: 'not_started',
  progress: 0,
  budget: 0,
  actualCost: 0,
  ...overrides,
});

describe('bidFormHelpers', () => {
  test('creates the default bid form with project and first phase context', () => {
    const form = createDefaultBidForm({
      phases: [phase()],
      projectId: 'project-1',
      projectName: 'Kitchen Remodel',
      createId: () => 'installment-1',
    });

    expect(form).toMatchObject({
      projectId: 'project-1',
      projectName: 'Kitchen Remodel',
      phaseId: 'phase-1',
      phaseName: 'Foundation and Concrete',
      status: 'draft',
      timeline: 30,
      paymentTerms: {
        downPaymentPercent: 20,
        syncInstallmentPhases: true,
        installments: [
          expect.objectContaining({
            id: 'installment-1',
            name: 'Final Payment',
            percent: 80,
            milestoneDescription: 'Upon completion of work',
          }),
        ],
      },
    });
  });

  test('normalizes initial payment terms while preserving fallback installments', () => {
    const fallback = createDefaultHookPaymentTerms(phase(), () => 'fallback-id');

    expect(normalizeInitialPaymentTerms(undefined, fallback)).toBe(fallback);

    const normalized = normalizeInitialPaymentTerms(
      {
        ...fallback,
        installments: [
          {
            id: '',
            name: '',
            percent: undefined as unknown as number,
            isFixedAmount: undefined as unknown as boolean,
            fixedAmount: undefined as unknown as number,
            milestoneDescription: '',
            phaseId: undefined,
            phaseName: undefined,
            manuallyConfigured: undefined,
          },
        ],
      },
      fallback,
      () => 'created-id',
    );

    expect(normalized.installments[0]).toEqual({
      id: 'created-id',
      name: '',
      percent: 0,
      isFixedAmount: false,
      fixedAmount: 0,
      milestoneDescription: '',
      phaseId: '',
      phaseName: '',
      manuallyConfigured: false,
    });
  });

  test('validates required bid fields and standalone project selection', () => {
    const emptyForm = {
      ...createDefaultBidForm({ createId: () => 'installment-1' }),
      totalAmount: 0,
    };

    expect(validateBidForm(emptyForm, false)).toEqual({
      title: 'Title is required',
      subcontractorName: 'Subcontractor is required',
      totalAmount: 'A valid amount is required',
      projectId: 'Project ID is required',
    });

    const validForm: BidFormData = {
      ...emptyForm,
      title: 'Concrete Foundation',
      subcontractorName: 'Acme Concrete',
      totalAmount: 1000,
    };

    expect(validateBidForm(validForm, true)).toEqual({});
  });

  test('builds sorted bid title options from every matching phase keyword', () => {
    const options = getBidTitleOptions('phase-1', [
      phase({ name: 'Foundation Concrete Footings' }),
    ]);

    expect(options).toContain('General Contracting Services');
    expect(options).toContain('Concrete Foundation');
    expect(options).toEqual([...options].sort());
  });
});
