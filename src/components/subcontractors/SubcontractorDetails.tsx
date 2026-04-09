import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Chip,
  LinearProgress,
  Rating,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Web as WebIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Subcontractor } from '../../types';
import { SubcontractorService } from '../../services/subcontractor';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

const SubcontractorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSubcontractor = async () => {
      if (!id) {
          setError('Subcontractor ID missing from URL.');
          setLoading(false);
          return;
      }
      if (!user?.uid) {
          setError('User not authenticated.');
          setLoading(false);
          return;
      }
      
      try {
        setLoading(true);
        const data = await SubcontractorService.getSubcontractor(user.uid, id);
        
        if (!data) {
          setError('Subcontractor not found or access denied.');
        } else {
          setSubcontractor(data);
        }
      } catch (err) {
        console.error('Error fetching subcontractor:', err);
        setError('Failed to load subcontractor data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcontractor();
  }, [id, user]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/subcontractors/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await SubcontractorService.deleteSubcontractor(id);
      navigate('/subcontractors');
    } catch (err) {
      console.error('Error deleting subcontractor:', err);
      setError('Failed to delete subcontractor');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleBack = () => {
    navigate('/subcontractors');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !subcontractor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Subcontractor not found'}</Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Subcontractors
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {subcontractor.name}
          </Typography>
          <Chip 
            label={subcontractor.specialty} 
            color="primary" 
            size="small" 
            sx={{ ml: 2 }} 
          />
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
            color="error" 
            startIcon={<DeleteIcon />} 
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  sx={{ bgcolor: 'primary.main', width: 64, height: 64, mr: 2 }}
                >
                  {subcontractor.name.substring(0, 1)}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating 
                      value={subcontractor.rating ?? 0} 
                      precision={0.5} 
                      readOnly 
                      size="small" 
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {(subcontractor.rating ?? 0).toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {subcontractor.totalProjects} completed projects
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <List dense>
              <ListItem>
                <PhoneIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Phone" 
                  secondary={subcontractor.contact?.phone ? formatPhoneNumber(subcontractor.contact.phone) : 'N/A'} 
                />
              </ListItem>
              <ListItem>
                <EmailIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Email" 
                  secondary={subcontractor.contact?.email || 'N/A'} 
                />
              </ListItem>
              <ListItem>
                <LocationIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Location" 
                  secondary={subcontractor.contact?.location || 'N/A'} 
                />
              </ListItem>
              {subcontractor.companyInfo?.website && (
                <ListItem>
                  <WebIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText 
                    primary="Website" 
                    secondary={
                      <Button 
                        variant="text" 
                        size="small" 
                        color="primary"
                        startIcon={<LinkIcon />}
                        component="a"
                        href={`https://${subcontractor.companyInfo.website.replace(/^https?:\/\//, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {subcontractor.companyInfo.website}
                      </Button>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>On Time Delivery</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={subcontractor.performance?.onTime ?? 0} 
                      sx={{ flexGrow: 1, mr: 1 }} 
                    />
                    <Typography variant="body2">{subcontractor.performance?.onTime ?? 0}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>Quality</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={subcontractor.performance?.quality ?? 0} 
                      sx={{ flexGrow: 1, mr: 1 }} 
                      color="success"
                    />
                    <Typography variant="body2">{subcontractor.performance?.quality ?? 0}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ minWidth: 120 }}>Communication</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={subcontractor.performance?.communication ?? 0} 
                      sx={{ flexGrow: 1, mr: 1 }} 
                      color="info"
                    />
                    <Typography variant="body2">{subcontractor.performance?.communication ?? 0}%</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Company Information</Typography>
            <List dense>
              {subcontractor.companyInfo?.founded && (
                <ListItem>
                  <BusinessIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText 
                    primary="Year Founded" 
                    secondary={subcontractor.companyInfo.founded} 
                  />
                </ListItem>
              )}
              {subcontractor.companyInfo?.employees && (
                <ListItem>
                  <AssignmentIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText 
                    primary="Number of Employees" 
                    secondary={subcontractor.companyInfo.employees} 
                  />
                </ListItem>
              )}
              {subcontractor.companyInfo?.license && (
                <ListItem>
                  <AssignmentIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                  <ListItemText 
                    primary="License Number" 
                    secondary={subcontractor.companyInfo.license} 
                  />
                </ListItem>
              )}
            </List>

            {subcontractor.lastBid && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Last Bid</Typography>
                <Typography variant="body2">
                  Date: {formatDate(subcontractor.lastBid.date)}
                </Typography>
                <Typography variant="body2">
                  Amount: {formatCurrency(subcontractor.lastBid.amount)}
                </Typography>
              </>
            )}
          </Grid>
        </Grid>

        {subcontractor.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Notes</Typography>
            <Typography variant="body2" paragraph>
              {subcontractor.notes}
            </Typography>
          </>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Projects" />
            <Tab label="Bids" />
            <Tab label="Activities" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box>
            {/* Project history would go here */}
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No projects found for this subcontractor
            </Typography>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            {/* Bid history would go here */}
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No bid history available
            </Typography>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            {/* Activity log would go here */}
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No recent activities
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {subcontractor.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubcontractorDetails; 
