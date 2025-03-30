import React from 'react';
import BidList from './BidList';
import { Box } from '@mui/material';

const Bids: React.FC = () => {
  return (
    <Box sx={{ height: '100%' }}>
      <BidList />
    </Box>
  );
};

export default Bids; 