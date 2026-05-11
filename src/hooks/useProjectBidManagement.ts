import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useProjectBids, useCreateBid, useUpdateBid, useDeleteBid } from './use-bids';
import { Bid, BidPaymentStage, ProjectPhase } from '../types';
import { showNotification } from '../utils/notifications';
import { ensureExpensesForAcceptedBid } from '../utils/bidOperations';
import { logger } from '../utils/logger';

type BidFormData = {
  title: string;
  subcontractorName: string;
  subcontractorId?: string;
  totalAmount: number;
  phaseId?: string;
  phaseName?: string;
  scope: string;
  timeline: number;
  submissionDeadline?: Date;
  paymentTerms: {
    downPaymentPercent: number;
    installments: {
      id: string;
      name: string;
      percent: number;
      milestoneDescription: string;
      phaseId?: string;
      phaseName?: string;
    }[];
  };
  notes: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  attachments: string[];
  tags: string[];
};

interface QuickBidData {
  phaseId: string;
  contractorName: string;
  amount: number;
  description: string;
}

export function useProjectBidManagement(projectId: string, userId: string, phases: ProjectPhase[]) {
  // States for bid management
  const [bidFormOpen, setBidFormOpen] = useState(false);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newBidDialogOpen, setNewBidDialogOpen] = useState(false);
  const [currentPhaseForBid, setCurrentPhaseForBid] = useState<string | null>(null);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  
  // Default bid form data
  const defaultBidForm: BidFormData = {
    title: '',
    subcontractorName: '',
    totalAmount: 0,
    phaseId: phases.length > 0 ? phases[0].id : '',
    phaseName: phases.length > 0 ? phases[0].name : '',
    scope: '',
    timeline: 30,
    paymentTerms: {
      downPaymentPercent: 20,
      installments: [
        {id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}
      ]
    },
    notes: '',
    status: 'submitted',
    attachments: [],
    tags: []
  };
  
  const [bidForm, setBidForm] = useState<BidFormData>(defaultBidForm);
  
  // Fetch bids for this project using the existing hook
  const { data: bids = [], isLoading, error, refetch } = useProjectBids(projectId);
  
  // Mutation hooks for CRUD operations
  const createBidMutation = useCreateBid();
  const updateBidMutation = useUpdateBid();
  const deleteBidMutation = useDeleteBid();
  
  // Helper function to remove undefined fields
  const removeUndefinedFields = (obj: any): any => {
    const cleanObj = { ...obj };
    
    // Special handling for certain fields that need to be null in Firestore
    const fieldsToMakeNull = ['submissionDeadline', 'startDate', 'completionDate', 'dueDate'];
    
    Object.keys(cleanObj).forEach(key => {
      if (cleanObj[key] === undefined) {
        // For fields that Firestore expects, convert undefined to null
        if (fieldsToMakeNull.includes(key)) {
          cleanObj[key] = null;
        } else {
          delete cleanObj[key];
        }
      } else if (cleanObj[key] === null) {
        // Keep null values as is
      } else if (typeof cleanObj[key] === 'object' && cleanObj[key] !== null) {
        // Recursively clean nested objects
        cleanObj[key] = removeUndefinedFields(cleanObj[key]);
      }
    });
    return cleanObj;
  };
  
  // Function to handle opening the bid form for adding a new bid
  const handleAddBid = useCallback(() => {
    // Reset form and open modal
    setEditingBidId(null);
    setBidForm(defaultBidForm);
    setBidFormOpen(true);
  }, [defaultBidForm]);
  
  // Function to handle opening the bid form for editing an existing bid
  const handleEditBid = useCallback((bidId: string) => {
    // Find the bid to edit
    const bidToEdit = bids.find(b => b.id === bidId);
    
    if (bidToEdit) {
      // Store the ID of the bid being edited
      setEditingBidId(bidId);
      
      // Get the payment schedule from the bid, if any
      const paymentSchedule = bidToEdit.paymentSchedule || [];
      
      // Calculate down payment and installments from payment schedule
      let downPaymentPercent = 20; // Default
      let installments = [{id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}];
      
      if (paymentSchedule.length > 0) {
        // Find down payment
        const downPayment = paymentSchedule.find(p => p.name === 'Down Payment');
        if (downPayment) {
          downPaymentPercent = downPayment.percentage || 20;
        }
        
        // Extract installments (all except down payment)
        const installmentPayments = paymentSchedule.filter(p => p.name !== 'Down Payment');
        if (installmentPayments.length > 0) {
          installments = installmentPayments.map(p => ({
            id: p.id || uuidv4(),
            name: p.name || 'Installment',
            percent: p.percentage || 0,
            milestoneDescription: p.description || '',
            phaseId: p.phaseId || bidToEdit.phaseId,
            phaseName: p.phaseName || bidToEdit.phaseName
          }));
        }
      }
      
      // Populate the form with the bid data
      setBidForm({
        title: bidToEdit.title || '',
        subcontractorName: bidToEdit.subcontractorName || '',
        subcontractorId: bidToEdit.subcontractorId || '',
        totalAmount: bidToEdit.totalAmount || 0,
        phaseId: bidToEdit.phaseId || (phases.length > 0 ? phases[0].id : ''),
        phaseName: bidToEdit.phaseName || (phases.length > 0 ? phases[0].name : ''),
        scope: bidToEdit.scope || '',
        timeline: bidToEdit.timeline || 30,
        paymentTerms: {
          downPaymentPercent: downPaymentPercent,
          installments: installments
        },
        notes: bidToEdit.notes || '',
        status: (bidToEdit.status === 'draft' || 
                bidToEdit.status === 'submitted' || 
                bidToEdit.status === 'accepted' || 
                bidToEdit.status === 'rejected' || 
                bidToEdit.status === 'expired') 
                ? bidToEdit.status 
                : 'submitted',
        attachments: Array.isArray(bidToEdit.attachments) 
                    ? bidToEdit.attachments.map(att => typeof att === 'string' ? att : (att && typeof att === 'object' && 'url' in att ? att.url : ''))
                    : [],
        tags: bidToEdit.tags || []
      });
      
      // Open the form modal
      setBidFormOpen(true);
    } else {
      logger.error(`Bid with ID ${bidId} not found`);
    }
  }, [bids, phases]);
  
  // Function to handle deleting a bid
  const handleDeleteBid = useCallback((bidId: string) => {
    if (!window.confirm('Are you sure you want to delete this bid?')) {
      return;
    }
    
    const bidToDelete = bids.find(b => b.id === bidId);
    if (!bidToDelete) {
      showNotification('Bid not found', 'error');
      return;
    }
    
    deleteBidMutation.mutate(
      { id: bidId, bid: bidToDelete },
      {
        onSuccess: () => {
          showNotification('Bid deleted successfully', 'success');
        },
        onError: (error: any) => {
          logger.error('Error deleting bid:', error);
          showNotification('Failed to delete bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        }
      }
    );
  }, [bids, deleteBidMutation]);
  
  // Function to handle submitting the bid form
  const handleSubmitBid = useCallback(async (bidFormData: BidFormData) => {
    if (!projectId || !userId) return;
    
    try {
      setIsSaving(true);
      
      // Calculate total percentage to ensure it adds up to 100%
      const downPaymentPercent = bidFormData.paymentTerms.downPaymentPercent;
      const installmentsTotal = bidFormData.paymentTerms.installments.reduce((sum: number, item: { percent: number }) => sum + item.percent, 0);
      const totalPercent = downPaymentPercent + installmentsTotal;
      
      if (totalPercent !== 100) {
        showNotification('Payment percentages must add up to 100%', 'error');
        setIsSaving(false);
        return;
      }
      
      const now = new Date();
      
      // Create payment schedule for bid with explicit date objects
      const paymentSchedule = [
        {
          id: uuidv4(),
          name: 'Down Payment',
          percentage: downPaymentPercent,
          amount: (bidFormData.totalAmount * downPaymentPercent) / 100,
          status: 'pending',
          phaseId: bidFormData.phaseId,
          phaseName: bidFormData.phaseName,
          dueDate: now,
          description: 'Initial payment to start work',
          createdAt: now,
          updatedAt: now
        } as BidPaymentStage,
        ...bidFormData.paymentTerms.installments.map((installment: {
          id: string;
          name: string;
          percent: number;
          milestoneDescription: string;
          phaseId?: string;
          phaseName?: string;
        }) => ({
          id: uuidv4(),
          name: installment.name,
          percentage: installment.percent,
          amount: (bidFormData.totalAmount * installment.percent) / 100,
          status: 'pending',
          phaseId: installment.phaseId || bidFormData.phaseId,
          phaseName: installment.phaseName || bidFormData.phaseName,
          dueDate: now,
          description: installment.milestoneDescription,
          createdAt: now,
          updatedAt: now
        } as BidPaymentStage))
      ] as BidPaymentStage[];
      
      // Create base bid data object with explicit null values for Date fields that can't be undefined
      const bidData = {
        userId: userId,
        projectId: projectId,
        title: bidFormData.title || '',
        subcontractorName: bidFormData.subcontractorName || '',
        subcontractorId: bidFormData.subcontractorId || '',
        phaseId: bidFormData.phaseId || '',
        phaseName: bidFormData.phaseName || '',
        totalAmount: bidFormData.totalAmount || 0,
        scope: bidFormData.scope || '',
        timeline: bidFormData.timeline || 0,
        notes: bidFormData.notes || '',
        status: bidFormData.status || 'draft',
        tags: Array.isArray(bidFormData.tags) ? bidFormData.tags : [],
        attachments: [],
        // Set date fields explicitly to null if invalid
        submissionDeadline: null, // Default to null, will override if valid below
        startDate: null,
        completionDate: null,
        paymentSchedule,
        updatedAt: now,
        paymentProgress: {
          paid: 0,
          pending: bidFormData.totalAmount,
          remaining: bidFormData.totalAmount
        }
      } as any;
      
      // Only set date fields if they are valid Date objects
      if (bidFormData.submissionDeadline instanceof Date && !isNaN(bidFormData.submissionDeadline.getTime())) {
        bidData.submissionDeadline = bidFormData.submissionDeadline;
      }
      
      // Clean any remaining undefined fields
      const cleanBidData = removeUndefinedFields(bidData);
      
      // Check if we're updating an existing bid or creating a new one
      let savedBid: Bid;
      if (editingBidId) {
        // Update existing bid
        savedBid = await updateBidMutation.mutateAsync({ id: editingBidId, data: cleanBidData });
        
        // Show success notification
        showNotification('Bid updated successfully', 'success');
      } else {
        // Generate ID and create final bid object for new bid
        const newBidId = uuidv4();
        const newBid: Bid = {
          id: newBidId,
          ...cleanBidData,
          createdAt: now,
        } as Bid;
        
        // Save new bid to database
        savedBid = await createBidMutation.mutateAsync(newBid);
        
        // Add to recent bids for easy comparison
        setRecentBids(prev => [newBid, ...prev].slice(0, 5));
        
        // Show success notification
        showNotification('Bid added successfully', 'success');
      }

      if (savedBid.status === 'accepted') {
        await ensureExpensesForAcceptedBid(userId, savedBid);
      }
      
      // Reset editing state
      setEditingBidId(null);
      
      // Close dialog
      setBidFormOpen(false);
      
      // Refresh bids
      refetch();
    } catch (error) {
      logger.error('Error saving bid:', error);
      showNotification('Failed to save bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, userId, editingBidId, updateBidMutation, createBidMutation, refetch]);
  
  // Function to handle opening the quick bid dialog
  const handleOpenQuickBidDialog = useCallback((phaseId: string) => {
    setCurrentPhaseForBid(phaseId);
    setNewBidDialogOpen(true);
  }, []);
  
  // Function to handle adding a quick bid
  const handleAddQuickBid = useCallback(async (quickBid: QuickBidData) => {
    // Only proceed if we have a valid phase ID and project
    if (!quickBid.phaseId || !projectId) return;
    
    try {
      setIsSaving(true);
      
      // Get the phase name from phases
      const phase = phases.find(p => p.id === quickBid.phaseId);
      const phaseName = phase?.name || '';
      
      // Create current date
      const now = new Date();
      
      // Create proper payment schedule (similar to the full bid form)
      const paymentSchedule = [
        {
          id: uuidv4(),
          name: 'Down Payment',
          percentage: 50,
          amount: (quickBid.amount * 50) / 100,
          status: 'pending' as const,
          phaseId: quickBid.phaseId,
          phaseName: phaseName,
          dueDate: now,
          description: 'Initial payment to start work',
          createdAt: now,
          updatedAt: now
        },
        {
          id: uuidv4(),
          name: 'Final Payment',
          percentage: 50,
          amount: (quickBid.amount * 50) / 100,
          status: 'pending' as const,
          phaseId: quickBid.phaseId,
          phaseName: phaseName,
          dueDate: now,
          description: 'Upon completion',
          createdAt: now,
          updatedAt: now
        }
      ];
      
      // Create a complete bid with all required fields
      const newBid: Omit<Bid, 'id'> = {
        userId: userId,
        projectId: projectId,
        phaseId: quickBid.phaseId,
        phaseName: phaseName,
        contractorName: quickBid.contractorName,
        title: `${quickBid.contractorName} - ${phaseName}`,
        bidAmount: quickBid.amount,
        totalAmount: quickBid.amount,
        scope: quickBid.description,
        notes: quickBid.description,
        status: 'accepted' as const,
        timeline: 30, // Default timeline
        tags: ['quick-bid'],
        paymentSchedule: paymentSchedule,
        createdAt: now,
        updatedAt: now,
        paymentProgress: {
          paid: 0,
          pending: quickBid.amount,
          remaining: quickBid.amount
        }
      };
      
      const savedBid = await createBidMutation.mutateAsync(newBid as any);
      await ensureExpensesForAcceptedBid(userId, savedBid);

      setNewBidDialogOpen(false);
      setCurrentPhaseForBid(null);
      showNotification(`Bid from ${quickBid.contractorName} added successfully`, 'success');
      refetch();
    } catch (error) {
      logger.error('Error with quick bid:', error);
      showNotification('Failed to process bid: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, userId, phases, createBidMutation, refetch]);
  
  return {
    bids,
    isLoading,
    error,
    bidFormOpen,
    setBidFormOpen,
    editingBidId,
    bidForm,
    setBidForm,
    isSaving,
    newBidDialogOpen,
    setNewBidDialogOpen,
    currentPhaseForBid,
    recentBids,
    handleAddBid,
    handleEditBid,
    handleDeleteBid,
    handleSubmitBid,
    handleOpenQuickBidDialog,
    handleAddQuickBid,
    handleCloseBidForm: () => setBidFormOpen(false),
  };
}

export default useProjectBidManagement; 
