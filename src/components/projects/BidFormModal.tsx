import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { Bid, Subcontractor, ProjectPhase } from '../../types';
import { BidService } from '../../services/bid';
import { SubcontractorService } from '../../services/subcontractor';
import ReusableBidForm from '../bids/ReusableBidForm';
import { v4 as uuidv4 } from 'uuid';
import { mapSimpleToDetailedCategory } from '../../data/hierarchicalCategories';
import { useQuickAddSubcontractorDialog } from '../../hooks/useQuickAddSubcontractorDialog';
import QuickAddSubcontractorDialog from '../dialogs/QuickAddSubcontractorDialog';

interface BidFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void | Promise<void>;
  initialData?: Bid | null;
  userId: string;
  projectId: string;
  projectPhases?: ProjectPhase[];
}

const BidFormModal: React.FC<BidFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  userId,
  projectId,
  projectPhases = [],
}) => {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickAddSubDialog = useQuickAddSubcontractorDialog({
    onSubmitSuccess: (newSubcontractor) => {
      setSubcontractors(prev => [...prev, newSubcontractor]);
    }
  });

  useEffect(() => {
    const fetchSubcontractors = async () => {
      try {
        const fetchedSubcontractors = await SubcontractorService.getSubcontractors(userId);
        setSubcontractors(fetchedSubcontractors);
      } catch (err) {
        console.error('Error fetching subcontractors:', err);
        setError('Failed to load subcontractors');
      }
    };

    if (open) {
      fetchSubcontractors();
    }
  }, [open, userId]);

  const handleAddNewSubcontractor = () => {
    quickAddSubDialog.openQuickAddSubDialog();
  };

  const handleSubmit = async (bidFormData: any) => {
    setIsSaving(true);
    setError(null);

    try {
      console.log('[Category Mapping Inputs]', {
        title: bidFormData.title || '',
        subcontractor: bidFormData.subcontractorName || '',
        scope: bidFormData.scope || ''
      });
      
      const categoryId = mapSimpleToDetailedCategory(
        bidFormData.title || '',
        bidFormData.subcontractorName || '',
        bidFormData.scope || ''
      );

      const submitPayload: Omit<Bid, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { categoryId?: string } = {
        title: bidFormData.title || `Bid from ${bidFormData.subcontractorName}`,
        projectId,
        projectName: initialData?.projectName || 'Unknown Project',
        subcontractorId: bidFormData.subcontractorId || '',
        subcontractorName: bidFormData.subcontractorName || '',
        scope: bidFormData.scope || 'N/A',
        status: (bidFormData.status?.toLowerCase() || 'submitted') as Bid['status'],
        categoryId: categoryId,
        priority: bidFormData.priority || 'medium',
        submissionDeadline: bidFormData.submissionDeadline || new Date(),
        startDate: bidFormData.startDate || null,
        completionDate: bidFormData.completionDate || null,
        totalAmount: bidFormData.totalAmount || 0,
        tags: bidFormData.tags || [],
        createdBy: initialData?.createdBy || userId,
        updatedBy: userId,
        requiresInsurance: bidFormData.requiresInsurance ?? false,
        requiresBond: bidFormData.requiresBond ?? false,
        isPublic: bidFormData.isPublic ?? false,
        isApproved: bidFormData.isApproved ?? false,
        notes: bidFormData.notes || '',
        paymentSchedule: [
          {
            id: uuidv4(),
            name: 'Down Payment',
            percentage: bidFormData.paymentTerms.downPaymentPercent,
            amount: (bidFormData.totalAmount * bidFormData.paymentTerms.downPaymentPercent) / 100,
            status: 'pending',
            phaseId: bidFormData.phaseId,
            phaseName: bidFormData.phaseName,
            dueDate: new Date(),
            description: 'Initial payment to start work',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          ...bidFormData.paymentTerms.installments.map((installment: any) => ({
            id: uuidv4(),
            name: installment.name,
            percentage: installment.percent,
            amount: (bidFormData.totalAmount * installment.percent) / 100,
            status: 'pending',
            phaseId: installment.phaseId || bidFormData.phaseId,
            phaseName: installment.phaseName || bidFormData.phaseName,
            dueDate: new Date(),
            description: installment.milestoneDescription,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        ],
        paymentProgress: {
          paid: 0,
          pending: bidFormData.totalAmount,
          remaining: bidFormData.totalAmount
        }
      };
      
      await onSubmit(submitPayload);
      onClose();
    } catch (err) {
      console.error('Error submitting bid:', err);
      setError('Failed to submit bid');
    } finally {
      setIsSaving(false);
    }
  };

  const convertBidStatus = (status: Bid['status']): 'submitted' | 'draft' | 'accepted' | 'rejected' | 'expired' => {
    switch (status) {
      case 'withdrawn':
      case 'revision_requested':
        return 'submitted';
      default:
        return status;
    }
  };

  const convertAttachments = (attachments: Bid['attachments']): string[] => {
    if (!attachments) return [];
    return attachments.map(attachment => 
      typeof attachment === 'string' ? attachment : attachment.url
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {initialData ? 'Edit Bid' : 'New Bid'}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <ReusableBidForm
            onSubmit={handleSubmit}
            phases={projectPhases}
            subcontractors={subcontractors}
            initialBidData={initialData ? {
              ...initialData,
              submissionDeadline: initialData.submissionDeadline || new Date(),
              status: convertBidStatus(initialData.status),
              attachments: convertAttachments(initialData.attachments),
              paymentTerms: {
                downPaymentPercent: initialData.paymentSchedule?.[0]?.percentage || 20,
                installments: initialData.paymentSchedule?.slice(1).map(payment => ({
                  id: payment.id || uuidv4(),
                  name: payment.name || '',
                  percent: payment.percentage || 0,
                  milestoneDescription: payment.description || '',
                  phaseId: payment.phaseId || '',
                  phaseName: payment.phaseName || ''
                })) || [{id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}]
              }
            } : undefined}
            isDialog={true}
            isSaving={isSaving}
            onAddSubcontractor={handleAddNewSubcontractor}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      <QuickAddSubcontractorDialog 
        open={quickAddSubDialog.isQuickAddSubDialogOpen}
        onClose={quickAddSubDialog.closeQuickAddSubDialog}
        onSubmit={quickAddSubDialog.handleDialogSubmit}
        isSaving={quickAddSubDialog.isSavingSub}
      />
    </>
  );
};

export default BidFormModal; 