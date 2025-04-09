import { useState, useCallback } from 'react';
import { Phase } from '../types'; // Assuming a Phase type exists

// Define the return type for the hook
interface UsePhaseDetailsDialogReturn {
  isPhaseDetailsOpen: boolean;
  selectedPhase: Phase | null;
  openPhaseDetailsDialog: (phase: Phase) => void;
  closePhaseDetailsDialog: () => void;
}

/**
 * Hook to manage the state for a phase details dialog.
 */
export const usePhaseDetailsDialog = (): UsePhaseDetailsDialogReturn => {
  const [isPhaseDetailsOpen, setIsPhaseDetailsOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

  const openPhaseDetailsDialog = useCallback((phase: Phase) => {
    setSelectedPhase(phase);
    setIsPhaseDetailsOpen(true);
  }, []);

  const closePhaseDetailsDialog = useCallback(() => {
    setIsPhaseDetailsOpen(false);
    setSelectedPhase(null); // Clear selection on close
  }, []);

  return {
    isPhaseDetailsOpen,
    selectedPhase,
    openPhaseDetailsDialog,
    closePhaseDetailsDialog,
  };
}; 