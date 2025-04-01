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
import { Subcontractor } from '../../types';
import { SubcontractorService } from '../../services/subcontractor';
import { formatCurrency } from '../../utils/formatters';
import { exportSubcontractorsToCSV, importSubcontractorsFromCSV, downloadFile } from '../../utils/importExport';
import { useAuth } from '../../contexts/AuthContext';

interface SubcontractorCardProps extends Subcontractor {
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
            <Rating value={rating ?? 0} precision={0.5} readOnly size="small" />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {(rating ?? 0).toFixed(1)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {totalProjects ?? 0} completed projects
          </Typography>
        </Box>

        {lastBid && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Last Bid</Typography>
            <Typography variant="body2">
              {formatCurrency(lastBid.amount)} ({lastBid.date ? new Date(lastBid.date).toLocaleDateString() : 'Date N/A'})
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
                  value={performance?.onTime ?? 0}
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Typography variant="body2">{performance?.onTime ?? 0}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>Quality</Typography>
                <LinearProgress
                  variant="determinate"
                  value={performance?.quality ?? 0}
                  sx={{ flexGrow: 1, mr: 1 }}
                  color="success"
                />
                <Typography variant="body2">{performance?.quality ?? 0}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ minWidth: 100 }}>Communication</Typography>
                <LinearProgress
                  variant="determinate"
                  value={performance?.communication ?? 0}
                  sx={{ flexGrow: 1, mr: 1 }}
                  color="info"
                />
                <Typography variant="body2">{performance?.communication ?? 0}%</Typography>
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
                <Typography variant="body2">{contact?.phone || '-'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact?.email || '-'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact?.location || '-'}</Typography>
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
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      fetchSubcontractors(user.uid);
    } else if (!user) {
      setLoading(true);
      setError(null);
    } else {
      setError("User not authenticated.");
      setLoading(false);
    }
  }, [user]);

  const fetchSubcontractors = async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const currentFilters = { specialty: specialtyFilter || undefined };
      const data = await SubcontractorService.getSubcontractors(currentUserId, currentFilters);
      const filteredData = data.filter(sub => 
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sub.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSubcontractors(filteredData);
    } catch (err) {
      console.error('Error fetching subcontractors:', err);
      setError('Failed to load subcontractors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchSubcontractors(user.uid);
    }
  }, [specialtyFilter, searchTerm, user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    let filter: string | null = null;
    switch(newValue) {
      case 0: filter = null; break; // All
      case 1: filter = 'Electrical'; break;
      case 2: filter = 'Plumbing'; break;
      case 3: filter = 'HVAC'; break;
      case 4: filter = 'Framing'; break;
      case 5: filter = 'Excavation'; break;
      case 6: filter = 'Concrete'; break;
      case 7: filter = 'Drywall'; break;
      case 8: filter = 'Painting'; break;
      case 9: filter = 'Roofing'; break;
      // Add more cases as needed
      default: filter = null;
    }
    setSpecialtyFilter(filter);
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
    if (!user?.uid) {
      setError("Cannot export: User not authenticated.");
      return;
    }
    try {
      const allSubcontractors = await SubcontractorService.getSubcontractors(user.uid);
      
      if (allSubcontractors.length === 0) {
        setError("No subcontractors to export.");
        return;
      }
      
      const csvData = exportSubcontractorsToCSV(allSubcontractors);
      downloadFile(csvData, 'subcontractors.csv', 'text/csv;charset=utf-8;');
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export subcontractors.");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.uid) {
      setError("Cannot import: User not authenticated.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setImportResult(null);
    
    try {
      const result = await importSubcontractorsFromCSV(file, user.uid);
      setImportResult(result);
      
      await fetchSubcontractors(user.uid);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
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
    <Box sx={{ py: 3, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, md: 0 } }}>
          Subcontractors
        </Typography>
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
          onClose={clearImportResult}
          sx={{ mb: 2 }}
        >
          <AlertTitle>Import Complete</AlertTitle>
          Successfully imported: {importResult.success}. Failed: {importResult.failed}.
          {importResult.failed > 0 && (
            <Box sx={{ maxHeight: 100, overflowY: 'auto', mt: 1 }}>
              <Typography variant="caption">Errors:</Typography>
              <ul>{importResult.errors.map((e, i) => <li key={i}><Typography variant="caption">{e}</Typography></li>)}</ul>
            </Box>
          )}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name or specialty..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 }, minWidth: '200px' }}
        />
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile 
          aria-label="Subcontractor specialty filter tabs"
        >
          <Tab label="All" />
          <Tab label="Electrical" />
          <Tab label="Plumbing" />
          <Tab label="HVAC" />
          <Tab label="Framing" />
          <Tab label="Excavation" />
          <Tab label="Concrete" />
          <Tab label="Drywall" />
          <Tab label="Painting" />
          <Tab label="Roofing" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredSubcontractors.length > 0 ? (
            filteredSubcontractors.map((sub) => (
              <Grid item key={sub.id} xs={12} sm={6} md={4} lg={3}>
                <SubcontractorCard
                  {...sub}
                  onEdit={handleEditSubcontractor}
                  onDelete={handleDeleteSubcontractor}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                No subcontractors found matching your criteria.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Subcontractors; 