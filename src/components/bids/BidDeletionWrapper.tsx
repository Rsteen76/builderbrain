import React, { useState } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Bid, BidSummary } from '../../types';
import BidDeletionDialog from '../dialogs/BidDeletionDialog';
import { deleteBid } from '../../utils/bidOperations';

import { logger } from '../../utils/logger';
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
  logger.log(`BidDeletionWrapper: Rendering for bid ID: ${bid.id}`);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

  const handleOpenDialog = () => {
    logger.log(`BidDeletionWrapper: handleOpenDialog called for bid ID: ${bid.id}`);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    logger.log(`BidDeletionWrapper: handleCloseDialog called for bid ID: ${bid.id}`);
    setDialogOpen(false);
  };

  const handleExpensesSelected = (expenseIds: string[]) => {
    logger.log(`BidDeletionWrapper: handleExpensesSelected called for bid ID: ${bid.id}`, expenseIds);
    setSelectedExpenses(expenseIds);
  };

  const handleConfirmDeletion = async () => {
    logger.log(`BidDeletionWrapper: handleConfirmDeletion called for bid ID: ${bid.id}`);
    setDeleting(true);
    let success = false;
    try {
      logger.log(`BidDeletionWrapper: Calling deleteBid utility for bid ID: ${bid.id}`);
      success = await deleteBid(bid.id, selectedExpenses);
      logger.log(`BidDeletionWrapper: deleteBid utility returned: ${success} for bid ID: ${bid.id}`);

      if (success) {
        logger.log(`BidDeletionWrapper: Deletion successful, calling onBidDeleted for bid ID: ${bid.id}`);
        onBidDeleted();
      } else {
        logger.error(`BidDeletionWrapper: deleteBid returned false for bid ID: ${bid.id}. Not calling onBidDeleted.`);
      }
    } catch (error) {
      success = false;
      logger.error(`BidDeletionWrapper: Error during handleConfirmDeletion for bid ID: ${bid.id}`, error);
    } finally {
      logger.log(`BidDeletionWrapper: handleConfirmDeletion finally block for bid ID: ${bid.id}. Success: ${success}`);
      setDeleting(false);
      setDialogOpen(false);
      logger.log(`BidDeletionWrapper: Dialog closed for bid ID: ${bid.id}`);
    }
  };

  logger.log(`BidDeletionWrapper: State before return for bid ID: ${bid.id} - dialogOpen: ${dialogOpen}, deleting: ${deleting}`);
  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Delete Bid">
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => { 
              logger.log("!!! BidDeletionWrapper ICON CLICKED !!!");
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
            logger.log("!!! BidDeletionWrapper BUTTON CLICKED !!!");
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
