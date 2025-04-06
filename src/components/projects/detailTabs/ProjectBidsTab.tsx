import React from 'react';
import {
  Box,
} from '@mui/material';
import { Bid } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import BidList from '../../bids/BidList';

interface ProjectBidsTabProps {
  projectId: string;
  bids: Bid[];
  recentBids: Bid[];
  theme: any;
  handleAddBid: () => void;
  handleEditBid: (bidId: string) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | string) => string;
}

const ProjectBidsTab: React.FC<ProjectBidsTabProps> = ({
  projectId,
  bids,
  recentBids,
  theme,
  handleAddBid,
  handleEditBid,
  formatCurrency,
  formatDate,
}) => {
  const { user } = useAuth();

  return (
    <Box>      
      {/* Display current project bids using the enhanced BidList component */}
      <BidList projectId={projectId} />
    </Box>
  );
};

export default ProjectBidsTab; 