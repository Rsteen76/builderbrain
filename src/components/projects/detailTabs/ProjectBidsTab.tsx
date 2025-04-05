import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemText,
  alpha,
  Theme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Compare as CompareIcon,
  Description as DocumentIcon,
  Gavel as BidsIcon,
} from '@mui/icons-material';
import { Bid, BidPaymentStage } from '../../../types';
import { openBidDeleteDialog } from '../../dialogs/BidDeletePortal';
import { useAuth } from '../../../hooks/useAuth';
import BidList from '../../bids/BidList';

interface ProjectBidsTabProps {
  projectId: string;
  bids: Bid[];
  recentBids: Bid[];
  theme: Theme;
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

  const handleDeleteBid = (bidId: string) => {
    const bidToDelete = bids.find(bid => bid.id === bidId);
    if (bidToDelete) {
      openBidDeleteDialog(bidToDelete);
    }
  };

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
      <BidList projectId={projectId} />
      
    </Box>
  );
};

export default ProjectBidsTab; 