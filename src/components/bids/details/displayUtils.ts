import { v4 as uuidv4 } from 'uuid';
import { Bid, BidVersion } from '../../../types';
import { BidFormData } from '../../../types/form.types';

export const STATUS_COLORS: Record<Bid['status'], string> = {
  draft: 'default',
  submitted: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
};

export const PRIORITY_COLORS: Record<NonNullable<Bid['priority']>, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

export const STATUS_DISPLAY: Record<Bid['status'], string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

export const PRIORITY_DISPLAY: Record<NonNullable<Bid['priority']>, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const formatDisplayDate = (dateValue: string | Date | null | undefined): string => {
  return dateValue &&
    (dateValue instanceof Date ||
      (typeof dateValue === 'string' && !isNaN(Date.parse(dateValue))))
    ? new Date(dateValue).toLocaleDateString()
    : 'N/A';
};

export const formatVersionDate = (dateValue: unknown): string => {
  if (!dateValue) return 'Unknown date';

  try {
    const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue));
    return date.toLocaleDateString();
  } catch (e) {
    return 'Invalid date';
  }
};

export const formatVersionTime = (dateValue: unknown): string => {
  if (!dateValue) return 'Unknown time';

  try {
    const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue));
    return date.toLocaleTimeString();
  } catch (e) {
    return 'Invalid time';
  }
};

export const sortVersionsByNumberDesc = (versions: BidVersion[]): BidVersion[] => {
  return [...versions].sort((a: BidVersion, b: BidVersion) =>
    typeof a.versionNumber === 'number' && typeof b.versionNumber === 'number'
      ? b.versionNumber - a.versionNumber
      : 0
  );
};

export const getAttachmentDisplay = (attachment: NonNullable<Bid['attachments']>[number]) => {
  const name =
    typeof attachment === 'string'
      ? attachment
      : attachment && typeof attachment === 'object' && 'name' in attachment
        ? attachment.name
        : 'Unnamed Attachment';
  const url =
    typeof attachment === 'string'
      ? attachment
      : attachment && typeof attachment === 'object' && 'url' in attachment
        ? attachment.url
        : '#';

  return { name: String(name), url };
};

export const getInitialBidFormData = (bid: Bid): Partial<BidFormData> => {
  const convertAttachments = (attachments: Bid['attachments']): string[] => {
    if (!attachments) return [];

    return attachments.map(att =>
      typeof att === 'string' ? att : (att?.url || 'invalid-attachment')
    );
  };

  return {
    title: bid.title || '',
    subcontractorId: bid.subcontractorId || '',
    subcontractorName: bid.subcontractorName || '',
    totalAmount: bid.totalAmount || 0,
    phaseId: bid.phaseId || '',
    phaseName: bid.phaseName || '',
    scope: bid.scope || '',
    timeline: bid.timeline || 30,
    status: bid.status,
    submissionDeadline: bid.submissionDeadline || null,
    paymentTerms: {
      downPaymentPercent: bid.paymentSchedule?.[0]?.percentage || 0,
      isDownPaymentFixed: false,
      downPaymentAmount: bid.paymentSchedule?.[0]?.amount || 0,
      installments: bid.paymentSchedule?.slice(1).map(payment => ({
        id: payment.id || uuidv4(),
        name: payment.name || '',
        percent: payment.percentage || 0,
        isFixedAmount: Boolean(payment.isFixedAmount),
        fixedAmount: payment.amount || 0,
        milestoneDescription: payment.description || '',
        phaseId: payment.phaseId || '',
        phaseName: payment.phaseName || '',
      })) || [],
      syncInstallmentPhases: true
    },
    notes: bid.notes || '',
    attachments: convertAttachments(bid.attachments),
    tags: Array.isArray(bid.tags) ? bid.tags : [],
    projectId: bid.projectId,
  };
};
