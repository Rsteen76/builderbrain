import { useState, useCallback } from 'react';

interface UsePhaseExpandStateReturn {
  expandedPhases: Record<string, boolean>;
  handleToggleExpand: (phaseId: string) => void;
}

export const usePhaseExpandState = (): UsePhaseExpandStateReturn => {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  const handleToggleExpand = useCallback((phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  }, []);

  return {
    expandedPhases,
    handleToggleExpand,
  };
}; 