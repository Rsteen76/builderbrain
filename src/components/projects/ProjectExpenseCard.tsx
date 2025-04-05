import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  useTheme,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Paid as PaidIcon,
  PendingActions as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  ArrowCircleUp as ArrowUpIcon,
  Store as VendorIcon,
  Receipt as InvoiceIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ProjectExpenseCardProps {
  expense: Expense;
  onViewExpense: (expenseId: string) => void;
  onEditExpense: (expenseId: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateStatus: (expenseId: string, newStatus: string) => void;
}

const ProjectExpenseCard: React.FC<ProjectExpenseCardProps> = ({
  expense,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
  onUpdateStatus,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleStatusChange = (newStatus: string) => {
    if (!expense.id) return;
    onUpdateStatus(expense.id, newStatus);
    handleMenuClose();
  };
  
  // Determine status icon and color
  const getStatusInfo = () => {
    const status = expense.status?.toLowerCase() || 'pending';
    
    switch (status) {
      case 'paid':
        return {
          icon: <PaidIcon />,
          color: theme.palette.success.main,
          label: 'Paid',
          bgColor: alpha(theme.palette.success.main, 0.1),
        };
      case 'approved':
        return {
          icon: <ApprovedIcon />,
          color: theme.palette.info.main,
          label: 'Approved',
          bgColor: alpha(theme.palette.info.main, 0.1),
        };
      case 'rejected':
        return {
          icon: <RejectedIcon />,
          color: theme.palette.error.main,
          label: 'Rejected',
          bgColor: alpha(theme.palette.error.main, 0.1),
        };
      case 'pending':
      default:
        return {
          icon: <PendingIcon />,
          color: theme.palette.warning.main,
          label: 'Pending',
          bgColor: alpha(theme.palette.warning.main, 0.1),
        };
    }
  };
  
  // Get category icon and color
  const getCategoryInfo = () => {
    const categoryIcons: { [key: string]: JSX.Element } = {
      materials: <CategoryIcon />,
      labor: <Avatar sx={{ width: 16, height: 16, fontSize: '0.7rem' }}>L</Avatar>,
      equipment: <Avatar sx={{ width: 16, height: 16, fontSize: '0.7rem' }}>E</Avatar>,
      permits: <Avatar sx={{ width: 16, height: 16, fontSize: '0.7rem' }}>P</Avatar>,
      other: <Avatar sx={{ width: 16, height: 16, fontSize: '0.7rem' }}>O</Avatar>,
    };
    
    const categoryColors: { [key: string]: string } = {
      materials: theme.palette.primary.main,
      labor: theme.palette.secondary.main,
      equipment: theme.palette.info.main,
      permits: theme.palette.warning.main,
      other: theme.palette.grey[600],
    };
    
    const category = expense.category?.toLowerCase() || 'other';
    
    return {
      icon: categoryIcons[category] || <CategoryIcon />,
      color: categoryColors[category] || theme.palette.grey[600],
      label: category.charAt(0).toUpperCase() + category.slice(1),
    };
  };
  
  const statusInfo = getStatusInfo();
  const categoryInfo = getCategoryInfo();
  
  if (!expense.id) return null;
  
  return (
    <Card 
      onClick={() => onViewExpense(expense.id as string)}
      sx={{ 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'visible',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.05)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
      }}
    >
      {/* Status indicator label */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          right: -6,
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: `0 2px 8px ${alpha(statusInfo.color, 0.3)}`,
          zIndex: 1,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '100%',
            right: 0,
            border: '3px solid transparent',
            borderTopColor: alpha(statusInfo.color, 0.7),
            borderRightColor: alpha(statusInfo.color, 0.7),
          }
        }}
      >
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.label}
          size="small"
          sx={{
            borderRadius: '4px 0 0 4px',
            pl: 0.5,
            backgroundColor: statusInfo.bgColor,
            color: statusInfo.color,
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: statusInfo.color,
              fontSize: '1rem',
            },
          }}
        />
      </Box>
      
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            {/* Description */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {expense.description || 'Unnamed Expense'}
            </Typography>
            
            {/* Date and ID */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {formatDate(expense.date)} • ID: {expense.id.slice(-6)}
            </Typography>
            
            {/* Category and Vendor */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                label={categoryInfo.label}
                sx={{
                  backgroundColor: alpha(categoryInfo.color, 0.1),
                  color: categoryInfo.color,
                  fontWeight: 500,
                  height: 24,
                }}
                icon={
                  <Box component="span" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                    {categoryInfo.icon}
                  </Box>
                }
              />
              
              {expense.vendor && (
                <Chip
                  size="small"
                  icon={<VendorIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={expense.vendor}
                  sx={{
                    backgroundColor: alpha(theme.palette.grey[600], 0.1),
                    color: theme.palette.text.secondary,
                    height: 24,
                  }}
                />
              )}
              
              {expense.subcontractorName && (
                <Chip
                  size="small"
                  label={expense.subcontractorName}
                  sx={{
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    height: 24,
                  }}
                />
              )}
            </Box>
          </Box>
          
          {/* Amount */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {formatCurrency(expense.amount || 0)}
            </Typography>
            
            {expense.phaseName && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Phase: {expense.phaseName}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {expense.receiptUrl && (
              <Tooltip title="View Receipt">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(expense.receiptUrl, '_blank');
                  }}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <ReceiptIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="View Details">
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewExpense(expense.id as string);
                }}
                sx={{ color: theme.palette.info.main }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box>
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ color: theme.palette.text.secondary }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => {
                onEditExpense(expense.id as string);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit Expense</ListItemText>
              </MenuItem>
              
              <Divider />
              
              {/* Status change options */}
              <MenuItem disabled={expense.status === 'pending'} onClick={() => handleStatusChange('pending')}>
                <ListItemIcon>
                  <PendingIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                </ListItemIcon>
                <ListItemText>Mark as Pending</ListItemText>
              </MenuItem>
              
              <MenuItem disabled={expense.status === 'approved'} onClick={() => handleStatusChange('approved')}>
                <ListItemIcon>
                  <ApprovedIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                </ListItemIcon>
                <ListItemText>Mark as Approved</ListItemText>
              </MenuItem>
              
              <MenuItem disabled={expense.status === 'paid'} onClick={() => handleStatusChange('paid')}>
                <ListItemIcon>
                  <PaidIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                </ListItemIcon>
                <ListItemText>Mark as Paid</ListItemText>
              </MenuItem>
              
              <MenuItem disabled={expense.status === 'rejected'} onClick={() => handleStatusChange('rejected')}>
                <ListItemIcon>
                  <RejectedIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                </ListItemIcon>
                <ListItemText>Mark as Rejected</ListItemText>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={() => {
                onDeleteExpense(expense.id as string);
                handleMenuClose();
              }} sx={{ color: theme.palette.error.main }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectExpenseCard; 