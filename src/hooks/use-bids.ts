import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidService } from '../api';
import { Bid, BidStatus } from '../types';

export const BIDS_QUERY_KEY = 'bids';

export function useBids(userId: string, status?: BidStatus) {
  return useQuery({
    queryKey: [BIDS_QUERY_KEY, userId, status],
    queryFn: async () => {
      const response = await bidService.getBidsByUser(userId, status);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to fetch bids');
      }

      return response.data;
    },
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProjectBids(projectId: string) {
  return useQuery({
    queryKey: [BIDS_QUERY_KEY, 'project', projectId],
    queryFn: async () => {
      const response = await bidService.getBidsByProject(projectId);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch bids for project ${projectId}`);
      }

      return response.data;
    },
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSubcontractorBids(subcontractorId: string, status?: BidStatus) {
  return useQuery({
    queryKey: [BIDS_QUERY_KEY, 'subcontractor', subcontractorId, status],
    queryFn: async () => {
      const response = await bidService.getBidsBySubcontractor(subcontractorId, status);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch bids for subcontractor ${subcontractorId}`);
      }

      return response.data;
    },
    enabled: !!subcontractorId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBid(bidId: string) {
  return useQuery({
    queryKey: [BIDS_QUERY_KEY, bidId],
    queryFn: async () => {
      const response = await bidService.getById(bidId);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || `Failed to fetch bid with ID ${bidId}`);
      }

      return response.data;
    },
    enabled: !!bidId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bidData: Omit<Bid, 'id'>) => {
      const response = await bidService.create(bidData);

      if (response.status === 'error' || !response.data) {
        throw new Error(response.error || 'Failed to create bid');
      }

      return response.data;
    },
    onSuccess: (newBid: Bid) => {
        // Invalidate the bids list query to refetch
        queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, newBid.userId] });

        // Invalidate project bids
        queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, 'project', newBid.projectId] });

        // If there's a subcontractorId, invalidate that query too
        if (newBid.subcontractorId) {
          queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, 'subcontractor', newBid.subcontractorId] });
        }

        // Add the new bid to the cache
        queryClient.setQueryData(
          [BIDS_QUERY_KEY, newBid.id],
          newBid
        );
    },
  });
}

export function useUpdateBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Bid> }) => {
      const response = await bidService.update(id, data);

      if (response.status === 'error') {
        throw new Error(response.error || `Failed to update bid with ID ${id}`);
      }

      // Since the update endpoint doesn't return the updated bid,
      // we need to fetch it to update the cache
      const updatedBid = await bidService.getById(id);

      if (updatedBid.status === 'error' || !updatedBid.data) {
        throw new Error(updatedBid.error || `Failed to fetch updated bid with ID ${id}`);
      }

      return updatedBid.data;
    },
    onSuccess: (updatedBid: Bid) => {
        // Update the bid in the cache
        queryClient.setQueryData(
          [BIDS_QUERY_KEY, updatedBid.id],
          updatedBid
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, updatedBid.userId] });
        queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, 'project', updatedBid.projectId] });

        if (updatedBid.subcontractorId) {
          queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, 'subcontractor', updatedBid.subcontractorId] });
        }
    },
  });
}

export function useDeleteBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bid }: { id: string; bid: Bid }) => {
      const response = await bidService.delete(id);

      if (response.status === 'error') {
        throw new Error(response.error || `Failed to delete bid with ID ${id}`);
      }

      return { id, bid };
    },
    onSuccess: ({ id, bid }: { id: string; bid: Bid }) => {
        // Remove the bid from the cache
        queryClient.removeQueries({ queryKey: [BIDS_QUERY_KEY, id] });

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, bid.userId] });
        queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, 'project', bid.projectId] });

        if (bid.subcontractorId) {
          queryClient.invalidateQueries({ queryKey: [BIDS_QUERY_KEY, 'subcontractor', bid.subcontractorId] });
        }
    },
  });
}
