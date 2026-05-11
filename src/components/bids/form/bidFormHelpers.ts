import { v4 as uuidv4 } from 'uuid';
import { PHASE_BID_TITLES } from '../../../data/bidFormConstants';
import { BidFormData, BidPaymentTermsFormData } from '../../../types/form.types';
import { ProjectPhase } from '../../../types';

type IdFactory = () => string;

interface DefaultBidFormOptions {
  phases?: ProjectPhase[];
  projectId?: string;
  projectName?: string;
  createId?: IdFactory;
}

export const createDefaultBidForm = ({
  phases,
  projectId,
  projectName,
  createId = uuidv4,
}: DefaultBidFormOptions): BidFormData => {
  const defaultPhase = phases && phases.length > 0 ? phases[0] : undefined;

  return {
    title: '',
    subcontractorId: '',
    subcontractorName: '',
    totalAmount: 0,
    phaseId: defaultPhase?.id || '',
    phaseName: defaultPhase?.name || '',
    scope: '',
    timeline: 30,
    paymentTerms: {
      downPaymentPercent: 20,
      isDownPaymentFixed: false,
      downPaymentAmount: 0,
      installments: [
        {
          id: createId(),
          name: 'Final Payment',
          percent: 80,
          isFixedAmount: false,
          fixedAmount: 0,
          milestoneDescription: 'Upon completion of work',
          phaseId: defaultPhase?.id || '',
          phaseName: defaultPhase?.name || '',
          manuallyConfigured: false,
        }
      ],
      syncInstallmentPhases: true,
    },
    notes: '',
    status: 'draft',
    attachments: [],
    tags: [],
    projectId,
    projectName,
    submissionDeadline: null,
  };
};

export const normalizeInitialPaymentTerms = (
  initialPaymentTerms: BidFormData['paymentTerms'] | undefined,
  defaultPaymentTerms: BidPaymentTermsFormData,
  createId: IdFactory = uuidv4,
): BidPaymentTermsFormData => {
  if (!initialPaymentTerms) {
    return defaultPaymentTerms;
  }

  return {
    ...defaultPaymentTerms,
    ...initialPaymentTerms,
    installments: Array.isArray(initialPaymentTerms.installments)
      ? initialPaymentTerms.installments.map(inst => ({
          id: inst.id || createId(),
          name: inst.name || '',
          percent: inst.percent || 0,
          isFixedAmount: inst.isFixedAmount || false,
          fixedAmount: inst.fixedAmount || 0,
          milestoneDescription: inst.milestoneDescription || '',
          phaseId: inst.phaseId || '',
          phaseName: inst.phaseName || '',
          manuallyConfigured: inst.manuallyConfigured || false,
        }))
      : defaultPaymentTerms.installments,
  };
};

export const createDefaultHookPaymentTerms = (
  phase?: ProjectPhase,
  createId: IdFactory = uuidv4,
): BidPaymentTermsFormData => ({
  downPaymentPercent: 20,
  isDownPaymentFixed: false,
  downPaymentAmount: 0,
  installments: [{
    id: createId(),
    name: 'Final Payment',
    percent: 80,
    isFixedAmount: false,
    fixedAmount: 0,
    milestoneDescription: 'Upon completion',
    phaseId: phase?.id,
    phaseName: phase?.name,
    manuallyConfigured: false,
  }],
  syncInstallmentPhases: true,
});

export const validateBidForm = (
  bidForm: BidFormData,
  hasContextProjectId: boolean,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!bidForm.title) errors.title = 'Title is required';
  if (!bidForm.subcontractorName) errors.subcontractorName = 'Subcontractor is required';
  if (!bidForm.totalAmount || bidForm.totalAmount <= 0) errors.totalAmount = 'A valid amount is required';
  if (!hasContextProjectId && !bidForm.projectId) errors.projectId = 'Project ID is required';

  return errors;
};

export const getBidTitleOptions = (phaseId: string | undefined, phases: ProjectPhase[]): string[] => {
  const applicableKeys: string[] = ['common'];

  if (phaseId && phases.length > 0) {
    const phase = phases.find(p => p.id === phaseId);

    if (phase) {
      const phaseNameLower = phase.name.toLowerCase();

      if (phaseNameLower.includes('site') || phaseNameLower.includes('excav') || phaseNameLower.includes('demo')) {
        applicableKeys.push('site_work');
      }
      if (phaseNameLower.includes('foundation') || phaseNameLower.includes('concrete') || phaseNameLower.includes('footings') || phaseNameLower.includes('footing')) {
        applicableKeys.push('foundation');
      }
      if (phaseNameLower.includes('frame') || phaseNameLower.includes('struct')) {
        applicableKeys.push('framing');
      }
      if (phaseNameLower.includes('rough') || phaseNameLower.includes('plumb') || phaseNameLower.includes('electr') || phaseNameLower.includes('hvac')) {
        applicableKeys.push('rough_ins');
      }
      if (phaseNameLower.includes('exterior') || phaseNameLower.includes('roof') || phaseNameLower.includes('siding')) {
        applicableKeys.push('exterior');
      }
      if (phaseNameLower.includes('interior') || phaseNameLower.includes('drywall') || phaseNameLower.includes('paint') || phaseNameLower.includes('insulat')) {
        applicableKeys.push('interior');
      }
      if (phaseNameLower.includes('finish') || phaseNameLower.includes('cabinet') || phaseNameLower.includes('counter')) {
        applicableKeys.push('finishes');
      }
      if (phaseNameLower.includes('pool') || phaseNameLower.includes('special') || phaseNameLower.includes('custom')) {
        applicableKeys.push('specialty');
      }
    }
  }

  const combinedTitles = new Set<string>();
  Array.from(new Set(applicableKeys)).forEach(key => {
    const titles = PHASE_BID_TITLES[key] || [];
    titles.forEach(title => combinedTitles.add(title));
  });

  return Array.from(combinedTitles).sort();
};
