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
import { BidService } from '../../services/bid';
import { ProjectService } from '../../services/project';
import { toast } from 'react-hot-toast';

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
  projectId?: string;
  projectName?: string;
}

const QuickBidDialog: React.FC<QuickBidDialogProps> = ({
  open,
  onClose,
  onSubmit,
  phaseId,
  isSaving,
  phases,
  subcontractors,
  projectId,
  projectName,
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
    try {
      // Check for required projectId
      if (!projectId) {
        console.error('ProjectId is required to create a bid');
        toast.error('Cannot create bid: Project ID is missing');
        return;
      }

      // Add phase information to the bid
      const bidWithPhase = {
        ...bidForm,
        phaseId: phaseId,
        phaseName: phases.find(p => p.id === phaseId)?.name || '',
        projectId: projectId, // This is now guaranteed to exist
        projectName: projectName || 'Unnamed Project',
        status: 'submitted'
      };

      // Create the bid - need to pass userId as first parameter
      const newBid = await BidService.createBid(user?.uid || '', bidWithPhase);
      
      // Add the new bid to the project's bids
      // Update the project to include the new bid
      await ProjectService.updateProject(projectId, {
        bids: [newBid]
      });
      
      // Close the dialog after successful submission
      onClose();
      
      // Show success message
      toast.success('Bid created successfully');
    } catch (error) {
      console.error('Error creating bid:', error);
      toast.error('Failed to create bid');
    }
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