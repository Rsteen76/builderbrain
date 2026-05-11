import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bid, BidSummary } from '../../types';
import BidDeletionDialog from './BidDeletionDialog';
import { deleteBid } from '../../utils/bidOperations';

import { logger } from '../../utils/logger';
// Define a global type for the event
declare global {
  interface WindowEventMap {
    'open-bid-delete-dialog': CustomEvent<Bid | BidSummary>;
  }
}

// Create a helper function to trigger the deletion
export const openBidDeleteDialog = (bid: Bid | BidSummary) => {
  logger.log(`Dispatching open-bid-delete-dialog event for bid ID: ${bid.id}`);
  window.dispatchEvent(new CustomEvent('open-bid-delete-dialog', { detail: bid }));
};

interface BidDeletePortalProps {
  userId: string;
  onBidDeleted?: (bidId: string) => void;
}

const BidDeletePortal: React.FC<BidDeletePortalProps> = ({ userId, onBidDeleted }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [currentBid, setCurrentBid] = useState<Bid | BidSummary | null>(null);

  // Listen for the custom event
  useEffect(() => {
    const handleOpenDeleteDialog = (event: CustomEvent<Bid | BidSummary>) => {
      logger.log('BidDeletePortal: Received open-bid-delete-dialog event', event.detail);
      setCurrentBid(event.detail);
      setDialogOpen(true);
    };

    // Add event listener
    window.addEventListener('open-bid-delete-dialog', handleOpenDeleteDialog as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('open-bid-delete-dialog', handleOpenDeleteDialog as EventListener);
    };
  }, []);

  const handleCloseDialog = () => {
    logger.log(`BidDeletePortal: handleCloseDialog called`);
    setDialogOpen(false);
    setSelectedExpenses([]);
  };

  const handleExpensesSelected = (expenseIds: string[]) => {
    logger.log(`BidDeletePortal: handleExpensesSelected called`, expenseIds);
    setSelectedExpenses(expenseIds);
  };

  const handleConfirmDeletion = async () => {
    if (!currentBid) return;
    
    logger.log(`BidDeletePortal: handleConfirmDeletion called for bid ID: ${currentBid.id}`);
    setDeleting(true);
    let success = false;
    
    try {
      logger.log(`BidDeletePortal: Calling deleteBid utility for bid ID: ${currentBid.id}`);
      success = await deleteBid(currentBid.id, selectedExpenses);
      logger.log(`BidDeletePortal: deleteBid utility returned: ${success} for bid ID: ${currentBid.id}`);

      if (success) {
        logger.log(`BidDeletePortal: Deletion successful for bid ID: ${currentBid.id}`);
        if (onBidDeleted) {
          onBidDeleted(currentBid.id);
        }
      } else {
        logger.error(`BidDeletePortal: deleteBid returned false for bid ID: ${currentBid.id}`);
      }
    } catch (error) {
      success = false;
      logger.error(`BidDeletePortal: Error during handleConfirmDeletion for bid ID: ${currentBid.id}`, error);
    } finally {
      logger.log(`BidDeletePortal: handleConfirmDeletion finally block. Success: ${success}`);
      setDeleting(false);
      setDialogOpen(false);
      setCurrentBid(null);
    }
  };

  // Don't render anything if the dialog isn't open
  if (!currentBid) return null;

  // Create portal to render dialog at the document root
  return createPortal(
    <BidDeletionDialog
      open={dialogOpen}
      onClose={handleCloseDialog}
      onConfirm={handleConfirmDeletion}
      bidId={currentBid.id}
      bidTitle={currentBid.title || 'Unnamed Bid'}
      userId={userId}
      onExpensesSelected={handleExpensesSelected}
    />,
    document.body
  );
};

export default BidDeletePortal; 