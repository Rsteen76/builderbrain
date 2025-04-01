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
  Stack,
  Container,
  useMediaQuery,
  CardActionArea,
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
  Person as PersonIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Subcontractor } from '../../types';
import { SubcontractorService } from '../../services/subcontractor';
import { formatCurrency, formatPhoneNumber } from '../../utils/formatters';
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
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
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
        }
      }}
    >
      <CardActionArea onClick={handleCardClick}>
        <CardContent sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 48,
                  height: 48,
                  mr: 2,
                }}
              >
                {name.substring(0, 1)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600} component="div">
                  {name}
                </Typography>
                <Chip 
                  label={specialty} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    mt: 0.5
                  }} 
                />
              </Box>
            </Box>
            <Box>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(e as React.MouseEvent<HTMLButtonElement>);
                }}
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                  elevation: 2,
                  sx: {
                    width: 180,
                    borderRadius: 2,
                    overflow: 'visible',
                    boxShadow: `0 5px 15px ${alpha(theme.palette.common.black, 0.1)}`,
                  },
                }}
              >
                <MenuItem onClick={() => { onEdit(id); handleClose(); }}>Edit</MenuItem>
                <MenuItem 
                  onClick={() => { onDelete(id); handleClose(); }}
                  sx={{ color: theme.palette.error.main }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={rating ?? 0} precision={0.5} readOnly size="small" />
              <Typography variant="body2" sx={{ ml: 1, color: theme.palette.text.secondary }}>
                {(rating ?? 0).toFixed(1)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WorkIcon fontSize="small" color="action" />
              {totalProjects ?? 0} completed projects
            </Typography>
          </Box>

          {lastBid && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>Last Bid</Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatCurrency(lastBid.amount)}
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>Performance</Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography variant="body2">On Time</Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={performance?.onTime ?? 0}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.warning.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.warning.main,
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={500}>{performance?.onTime ?? 0}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography variant="body2">Quality</Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={performance?.quality ?? 0}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.success.main,
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={500}>{performance?.quality ?? 0}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ minWidth: 100 }}>
                    <Typography variant="body2">Communication</Typography>
                  </Box>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={performance?.communication ?? 0}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.info.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.info.main,
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={500}>{performance?.communication ?? 0}%</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Stack direction="column" spacing={0.5}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>Contact</Typography>
            {contact?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{formatPhoneNumber(contact.phone)}</Typography>
              </Box>
            )}
            {contact?.email && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.email}</Typography>
              </Box>
            )}
            {contact?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{contact.location}</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const Subcontractors: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      const currentFilters = { specialtyArea: specialtyFilter || undefined };
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
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 }, pb: 4 }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 44,
                height: 44,
              }}
            >
              <ConstructionIcon />
            </Avatar>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight={600}>
                Subcontractors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredSubcontractors.length} subcontractors {specialtyFilter && `in ${specialtyFilter}`}
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2 }}
            fullWidth={isMobile}
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
            sx={{ borderRadius: 2 }}
            fullWidth={isMobile}
          >
            Import
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddSubcontractor}
            sx={{ borderRadius: 2 }}
            fullWidth={isMobile}
          >
            {isMobile ? 'Add' : 'Add Subcontractor'}
          </Button>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Stack>
      </Stack>
      
      {importResult && (
        <Alert 
          severity={importResult.failed > 0 ? "warning" : "success"}
          onClose={clearImportResult}
          sx={{ mb: 3, borderRadius: 2 }}
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
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}
      
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 3 }}
      >
        <TextField
          placeholder="Search by name or specialty..."
          variant="outlined"
          fullWidth
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.2),
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile 
          aria-label="Subcontractor specialty filter tabs"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minWidth: 'auto',
              mx: 1,
              '&:first-of-type': {
                ml: 0,
              },
            }
          }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
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
              <Card
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  textAlign: 'center',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                }}
              >
                <ConstructionIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No subcontractors found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm ? 'Try adjusting your search or filters' : 'Add your first subcontractor to get started'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSubcontractor}
                  sx={{ borderRadius: 2 }}
                >
                  Add Subcontractor
                </Button>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Subcontractors; 