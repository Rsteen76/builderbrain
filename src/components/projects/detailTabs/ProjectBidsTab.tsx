import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Project Bids</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddBid}
          sx={{ borderRadius: 1.5 }}
        >
          Add New Bid
        </Button>
      </Box>
      
      {/* Display current project bids using the enhanced BidList component */}
      <BidList projectId={projectId} hideHeader={true} />
    </Box>
  );
};

export default ProjectBidsTab; 