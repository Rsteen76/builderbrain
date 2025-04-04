import React, { useState } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Bid, BidSummary } from '../../types';
import BidDeletionDialog from '../dialogs/BidDeletionDialog';
import { deleteBid } from '../../utils/bidOperations';

interface BidDeletionWrapperProps {
  bid: Bid | BidSummary;
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
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleExpensesSelected = (expenseIds: string[]) => {
    setSelectedExpenses(expenseIds);
  };

  const handleConfirmDeletion = async () => {
    setDeleting(true);
    try {
      // Delete the bid and its selected expenses
      const success = await deleteBid(bid.id, selectedExpenses);
      if (success) {
        onBidDeleted();
      } else {
        console.error('Failed to delete bid');
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
        bidTitle={bid.title || 'Unnamed Bid'}
        userId={userId}
        onExpensesSelected={handleExpensesSelected}
      />
    </>
  );
};

export default BidDeletionWrapper; 