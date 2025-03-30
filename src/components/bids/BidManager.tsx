import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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

interface Bid {
  id: string;
  title: string;
  client: string;
  projectType: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  createdAt: string;
  updatedAt: string;
  items: BidItem[];
  total: number;
  notes: string;
  validUntil: string;
  terms: string;
  conditions: string;
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
  const [activeTab, setActiveTab] = useState(0);
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewBidDialog, setShowNewBidDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showMaterials, setShowMaterials] = useState<{ [key: string]: boolean }>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Sample data - In production, this would come from your backend
  const sampleBids: Bid[] = [
    {
      id: '1',
      title: 'Single Family Home Renovation',
      client: 'John Smith',
      projectType: 'residential',
      status: 'draft',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      items: [],
      total: 0,
      notes: 'Complete renovation of 2,500 sq ft home',
      validUntil: '2024-02-15',
      terms: 'Net 30',
      conditions: 'Standard construction terms apply',
    },
    {
      id: '2',
      title: 'Office Building Extension',
      client: 'TechCorp Inc.',
      projectType: 'commercial',
      status: 'sent',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
      items: [],
      total: 0,
      notes: '5,000 sq ft office extension',
      validUntil: '2024-02-10',
      terms: 'Net 45',
      conditions: 'Subject to building permit',
    },
  ];

  useEffect(() => {
    // In production, fetch bids from your backend
    setBids(sampleBids);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNewBid = () => {
    setShowNewBidDialog(true);
  };

  const handleConvertToProject = (bid: Bid) => {
    // Implementation for converting bid to project
    navigate(`/projects/new?fromBid=${bid.id}`);
  };

  const handleSaveBid = (bid: Bid) => {
    // Implementation for saving bid
  };

  const handleDeleteBid = (bid: Bid) => {
    // Implementation for deleting bid
  };

  const getStatusColor = (status: Bid['status']) => {
    switch (status) {
      case 'draft':
        return theme.palette.grey[500];
      case 'sent':
        return theme.palette.info.main;
      case 'accepted':
        return theme.palette.success.main;
      case 'rejected':
        return theme.palette.error.main;
      case 'converted':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

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
              onClick={() => setShowHistory(true)}
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

        <Grid container spacing={3}>
          {bids.map((bid) => (
            <Grid item xs={12} md={6} key={bid.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="div">
                        {bid.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bid.client}
                      </Typography>
                    </Box>
                    <Chip
                      label={bid.status}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getStatusColor(bid.status), 0.1),
                        color: getStatusColor(bid.status),
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Project Type: {projectTypes.find(t => t.id === bid.projectType)?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valid Until: {bid.validUntil}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" component="div">
                      ${bid.total.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Bid Amount
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {bid.notes}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setSelectedBid(bid)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PrintIcon />}
                  >
                    Print
                  </Button>
                  {bid.status === 'accepted' && (
                    <Button
                      size="small"
                      startIcon={<BuildIcon />}
                      onClick={() => handleConvertToProject(bid)}
                    >
                      Convert to Project
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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