import { ProjectPhase } from '../../../types';
import { BidPaymentTermsFormData } from '../../../types/form.types';
import { buildPaymentScheduleSummary, buildPaymentTemplateTerms } from './paymentTermsHelpers';

const phase = (overrides: Partial<ProjectPhase> = {}): ProjectPhase => ({
  id: 'phase-1',
  name: 'Rough-In',
  status: 'not_started',
  progress: 0,
  budget: 0,
  actualCost: 0,
  ...overrides,
});

describe('paymentTermsHelpers', () => {
  test('builds standard and one-time payment template terms', () => {
    expect(buildPaymentTemplateTerms({
      template: 'one-time',
      totalAmount: 1000,
      useFixedAmounts: false,
      syncInstallmentPhases: true,
      defaultPhase: phase(),
      createId: () => 'unused',
    })).toMatchObject({
      downPaymentPercent: 100,
      downPaymentAmount: 1000,
      installments: [],
      syncInstallmentPhases: true,
    });

    const standard = buildPaymentTemplateTerms({
      template: 'standard',
      totalAmount: 1000,
      useFixedAmounts: true,
      syncInstallmentPhases: false,
      defaultPhase: phase(),
      createId: () => 'standard-id',
    });

    expect(standard).toMatchObject({
      downPaymentPercent: 50,
      downPaymentAmount: 500,
      isDownPaymentFixed: true,
      syncInstallmentPhases: false,
      installments: [
        {
          id: 'standard-id',
          name: 'Final Payment',
          percent: 50,
          fixedAmount: 500,
          isFixedAmount: true,
          phaseId: 'phase-1',
          phaseName: 'Rough-In',
        },
      ],
    });
  });

  test('builds trades template with existing labels and percentages', () => {
    let nextId = 0;
    const terms = buildPaymentTemplateTerms({
      template: 'trades',
      totalAmount: 2000,
      useFixedAmounts: false,
      syncInstallmentPhases: true,
      defaultPhase: phase(),
      createId: () => `id-${nextId++}`,
    });

    expect(terms.downPaymentPercent).toBe(30);
    expect(terms.downPaymentAmount).toBe(600);
    expect(terms.installments).toEqual([
      expect.objectContaining({
        id: 'id-0',
        name: 'Rough-In',
        percent: 40,
        fixedAmount: 800,
        milestoneDescription: 'After rough-in inspection',
      }),
      expect.objectContaining({
        id: 'id-1',
        name: 'Final/Top-Out',
        percent: 30,
        fixedAmount: 600,
        milestoneDescription: 'After final inspection',
      }),
    ]);
  });

  test('summarizes complete and incomplete payment schedules', () => {
    const completeTerms: BidPaymentTermsFormData = {
      downPaymentPercent: 20,
      isDownPaymentFixed: false,
      downPaymentAmount: 200,
      syncInstallmentPhases: true,
      installments: [
        {
          id: 'final',
          name: 'Final Payment',
          percent: 80,
          isFixedAmount: false,
          fixedAmount: 800,
          milestoneDescription: 'Upon completion',
        },
      ],
    };

    expect(buildPaymentScheduleSummary(completeTerms, 1000, 100, 1000)).toMatchObject({
      exactlyOneHundred: true,
      matchesTotalBid: true,
      downPaymentAmount: 200,
      finalPaymentAmount: 800,
      finalPaymentPercent: 80,
      remainingPercent: 80,
      suggestedFinalAmount: 800,
    });

    const incomplete = buildPaymentScheduleSummary({
      ...completeTerms,
      installments: [
        { ...completeTerms.installments[0], percent: 60, fixedAmount: 600 },
      ],
    }, 1000, 80, 800);

    expect(incomplete).toMatchObject({
      exactlyOneHundred: false,
      matchesTotalBid: false,
      finalPaymentPercent: 60,
      remainingPercent: 80,
      suggestedFinalAmount: 800,
    });
  });
});
