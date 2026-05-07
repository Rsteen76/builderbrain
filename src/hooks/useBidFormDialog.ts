import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BidService } from '../services/bid';
import { Bid, BidSummary } from '../types';
import { BidFormData } from '../types/form.types';
import { safelyParseDate } from '../utils/formatters';

/**
 * Options for initializing the useBidFormDialog hook
 */
export interface UseBidFormDialogOptions {
  onSubmitSuccess?: (bid: Bid) => void;
  onError?: (error: string) => void;
  projectId?: string;
}

/**
 * Hook for managing bid form dialog state and operations
 * 
 * This hook extracts and centralizes dialog state management for the bid form dialog 
 * used for creating and editing bids.
 */
export function useBidFormDialog(userId: string | undefined, options: UseBidFormDialogOptions = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [initialBidData, setInitialBidData] = useState<Partial<BidFormData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatBidForDialog = (bid: Bid): Partial<BidFormData> => {
    let downPaymentPercent = 20;
    let downPaymentAmount = 0;
    let installments: any[] = [];
    if (bid.paymentSchedule && bid.paymentSchedule.length > 0) {
      const downPayment = bid.paymentSchedule.find(p => p.name === 'Down Payment');
      downPaymentPercent = downPayment?.percentage || 20;
      downPaymentAmount = downPayment?.amount || 0;
      installments = bid.paymentSchedule
        .filter(p => p.name !== 'Down Payment')
        .map(p => ({
          id: p.id || uuidv4(),
          name: p.name || 'Installment',
          percent: p.percentage || 0,
          isFixedAmount: Boolean(p.isFixedAmount),
          fixedAmount: p.amount || 0,
          milestoneDescription: p.description || '',
          phaseId: p.phaseId,
          phaseName: p.phaseName,
        }));
    }

    return {
      title: bid.title || '',
      subcontractorName: bid.subcontractorName || '',
      subcontractorId: bid.subcontractorId || '',
      totalAmount: bid.totalAmount || 0,
      phaseId: bid.phaseId || '',
      phaseName: bid.phaseName || '',
      projectId: bid.projectId || options.projectId, 
      scope: bid.scope || '',
      timeline: bid.timeline || 30,
      submissionDeadline: bid.submissionDeadline ? safelyParseDate(bid.submissionDeadline) : undefined,
      paymentTerms: {
        downPaymentPercent: downPaymentPercent,
        isDownPaymentFixed: false,
        downPaymentAmount,
        installments: installments,
        syncInstallmentPhases: true
      },
      notes: bid.notes || '',
      status: bid.status || 'draft',
      attachments: Array.isArray(bid.attachments)
        ? bid.attachments.map(att => (typeof att === 'string' ? att : att?.url)).filter(Boolean) as string[]
        : [],
      tags: Array.isArray(bid.tags) ? [...bid.tags] : [],
    };
  };

  const openNewBidDialog = (initialData?: Partial<BidFormData>) => {
    setEditingBidId(null);
    const dataToSet = { 
      ...(initialData || {}), 
      projectId: initialData?.projectId ?? options.projectId, 
    };
    setInitialBidData(Object.keys(dataToSet).length > 0 ? dataToSet : null);
    setIsModalOpen(true);
    setError(null);
  };

  /**
   * Opens the dialog for editing an existing bid
   */
  const openEditBidDialog = useCallback(async (bid: Bid | BidSummary) => {
    if (!userId) {
      setError('User not authenticated');
      if (options.onError) options.onError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fullBid = await BidService.getBid(userId, bid.id);
      if (fullBid) {
        setInitialBidData(formatBidForDialog(fullBid));
        setEditingBidId(bid.id);
        setIsModalOpen(true);
      } else {
        const msg = 'Could not load bid data for editing.';
        setError(msg);
        if (options.onError) options.onError(msg);
      }
    } catch (err) {
      const errorMsg = 'Error loading bid data.';
      console.error(errorMsg, err);
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, options.onError]);

  const closeBidDialog = () => {
    setIsModalOpen(false);
    setEditingBidId(null);
    setInitialBidData(null);
    setError(null);
  };

  const handleBidSubmitSuccess = (savedBid: Bid) => {
    closeBidDialog();
    if (options.onSubmitSuccess) {
      options.onSubmitSuccess(savedBid);
    }
  };

  return {
    isModalOpen,
    editingBidId,
    initialBidData,
    loading,
    error,
    openNewBidDialog,
    openEditBidDialog,
    closeBidDialog,
    handleBidSubmitSuccess,
  };
} 
