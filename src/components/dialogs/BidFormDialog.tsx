import React, { useState, useEffect } from 'react';
import { Dialog } from '@mui/material';
import { Bid, Phase, Subcontractor, Project, BidFormData } from '../../types';
import ReusableBidForm from '../bids/ReusableBidForm';
import { SubcontractorService } from '../../services/subcontractor';
import { ProjectService } from '../../services/project';
import { useAuth } from '../../contexts/AuthContext';
import { submitBid } from '../../utils/bidOperations';
import { toast } from 'react-hot-toast';

interface BidFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: (bid: Bid) => void; // Callback on successful save
  projectId?: string; // Optional: If provided, assumes context of a specific project
  phases?: Phase[]; // Make optional again
  subcontractors: Subcontractor[]; // <-- ADD PROP
  initialBidData?: Partial<BidFormData>; // For editing
  editingBidId?: string | null;
  onAddSubcontractor?: () => void; // Callback to open add sub dialog (if needed)
}

const BidFormDialog: React.FC<BidFormDialogProps> = ({
  open,
  onClose,
  onSubmitSuccess,
  projectId,
  phases, // Now optional again
  subcontractors, // <-- ACCEPT PROP
  initialBidData,
  editingBidId,
  onAddSubcontractor,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for fetched data
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Fetch necessary data when dialog opens or user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!open || !user?.uid) return;
      
      setIsLoadingData(true);
      setError(null);
      let fetchedProjects: Project[] = [];
      
      try {
        // Fetch projects only if projectId is NOT provided (standalone mode)
        if (!projectId) {
          fetchedProjects = await ProjectService.getProjects(user.uid);
          setAvailableProjects(fetchedProjects);
        }
        
        console.log('BidFormDialog - Data fetched:', {
          projects: fetchedProjects.length,
        });
      } catch (err) {
        console.error('BidFormDialog - Error fetching data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [open, user?.uid, projectId]);
  
  // Handle bid submission
  const handleInternalSubmit = async (bidFormData: BidFormData) => {
    if (!user?.uid) {
      setError('User not authenticated.');
      return;
    }
    
    console.log('BidFormDialog - DEBUG - handleInternalSubmit started with bidFormData:', bidFormData);
    setIsSaving(true);
    setError(null);
    
    try {
      // Determine the project ID and name
      let finalProjectId = projectId; // Use prop if available
      let finalProjectName = ''; // Initialize project name
      
      if (!finalProjectId) {
        // If no projectId prop, get it from the form data (selected project)
        finalProjectId = bidFormData.projectId;
        const selectedProject = availableProjects.find(p => p.id === finalProjectId);
        finalProjectName = selectedProject?.name || 'Unknown Project';
      } else {
        // If projectId prop was provided, try to find the project name from availableProjects or infer
        const project = availableProjects.find(p => p.id === finalProjectId);
        finalProjectName = project?.name || bidFormData.projectName || 'Unknown Project'; // Fallback logic
      }

      // Validate if we have a project ID at this point
      if (!finalProjectId) {
        throw new Error('Project ID is missing. Please select a project.');
      }
      
      console.log('BidFormDialog - DEBUG - About to submit bid with:', {
        userId: user.uid,
        formData: bidFormData,
        editingId: editingBidId,
        projectId: finalProjectId,
        projectName: finalProjectName,
        onSubmitSuccess: !!onSubmitSuccess
      });

      // Use the shared submitBid utility function
      const savedBid = await submitBid(
        user.uid,
        bidFormData,
        editingBidId || null,
        finalProjectId, // Use the determined project ID
        finalProjectName // Use the determined project name
      );

      console.log('BidFormDialog - DEBUG - submitBid returned:', savedBid);

      if (savedBid) {
        console.log('BidFormDialog - Bid saved successfully:', savedBid);
        toast.success(editingBidId ? 'Bid updated successfully' : 'Bid created successfully');
        console.log('BidFormDialog - DEBUG - About to call onSubmitSuccess with bid:', savedBid.id);
        
        // Add additional debugging for callback execution
        try {
          onSubmitSuccess(savedBid); // Call the success callback
          console.log('BidFormDialog - DEBUG - onSubmitSuccess called successfully');
        } catch (callbackError) {
          console.error('BidFormDialog - DEBUG - Error in onSubmitSuccess callback:', callbackError);
        }
        
        onClose(); // Close the dialog
        console.log('BidFormDialog - DEBUG - Dialog closed');
      } else {
        throw new Error('Failed to save bid.');
      }
    } catch (err: any) {
      console.error('BidFormDialog - Error saving bid:', err);
      setError(err.message || 'Failed to save bid. Please try again.');
      toast.error(err.message || 'Failed to save bid. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ReusableBidForm
      open={open}
      onClose={onClose}
      onSubmit={handleInternalSubmit}
      phases={projectId ? phases : undefined}
      availableProjects={!projectId ? availableProjects : undefined}
      subcontractors={subcontractors}
      initialBidData={initialBidData}
      editingBidId={editingBidId}
      isSaving={isSaving || isLoadingData}
      onAddSubcontractor={onAddSubcontractor}
      isDialog={true}
      projectId={projectId}
      projectName={initialBidData?.projectName}
      error={error}
    />
  );
};

export default BidFormDialog; 