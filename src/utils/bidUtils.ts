import { Bid } from '../types';
import { BidFormData, BidPaymentInstallmentFormData, BidPaymentTermsFormData } from '../types/form.types'; // Updated import
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
  // Default payment terms structure
  let paymentTerms: BidPaymentTermsFormData = {
    downPaymentPercent: 20,
    isDownPaymentFixed: false,
    downPaymentAmount: (bid.totalAmount || 0) * 0.20, // Calculate default amount
    installments: [],
    syncInstallmentPhases: true, // Default value
  };

  if (bid.paymentSchedule && bid.paymentSchedule.length > 0) {
    const downPaymentStage = bid.paymentSchedule.find(p => p.name === 'Down Payment' || p.name === 'Initial Payment'); // More flexible find

    const scheduleInstallments: BidPaymentInstallmentFormData[] = bid.paymentSchedule
      .filter(p => p.name !== 'Down Payment' && p.name !== 'Initial Payment')
      .map(p => ({
        id: p.id || uuidv4(),
        name: p.name || 'Installment',
        percent: p.percentage || 0,
        isFixedAmount: false, // As per instruction, assume percentage was primary
        fixedAmount: bid.totalAmount ? (bid.totalAmount * (p.percentage || 0) / 100) : 0,
        milestoneDescription: p.description || '',
        phaseId: p.phaseId || '',
        phaseName: p.phaseName || '',
        manuallyConfigured: !!p.phaseId, // If phaseId was stored, consider it manually configured
      }));

    if (downPaymentStage) {
      paymentTerms = {
        downPaymentPercent: downPaymentStage.percentage || 0, // Default to 0 if not found
        isDownPaymentFixed: false, // Assume percentage was primary
        downPaymentAmount: bid.totalAmount ? (bid.totalAmount * (downPaymentStage.percentage || 0) / 100) : 0,
        installments: scheduleInstallments,
        syncInstallmentPhases: true, // Default, can be overridden if stored differently
      };
    } else {
      // If no specific down payment stage, but other stages exist, sum them up
      // This might indicate an older data structure or a bid with no down payment
      paymentTerms.downPaymentPercent = 0;
      paymentTerms.downPaymentAmount = 0;
      paymentTerms.installments = scheduleInstallments;
      // If there are installments, but no down payment, it's likely the first installment acts as one.
      // Or, it's simply a multi-stage payment with no explicit down payment.
      // For simplicity, we'll keep downPayment at 0 and list others as installments.
    }
  } else {
    // If no payment schedule, create a default final payment installment if totalAmount > 0
    // This mirrors the defaultBidForm structure more closely for new/empty schedules
    if (bid.totalAmount > 0) {
        paymentTerms.installments = [
            {
                id: uuidv4(),
                name: 'Final Payment',
                percent: 100 - paymentTerms.downPaymentPercent,
                isFixedAmount: false,
                fixedAmount: bid.totalAmount * ((100 - paymentTerms.downPaymentPercent)/100),
                milestoneDescription: 'Upon completion of work',
                phaseId: bid.phaseId || '', // Default to bid's phase
                phaseName: bid.phaseName || '', // Default to bid's phase name
                manuallyConfigured: false,
            }
        ];
    }
  }

  const formData: Partial<BidFormData> = {
    title: bid.title || '',
    subcontractorId: bid.subcontractorId || '',
    subcontractorName: bid.subcontractorName || '', // Include if needed by form
    projectId: bid.projectId, // Essential for linking
    projectName: bid.projectName, // Include if needed by form
    phaseId: bid.phaseId || '',
    phaseName: bid.phaseName || '',
    totalAmount: bid.totalAmount || 0,
    scope: bid.scope || '',
    timeline: bid.timeline || 30,
    submissionDeadline: bid.submissionDeadline ? safelyParseDate(bid.submissionDeadline) : null, // Ensure null if undefined
    paymentTerms: paymentTerms, // Use the processed paymentTerms object
    notes: bid.notes || '',
    status: bid.status || 'draft',
    attachments: Array.isArray(bid.attachments)
      ? bid.attachments.map(att => (typeof att === 'string' ? att : att?.url)).filter(Boolean) as string[]
      : [],
    tags: Array.isArray(bid.tags) ? [...bid.tags] : [],
    // Add any other necessary fields from Bid that map to BidFormData
  };

  return formData;
};

// Add other bid-related utility functions here as needed. 