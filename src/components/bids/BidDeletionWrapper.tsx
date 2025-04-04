import React, { useState } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Bid } from '../../types';
import BidDeletionDialog from '../dialogs/BidDeletionDialog';
import { deleteBid } from '../../utils/bidOperations';

interface BidDeletionWrapperProps {
  bid: Bid;
  userId: string;
  onBidDeleted: () => void;
  variant?: 'icon' | 'button';
}

const BidDeletionWrapper: React.FC<BidDeletionWrapperProps> = ({
  bid,
  userId,
  onBidDeleted,
  variant = 'icon'
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleConfirmDeletion = async () => {
    setDeleting(true);
    try {
      // Delete the bid
      const success = await deleteBid(bid.id);
      if (success) {
        onBidDeleted();
      }
    } catch (error) {
      console.error('Error deleting bid:', error);
    } finally {
      setDeleting(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Delete Bid">
          <IconButton 
            size="small" 
            color="error" 
            onClick={handleOpenDialog}
            disabled={deleting}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />}
          onClick={handleOpenDialog}
          disabled={deleting}
        >
          Delete Bid
        </Button>
      )}

      <BidDeletionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDeletion}
        bidId={bid.id}
        bidTitle={bid.title || bid.scope || 'Unnamed Bid'}
        userId={userId}
      />
    </>
  );
};

export default BidDeletionWrapper; 