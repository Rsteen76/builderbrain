import { useState, useCallback } from 'react';
import { Subcontractor } from '../types';
import { SubcontractorService } from '../services/subcontractor'; // Assuming service
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

// Data expected from the dialog form
interface SubcontractorFormData {
  name: string;
  specialty: string;
  contact: {
    phone: string;
    email: string;
  };
}

// Define options for the hook
interface UseQuickAddSubDialogOptions {
  // Callback when a new subcontractor is successfully added
  onSubmitSuccess?: (newSubcontractor: Subcontractor) => void; 
}

// Define the return type for the hook
interface UseQuickAddSubDialogReturn {
  isQuickAddSubDialogOpen: boolean;
  isSavingSub: boolean;
  openQuickAddSubDialog: () => void;
  closeQuickAddSubDialog: () => void;
  // Provide an onSubmit handler for the dialog
  handleDialogSubmit: (formData: SubcontractorFormData) => Promise<void>; 
}

/**
 * Hook to manage the state for a quick add subcontractor dialog.
 */
export const useQuickAddSubcontractorDialog = (
  options: UseQuickAddSubDialogOptions = {}
): UseQuickAddSubDialogReturn => {
  const { user } = useAuth();
  const [isQuickAddSubDialogOpen, setIsQuickAddSubDialogOpen] = useState(false);
  const [isSavingSub, setIsSavingSub] = useState(false);

  const openQuickAddSubDialog = useCallback(() => {
    setIsQuickAddSubDialogOpen(true);
  }, []);

  const closeQuickAddSubDialog = useCallback(() => {
    setIsQuickAddSubDialogOpen(false);
  }, []);

  // This function will be passed to the dialog's onSubmit prop
  const handleDialogSubmit = useCallback(async (formData: SubcontractorFormData) => {
    if (!user?.uid) {
      toast.error("Authentication required.");
      return;
    }
    setIsSavingSub(true);
    try {
      // Prepare data for the service call (may need adjustments)
      const newSubData = {
        ...formData,
        userId: user.uid,
        // Add any other required fields or transformations
      };
      
      const savedSub = await SubcontractorService.createSubcontractor(user.uid, newSubData as any);
      
      toast.success("Subcontractor added!");
      closeQuickAddSubDialog(); // Close dialog on success
      if (options.onSubmitSuccess) {
        options.onSubmitSuccess(savedSub); // Call the original success callback
      }
    } catch (error) {
      console.error("Error saving subcontractor:", error);
      toast.error("Failed to add subcontractor.");
      // Optionally keep dialog open on error?
    } finally {
      setIsSavingSub(false);
    }
  }, [user?.uid, closeQuickAddSubDialog, options.onSubmitSuccess]);

  return {
    isQuickAddSubDialogOpen,
    isSavingSub,
    openQuickAddSubDialog,
    closeQuickAddSubDialog,
    handleDialogSubmit, // Expose the submit handler
  };
}; 