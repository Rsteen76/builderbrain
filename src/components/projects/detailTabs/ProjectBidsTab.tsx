import React from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import BidList from '../../bids/BidList';

const ProjectBidsTab: React.FC = () => {
  const {
    projectId,
    bids,
    loading,
    error,
    openNewBidDialog,
    refreshAllProjectData,
  } = useProjectDetail();

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />;
  }
  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>Error loading bid data: {error}</Alert>;
  }
  if (!projectId) {
    return <Alert severity="warning" sx={{ mt: 2 }}>Project context not available.</Alert>;
  }

  const handleAddBidClick = () => {
    openNewBidDialog({ projectId });
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Project Bids</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddBidClick}
          sx={{ borderRadius: 1.5 }}
        >
          Add New Bid
        </Button>
      </Box>
      
      <BidList
        projectId={projectId}
        hideHeader={true}
        initialBids={bids}
        onRefreshProjectBids={refreshAllProjectData}
      />
    </Box>
  );
};

export default ProjectBidsTab;
