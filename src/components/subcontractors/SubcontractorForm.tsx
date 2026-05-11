import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  MenuItem,
  Rating,
  Slider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { Subcontractor } from '../../types';
import { SubcontractorService } from '../../services/subcontractor';
import { useAuth } from '../../contexts/AuthContext';

const specialties = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Masonry',
  'Drywall',
  'Painting',
  'Roofing',
  'Flooring',
  'Foundation',
  'Concrete',
  'Excavation',
  'Demolition',
  'Insulation',
  'Glazing',
  'Structural Steel',
  'Framing',
  'Siding',
  'Waterproofing',
  'Tile',
  'Landscaping',
  'Other'
];

const SubcontractorForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const emptySubcontractor: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
    name: '',
    specialty: '',
    rating: 0,
    totalProjects: 0,
    contact: {
      phone: '',
      email: '',
      location: '',
    },
    performance: {
      onTime: 0,
      quality: 0,
      communication: 0,
    },
    companyInfo: {
      website: '',
      founded: '',
      employees: 0,
      license: '',
    },
    lastBid: null,
    projects: [],
    notes: '',
  };

  const [formData, setFormData] = useState<Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(emptySubcontractor);
  const isEditMode = !!id;

  useEffect(() => {
    const fetchSubcontractor = async () => {
      if (!id || !user?.uid) {
        if (!id) {
          // Handle if needed
        } else {
          setError('User not authenticated.');
        }
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const subcontractor = await SubcontractorService.getSubcontractor(user.uid, id);
        
        if (!subcontractor) {
          setError('Subcontractor not found or not accessible');
          return;
        }
        
        const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...dataToSet } = subcontractor;
        setFormData(dataToSet);
      } catch (err) {
        logger.error('Error fetching subcontractor:', err);
        setError('Failed to load subcontractor data');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode && user?.uid) {
      fetchSubcontractor();
    } else if (isEditMode) {
      setError('Authenticating...');
      setLoading(false);
    }
  }, [id, isEditMode, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof typeof prev];
        if (parentObj && typeof parentObj === 'object') {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentObj = prev[parent as keyof typeof prev];
        if (parentObj && typeof parentObj === 'object') {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: numValue,
            },
          };
        }
        return prev;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  const handleRatingChange = (_: React.SyntheticEvent, newValue: number | null) => {
    setFormData(prev => ({
      ...prev,
      rating: newValue || 0,
    }));
  };

  const handlePerformanceChange = (name: string) => (_: Event, newValue: number | number[]) => {
    setFormData(prev => ({
      ...prev,
      performance: {
        ...prev.performance || {},
        [name]: newValue as number,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError("User authentication error. Cannot save.");
      return;
    }
    
    if (!formData.name || !formData.specialty) {
      setError('Name and specialty are required');
      return;
    }
    
    try {
      setSaveLoading(true);
      setError(null);
      
      const payload: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = { 
          ...emptySubcontractor,
          ...formData,
          contact: { ...emptySubcontractor.contact, ...formData.contact },
          performance: { ...emptySubcontractor.performance, ...formData.performance },
          companyInfo: { ...emptySubcontractor.companyInfo, ...formData.companyInfo },
          lastBid: formData.lastBid || null,
      };

      if (isEditMode && id) {
        const updatePayload = JSON.parse(JSON.stringify(formData));
        await SubcontractorService.updateSubcontractor(id, updatePayload);
        setSuccess('Subcontractor updated successfully');
      } else {
        await SubcontractorService.createSubcontractor(user.uid, payload);
        setSuccess('Subcontractor created successfully');
        
        setTimeout(() => navigate('/subcontractors'), 1500);
      }
    } catch (err) {
      logger.error('Error saving subcontractor:', err);
      setError('Failed to save subcontractor. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/subcontractors');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Subcontractor' : 'Add New Subcontractor'}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={saveLoading}
        >
          {saveLoading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Company Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Specialty"
                name="specialty"
                value={formData.specialty}
                onChange={handleInputChange}
                select
                fullWidth
                required
              >
                {specialties.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography component="legend">Rating</Typography>
              <Rating
                name="rating"
                value={formData.rating}
                onChange={handleRatingChange}
                precision={0.5}
                size="large"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Total Projects"
                name="totalProjects"
                type="number"
                value={formData.totalProjects}
                onChange={handleNumberInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                name="contact.email"
                type="email"
                value={formData.contact.email}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                name="contact.location"
                value={formData.contact.location}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>Performance Metrics</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Typography gutterBottom>On-Time Delivery: {formData.performance?.onTime || 0}%</Typography>
              <Slider
                value={formData.performance?.onTime || 0}
                onChange={handlePerformanceChange('onTime')}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Quality: {formData.performance?.quality || 0}%</Typography>
              <Slider
                value={formData.performance?.quality || 0}
                onChange={handlePerformanceChange('quality')}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Communication: {formData.performance?.communication || 0}%</Typography>
              <Slider
                value={formData.performance?.communication || 0}
                onChange={handlePerformanceChange('communication')}
                valueLabelDisplay="auto"
                step={5}
                marks
                min={0}
                max={100}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>Company Information</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Website"
                name="companyInfo.website"
                value={formData.companyInfo?.website || ''}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Year Founded"
                name="companyInfo.founded"
                value={formData.companyInfo?.founded || ''}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Number of Employees"
                name="companyInfo.employees"
                type="number"
                value={formData.companyInfo?.employees || 0}
                onChange={handleNumberInputChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="License Number"
                name="companyInfo.license"
                value={formData.companyInfo?.license || ''}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>Additional Notes</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
              />
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default SubcontractorForm; 