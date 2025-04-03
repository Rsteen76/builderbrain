import React from 'react';
import { Dialog } from '@mui/material';
import { Bid, Phase, Subcontractor } from '../../types';
import ReusableBidForm from '../bids/ReusableBidForm';

// Interface for bid form data
interface BidFormData {
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
}

// Interface for props
interface BidFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (bidForm: BidFormData) => Promise<void>;
  phases: Phase[];
  subcontractors: Subcontractor[];
  initialBidData?: Partial<BidFormData>;
  editingBidId: string | null;
  isSaving: boolean;
  onAddSubcontractor: () => void;
}

const BidFormDialog: React.FC<BidFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  phases,
  subcontractors,
  initialBidData,
  editingBidId,
  isSaving,
  onAddSubcontractor,
}) => {
  // Log props for debugging
  console.log('BidFormDialog props:', { 
    open, 
    initialBidData, 
    editingBidId, 
    phasesCount: phases.length, 
    subcontractorsCount: subcontractors.length 
  });
  
  return (
    <ReusableBidForm
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      phases={phases}
      subcontractors={subcontractors}
      initialBidData={initialBidData}
      editingBidId={editingBidId}
      isSaving={isSaving}
      onAddSubcontractor={onAddSubcontractor}
      isDialog={true}
    />
  );
};

export default BidFormDialog; 