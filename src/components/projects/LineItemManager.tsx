import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
  Avatar,
  Skeleton,
  Badge,
  useMediaQuery,
  Chip,
  Grid,
  TablePagination,
  Divider,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  CategoryOutlined as CategoryIcon,
  ReceiptLong as ReceiptIcon,
  Calculate as CalculateIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { LineItemService } from '../../services/lineItem';
import { LineItem, Project } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface LineItemManagerProps {
  project: Project;
  userId: string;
  onProjectUpdate: (project: Project) => void;
}



const LineItemManager: React.FC<LineItemManagerProps> = ({ project, userId, onProjectUpdate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<LineItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    category: '' as LineItem['category'] | '',
    quantity: 1,
    unitCost: 0,
    totalCost: 0,
    notes: '',
  });

  useEffect(() => {
    fetchLineItems();
  }, [project.id, userId]);

  const fetchLineItems = async () => {
    if (!project.id || !userId) {
      setError('Missing project ID or user ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const items = await LineItemService.getLineItems(userId, project.id);
      setLineItems(items);
    } catch (err) {
      console.error('Error fetching line items:', err);
      setError('Failed to load line items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item: LineItem | null = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        description: item.description || '',
        category: item.category || '',
        quantity: item.quantity || 1,
        unitCost: item.unitCost || 0,
        totalCost: item.totalCost || 0,
        notes: item.notes || '',
      });
    } else {
      setCurrentItem(null);
      setFormData({
        description: '',
        category: '',
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let updatedFormData = { ...formData, [name]: value };
    
    // Auto-calculate total cost when quantity or unit cost changes
    if (name === 'quantity' || name === 'unitCost') {
      const quantity = name === 'quantity' ? Number(value) : formData.quantity;
      const unitCost = name === 'unitCost' ? Number(value) : formData.unitCost;
      const totalCost = quantity * unitCost;
      updatedFormData = { ...updatedFormData, totalCost };
    }
    
    setFormData(updatedFormData);
  };

  const handleSaveLineItem = async () => {
    if (!project.id || !userId) {
      setError('Missing project ID or user ID');
      return;
    }

    try {
      setLoading(true);
      const lineItemData: Partial<LineItem> = {
        ...formData,
        projectId: project.id,
        // Ensure numbers are actually numbers
        quantity: Number(formData.quantity),
        unitCost: Number(formData.unitCost),
        totalCost: Number(formData.totalCost),
        // Cast category to the expected type
        category: formData.category as LineItem['category'],
      };

      let updatedLineItem: LineItem | null = null;
      
      if (currentItem) {
        // Update existing line item
        updatedLineItem = await LineItemService.updateLineItem(
          userId,
          project.id,
          currentItem.id!,
          lineItemData
        );
        setLineItems(prevItems => 
          prevItems.map(item => item.id === updatedLineItem!.id ? updatedLineItem! : item)
        );
      } else {
        // Create new line item
        updatedLineItem = await LineItemService.createLineItem(userId, project.id, lineItemData);
        setLineItems(prevItems => [...prevItems, updatedLineItem!]);
      }

      // Update project with new total estimate
      const updatedProject = { ...project };
      const totalEstimate = lineItems.reduce(
        (sum, item) => sum + (item.id === updatedLineItem?.id ? updatedLineItem.totalCost! : item.totalCost || 0),
        currentItem ? 0 : updatedLineItem?.totalCost || 0
      );
      
      onProjectUpdate(updatedProject);
      handleCloseDialog();
      
    } catch (err) {
      console.error('Error saving line item:', err);
      setError('Failed to save line item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLineItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    if (!project.id || !userId) {
      setError('Missing project ID or user ID');
      return;
    }

    try {
      setLoading(true);
      await LineItemService.deleteLineItem(userId, project.id, itemId);
      setLineItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // Update project with new total estimate
      const updatedProject = { ...project };
      onProjectUpdate(updatedProject);
    } catch (err) {
      console.error('Error deleting line item:', err);
      setError('Failed to delete line item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalEstimate = lineItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const displayedItems = lineItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getCategoryColor = (category: string) => {
    switch(category.toLowerCase()) {
      case 'labor': return theme.palette.info.main;
      case 'material': return theme.palette.success.main;
      case 'equipment': return theme.palette.warning.main;
      case 'subcontractor': return theme.palette.secondary.main;
      case 'permit': return theme.palette.primary.main;
      case 'other': return theme.palette.grey[600];
      default: return theme.palette.grey[500];
    }
  };

  if (loading && lineItems.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Skeleton variant="text" width={200} height={24} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>
        
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Skeleton variant="rectangular" height={53} />
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={52} sx={{ my: 0.5 }} />
          ))}
        </TableContainer>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Card 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
            mb: 3,
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 36,
                  height: 36,
                }}
              >
                <CalculateIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={500}>Project Cost Estimate</Typography>
            </Stack>
            
            <Grid container spacing={3} sx={{ px: 1 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Total Estimated Cost</Typography>
                  <Typography variant="h5" color="text.primary" fontWeight={600}>
                    {formatCurrency(totalEstimate)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Total Items</Typography>
                  <Typography variant="h5" color="text.primary" fontWeight={600}>
                    {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                width: 36,
                height: 36,
              }}
            >
              <ReceiptIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={500}>Line Items</Typography>
          </Stack>
          <Button
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2 }}
          >
            Add Item
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}

      {lineItems.length === 0 ? (
        <Alert 
          severity="info"
          icon={<ReceiptIcon color="info" />}
          sx={{ 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            py: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          No line items added yet. Click the "Add Item" button to create your first cost item.
        </Alert>
      ) : (
        <>
          {isMobile ? (
            // Mobile view - cards instead of table
            <Box>
              {displayedItems.map((item) => (
                <Card 
                  key={item.id} 
                  elevation={0}
                  sx={{ 
                    mb: 2, 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.03)}`,
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        {item.category && (
                          <Chip 
                            label={item.category}
                            size="small"
                            sx={{
                              bgcolor: alpha(getCategoryColor(item.category), 0.1),
                              color: getCategoryColor(item.category),
                              fontWeight: 500,
                              borderRadius: '4px',
                            }}
                          />
                        )}
                        <Typography variant="subtitle1" fontWeight={500}>
                          {item.description}
                        </Typography>
                      </Stack>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'right' }}>
                          {formatCurrency(item.totalCost || 0)}
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Quantity</Typography>
                          <Typography variant="body2">{item.quantity || 1}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Unit Cost</Typography>
                          <Typography variant="body2">{formatCurrency(item.unitCost || 0)}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    {item.notes && (
                      <>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleExpand(item.id!)}
                          sx={{ p: 0.5, my: 0.5 }}
                        >
                          {expandedItems[item.id!] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {expandedItems[item.id!] ? 'Hide' : 'Show'} notes
                          </Typography>
                        </IconButton>
                        <Collapse in={expandedItems[item.id!]}>
                          <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), p: 1.5, borderRadius: 1, mb: 1.5 }}>
                            <Typography variant="body2">{item.notes}</Typography>
                          </Box>
                        </Collapse>
                      </>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(item)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteLineItem(item.id!)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              
              <TablePagination
                component="div"
                count={lineItems.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          ) : (
            // Desktop view - table
            <Paper 
              elevation={0}
              sx={{ 
                width: '100%', 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Cost</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total Cost</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <TableRow 
                          hover
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.description}</Typography>
                          </TableCell>
                          <TableCell>
                            {item.category && (
                              <Chip 
                                label={item.category}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getCategoryColor(item.category), 0.1),
                                  color: getCategoryColor(item.category),
                                  fontWeight: 500,
                                  borderRadius: '4px',
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="right">{item.quantity || 1}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitCost || 0)}</TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.totalCost || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {item.notes && (
                                <Tooltip title="View Notes">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleExpand(item.id!)}
                                    color="default"
                                  >
                                    {expandedItems[item.id!] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </Tooltip>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(item)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLineItem(item.id!)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        {item.notes && (
                          <TableRow>
                            <TableCell 
                              colSpan={6} 
                              sx={{ 
                                py: expandedItems[item.id!] ? 1.5 : 0,
                                px: expandedItems[item.id!] ? 3 : 2,
                                borderBottom: expandedItems[item.id!] ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                              }}
                            >
                              <Collapse in={expandedItems[item.id!]} timeout="auto" unmountOnExit>
                                <Box sx={{ py: 1 }}>
                                  <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
                                  <Box sx={{ 
                                    bgcolor: alpha(theme.palette.background.default, 0.5), 
                                    p: 2, 
                                    borderRadius: 1,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                                  }}>
                                    <Typography variant="body2">{item.notes}</Typography>
                                  </Box>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={lineItems.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ 
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              />
            </Paper>
          )}
        </>
      )}

      {/* Line Item Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>
          {currentItem ? 'Edit Line Item' : 'Add New Line Item'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
            <TextField
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleInputChange}
              select
              fullWidth
              margin="normal"
              variant="outlined"
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="labor">Labor</MenuItem>
              <MenuItem value="material">Materials</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="subcontractor">Subcontractor</MenuItem>
              <MenuItem value="permit">Permits / Fees</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                required
                inputProps={{ min: 1, step: 1 }}
                fullWidth
              />
              <TextField
                name="unitCost"
                label="Unit Cost"
                type="number"
                value={formData.unitCost}
                onChange={handleInputChange}
                margin="normal"
                variant="outlined"
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
              />
            </Box>
            <TextField
              name="totalCost"
              label="Total Cost"
              type="number"
              value={formData.totalCost}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                readOnly: true,
              }}
              fullWidth
              sx={{ mt: 3, mb: 1 }}
            />
            <TextField
              name="notes"
              label="Notes (Optional)"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={3}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveLineItem} 
            variant="contained"
            disabled={!formData.description || formData.totalCost <= 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LineItemManager; 