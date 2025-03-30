import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha,
  Avatar,
  Rating,
  Divider,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  Star as StarIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Reuse the SubcontractorCard component from Dashboard
interface SubcontractorCardProps {
  name: string;
  specialty: string;
  rating: number;
  totalProjects: number;
  lastBid: string;
  lastBidAmount: string;
  contact: {
    phone: string;
    email: string;
    location: string;
  };
  performance: {
    onTime: number;
    quality: number;
    communication: number;
  };
}

const SubcontractorCard: React.FC<SubcontractorCardProps> = ({
  name,
  specialty,
  rating,
  totalProjects,
  lastBid,
  lastBidAmount,
  contact,
  performance,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: theme.palette.primary.main,
              mr: 2,
            }}
          >
            {name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {specialty}
            </Typography>
          </Box>
          <Rating value={rating} readOnly precision={0.5} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Performance Metrics
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  On-Time Delivery
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {performance.onTime}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={performance.onTime}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.success.main,
                  },
                }}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Quality Rating
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {performance.quality}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={performance.quality}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Communication
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {performance.communication}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={performance.communication}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.info.main,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Contact Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{contact.phone}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{contact.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">{contact.location}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Last Bid: {lastBid}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Amount: {lastBidAmount}
            </Typography>
          </Box>
          <Chip
            label={`${totalProjects} Projects`}
            size="small"
            icon={<WorkIcon />}
            onClick={() => navigate(`/subcontractors/${name}`)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const Subcontractors: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const subcontractors = [
    {
      name: 'Elite Electrical',
      specialty: 'Electrical Systems',
      rating: 4.5,
      totalProjects: 8,
      lastBid: 'Mar 15, 2024',
      lastBidAmount: '$45,000',
      contact: {
        phone: '(555) 123-4567',
        email: 'contact@eliteelectrical.com',
        location: 'New York, NY',
      },
      performance: {
        onTime: 95,
        quality: 92,
        communication: 88,
      },
    },
    {
      name: 'Premier Plumbing',
      specialty: 'Plumbing & HVAC',
      rating: 4.8,
      totalProjects: 12,
      lastBid: 'Mar 20, 2024',
      lastBidAmount: '$78,000',
      contact: {
        phone: '(555) 234-5678',
        email: 'info@premierplumbing.com',
        location: 'Brooklyn, NY',
      },
      performance: {
        onTime: 98,
        quality: 95,
        communication: 92,
      },
    },
    {
      name: 'Quality Concrete',
      specialty: 'Concrete & Foundation',
      rating: 4.2,
      totalProjects: 15,
      lastBid: 'Mar 25, 2024',
      lastBidAmount: '$120,000',
      contact: {
        phone: '(555) 345-6789',
        email: 'bids@qualityconcrete.com',
        location: 'Queens, NY',
      },
      performance: {
        onTime: 90,
        quality: 88,
        communication: 85,
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subcontractors
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track your subcontractor relationships
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search subcontractors..."
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
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/subcontractors/new')}
            >
              Add Subcontractor
            </Button>
          </Box>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="All" />
          <Tab label="Electrical" />
          <Tab label="Plumbing" />
          <Tab label="Concrete" />
          <Tab label="HVAC" />
        </Tabs>

        <Grid container spacing={3}>
          {subcontractors.map((subcontractor, index) => (
            <Grid item xs={12} md={4} key={index}>
              <SubcontractorCard {...subcontractor} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>Rating: High to Low</MenuItem>
        <MenuItem onClick={handleFilterClose}>Rating: Low to High</MenuItem>
        <MenuItem onClick={handleFilterClose}>Projects: Most to Least</MenuItem>
        <MenuItem onClick={handleFilterClose}>Projects: Least to Most</MenuItem>
        <MenuItem onClick={handleFilterClose}>On-Time Delivery: High to Low</MenuItem>
        <MenuItem onClick={handleFilterClose}>On-Time Delivery: Low to High</MenuItem>
      </Menu>
    </Box>
  );
};

export default Subcontractors; 