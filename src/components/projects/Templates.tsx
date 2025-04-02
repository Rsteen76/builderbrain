import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Construction as ConstructionIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  AccountBalance as InstitutionalIcon,
  HolidayVillage as HospitalityIcon,
  ShoppingCart as RetailIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectService } from '../../services/project';
import { Project, Template } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Mock templates data structure until we implement backend storage
const INITIAL_TEMPLATES = [
  {
    id: 'residential-template',
    name: 'Residential Construction',
    description: 'Template for single-family and multi-family residential construction projects',
    icon: 'home',
    phases: [
      { name: 'Pre-Construction', percentage: 0.05 },
      { name: 'Site Work & Foundation', percentage: 0.15 },
      { name: 'Framing', percentage: 0.2 },
      { name: 'Exterior Finishing', percentage: 0.1 },
      { name: 'Rough-In Mechanical Systems', percentage: 0.1 },
      { name: 'Insulation & Drywall', percentage: 0.08 },
      { name: 'Interior Finishing', percentage: 0.15 },
      { name: 'Mechanical Trim-Out', percentage: 0.07 },
      { name: 'Landscaping & Exterior Work', percentage: 0.05 },
      { name: 'Final Inspection & Closeout', percentage: 0.05 },
    ],
    createdBy: 'system',
    createdAt: new Date('2023-01-01'),
    isSystem: true
  },
  {
    id: 'commercial-template',
    name: 'Commercial Construction',
    description: 'Template for office buildings, retail spaces, and other commercial construction projects',
    icon: 'business',
    phases: [
      { name: 'Pre-Construction & Planning', percentage: 0.08 },
      { name: 'Site Preparation', percentage: 0.1 },
      { name: 'Foundation', percentage: 0.12 },
      { name: 'Structural Steel & Framing', percentage: 0.15 },
      { name: 'Exterior Envelope', percentage: 0.12 },
      { name: 'Mechanical, Electrical & Plumbing', percentage: 0.15 },
      { name: 'Interior Construction', percentage: 0.1 },
      { name: 'Finishes', percentage: 0.08 },
      { name: 'Site Improvements', percentage: 0.05 },
      { name: 'Commissioning & Closeout', percentage: 0.05 },
    ],
    createdBy: 'system',
    createdAt: new Date('2023-01-01'),
    isSystem: true
  },
  {
    id: 'renovation-template',
    name: 'Renovation',
    description: 'Template for renovation and remodeling projects',
    icon: 'apartment',
    phases: [
      { name: 'Assessment & Planning', percentage: 0.1 },
      { name: 'Demolition', percentage: 0.1 },
      { name: 'Structural Modifications', percentage: 0.15 },
      { name: 'Rough-In Mechanical Systems', percentage: 0.15 },
      { name: 'Insulation & Drywall', percentage: 0.1 },
      { name: 'Interior Finishing', percentage: 0.2 },
      { name: 'Mechanical Trim-Out', percentage: 0.1 },
      { name: 'Final Inspection & Closeout', percentage: 0.1 },
    ],
    createdBy: 'system',
    createdAt: new Date('2023-01-01'),
    isSystem: true
  }
];

// Template form structure
interface TemplateForm {
  name: string;
  description: string;
  icon: 'home' | 'business' | 'apartment' | 'institutional' | 'hospitality' | 'retail';
  phases: { name: string; percentage: number }[];
}

// Define a Phase type for easier reference
type PhaseField = {
  name: string;
  percentage: number;
};

const ProjectTemplates: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  // State
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateForm>({
    name: '',
    description: '',
    icon: 'home',
    phases: [{ name: '', percentage: 0 }]
  });
  
  // Load templates when the component mounts
  useEffect(() => {
    // In the future, we can load templates from the backend here
    // For now, we're using the mock data
  }, [user]);
  
  // Get icon component based on template.icon value
  const getIconComponent = (icon: string, props = {}) => {
    switch (icon) {
      case 'home': return <HomeIcon {...props} />;
      case 'business': return <BusinessIcon {...props} />;
      case 'apartment': return <ApartmentIcon {...props} />;
      case 'institutional': return <InstitutionalIcon {...props} />;
      case 'hospitality': return <HospitalityIcon {...props} />;
      case 'retail': return <RetailIcon {...props} />;
      default: return <ConstructionIcon {...props} />;
    }
  };
  
  // Handle opening the create template dialog
  const handleCreateTemplate = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      description: '',
      icon: 'home',
      phases: [{ name: 'Phase 1', percentage: 1 }]
    });
    setIsDialogOpen(true);
  };
  
  // Handle opening the edit template dialog
  const handleEditTemplate = (template: Template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      icon: template.icon as TemplateForm['icon'],
      phases: [...template.phases]
    });
    setIsDialogOpen(true);
  };
  
  // Handle opening the delete template dialog
  const handleDeleteClick = (template: Template) => {
    setCurrentTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirming template deletion
  const handleDeleteTemplate = () => {
    if (!currentTemplate) return;
    
    // Filter out the template to delete
    const updatedTemplates = templates.filter(t => t.id !== currentTemplate.id);
    setTemplates(updatedTemplates);
    setIsDeleteDialogOpen(false);
    setCurrentTemplate(null);
  };
  
  // Handle duplicating a template
  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: uuidv4(),
      name: `${template.name} (Copy)`,
      createdBy: user?.uid || 'unknown',
      createdAt: new Date(),
      isSystem: false
    };
    
    setTemplates([...templates, newTemplate]);
  };
  
  // Handle text field changes in the form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle adding a new phase
  const handleAddPhase = () => {
    const newPhases = [...formData.phases, { name: '', percentage: 0 }];
    setFormData({
      ...formData,
      phases: newPhases
    });
  };
  
  // Handle removing a phase
  const handleRemovePhase = (index: number) => {
    const newPhases = formData.phases.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      phases: newPhases
    });
  };
  
  // Handle changes to phase fields
  const handlePhaseChange = (index: number, field: keyof PhaseField, value: string | number) => {
    const newPhases = [...formData.phases];
    if (field === 'percentage') {
      newPhases[index][field] = parseFloat(value as string);
    } else if (field === 'name') {
      newPhases[index][field] = value as string;
    }
    setFormData({
      ...formData,
      phases: newPhases
    });
  };
  
  // Handle normalizing percentages to ensure they sum to 100%
  const normalizePercentages = () => {
    const totalPercentage = formData.phases.reduce((sum, phase) => sum + phase.percentage, 0);
    
    if (totalPercentage === 0) {
      // If all percentages are 0, distribute evenly
      const evenPercentage = 1 / formData.phases.length;
      const newPhases = formData.phases.map(phase => ({
        ...phase,
        percentage: evenPercentage
      }));
      setFormData({
        ...formData,
        phases: newPhases
      });
    } else if (totalPercentage !== 1) {
      // Normalize to sum to 1 (100%)
      const newPhases = formData.phases.map(phase => ({
        ...phase,
        percentage: phase.percentage / totalPercentage
      }));
      setFormData({
        ...formData,
        phases: newPhases
      });
    }
  };
  
  // Handle saving the template
  const handleSaveTemplate = () => {
    // Normalize percentages
    normalizePercentages();
    
    // Validate the form data
    if (!formData.name) {
      setError('Template name is required');
      return;
    }
    
    if (formData.phases.some(phase => !phase.name)) {
      setError('All phases must have a name');
      return;
    }
    
    // Create or update the template
    if (currentTemplate) {
      // Update existing template
      const updatedTemplates = templates.map(t => {
        if (t.id === currentTemplate.id) {
          return {
            ...t,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            phases: formData.phases
          };
        }
        return t;
      });
      setTemplates(updatedTemplates);
    } else {
      // Create new template
      const newTemplate: Template = {
        id: uuidv4(),
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        phases: formData.phases,
        createdBy: user?.uid || 'unknown',
        createdAt: new Date(),
        isSystem: false
      };
      setTemplates([...templates, newTemplate]);
    }
    
    // Close the dialog
    setIsDialogOpen(false);
    setCurrentTemplate(null);
    setError(null);
  };
  
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please sign in to manage project templates.</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          p: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConstructionIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight={600}>
              Project Templates
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTemplate}
            sx={{ borderRadius: 1.5 }}
          >
            Create Template
          </Button>
        </Box>
      </Paper>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Templates grid */}
      <Grid container spacing={3}>
        {templates.map(template => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.light', 
                      color: 'primary.contrastText',
                      mr: 2,
                    }}
                  >
                    {getIconComponent(template.icon, { fontSize: 'small' })}
                  </Box>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {template.name}
                  </Typography>
                  {template.isSystem && (
                    <Chip 
                      size="small" 
                      label="System" 
                      color="default" 
                      sx={{ ml: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }} 
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                
                <Typography variant="subtitle2" color="text.primary" gutterBottom>
                  Phases:
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  {template.phases.slice(0, 4).map((phase, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{phase.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(phase.percentage * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  ))}
                  
                  {template.phases.length > 4 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      +{template.phases.length - 4} more phases
                    </Typography>
                  )}
                </Box>
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Box>
                  <Tooltip title="Edit Template">
                    <IconButton 
                      onClick={() => handleEditTemplate(template)}
                      disabled={template.isSystem}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Duplicate Template">
                    <IconButton onClick={() => handleDuplicateTemplate(template)}>
                      <DuplicateIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete Template">
                    <span>
                      <IconButton 
                        onClick={() => handleDeleteClick(template)}
                        disabled={template.isSystem}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => navigate('/projects/new')}
                  sx={{ borderRadius: 1.5 }}
                >
                  Use Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Template form dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentTemplate ? `Edit Template: ${currentTemplate.name}` : 'Create New Template'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Template Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleFormChange}
                  fullWidth
                >
                  <MenuItem value="home">Residential</MenuItem>
                  <MenuItem value="business">Commercial</MenuItem>
                  <MenuItem value="apartment">Renovation</MenuItem>
                  <MenuItem value="institutional">Institutional</MenuItem>
                  <MenuItem value="hospitality">Hospitality</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Project Phases</Typography>
                  <Button 
                    startIcon={<AddIcon />} 
                    onClick={handleAddPhase}
                    size="small"
                  >
                    Add Phase
                  </Button>
                </Box>
                
                {formData.phases.map((phase, index) => (
                  <Box key={index} sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      label="Phase Name"
                      value={phase.name}
                      onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                      fullWidth
                      required
                    />
                    
                    <TextField
                      label="Percentage"
                      type="number"
                      value={phase.percentage * 100}
                      onChange={(e) => handlePhaseChange(index, 'percentage', parseFloat(e.target.value) / 100)}
                      InputProps={{
                        endAdornment: <Typography variant="caption">%</Typography>,
                      }}
                      inputProps={{
                        min: 0,
                        max: 100,
                        step: 1,
                      }}
                      sx={{ width: '120px' }}
                    />
                    
                    <IconButton 
                      onClick={() => handleRemovePhase(index)}
                      color="error"
                      disabled={formData.phases.length === 1}
                      sx={{ mt: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {formData.phases.reduce((sum, phase) => sum + phase.percentage, 0) * 100}%
                  </Typography>
                  <Button size="small" onClick={normalizePercentages}>Normalize to 100%</Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveTemplate}
            color="primary"
            sx={{ borderRadius: 1.5 }}
          >
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the template "{currentTemplate?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteTemplate} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: 1.5 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectTemplates; 