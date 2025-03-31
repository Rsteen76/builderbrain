import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, CircularProgress, Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProjectService, Project } from '../../services/project';
import { LineItem } from '../../types/project.types';
import LineItemFormModal from './LineItemFormModal';

interface LineItemManagerProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

const LineItemManager: React.FC<LineItemManagerProps> = ({ project, onProjectUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineItems = project.lineItems || [];

  const calculateTotalEstimate = () => {
    return lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleOpenEditModal = (item: LineItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSubmit = async (submittedItem: LineItem) => {
    console.log('Form submitted:', submittedItem);
    setLoading(true);
    setError(null);
    let updatedLineItems;

    if (editingItem) {
      updatedLineItems = lineItems.map(item =>
        item.id === submittedItem.id ? submittedItem : item
      );
    } else {
      updatedLineItems = [...lineItems, submittedItem];
    }

    try {
      const updatedProjectData: Partial<Project> = {
        lineItems: updatedLineItems,
      };
      await ProjectService.updateProject(project.id!, updatedProjectData);
      onProjectUpdate({ ...project, lineItems: updatedLineItems });
      handleCloseModal();
    } catch (err) {
      console.error("Error saving line item:", err);
      setError(err instanceof Error ? err.message : "Failed to save line item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this line item?')) {
      return;
    }
    console.log('Delete item with ID:', itemId);
    setLoading(true);
    setError(null);

    const updatedLineItems = lineItems.filter(item => item.id !== itemId);

    try {
      const updatedProjectData: Partial<Project> = {
        lineItems: updatedLineItems,
      };
      await ProjectService.updateProject(project.id!, updatedProjectData);
      onProjectUpdate({ ...project, lineItems: updatedLineItems });
    } catch (err) {
      console.error("Error deleting line item:", err);
      setError(err instanceof Error ? err.message : "Failed to delete line item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Estimate / Line Items</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={loading}>
          Add Line Item
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell align="right">Total Cost</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lineItems.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No line items added yet.
                </TableCell>
              </TableRow>
            ) : (
              lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell align="right">${item.unitCost?.toFixed(2)}</TableCell>
                  <TableCell align="right">${item.totalCost?.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenEditModal(item)} disabled={loading}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)} disabled={loading}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow sx={{ '& > *': { borderTop: '2px solid', borderColor: 'divider' } }}>
              <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold' }}>
                Total Estimated Cost:
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                ${calculateTotalEstimate().toFixed(2)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <LineItemFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />
    </Paper>
  );
};

export default LineItemManager; 