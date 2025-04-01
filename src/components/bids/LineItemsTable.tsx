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
    <>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell width="30%">Description</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Unit</TableCell>
              <TableCell align="right">Price per Unit</TableCell>
              <TableCell align="right">Total</TableCell>
              {editable && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(categories).map(([category, { label }]) => {
              const categoryItems = lineItems.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <React.Fragment key={category}>
                  {/* Category header */}
                  <TableRow 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    <TableCell colSpan={editable ? 6 : 5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {label} ({categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'})
                        </Typography>
                        {showTotals && (
                          <Typography variant="subtitle1" fontWeight="bold">
                            Subtotal: {formatCurrency(categoryTotals[category as LineItem['category']])}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Category items */}
                  {categoryItems.map((item: LineItem) => {
                    const isEditing = editable && editingRowId === item.id;
                    return (
                      <TableRow 
                        key={item.id}
                        sx={{ 
                          bgcolor: isEditing ? alpha(theme.palette.primary.main, 0.1) : 'inherit',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              name="description"
                              value={editForm?.description || ''}
                              onChange={(e) => handleInputChange(e, 'description')}
                              fullWidth
                              size="small"
                              multiline
                              maxRows={3}
                            />
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography>{item.description || '(No description)'}</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <TextField
                              name="quantity"
                              value={editForm?.quantity || 0}
                              onChange={(e) => handleInputChange(e, 'quantity')}
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              size="small"
                              sx={{ width: 100 }}
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <Select
                              name="unit"
                              value={editForm?.unit || ''}
                              onChange={(e) => handleSelectChange(e)}
                              size="small"
                              sx={{ width: 100 }}
                              displayEmpty
                            >
                              {UNIT_OPTIONS.map(unit => (
                                <MenuItem key={unit} value={unit}>
                                  {unit}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            item.unit
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <TextField
                              name="unitCost"
                              value={editForm?.unitCost || 0}
                              onChange={(e) => handleInputChange(e, 'unitCost')}
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              size="small"
                              sx={{ width: 120 }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          ) : (
                            formatCurrency(item.unitCost || 0)
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            formatCurrency(editForm?.totalCost || 0)
                          ) : (
                            formatCurrency(item.totalCost || 0)
                          )}
                        </TableCell>
                        {editable && (
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {isEditing ? (
                                <>
                                  <Tooltip title="Save">
                                    <IconButton 
                                      size="small" 
                                      onClick={handleSaveClick}
                                      color="primary"
                                    >
                                      <SaveIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton 
                                      size="small" 
                                      onClick={handleCancelClick}
                                      color="default"
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip title="Edit">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleEditClick(item)}
                                      color="primary"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Duplicate">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDuplicateItem(item)}
                                      color="default"
                                    >
                                      <DuplicateIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteClick(item.id)}
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Grand total row */}
            {showTotals && (
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell colSpan={3} />
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold" color="common.white">
                    GRAND TOTAL
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6" fontWeight="bold" color="common.white">
                    {formatCurrency(grandTotal)}
                  </Typography>
                </TableCell>
                {editable && <TableCell />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* "Add item" buttons */}
      {editable && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Add New Line Items:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map(category => (
              <Button
                key={category.value}
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAddCategory(category.value as LineItem['category'])}
                sx={{ mb: 1 }}
              >
                {category.label}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!itemToDelete}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this line item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LineItemsTable; 