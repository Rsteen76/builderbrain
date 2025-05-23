import { useState, useCallback } from 'react';
import { ProjectPhase } from '../types'; // Assuming a Phase type exists

// Define the return type for the hook
interface UsePhaseDetailsDialogReturn {
  isPhaseDetailsOpen: boolean;
  selectedPhase: ProjectPhase | null;
  openPhaseDetailsDialog: (phase: ProjectPhase) => void;
  closePhaseDetailsDialog: () => void;
}

/**
 * Hook to manage the state for a phase details dialog.
 */
export const usePhaseDetailsDialog = (): UsePhaseDetailsDialogReturn => {
  const [isPhaseDetailsOpen, setIsPhaseDetailsOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);

  const openPhaseDetailsDialog = useCallback((phase: ProjectPhase) => {
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