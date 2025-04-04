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
  console.log(`BidDeletionWrapper: Rendering for bid ID: ${bid.id}`);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const handleOpenDialog = () => {
    console.log(`BidDeletionWrapper: handleOpenDialog called for bid ID: ${bid.id}`);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    console.log(`BidDeletionWrapper: handleCloseDialog called for bid ID: ${bid.id}`);
    setDialogOpen(false);
  };

  const handleExpensesSelected = (expenseIds: string[]) => {
    console.log(`BidDeletionWrapper: handleExpensesSelected called for bid ID: ${bid.id}`, expenseIds);
    setSelectedExpenses(expenseIds);
  };

  const handleConfirmDeletion = async () => {
    console.log(`BidDeletionWrapper: handleConfirmDeletion called for bid ID: ${bid.id}`);
    setDeleting(true);
    let success = false;
    try {
      console.log(`BidDeletionWrapper: Calling deleteBid utility for bid ID: ${bid.id}`);
      success = await deleteBid(bid.id, selectedExpenses);
      console.log(`BidDeletionWrapper: deleteBid utility returned: ${success} for bid ID: ${bid.id}`);

      if (success) {
        console.log(`BidDeletionWrapper: Deletion successful, calling onBidDeleted for bid ID: ${bid.id}`);
        onBidDeleted();
      } else {
        console.error(`BidDeletionWrapper: deleteBid returned false for bid ID: ${bid.id}. Not calling onBidDeleted.`);
      }
    } catch (error) {
      success = false;
      console.error(`BidDeletionWrapper: Error during handleConfirmDeletion for bid ID: ${bid.id}`, error);
    } finally {
      console.log(`BidDeletionWrapper: handleConfirmDeletion finally block for bid ID: ${bid.id}. Success: ${success}`);
      setDeleting(false);
      setDialogOpen(false);
      console.log(`BidDeletionWrapper: Dialog closed for bid ID: ${bid.id}`);
    }
  };

  console.log(`BidDeletionWrapper: State before return for bid ID: ${bid.id} - dialogOpen: ${dialogOpen}, deleting: ${deleting}`);
  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Delete Bid">
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => { 
              console.log("!!! BidDeletionWrapper ICON CLICKED !!!"); 
              handleOpenDialog(); 
            }}
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
          onClick={() => { 
            console.log("!!! BidDeletionWrapper BUTTON CLICKED !!!"); 
            handleOpenDialog(); 
          }}
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