import React from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// Import other icons as needed

interface BidListActionsProps {
  onOpenNewBidDialog: () => void;
  // Add other action handlers as props, e.g.:
  // onToggleView?: () => void;
  // onExport?: () => void;
}

const BidListActions: React.FC<BidListActionsProps> = ({
  onOpenNewBidDialog,
  // ... other props
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onOpenNewBidDialog}
      >
        Add New Bid
      </Button>
      {/* Add other action buttons here */}
    </Box>
  );
};

export default BidListActions; 