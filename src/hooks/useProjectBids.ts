import { useState, useEffect, useCallback } from 'react';
import { BidService } from '../services/bid';
import { Bid } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseProjectBidsResult {
  bids: Bid[];
  loading: boolean;
  error: string | null;
  fetchBids: () => Promise<void>;
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
}

/**
 * Custom hook to fetch and manage project bids.
 * Also handles real-time updates when bids are deleted via a global event.
 * @param projectId The ID of the project whose bids are to be fetched.
 * @returns An object containing bids, loading state, error state, and a refetch function.
 */
export const useProjectBids = (projectId: string | undefined): UseProjectBidsResult => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    if (!projectId || !user?.uid) {
      setBids([]);
      setLoading(false);
      setError(projectId ? 'User not authenticated' : 'Project ID is missing');
      return;
    }

    console.log(`useProjectBids: Fetching bids for project ID: ${projectId}`);
    setLoading(true);
    setError(null);

    try {
      const bidFilters = { projectId };
      const bidData = await BidService.getBids(user.uid, bidFilters);
      console.log(`useProjectBids: Successfully fetched ${bidData.length} bids.`);
      // Ensure the state is typed as Bid[]
      setBids(bidData);
    } catch (err) {
      console.error('useProjectBids: Error fetching bids:', err);
      setError('Failed to load project bids');
      setBids([]); // Clear bids on error
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.uid]); // useCallback dependencies

  // Effect for initial fetch
  useEffect(() => {
    fetchBids();
  }, [fetchBids]); // useEffect depends on the memoized fetchBids

  // Effect for handling 'bid-deleted' events
  useEffect(() => {
    const handleBidDeletedEvent = (event: CustomEvent<{ bidId: string }>) => {
      const { bidId } = event.detail;
      console.log(`useProjectBids: Received bid-deleted event for bid ID: ${bidId}`);
      setBids(prevBids => {
        const newBids = prevBids.filter(b => b.id !== bidId);
        console.log(`useProjectBids: Updated bids list. Removed ID: ${bidId}. New count: ${newBids.length}`);
        return newBids;
      });
      // Optionally, trigger a notification or other side effect here if needed,
      // though typically UI notifications belong in the component layer.
    };

    // Add event listener
    // Type assertion needed as addEventListener expects EventListener type
    window.addEventListener('bid-deleted', handleBidDeletedEvent as EventListener);
    console.log('useProjectBids: Added bid-deleted event listener.');

    // Cleanup: remove event listener
    return () => {
      window.removeEventListener('bid-deleted', handleBidDeletedEvent as EventListener);
      console.log('useProjectBids: Removed bid-deleted event listener.');
    };
  }, []); // Empty dependency array ensures this runs only once on mount/unmount

  return { bids, loading, error, fetchBids, setBids };
};