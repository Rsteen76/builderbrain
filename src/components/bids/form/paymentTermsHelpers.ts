import { v4 as uuidv4 } from 'uuid';
import { BidPaymentInstallmentFormData, BidPaymentTermsFormData } from '../../../types/form.types';
import { ProjectPhase } from '../../../types';

export type PaymentTemplate = 'one-time' | 'standard' | 'trades' | 'custom';

type IdFactory = () => string;

interface PaymentTemplateOptions {
  template: Exclude<PaymentTemplate, 'custom'>;
  totalAmount: number;
  useFixedAmounts: boolean;
  syncInstallmentPhases: boolean;
  defaultPhase: ProjectPhase | null;
  createId?: IdFactory;
}

export const buildPaymentTemplateTerms = ({
  template,
  totalAmount,
  useFixedAmounts,
  syncInstallmentPhases,
  defaultPhase,
  createId = uuidv4,
}: PaymentTemplateOptions): BidPaymentTermsFormData => {
  switch (template) {
    case 'one-time':
      return {
        downPaymentPercent: 100,
        isDownPaymentFixed: useFixedAmounts,
        downPaymentAmount: totalAmount,
        installments: [],
        syncInstallmentPhases,
      };
    case 'standard':
      return {
        downPaymentPercent: 50,
        isDownPaymentFixed: useFixedAmounts,
        downPaymentAmount: totalAmount * 0.5,
        installments: [
          {
            id: createId(),
            name: 'Final Payment',
            percent: 50,
            isFixedAmount: useFixedAmounts,
            fixedAmount: totalAmount * 0.5,
            milestoneDescription: 'Upon completion',
            phaseId: defaultPhase?.id,
            phaseName: defaultPhase?.name,
            manuallyConfigured: false,
          }
        ],
        syncInstallmentPhases,
      };
    case 'trades': {
      const downPercent = parseFloat((30).toFixed(1));
      const roughInPercent = parseFloat((40).toFixed(1));
      const finalPercent = parseFloat((30).toFixed(1));

      return {
        downPaymentPercent: downPercent,
        isDownPaymentFixed: useFixedAmounts,
        downPaymentAmount: totalAmount * (downPercent / 100),
        installments: [
          {
            id: createId(),
            name: 'Rough-In',
            percent: roughInPercent,
            isFixedAmount: useFixedAmounts,
            fixedAmount: totalAmount * (roughInPercent / 100),
            milestoneDescription: 'After rough-in inspection',
            phaseId: defaultPhase?.id,
            phaseName: defaultPhase?.name,
            manuallyConfigured: false,
          },
          {
            id: createId(),
            name: 'Final/Top-Out',
            percent: finalPercent,
            isFixedAmount: useFixedAmounts,
            fixedAmount: totalAmount * (finalPercent / 100),
            milestoneDescription: 'After final inspection',
            phaseId: defaultPhase?.id,
            phaseName: defaultPhase?.name,
            manuallyConfigured: false,
          }
        ],
        syncInstallmentPhases,
      };
    }
  }
};

export interface PaymentScheduleSummary {
  exactlyOneHundred: boolean;
  matchesTotalBid: boolean;
  downPaymentPercent: number;
  downPaymentAmount: number;
  intermediateInstallments: BidPaymentInstallmentFormData[];
  intermediateAmount: number;
  intermediatePercent: number;
  hasFinalPayment: boolean;
  finalPayment: BidPaymentInstallmentFormData | null;
  finalPaymentAmount: number;
  finalPaymentPercent: number;
  remainingPercent: number;
  suggestedFinalAmount: number;
}

export const buildPaymentScheduleSummary = (
  paymentTerms: BidPaymentTermsFormData,
  totalAmount: number,
  totalScheduledPercent: number,
  totalScheduledAmount: number,
): PaymentScheduleSummary => {
  const exactlyOneHundred = Math.abs(totalScheduledPercent - 100) < 0.01;
  const matchesTotalBid = Math.abs(totalScheduledAmount - totalAmount) < 0.01;
  const downPaymentPercent = paymentTerms.downPaymentPercent;
  const downPaymentAmount = paymentTerms.isDownPaymentFixed
    ? paymentTerms.downPaymentAmount
    : totalAmount * (downPaymentPercent / 100);
  const hasFinalPayment = paymentTerms.installments.length > 0;
  const finalPayment = hasFinalPayment ? paymentTerms.installments[paymentTerms.installments.length - 1] : null;
  const finalPaymentAmount = finalPayment
    ? (finalPayment.isFixedAmount ? finalPayment.fixedAmount : totalAmount * (finalPayment.percent / 100))
    : 0;
  const finalPaymentPercent = finalPayment ? finalPayment.percent : 0;
  const intermediateInstallments = paymentTerms.installments.slice(0, -1);
  const intermediateAmount = intermediateInstallments.reduce(
    (sum, inst) => sum + (inst.isFixedAmount ? inst.fixedAmount : totalAmount * (inst.percent / 100)),
    0,
  );
  const intermediatePercent = intermediateInstallments.reduce((sum, inst) => sum + inst.percent, 0);
  const remainingPercent = 100 - (downPaymentPercent + intermediatePercent);
  const suggestedFinalAmount = totalAmount * (remainingPercent / 100);

  return {
    exactlyOneHundred,
    matchesTotalBid,
    downPaymentPercent,
    downPaymentAmount,
    intermediateInstallments,
    intermediateAmount,
    intermediatePercent,
    hasFinalPayment,
    finalPayment,
    finalPaymentAmount,
    finalPaymentPercent,
    remainingPercent,
    suggestedFinalAmount,
  };
};
