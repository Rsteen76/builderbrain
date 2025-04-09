import { Bid, BidFormData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { safelyParseDate } from './formatters';

/**
 * Formats a Bid object into the shape expected by the BidFormDialog/
 * ReusableBidForm, primarily for initializing the form for editing.
 * 
 * @param bid The Bid object to format.
 * @returns A partial BidFormData object suitable for the form.
 */
export const formatBidForDialog = (bid: Bid): Partial<BidFormData> => {
  let downPaymentPercent = 20;
  let installments: any[] = []; // Consider defining a stricter type if possible

  if (bid.paymentSchedule && bid.paymentSchedule.length > 0) {
    const downPayment = bid.paymentSchedule.find(p => p.name === 'Down Payment');
    downPaymentPercent = downPayment?.percentage || 20;
    installments = bid.paymentSchedule
      .filter(p => p.name !== 'Down Payment')
      .map(p => ({
        id: p.id || uuidv4(),
        name: p.name || 'Installment',
        percent: p.percentage || 0,
        milestoneDescription: p.description || '',
        phaseId: p.phaseId,
        phaseName: p.phaseName, // Phase name might be needed in the form
      }));
  }

  // Note: Ensure BidFormData includes all these fields or adjust accordingly
  const formData: Partial<BidFormData> = {
    title: bid.title || '',
    subcontractorId: bid.subcontractorId || '',
    subcontractorName: bid.subcontractorName || '', // Include if needed by form
    projectId: bid.projectId, // Essential for linking
    projectName: bid.projectName, // Include if needed by form
    phaseId: bid.phaseId || '',
    phaseName: bid.phaseName || '', // Include if needed by form
    totalAmount: bid.totalAmount || 0,
    scope: bid.scope || '',
    timeline: bid.timeline || 30, // Consider if this mapping is correct
    submissionDeadline: bid.submissionDeadline ? safelyParseDate(bid.submissionDeadline) : undefined,
    paymentTerms: {
      downPaymentPercent: downPaymentPercent,
      installments: installments,
    },
    notes: bid.notes || '',
    status: bid.status || 'draft', // Usually handled separately, but might be needed
    attachments: Array.isArray(bid.attachments)
      ? bid.attachments.map(att => (typeof att === 'string' ? att : att?.url)).filter(Boolean) as string[]
      : [],
    tags: Array.isArray(bid.tags) ? [...bid.tags] : [],
    // Add any other necessary fields from Bid that map to BidFormData
  };

  return formData;
};

// Add other bid-related utility functions here as needed. 