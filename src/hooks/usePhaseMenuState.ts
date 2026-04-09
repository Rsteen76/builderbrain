import React, { useState, useCallback } from 'react';

interface UsePhaseMenuStateReturn {
  // Action Menu State & Handlers
  actionAnchorEl: null | HTMLElement;
  actionMenuPhaseId: string | null;
  handleActionMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  handleActionMenuClose: () => void;
  isActionMenuOpen: boolean; // Helper boolean

  // Status Menu State & Handlers
  statusAnchorEl: null | HTMLElement;
  statusMenuPhaseId: string | null;
  handleStatusMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  handleStatusMenuClose: () => void;
  isStatusMenuOpen: boolean; // Helper boolean
}

export const usePhaseMenuState = (): UsePhaseMenuStateReturn => {
  // State for Action Menu
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [actionMenuPhaseId, setActionMenuPhaseId] = useState<string | null>(null);

  // State for Status Menu
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [statusMenuPhaseId, setStatusMenuPhaseId] = useState<string | null>(null);

  // Action Menu Handlers
  const handleActionMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, phaseId: string) => {
    event.stopPropagation(); // Prevent other clicks
    setActionAnchorEl(event.currentTarget);
    setActionMenuPhaseId(phaseId);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setActionAnchorEl(null);
    setActionMenuPhaseId(null);
  }, []);

  // Status Menu Handlers
  const handleStatusMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, phaseId: string) => {
    event.stopPropagation(); // Prevent other clicks
    setStatusAnchorEl(event.currentTarget);
    setStatusMenuPhaseId(phaseId);
  }, []);

  const handleStatusMenuClose = useCallback(() => {
    setStatusAnchorEl(null);
    setStatusMenuPhaseId(null);
  }, []);

  return {
    actionAnchorEl,
    actionMenuPhaseId,
    handleActionMenuOpen,
    handleActionMenuClose,
    isActionMenuOpen: Boolean(actionAnchorEl), // Derive boolean flag

    statusAnchorEl,
    statusMenuPhaseId,
    handleStatusMenuOpen,
    handleStatusMenuClose,
    isStatusMenuOpen: Boolean(statusAnchorEl), // Derive boolean flag
  };
}; 
