import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Autocomplete,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Apartment as ApartmentIcon,
  Store as StoreIcon,
  School as SchoolIcon,
  Factory as FactoryIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BidDeletionWrapper from './BidDeletionWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { Bid, BidSummary } from '../../types';
import { BidService } from '../../services/bid';

interface BidItem {
  id: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes: string;
  materials: string[];
  laborHours: number;
  laborRate: number;
  markup: number;
  isExpanded: boolean;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  items: BidItem[];
  total: number;
}

const projectTypes = [
  { id: 'residential', name: 'Residential', icon: <HomeIcon /> },
  { id: 'commercial', name: 'Commercial', icon: <BusinessIcon /> },
  { id: 'multi-family', name: 'Multi-Family', icon: <ApartmentIcon /> },
  { id: 'retail', name: 'Retail', icon: <StoreIcon /> },
  { id: 'industrial', name: 'Industrial', icon: <FactoryIcon /> },
  { id: 'institutional', name: 'Institutional', icon: <SchoolIcon /> },
];

const constructionCategories = [
  {
    name: 'Site Work',
    items: [
      'Site Clearing',
      'Excavation',
      'Grading',
      'Drainage',
      'Landscaping',
      'Driveways',
      'Parking Areas',
    ],
  },
  {
    name: 'Foundation',
    items: [
      'Footings',
      'Foundation Walls',
      'Slab',
      'Waterproofing',
      'Drainage Systems',
      'Backfill',
    ],
  },
  {
    name: 'Framing',
    items: [
      'Wood Framing',
      'Steel Framing',
      'Roof Trusses',
      'Floor Joists',
      'Wall Sheathing',
      'Roof Sheathing',
    ],
  },
  {
    name: 'Exterior',
    items: [
      'Siding',
      'Windows',
      'Doors',
      'Roofing',
      'Gutters',
      'Flashings',
      'Trim',
    ],
  },
  {
    name: 'Interior',
    items: [
      'Drywall',
      'Insulation',
      'Ceilings',
      'Flooring',
      'Cabinets',
      'Countertops',
      'Trim',
    ],
  },
  {
    name: 'Mechanical',
    items: [
      'HVAC',
      'Plumbing',
      'Electrical',
      'Fire Protection',
      'Security Systems',
      'Elevators',
    ],
  },
  {
    name: 'Finishes',
    items: [
      'Paint',
      'Stain',
      'Tile',
      'Carpet',
      'Wallpaper',
      'Decorative Elements',
    ],
  },
];

const BidManager: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewBidDialog, setShowNewBidDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showMaterials, setShowMaterials] = useState<{ [key: string]: boolean }>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const fetchBids = async () => {
    if (!user?.uid) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the status filter based on the active tab
      let statusFilter;
      switch (activeTab) {
        case 1: // Drafts
          statusFilter = 'draft';
          break;
        case 2: // Sent
          statusFilter = 'submitted';
          break;
        case 3: // Accepted
          statusFilter = 'accepted';
          break;
        case 4: // Rejected
          statusFilter = ['rejected', 'expired'];
          break;
        case 5: // Converted
          statusFilter = 'converted';
          break;
        default: // All bids
          statusFilter = undefined;
      }
      
      // Fetch bids from the database
      const fetchedBids = await BidService.getBids(
        user.uid,
        statusFilter ? { status: statusFilter } : undefined
      );
      
      setBids(fetchedBids);
    } catch (err) {
      logger.error("Error fetching bids:", err);
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [user, activeTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNewBid = () => {
    setShowNewBidDialog(true);
  };

  const handleRefresh = () => {
    fetchBids();
  };

  const handleViewBid = (bid: Bid) => {
    navigate(`/bids/${bid.id}`);
  };

  const handleEditBid = (bid: Bid) => {
    navigate(`/bids/${bid.id}/edit`);
  };

  const handleConvertToProject = (bid: Bid) => {
    // Implementation for converting bid to project
    navigate(`/projects/new?fromBid=${bid.id}`);
  };

  const handleBidDeleted = (bidId: string) => {
    logger.log(`Bid ${bidId} successfully deleted`);
    // Remove the bid from the local state
    setBids(prevBids => prevBids.filter(b => b.id !== bidId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return theme.palette.grey[500];
      case 'submitted':
      case 'sent':
        return theme.palette.info.main;
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
      case 'expired':
        return theme.palette.error.main;
      case 'converted':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const filteredBids = searchQuery.trim() === '' 
    ? bids 
    : bids.filter(bid => 
        bid.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.subcontractorName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bid Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage project bids efficiently
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search bids..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setShowTemplateDialog(true)}
            >
              Templates
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => setShowUpload(true)}
            >
              Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewBid}
            >
              New Bid
            </Button>
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="All Bids" />
          <Tab label="Drafts" />
          <Tab label="Sent" />
          <Tab label="Accepted" />
          <Tab label="Rejected" />
          <Tab label="Converted" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : filteredBids.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No bids found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchQuery 
                ? "No bids match your search criteria" 
                : "Create a new bid to get started"}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewBid}
              sx={{ mt: 2 }}
            >
              Create New Bid
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredBids.map((bid) => (
              <Grid item xs={12} md={6} key={bid.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {bid.title || 'Untitled Bid'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bid.projectName || 'No Project'} • {bid.subcontractorName || 'No Subcontractor'}
                        </Typography>
                      </Box>
                      <Chip
                        label={bid.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          backgroundColor: alpha(getStatusColor(bid.status), 0.1),
                          color: getStatusColor(bid.status),
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Deadline: {bid.submissionDeadline ? new Date(bid.submissionDeadline).toLocaleDateString() : 'None'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(bid.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" component="div">
                        ${bid.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Bid Amount
                      </Typography>
                    </Box>

                    {bid.notes && (
                      <Typography variant="body2" color="text.secondary">
                        {bid.notes}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditBid(bid)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewBid(bid)}
                    >
                      View
                    </Button>
                    <BidDeletionWrapper
                      bid={bid}
                      userId={user?.uid || ''}
                      onBidDeleted={() => handleBidDeleted(bid.id)}
                      variant="icon"
                    />
                    {bid.status === 'accepted' && (
                      <Button
                        size="small"
                        startIcon={<BuildIcon />}
                        onClick={() => handleConvertToProject(bid)}
                      >
                        Convert
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* New Bid Dialog */}
      <Dialog
        open={showNewBidDialog}
        onClose={() => setShowNewBidDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Bid</DialogTitle>
        <DialogContent>
          <Stepper activeStep={0} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Project Information</StepLabel>
            </Step>
            <Step>
              <StepLabel>Scope & Items</StepLabel>
            </Step>
            <Step>
              <StepLabel>Terms & Conditions</StepLabel>
            </Step>
          </Stepper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Bid Title"
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Client Name"
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={projectTypes}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project Type"
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    {option.icon}
                    <Typography sx={{ ml: 1 }}>{option.name}</Typography>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Valid Until"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Project Description"
                multiline
                rows={3}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewBidDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowNewBidDialog(false)}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Project Templates</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {projectTypes.map((type) => (
              <Grid item xs={12} md={6} key={type.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {type.icon}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {type.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Standard template for {type.name.toLowerCase()} projects
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<ContentCopyIcon />}>
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Bid</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Drag and drop your bid file here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: Excel, CSV, PDF
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpload(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowUpload(false)}>
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BidManager; 