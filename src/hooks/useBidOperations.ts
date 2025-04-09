import { useCallback, useState } from 'react';
import { BidService } from '../services/bid'; // Correct path
import { Bid, BidSummary } from '../types'; // Assuming Bid types exist
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';
import { openBidDeleteDialog } from '../components/dialogs/BidDeletePortal';

// Define options/arguments for the hook
interface UseBidOperationsOptions {
  projectId?: string; // Optional project context
  // Callback after a successful operation (e.g., delete, duplicate)
  onBidUpdate?: (affectedBidId: string, operation: 'delete' | 'duplicate' | 'update') => void; 
}

// Define the return type of the hook
interface UseBidOperationsReturn {
  isOperating: boolean; // Generic loading state for any operation
  // deleteBid: (bidId: string) => Promise<void>; // Example, might conflict with global portal
  requestDeleteBid: (bid: BidSummary | Bid) => void; // Uses the portal system
  duplicateBid: (bidToDuplicate: BidSummary | Bid) => Promise<void>;
}

/**
 * Hook to manage operations related to bids (excluding form submission).
 */
export const useBidOperations = (
  options: UseBidOperationsOptions = {}
): UseBidOperationsReturn => {
  const { user } = useAuth();
  const [isOperating, setIsOperating] = useState(false);

  // Use the portal system for deletion requests
  const requestDeleteBid = useCallback((bid: BidSummary | Bid) => {
    if (!user?.uid) {
      toast.error('Authentication required.');
      return;
    }
    // The portal handles confirmation and actual deletion
    openBidDeleteDialog(bid);
  }, [user?.uid]);

  // Function to duplicate a bid
  const duplicateBid = useCallback(async (bidToDuplicate: BidSummary | Bid) => {
    if (!user?.uid) {
      toast.error('Authentication required to duplicate bid.');
      return;
    }
    
    setIsOperating(true);
    try {
      let fullBidDetails: Bid | null = null; // Allow null
      if (!('paymentSchedule' in bidToDuplicate)) {
        fullBidDetails = await BidService.getBid(user.uid, bidToDuplicate.id);
        // Check for null *after* the await
        if (!fullBidDetails) { 
          throw new Error('Original bid not found for duplication.');
        }
      } else {
        fullBidDetails = bidToDuplicate as Bid;
      }

      // Now fullBidDetails is guaranteed to be a Bid object here
      const newBidData: Partial<Bid> = {
        ...fullBidDetails, // Safe to spread now
        id: undefined,
        title: `${fullBidDetails.title || 'Bid'} (Copy)`,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      delete newBidData.id;
      
      const newBid = await BidService.createBid(user.uid, newBidData as Omit<Bid, 'id'>);
      toast.success('Bid duplicated successfully!');
      if (options.onBidUpdate) {
        options.onBidUpdate(newBid.id, 'duplicate');
      }
    } catch (error) {
      console.error('Error duplicating bid:', error);
      toast.error('Failed to duplicate bid.');
    } finally {
      setIsOperating(false);
    }
  }, [user?.uid, options.onBidUpdate]);

  return {
    isOperating,
    requestDeleteBid,
    duplicateBid,
  };
}; 