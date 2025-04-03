import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Phase, Subcontractor } from '../../types';
import ReusableBidForm from '../bids/ReusableBidForm';

interface QuickBidData {
  phaseId: string;
  contractorName: string;
  amount: number;
  description: string;
}

interface QuickBidDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (bid: QuickBidData) => void;
  phaseId: string | null;
  isSaving: boolean;
  phases: Phase[];
  subcontractors: Subcontractor[];
}

const QuickBidDialog: React.FC<QuickBidDialogProps> = ({
  open,
  onClose,
  onSubmit,
  phaseId,
  isSaving,
  phases,
  subcontractors,
}) => {
  const handleSubmit = async (bidForm: any) => {
    onSubmit({
      phaseId: bidForm.phaseId || phaseId || '',
      contractorName: bidForm.subcontractorName,
      amount: bidForm.totalAmount,
      description: bidForm.scope,
    });
  };

  return (
    <ReusableBidForm
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      phases={phases}
      subcontractors={subcontractors}
      initialBidData={{
        phaseId: phaseId || '',
        subcontractorName: '',
        totalAmount: 0,
        scope: '',
        timeline: 30,
        paymentTerms: {
          downPaymentPercent: 50,
          installments: [
            {id: 'final', name: 'Final Payment', percent: 50, milestoneDescription: 'Upon completion'}
          ]
        },
        notes: '',
        status: 'submitted',
        attachments: [],
        tags: []
      }}
      isSaving={isSaving}
      isDialog={true}
    />
  );
};

export default QuickBidDialog; 