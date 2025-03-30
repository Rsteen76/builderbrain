import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Alert,
  AlertTitle,
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
  MoreVert as MoreVertIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SubcontractorService, Subcontractor } from '../../services/subcontractor';
import { formatCurrency } from '../../utils/formatters';
import { exportSubcontractorsToCSV, importSubcontractorsFromCSV, downloadFile } from '../../utils/importExport';

interface SubcontractorCardProps {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  totalProjects: number;
  lastBid?: {
    date: Date;
    amount: number;
    projectId?: string;
  };
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
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SubcontractorCard: React.FC<SubcontractorCardProps> = ({
  id,
  name,
  specialty,
  rating,
  totalProjects,
  lastBid,
  contact,
  performance,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    navigate(`/subcontractors/${id}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 56,
                height: 56,
                mr: 2,
              }}
            >
              {name.substring(0, 1)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {name}
              </Typography>
              <Chip label={specialty} size="small" color="primary" />
            </Box>
          </Box>
          <Box>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e as React.MouseEvent<HTMLButtonElement>);
              }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem onClick={() => { onEdit(id); handleClose(); }}>Edit</MenuItem>
              <MenuItem onClick={() => { onDelete(id); handleClose(); }}>Delete</MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating value={rating} precision={0.5} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {rating.toFixed(1)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {totalProjects} completed projects
          </Typography>
        </Box>

        {lastBid && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Last Bid</Typography>
            <Typography variant="body2">
              {formatCurrency(lastBid.amount)} ({new Date(lastBid.date).toLocaleDateString()})
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Performance</Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>On Time</Typography>
                <LinearProgress
                  variant="determinate"
                  value={performance.onTime}
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Typography variant="body2">{performance.onTime}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>Quality</Typography>
                <LinearProgress
                  variant="determinate"
                  value={performance.quality}
                  sx={{ flexGrow: 1, mr: 1 }}
                  color="success"
                />
                <Typography variant="body2">{performance.quality}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>Communication</Typography>
                <LinearProgress
                  variant="determinate"
                  value={performance.communication}
                  sx={{ flexGrow: 1, mr: 1 }}
                  color="info"
                />
                <Typography variant="body2">{performance.communication}%</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Contact</Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.phone}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.email}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.location}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

const Subcontractors: React.FC = () => {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubcontractors = async () => {
      try {
        setLoading(true);
        const filters: {specialty?: string} = {};
        
        if (specialtyFilter) {
          filters.specialty = specialtyFilter;
        }
        
        const data = await SubcontractorService.getSubcontractors(filters);
        setSubcontractors(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching subcontractors:", err);
        setError("Failed to load subcontractors. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubcontractors();
  }, [specialtyFilter]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update specialty filter based on tab
    switch(newValue) {
      case 0: // All
        setSpecialtyFilter(null);
        break;
      case 1: // Electrical
        setSpecialtyFilter('Electrical');
        break;
      case 2: // Plumbing
        setSpecialtyFilter('Plumbing');
        break;
      case 3: // HVAC
        setSpecialtyFilter('HVAC');
        break;
      case 4: // Carpentry
        setSpecialtyFilter('Carpentry');
        break;
      default:
        setSpecialtyFilter(null);
    }
  };

  const handleAddSubcontractor = () => {
    navigate('/subcontractors/new');
  };

  const handleEditSubcontractor = (id: string) => {
    navigate(`/subcontractors/${id}/edit`);
  };

  const handleDeleteSubcontractor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subcontractor?')) {
      try {
        await SubcontractorService.deleteSubcontractor(id);
        setSubcontractors(subcontractors.filter(s => s.id !== id));
      } catch (err) {
        console.error("Error deleting subcontractor:", err);
        setError("Failed to delete subcontractor. Please try again.");
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      // Get all subcontractors for export (without filters)
      const allSubcontractors = await SubcontractorService.getSubcontractors();
      
      if (allSubcontractors.length === 0) {
        setError("No subcontractors to export.");
        return;
      }
      
      // Generate CSV and download it
      const csvContent = exportSubcontractorsToCSV(allSubcontractors);
      const fileName = `subcontractors-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(csvContent, fileName, 'text/csv');
    } catch (err) {
      console.error("Error exporting subcontractors:", err);
      setError("Failed to export subcontractors. Please try again.");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csvText = e.target?.result as string;
          const result = await importSubcontractorsFromCSV(csvText);
          
          setImportResult(result);
          
          // Reload subcontractors after import
          const data = await SubcontractorService.getSubcontractors();
          setSubcontractors(data);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (err) {
          console.error("Error importing subcontractors:", err);
          setError("Failed to import subcontractors. Please check your CSV format.");
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsText(file);
    } catch (err) {
      console.error("Error reading file:", err);
      setError("Failed to read file. Please try again.");
      setLoading(false);
    }
  };

  const clearImportResult = () => {
    setImportResult(null);
  };

  const filteredSubcontractors = subcontractors.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sub.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Subcontractors</Typography>
        <Box sx={{ display: 'flex' }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
            sx={{ mr: 1 }}
          >
            Import
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddSubcontractor}
          >
            Add Subcontractor
          </Button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Box>
      
      {importResult && (
        <Alert 
          severity={importResult.failed > 0 ? "warning" : "success"} 
          sx={{ mb: 3 }}
          onClose={clearImportResult}
        >
          <AlertTitle>Import Results</AlertTitle>
          Successfully imported {importResult.success} subcontractors.
          {importResult.failed > 0 && (
            <>
              <br />Failed to import {importResult.failed} subcontractors.
              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Errors:</Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}><Typography variant="body2">{error}</Typography></li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li><Typography variant="body2">And {importResult.errors.length - 5} more errors...</Typography></li>
                    )}
                  </ul>
                </Box>
              )}
            </>
          )}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            placeholder="Search subcontractors..."
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button 
            variant="outlined" 
            startIcon={<FilterIcon />}
            sx={{ minWidth: 120 }}
          >
            Filter
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<SortIcon />}
            sx={{ ml: 2, minWidth: 120 }}
          >
            Sort
          </Button>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" />
          <Tab label="Electrical" />
          <Tab label="Plumbing" />
          <Tab label="HVAC" />
          <Tab label="Carpentry" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      ) : filteredSubcontractors.length === 0 ? (
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h6">No subcontractors found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Add your first subcontractor to get started
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={handleAddSubcontractor}
          >
            Add Subcontractor
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredSubcontractors.map((subcontractor) => (
            <Grid item xs={12} sm={6} md={4} key={subcontractor.id}>
              <SubcontractorCard
                id={subcontractor.id!}
                name={subcontractor.name}
                specialty={subcontractor.specialty}
                rating={subcontractor.rating}
                totalProjects={subcontractor.totalProjects}
                lastBid={subcontractor.lastBid}
                contact={subcontractor.contact}
                performance={subcontractor.performance}
                onEdit={handleEditSubcontractor}
                onDelete={handleDeleteSubcontractor}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Subcontractors; 