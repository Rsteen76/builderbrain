import React from 'react';
import {
  Box,
  Button,
  Tooltip
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  ReceiptLong as ReceiptLongIcon,
  Handshake as HandshakeIcon,
} from '@mui/icons-material';

interface PhaseCardActionsProps {
  phaseId: string;
  onOpenQuickExpenseDialog: (phaseId: string) => void;
  onOpenQuickBidDialog: (phaseId: string) => void;
  onViewPhaseDetails: (phaseId: string) => void;
}

const PhaseCardActions: React.FC<PhaseCardActionsProps> = ({
  phaseId,
  onOpenQuickExpenseDialog,
  onOpenQuickBidDialog,
  onViewPhaseDetails,
}) => {
  return (
    <Box
      sx={{
        mt: 'auto', // Push actions to the bottom
        pt: 1,        // Add some padding top
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: theme => `1px solid ${theme.palette.divider}` // Add separator line
      }}
    >
      <Box>
        <Tooltip title="Add Quick Expense" arrow>
          <Button 
            size="small" 
            startIcon={<ReceiptLongIcon fontSize="small" />} 
            onClick={() => onOpenQuickExpenseDialog(phaseId)} 
            sx={{ fontSize: '0.75rem', mr: 0.5, color: 'text.secondary' }} 
          >
            Expense
          </Button>
        </Tooltip>
        <Tooltip title="Add Quick Bid" arrow>
          <Button 
            size="small" 
            startIcon={<HandshakeIcon fontSize="small" />} 
            onClick={() => onOpenQuickBidDialog(phaseId)} 
            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
          >
            Bid
          </Button>
        </Tooltip>
      </Box>
      <Button
        size="small"
        endIcon={<ChevronRightIcon fontSize="small" />}
        onClick={() => onViewPhaseDetails(phaseId)}
        sx={{ fontSize: '0.75rem' }}
      >
        Details
      </Button>
    </Box>
  );
};

export default PhaseCardActions; 