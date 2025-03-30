import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  FileCopy as DuplicateIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  Mail as MailIcon,
  GetApp as DownloadIcon,
  AddCircleOutline as AddVersionIcon,
} from '@mui/icons-material';
import { BidService, Bid, BidVersion, BidStatus, BidPriority } from '../../services/bid';
import LineItemsTable from './LineItemsTable';
import { formatCurrency } from '../../utils/formatters';

// Status chip colors
const STATUS_COLORS: Record<BidStatus, string> = {
  draft: 'default',
  submitted: 'info',
  under_review: 'info',
  awarded: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
  revised: 'info',
};

// Priority chip colors
const PRIORITY_COLORS: Record<BidPriority, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

// Status display names
const STATUS_DISPLAY: Record<BidStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  awarded: 'Awarded',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
  revised: 'Revised',
};

// Priority display names
const PRIORITY_DISPLAY: Record<BidPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Version card component for showing bid version history
interface VersionCardProps {
  version: BidVersion;
  isActive: boolean;
  onClick: () => void;
}

const VersionCard: React.FC<VersionCardProps> = ({ version, isActive, onClick }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        border: isActive ? `2px solid ${theme.palette.primary.main}` : 'none',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Version {version.versionNumber}</Typography>
          {isActive && (
            <Chip label="Current" color="primary" size="small" />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Created on {new Date(version.createdAt).toLocaleDateString()} at {new Date(version.createdAt).toLocaleTimeString()}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Total: {formatCurrency(version.totalAmount)}
        </Typography>
        <Typography variant="body2">
          Line items: {version.lineItems.length}
        </Typography>
        {version.notes && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" fontWeight="bold">Notes:</Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {version.notes}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const BidDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (!id) return;
    fetchBid(id);
  }, [id]);
  
  const fetchBid = async (bidId: string) => {
    try {
      setLoading(true);
      const bidData = await BidService.getBid(bidId);
      
      if (!bidData) {
        setError('Bid not found');
        return;
      }
      
      setBid(bidData);
      setSelectedVersionId(bidData.currentVersionId);
    } catch (err) {
      console.error('Error fetching bid:', err);
      setError('Failed to load bid details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersionId(versionId);
  };
  
  const handleEdit = () => {
    if (!id) return;
    navigate(`/bids/${id}/edit`);
  };
  
  const handleDuplicate = () => {
    if (!bid) return;
    navigate('/bids/new', { state: { duplicate: bid } });
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      await BidService.deleteBid(id);
      navigate('/bids');
    } catch (err) {
      console.error('Error deleting bid:', err);
      setError('Failed to delete bid');
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleBack = () => {
    navigate('/bids');
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  // Get current version details
  const getCurrentVersion = () => {
    if (!bid || !selectedVersionId) return null;
    return bid.versions.find(v => v.id === selectedVersionId) || null;
  };
  
  const currentVersion = getCurrentVersion();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !bid) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || 'Bid not found'}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Bids
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">{bid.title}</Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DuplicateIcon />} 
            onClick={handleDuplicate}
            sx={{ mr: 1 }}
          >
            Duplicate
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />} 
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      {/* Status and details section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Bid Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={STATUS_DISPLAY[bid.status]} 
                    color={STATUS_COLORS[bid.status] as any} 
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Priority</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={PRIORITY_DISPLAY[bid.priority]} 
                    color={PRIORITY_COLORS[bid.priority] as any} 
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Project</Typography>
                <Typography variant="body1">{bid.projectName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Subcontractor</Typography>
                <Typography variant="body1">{bid.subcontractorName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Submission Deadline</Typography>
                <Typography variant="body1">{new Date(bid.submissionDeadline).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                <Typography variant="h6" color="primary.main">{formatCurrency(bid.totalAmount)}</Typography>
              </Grid>
              {bid.startDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">{new Date(bid.startDate).toLocaleDateString()}</Typography>
                </Grid>
              )}
              {bid.completionDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Completion Date</Typography>
                  <Typography variant="body1">{new Date(bid.completionDate).toLocaleDateString()}</Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Requirements & Tags</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Insurance Required</Typography>
                <Typography variant="body1">{bid.requiresInsurance ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Bond Required</Typography>
                <Typography variant="body1">{bid.requiresBond ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Public to Subcontractor</Typography>
                <Typography variant="body1">{bid.isPublic ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Approved</Typography>
                <Typography variant="body1">{bid.isApproved ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {bid.tags.length > 0 ? (
                    bid.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))
                  ) : (
                    <Typography variant="body2">No tags</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12}>
            <Box>
              <Typography variant="h6" gutterBottom>Scope</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {bid.scope || 'No scope description provided.'}
              </Typography>
            </Box>
          </Grid>
          
          {bid.notes && (
            <Grid item xs={12}>
              <Box>
                <Typography variant="h6" gutterBottom>Notes</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {bid.notes}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Tabs for Line Items and Version History */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Line Items" />
          <Tab label="Version History" />
        </Tabs>
        
        {/* Line Items Tab */}
        {tabValue === 0 && currentVersion && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Line Items (Version {currentVersion.versionNumber})
              </Typography>
              <Box>
                <Tooltip title="Print Bid">
                  <IconButton onClick={handlePrint}>
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download as PDF">
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <LineItemsTable 
              lineItems={currentVersion.lineItems} 
              onChange={() => {}} // Read-only mode 
              editable={false}
            />
          </Box>
        )}
        
        {/* Version History Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Version History
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a version to view its details
              </Typography>
              {bid.versions.sort((a, b) => b.versionNumber - a.versionNumber).map(version => (
                <VersionCard 
                  key={version.id} 
                  version={version} 
                  isActive={version.id === bid.currentVersionId}
                  onClick={() => handleVersionSelect(version.id)}
                />
              ))}
            </Grid>
            <Grid item xs={12} md={8}>
              {currentVersion && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Version {currentVersion.versionNumber} Details
                    {currentVersion.id === bid.currentVersionId && (
                      <Chip label="Current" color="primary" size="small" sx={{ ml: 2 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created on {new Date(currentVersion.createdAt).toLocaleDateString()} at {new Date(currentVersion.createdAt).toLocaleTimeString()}
                  </Typography>
                  
                  {currentVersion.notes && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>Version Notes:</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {currentVersion.notes}
                      </Typography>
                    </Paper>
                  )}
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Line Items
                  </Typography>
                  <LineItemsTable 
                    lineItems={currentVersion.lineItems} 
                    onChange={() => {}} // Read-only mode 
                    editable={false}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </Box>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this bid? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BidDetails; 