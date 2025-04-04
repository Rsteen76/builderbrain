import React, { useState, useEffect } from 'react';
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
import QuickAddSubcontractorDialog from './QuickAddSubcontractorDialog';
import { SubcontractorService } from '../../services/subcontractor';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [showAddSubcontractor, setShowAddSubcontractor] = useState(false);
  const [isAddingSubcontractor, setIsAddingSubcontractor] = useState(false);
  const [localSubcontractors, setLocalSubcontractors] = useState<Subcontractor[]>([]);

  // Update local subcontractors when props change
  useEffect(() => {
    console.log('QuickBidDialog - subcontractors received:', subcontractors);
    setLocalSubcontractors(subcontractors);
  }, [subcontractors]);

  // Log when dialog opens or closes
  useEffect(() => {
    if (open) {
      console.log('QuickBidDialog opened with phaseId:', phaseId);
      console.log('QuickBidDialog - subcontractors count:', subcontractors.length);
    }
  }, [open, phaseId, subcontractors]);

  const handleSubmit = async (bidForm: any) => {
    onSubmit({
      phaseId: bidForm.phaseId || phaseId || '',
      contractorName: bidForm.subcontractorName,
      amount: bidForm.totalAmount,
      description: bidForm.scope,
    });
  };

  const handleAddSubcontractor = async (subcontractorData: {
    name: string;
    specialty: string;
    contact: {
      phone: string;
      email: string;
    };
  }) => {
    if (!user?.uid) return;
    
    setIsAddingSubcontractor(true);
    try {
      const newSubcontractor = await SubcontractorService.createSubcontractor(user.uid, {
        name: subcontractorData.name,
        specialty: subcontractorData.specialty,
        contact: subcontractorData.contact,
        rating: 0,
        totalProjects: 0
      });
      
      // Update the local subcontractors list
      setLocalSubcontractors(prev => [...prev, newSubcontractor]);
      
      // Close the dialog
      setShowAddSubcontractor(false);
    } catch (error) {
      console.error('Error adding subcontractor:', error);
    } finally {
      setIsAddingSubcontractor(false);
    }
  };

  return (
    <>
      <ReusableBidForm
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        phases={phases}
        subcontractors={localSubcontractors}
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
        onAddSubcontractor={() => setShowAddSubcontractor(true)}
      />

      <QuickAddSubcontractorDialog
        open={showAddSubcontractor}
        onClose={() => setShowAddSubcontractor(false)}
        onSubmit={handleAddSubcontractor}
        isSaving={isAddingSubcontractor}
      />
    </>
  );
};

export default QuickBidDialog; 