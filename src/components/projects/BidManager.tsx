import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Alert, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectService, Project } from '../../services/project';
import { Bid, BidStatus } from '../../types/project.types';
import BidFormModal from './BidFormModal'; // Import the modal

interface BidManagerProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

// Helper to get bid status chip color
const getBidStatusColor = (status: BidStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'Submitted':
    case 'Pending':
        return 'info';
    case 'Accepted':
        return 'success';
    case 'Rejected':
        return 'error';
    case 'Needs Revision':
        return 'warning';
    default: 
        return 'default';
  }
};

const BidManager: React.FC<BidManagerProps> = ({ project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bids = project.bids || [];

  const handleOpenAddModal = () => {
    setEditingBid(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleOpenEditModal = (bid: Bid) => {
    setEditingBid(bid);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBid(null);
  };

  const handleFormSubmit = async (submittedBid: Bid) => {
    console.log('Bid Form submitted:', submittedBid);
    setLoading(true);
    setError(null);
    let updatedBids;

    if (editingBid) {
      // Edit existing bid
      updatedBids = bids.map(b => (b.id === submittedBid.id ? submittedBid : b));
    } else {
      // Add new bid
      updatedBids = [...bids, submittedBid];
    }

    try {
      const updatedProjectData: Partial<Project> = {
        bids: updatedBids,
      };
      await ProjectService.updateProject(project.id!, updatedProjectData);
      onProjectUpdate({ ...project, bids: updatedBids });
      handleCloseModal();
    } catch (err) {
      console.error("Error saving bid:", err);
      setError(err instanceof Error ? err.message : "Failed to save bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bidId: string) => {
    if (!window.confirm('Are you sure you want to delete this bid?')) {
      return;
    }
    console.log('Delete bid with ID:', bidId);
    setLoading(true);
    setError(null);

    const updatedBids = bids.filter(b => b.id !== bidId);

    try {
      const updatedProjectData: Partial<Project> = {
        bids: updatedBids,
      };
      await ProjectService.updateProject(project.id!, updatedProjectData);
      onProjectUpdate({ ...project, bids: updatedBids });
    } catch (err) {
      console.error("Error deleting bid:", err);
      setError(err instanceof Error ? err.message : "Failed to delete bid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Bids</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={loading}>
          Add Bid
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Contractor/Supplier</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No bids added yet.
                </TableCell>
              </TableRow>
            ) : (
              bids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>{bid.contractorName}</TableCell>
                  <TableCell>{bid.category || '-'}</TableCell>
                  <TableCell align="right">${bid.bidAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Chip label={bid.status} color={getBidStatusColor(bid.status)} size="small" />
                  </TableCell>
                  <TableCell>{formatDate(bid.submittedDate)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenEditModal(bid)} disabled={loading}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(bid.id)} disabled={loading}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Render the BidFormModal */}
      <BidFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingBid}
      />
    </Paper>
  );
};

export default BidManager; 