import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileCopy as DuplicateIcon,
} from '@mui/icons-material';
import { LineItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Line item categories (local definition is fine, ensure values match LineItem['category'])
const categories: { value: LineItem['category']; label: string }[] = [
  { value: 'material', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'permit', label: 'Permit' },
  { value: 'other', label: 'Other' },
];

// Common unit options
const UNIT_OPTIONS = [
  'hours',
  'days',
  'weeks',
  'each',
  'ft',
  'sq ft',
  'cu ft',
  'yards',
  'sq yards',
  'cu yards',
  'gallons',
  'linear ft',
  'lump sum',
];

interface LineItemsTableProps {
  lineItems: LineItem[];
  onChange: (updatedItems: LineItem[]) => void;
  editable?: boolean;
  showTotals?: boolean;
}

const LineItemsTable: React.FC<LineItemsTableProps> = ({
  lineItems,
  onChange,
  editable = true,
  showTotals = true,
}) => {
  const theme = useTheme();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LineItem | null>(null);

  // Calculate totals by category
  const calculateCategoryTotals = () => {
    const totals: Record<LineItem['category'], number> = {
      material: 0,
      labor: 0,
      equipment: 0,
      subcontractor: 0,
      permit: 0,
      other: 0,
    };

    lineItems.forEach(item => {
      totals[item.category] += item.totalCost || 0;
    });

    return totals;
  };

  const categoryTotals = calculateCategoryTotals();
  const grandTotal = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  // Handlers
  const handleEditClick = (lineItem: LineItem) => {
    setEditingRowId(lineItem.id);
    setEditForm({ ...lineItem });
  };

  const handleSaveClick = () => {
    if (!editForm) return;

    const newLineItems = lineItems.map(item =>
      item.id === editingRowId ? editForm : item
    );

    onChange(newLineItems);
    setEditingRowId(null);
    setEditForm(null);
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditForm(null);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    const newLineItems = lineItems.filter(item => item.id !== itemToDelete);
    onChange(newLineItems);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setItemToDelete(null);
  };

  const handleDuplicateItem = (item: LineItem) => {
    // Create a duplicate with a new ID
    const { id, ...itemWithoutId } = item;
    const newItem: LineItem = {
      ...itemWithoutId,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
      description: `${item.description} (Copy)`,
    };

    onChange([...lineItems, newItem]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof LineItem) => {
    if (!editForm) return;
    const value = e.target.value;
    let updatedValue: string | number = value;
    if (field === 'quantity' || field === 'unitCost' || field === 'totalCost') {
      updatedValue = parseFloat(value) || 0;
    }
    
    const updatedItem = { 
      ...editForm, 
      [field]: updatedValue 
    } as LineItem; // Ensure type consistency

    // Recalculate totalCost if quantity or unitCost changed
    if ((field === 'quantity' || field === 'unitCost') && typeof updatedItem.quantity === 'number' && typeof updatedItem.unitCost === 'number') {
        updatedItem.totalCost = updatedItem.quantity * updatedItem.unitCost;
    }
    
    setEditForm(updatedItem);
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
      if (!editForm) return;
      const { name, value } = e.target;
      if (name) {
          setEditForm(prev => {
              if (!prev) return null;
              // Ensure the value matches the LineItem['category'] type
              return { ...prev, [name]: value as LineItem['category'] }; 
          });
      }
  };

  const handleAddCategory = (category: LineItem['category']) => {
    const newItem: LineItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      description: '',
      quantity: 1,
      unit: UNIT_OPTIONS[0],
      unitCost: 0,
      totalCost: 0,
      notes: '',
    };

    onChange([...lineItems, newItem]);
    handleEditClick(newItem);
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: 'background.neutral' }}>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Unit Cost</TableCell>
            <TableCell align="right">Total Cost</TableCell>
            {editable && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.isArray(lineItems) && lineItems.length > 0 ? (
            lineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.category ? String(item.category) : 'N/A'}</TableCell>
                <TableCell>{item.description || 'N/A'}</TableCell>
                <TableCell align="right">{typeof item.quantity === 'number' ? item.quantity.toString() : '0'}</TableCell>
                <TableCell>{item.unit || 'N/A'}</TableCell>
                <TableCell align="right">{typeof item.unitCost === 'number' ? formatCurrency(item.unitCost) : '$0.00'}</TableCell>
                <TableCell align="right">{typeof item.totalCost === 'number' ? formatCurrency(item.totalCost) : '$0.00'}</TableCell>
                {editable && (
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(item.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={editable ? 7 : 6} align="center">
                No line items added
              </TableCell>
            </TableRow>
          )}
          {Array.isArray(lineItems) && lineItems.length > 0 && (
            <TableRow sx={{ '& td': { fontWeight: 'bold', py: 1.5 } }}>
              <TableCell colSpan={5} align="right">
                Total:
              </TableCell>
              <TableCell align="right">
                {formatCurrency(lineItems.reduce((sum, item) => sum + (typeof item.totalCost === 'number' ? item.totalCost : 0), 0))}
              </TableCell>
              {editable && <TableCell />}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default LineItemsTable; 