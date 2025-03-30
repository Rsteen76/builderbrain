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
import { BidLineItem, LineItemCategory } from '../../services/bid';
import { formatCurrency } from '../../utils/formatters';

// Line item categories with labels
const CATEGORY_OPTIONS: { value: LineItemCategory; label: string }[] = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'profit', label: 'Profit' },
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
  lineItems: BidLineItem[];
  onChange: (lineItems: BidLineItem[]) => void;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BidLineItem | null>(null);

  // Calculate totals by category
  const calculateCategoryTotals = () => {
    const totals: Record<LineItemCategory, number> = {
      labor: 0,
      materials: 0,
      equipment: 0,
      subcontractor: 0,
      overhead: 0,
      profit: 0,
      other: 0,
    };

    lineItems.forEach(item => {
      totals[item.category] += item.total;
    });

    return totals;
  };

  const categoryTotals = calculateCategoryTotals();
  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

  // Handlers
  const handleEditClick = (lineItem: BidLineItem) => {
    setEditingId(lineItem.id);
    setEditForm({ ...lineItem });
  };

  const handleSaveClick = () => {
    if (!editForm) return;

    const newLineItems = lineItems.map(item =>
      item.id === editingId ? editForm : item
    );

    onChange(newLineItems);
    setEditingId(null);
    setEditForm(null);
  };

  const handleCancelClick = () => {
    setEditingId(null);
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

  const handleDuplicateItem = (item: BidLineItem) => {
    // Create a duplicate with a new ID
    const { id, ...itemWithoutId } = item;
    const newItem: BidLineItem = {
      ...itemWithoutId,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
      description: `${item.description} (Copy)`,
    };

    onChange([...lineItems, newItem]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editForm) return;

    const { name, value } = e.target;
    setEditForm(prev => {
      if (!prev) return null;

      const updatedItem = { ...prev, [name]: value };

      // Recalculate total if quantity or unit price changes
      if (name === 'quantity' || name === 'unitPrice') {
        const quantity = name === 'quantity' ? parseFloat(value) || 0 : prev.quantity;
        const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : prev.unitPrice;
        updatedItem.total = quantity * unitPrice;
      }

      return updatedItem;
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    if (!editForm) return;

    const { name, value } = e.target;
    if (name) {
      setEditForm(prev => {
        if (!prev) return null;
        return { ...prev, [name]: value };
      });
    }
  };

  const handleAddCategory = (category: LineItemCategory) => {
    const newItem: BidLineItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      description: '',
      quantity: 1,
      unit: UNIT_OPTIONS[0],
      unitPrice: 0,
      total: 0,
      notes: '',
    };

    onChange([...lineItems, newItem]);
    handleEditClick(newItem);
  };

  const handleExpandClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Group line items by category
  const lineItemsByCategory: Record<LineItemCategory, BidLineItem[]> = {
    labor: [],
    materials: [],
    equipment: [],
    subcontractor: [],
    overhead: [],
    profit: [],
    other: [],
  };

  lineItems.forEach(item => {
    lineItemsByCategory[item.category].push(item);
  });

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
            {Object.entries(lineItemsByCategory).map(([category, items]) => {
              if (items.length === 0) return null;

              const categoryLabel = CATEGORY_OPTIONS.find(option => option.value === category)?.label || category;
              
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
                          {categoryLabel} ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </Typography>
                        {showTotals && (
                          <Typography variant="subtitle1" fontWeight="bold">
                            Subtotal: {formatCurrency(categoryTotals[category as LineItemCategory])}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Category items */}
                  {items.map(item => (
                    <React.Fragment key={item.id}>
                      <TableRow 
                        sx={{ 
                          bgcolor: editingId === item.id ? alpha(theme.palette.primary.main, 0.1) : 'inherit',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        <TableCell>
                          {editingId === item.id ? (
                            <TextField
                              name="description"
                              value={editForm?.description || ''}
                              onChange={handleInputChange}
                              fullWidth
                              size="small"
                              multiline
                              maxRows={3}
                            />
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {item.notes && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleExpandClick(item.id)}
                                  sx={{ mr: 1 }}
                                >
                                  {expandedId === item.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              )}
                              <Typography>{item.description || '(No description)'}</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {editingId === item.id ? (
                            <TextField
                              name="quantity"
                              value={editForm?.quantity || 0}
                              onChange={handleInputChange}
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
                          {editingId === item.id ? (
                            <Select
                              name="unit"
                              value={editForm?.unit || ''}
                              onChange={handleSelectChange}
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
                          {editingId === item.id ? (
                            <TextField
                              name="unitPrice"
                              value={editForm?.unitPrice || 0}
                              onChange={handleInputChange}
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              size="small"
                              sx={{ width: 120 }}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                            />
                          ) : (
                            formatCurrency(item.unitPrice)
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {editingId === item.id && editForm
                            ? formatCurrency(editForm.quantity * editForm.unitPrice)
                            : formatCurrency(item.total)
                          }
                        </TableCell>
                        {editable && (
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {editingId === item.id ? (
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

                      {/* Notes expansion panel */}
                      {expandedId === item.id && item.notes && (
                        <TableRow>
                          <TableCell colSpan={editable ? 6 : 5} sx={{ py: 0, backgroundColor: 'grey.50' }}>
                            <Collapse in={expandedId === item.id}>
                              <Box sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                  {item.notes}
                                </Typography>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Notes editing in edit mode */}
                      {editingId === item.id && (
                        <TableRow>
                          <TableCell colSpan={editable ? 6 : 5} sx={{ py: 1, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TextField
                              name="notes"
                              value={editForm?.notes || ''}
                              onChange={handleInputChange}
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              placeholder="Add notes for this item (optional)"
                              label="Notes"
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
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
            {CATEGORY_OPTIONS.map(category => (
              <Button
                key={category.value}
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAddCategory(category.value)}
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