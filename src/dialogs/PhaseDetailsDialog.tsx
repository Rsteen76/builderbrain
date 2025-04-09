import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Phase } from '../types'; // Adjust path if needed

interface PhaseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  phase: Phase | null;
}

const PhaseDetailsDialog: React.FC<PhaseDetailsDialogProps> = ({
  open,
  onClose,
  phase,
}) => {
  if (!phase) {
    return null; // Don't render if no phase is selected
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Phase Details: {phase.name}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Status:</Typography>
          <Typography>{phase.status || 'N/A'}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Description:</Typography>
          <Typography>{phase.description || 'No description provided.'}</Typography>
        </Box>
        {/* Add more phase details here as needed */}
        {/* Example: Dates, Budget, Actual Cost, Tasks, etc. */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {/* Add other actions like Edit if needed */}
      </DialogActions>
    </Dialog>
  );
};

export default PhaseDetailsDialog; 