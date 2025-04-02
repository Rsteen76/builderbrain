import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Autocomplete,
  FormHelperText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { BidService } from '../../services/bid';
import { ProjectService } from '../../services/project';
import { SubcontractorService } from '../../services/subcontractor';
import { formatCurrency } from '../../utils/formatters';
import { Bid, BidPaymentStage, Project, Subcontractor } from '../../types';
import LineItemsTable from './LineItemsTable';

// Define interfaces for the form state
interface BidInstallment {
  id: string;
  name: string;
  percent: number;
  milestoneDescription: string;
  phaseId?: string;
  phaseName?: string;
}

interface PaymentTerms {
  downPaymentPercent: number;
  installments: BidInstallment[];
}

// Use a simpler interface with type assertion when needed
interface BidFormState {
  [key: string]: any;
}

// Status and priority options
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'revision_requested', label: 'Revision Requested' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const BidForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for form data
  const [bidForm, setBidForm] = useState<BidFormState>({
    title: '',
    subcontractorName: '',
    subcontractorId: '',
    projectId: '',
    projectName: '',
    phaseId: '',
    phaseName: '',
    totalAmount: 0,
    scope: '',
    timeline: 30,
    notes: '',
    status: 'draft',
    priority: 'medium',
    submissionDeadline: new Date(new Date().setDate(new Date().getDate() + 14)),
    startDate: null,
    completionDate: null,
    attachments: [],
    tags: [],
    requiresInsurance: false,
    requiresBond: false,
    isPublic: false,
    isApproved: false,
    paymentTerms: {
      downPaymentPercent: 20,
      installments: [
        {id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}
      ]
    },
  });
  
  // State for managing UI
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // State for subcontractor management
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [showQuickAddSubcontractor, setShowQuickAddSubcontractor] = useState(false);
  const [newSubcontractor, setNewSubcontractor] = useState({
    name: '',
    specialty: '',
    contact: {
      phone: '',
      email: ''
    }
  });
  
  // Fetch data on component mount
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user]);
  
  // Fetch bid data for editing
  useEffect(() => {
    if (id && user?.uid) {
      fetchBid();
    }
  }, [id, user]);
  
  const fetchData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Fetch projects
      const projectsList = await ProjectService.getProjects(user.uid);
      setProjects(projectsList);
      
      // Fetch subcontractors
      const subcontractorsList = await SubcontractorService.getSubcontractors(user.uid);
      setSubcontractors(subcontractorsList);
    } catch (err) {
      setError('Error loading data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBid = async () => {
    if (!id || !user?.uid) return;
    
    setLoading(true);
    try {
      const bid = await BidService.getBid(user.uid, id);
      
      if (!bid) {
        setError('Bid not found or access denied.');
        return;
      }
      
      console.log('Loaded bid for editing:', bid);
      
      // Extract payment terms from payment schedule
      const paymentTerms = {
        downPaymentPercent: bid.paymentSchedule && bid.paymentSchedule.length > 0 ? bid.paymentSchedule[0].percentage || 0 : 20,
        installments: bid.paymentSchedule && bid.paymentSchedule.length > 1 
          ? bid.paymentSchedule.slice(1).map(payment => ({
              id: payment.id || uuidv4(),
              name: payment.name || '',
              percent: payment.percentage || 0,
              milestoneDescription: payment.description || '',
              phaseId: payment.phaseId || '',
              phaseName: payment.phaseName || ''
            }))
          : [{id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}]
      };
      
      // Set form data from bid
      setBidForm({
        ...bid,
        paymentTerms
      });
      
      // If bid has versions with line items, load those
      if (bid.versions && bid.versions.length > 0 && bid.currentVersionId) {
        const currentVersion = bid.versions.find(v => v.id === bid.currentVersionId);
        if (currentVersion && Array.isArray(currentVersion.lineItems)) {
          setLineItems(currentVersion.lineItems);
        }
      }
    } catch (err) {
      setError('Error loading bid. Please try again.');
      console.error('Error fetching bid:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form field changes
  const handleChangeBidForm = (field: string, value: any) => {
    setBidForm((prev: BidFormState) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle payment terms changes
  const handleChangePaymentTerms = (field: string, value: any) => {
    setBidForm((prev: BidFormState) => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        [field]: value
      }
    }));
  };
  
  // Handle installment changes
  const handleChangeInstallment = (id: string, field: string, value: any) => {
    setBidForm((prev: BidFormState) => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.map((item: BidInstallment) => 
          item.id === id ? { ...item, [field]: value } : item
        )
      }
    }));
  };
  
  // Add installment
  const handleAddInstallment = () => {
    if (!bidForm.paymentTerms.installments) {
      handleChangePaymentTerms('installments', []);
    }
    
    const newInstallment = {
      id: uuidv4(),
      name: `Installment ${(bidForm.paymentTerms.installments?.length || 0) + 1}`,
      percent: 20,
      milestoneDescription: '',
      phaseId: bidForm.phaseId || '',
      phaseName: bidForm.phaseName || ''
    };
    
    handleChangePaymentTerms('installments', [...(bidForm.paymentTerms.installments || []), newInstallment]);
  };
  
  // Remove installment
  const handleRemoveInstallment = (id: string) => {
    handleChangePaymentTerms('installments', bidForm.paymentTerms.installments.filter((item: BidInstallment) => item.id !== id));
  };
  
  // Handle line item changes
  const handleLineItemChange = (updatedItems: any[]) => {
    setLineItems(updatedItems);
    
    // Update total amount based on line items
    const total = updatedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    handleChangeBidForm('totalAmount', total);
  };
  
  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = Array.isArray(bidForm.tags) 
        ? [...bidForm.tags, tagInput.trim()] 
        : [tagInput.trim()];
      
      handleChangeBidForm('tags', newTags);
      setTagInput('');
    }
  };
  
  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = Array.isArray(bidForm.tags) 
      ? bidForm.tags.filter((tag: string) => tag !== tagToRemove)
      : [];
    
    handleChangeBidForm('tags', newTags);
  };
  
  // Quick add subcontractor
  const handleQuickAddSubcontractor = async () => {
    if (!user?.uid || !newSubcontractor.name.trim()) return;
    
    try {
      setIsSaving(true);
      
      // Create subcontractor object
      const subcontractorData = {
        name: newSubcontractor.name,
        specialty: newSubcontractor.specialty,
        contact: {
          phone: newSubcontractor.contact.phone,
          email: newSubcontractor.contact.email
        },
        rating: 0,
        totalProjects: 0
      };
      
      const createdSubcontractor = await SubcontractorService.createSubcontractor(user.uid, subcontractorData);
      
      // Update subcontractors list
      setSubcontractors(prev => [...prev, createdSubcontractor]);
      
      // Set as selected subcontractor
      handleChangeBidForm('subcontractorId', createdSubcontractor.id);
      handleChangeBidForm('subcontractorName', createdSubcontractor.name);
      
      // Reset form and close dialog
      setNewSubcontractor({
        name: '',
        specialty: '',
        contact: {
          phone: '',
          email: ''
        }
      });
      setShowQuickAddSubcontractor(false);
      
      // Show success message
      setSuccess('Subcontractor added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add subcontractor');
      console.error('Error adding subcontractor:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper function to remove undefined fields
  const removeUndefinedFields = (obj: any): any => {
    const cleanObj = { ...obj };
    
    Object.keys(cleanObj).forEach(key => {
      if (cleanObj[key] === undefined) {
        if (key === 'submissionDeadline' || key === 'startDate' || key === 'completionDate' || key === 'dueDate') {
          cleanObj[key] = null;
        } else {
          delete cleanObj[key];
        }
      } else if (typeof cleanObj[key] === 'object' && cleanObj[key] !== null && !(cleanObj[key] instanceof Date)) {
        cleanObj[key] = removeUndefinedFields(cleanObj[key]);
      }
    });
    
    return cleanObj;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }
    
    // Validate required fields
    if (!bidForm.title) {
      setError('Please enter a title for the bid');
      return;
    }
    
    if (!bidForm.projectId) {
      setError('Please select a project');
      return;
    }
    
    if (!bidForm.subcontractorName) {
      setError('Please select or enter a subcontractor name');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Calculate total percentage to ensure it adds up to 100%
      const downPaymentPercent = bidForm.paymentTerms.downPaymentPercent;
      const installmentsTotal = bidForm.paymentTerms.installments.reduce((sum: number, item: any) => sum + (parseFloat(item.percent) || 0), 0);
      const totalPercent = downPaymentPercent + installmentsTotal;
      
      if (Math.abs(totalPercent - 100) > 0.01) {
        setError(`Payment percentages must add up to 100%. Currently: ${totalPercent.toFixed(2)}%`);
        setIsSaving(false);
        return;
      }
      
      const now = new Date();
      
      // Create payment schedule for bid with explicit date objects
      const paymentSchedule = [
        {
          id: uuidv4(),
          name: 'Down Payment',
          percentage: downPaymentPercent,
          amount: (bidForm.totalAmount * downPaymentPercent) / 100,
          status: 'pending',
          phaseId: bidForm.phaseId,
          phaseName: bidForm.phaseName,
          dueDate: now,
          description: 'Initial payment to start work',
          createdAt: now,
          updatedAt: now
        } as BidPaymentStage,
        ...bidForm.paymentTerms.installments.map((installment: any) => ({
          id: installment.id || uuidv4(),
          name: installment.name,
          percentage: parseFloat(installment.percent) || 0,
          amount: (bidForm.totalAmount * parseFloat(installment.percent)) / 100,
          status: 'pending',
          phaseId: installment.phaseId || bidForm.phaseId,
          phaseName: installment.phaseName || bidForm.phaseName,
          dueDate: now,
          description: installment.milestoneDescription,
          createdAt: now,
          updatedAt: now
        } as BidPaymentStage))
      ] as BidPaymentStage[];
      
      // Create base bid data object with explicit null values for Date fields that can't be undefined
      const bidData = {
        userId: user.uid,
        projectId: bidForm.projectId,
        projectName: bidForm.projectName || '',
        title: bidForm.title || '',
        subcontractorName: bidForm.subcontractorName || '',
        subcontractorId: bidForm.subcontractorId || '',
        phaseId: bidForm.phaseId || '',
        phaseName: bidForm.phaseName || '',
        totalAmount: bidForm.totalAmount || 0,
        scope: bidForm.scope || '',
        timeline: bidForm.timeline || 0,
        notes: bidForm.notes || '',
        status: bidForm.status || 'draft',
        priority: bidForm.priority || 'medium',
        requiresInsurance: bidForm.requiresInsurance || false,
        requiresBond: bidForm.requiresBond || false,
        isPublic: bidForm.isPublic || false,
        isApproved: bidForm.isApproved || false,
        tags: Array.isArray(bidForm.tags) ? bidForm.tags : [],
        attachments: Array.isArray(bidForm.attachments) ? bidForm.attachments : [],
        // Set date fields explicitly to null if invalid
        submissionDeadline: null, // Default to null, will override if valid below
        startDate: null,
        completionDate: null,
        paymentSchedule,
        createdAt: now,
        updatedAt: now,
        paymentProgress: {
          paid: 0,
          pending: bidForm.totalAmount,
          remaining: bidForm.totalAmount
        }
      } as any;
      
      // Only set date fields if they are valid Date objects
      if (bidForm.submissionDeadline instanceof Date && !isNaN(bidForm.submissionDeadline.getTime())) {
        bidData.submissionDeadline = bidForm.submissionDeadline;
      }
      
      if (bidForm.startDate instanceof Date && !isNaN(bidForm.startDate.getTime())) {
        bidData.startDate = bidForm.startDate;
      }
      
      if (bidForm.completionDate instanceof Date && !isNaN(bidForm.completionDate.getTime())) {
        bidData.completionDate = bidForm.completionDate;
      }
      
      // Clean any remaining undefined fields
      const cleanBidData = removeUndefinedFields(bidData);
      
      if (id) {
        // Update existing bid
        await BidService.updateBid(id, cleanBidData);
        
        // Create new version if there are line items
        if (lineItems.length > 0) {
          const versionData = {
            versionNumber: (bidForm.versions?.length || 0) + 1,
            totalAmount: bidForm.totalAmount,
            notes: 'Updated version',
            lineItems: lineItems,
            attachments: Array.isArray(bidForm.attachments) ? bidForm.attachments : []
          };
          
          await BidService.createBidVersion(user.uid, id, versionData);
        }
        
        setSuccess('Bid updated successfully');
        
        setTimeout(() => {
          navigate(`/bids/${id}`);
        }, 1500);
      } else {
        // Create new bid
        const newBid = await BidService.createBid(user.uid, cleanBidData);
        
        // Create version if there are line items
        if (lineItems.length > 0) {
          const versionData = {
            versionNumber: 1,
            totalAmount: bidForm.totalAmount,
            notes: 'Initial version',
            lineItems: lineItems,
            attachments: Array.isArray(bidForm.attachments) ? bidForm.attachments : []
          };
          
          await BidService.createBidVersion(user.uid, newBid.id, versionData);
        }
        
        setSuccess('Bid created successfully');
        
        setTimeout(() => {
          navigate(`/bids/${newBid.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving bid:', err);
      setError(`Failed to save bid: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item>
            <IconButton onClick={() => navigate(-1)} color="primary">
              <ArrowBackIcon />
            </IconButton>
          </Grid>
          <Grid item xs>
            <Typography variant="h5">{id ? 'Edit Bid' : 'Create New Bid'}</Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />} 
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Bid'}
            </Button>
          </Grid>
        </Grid>

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

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>

            <TextField
              label="Bid Title"
              value={bidForm.title}
              onChange={(e) => handleChangeBidForm('title', e.target.value)}
              fullWidth
              required
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={projects}
                getOptionLabel={(option) => option.name || ''}
                value={bidForm.projectId ? projects.find(p => p.id === bidForm.projectId) || null : null}
                onChange={(_, value) => {
                  if (value) {
                    handleChangeBidForm('projectId', value.id);
                    handleChangeBidForm('projectName', value.name);
                    
                    // If project has phases, set the first phase as default
                    if (value.phases && value.phases.length > 0) {
                      handleChangeBidForm('phaseId', value.phases[0].id);
                      handleChangeBidForm('phaseName', value.phases[0].name);
                    }
                  } else {
                    handleChangeBidForm('projectId', '');
                    handleChangeBidForm('projectName', '');
                    handleChangeBidForm('phaseId', '');
                    handleChangeBidForm('phaseName', '');
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Project" required />}
              />
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <Autocomplete
                options={subcontractors}
                getOptionLabel={(option) => option.name || ''}
                value={bidForm.subcontractorId ? subcontractors.find(s => s.id === bidForm.subcontractorId) || null : null}
                onChange={(_, value) => {
                  if (value) {
                    handleChangeBidForm('subcontractorId', value.id);
                    handleChangeBidForm('subcontractorName', value.name);
                  } else {
                    handleChangeBidForm('subcontractorId', '');
                    handleChangeBidForm('subcontractorName', '');
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Subcontractor" required />}
              />
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button 
                size="small" 
                onClick={() => setShowQuickAddSubcontractor(true)}
                startIcon={<AddIcon />}
              >
                Add New Subcontractor
              </Button>
            </Box>
            
            <TextField
              label="Total Amount"
              value={bidForm.totalAmount}
              onChange={(e) => handleChangeBidForm('totalAmount', parseFloat(e.target.value) || 0)}
              fullWidth
              type="number"
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>
              }}
              margin="normal"
            />

            <TextField
              label="Timeline (Days)"
              value={bidForm.timeline}
              onChange={(e) => handleChangeBidForm('timeline', parseInt(e.target.value) || 0)}
              fullWidth
              type="number"
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Details & Settings</Typography>
            
            <DatePicker
              label="Submission Deadline"
              value={bidForm.submissionDeadline}
              onChange={(date) => handleChangeBidForm('submissionDeadline', date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal'
                }
              }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={bidForm.status}
                onChange={(e) => handleChangeBidForm('status', e.target.value)}
                label="Status"
              >
                {STATUS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={bidForm.priority}
                onChange={(e) => handleChangeBidForm('priority', e.target.value)}
                label="Priority"
              >
                {PRIORITY_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <Typography variant="body2" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 1 }}>
                {Array.isArray(bidForm.tags) && bidForm.tags.map((tag: string, index: number) => (
                  <Chip
                    key={index}
                    label={String(tag)}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex' }}>
                <TextField
                  label="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  sx={{ ml: 1 }}
                >
                  Add
                </Button>
              </Box>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Scope</Typography>
            <TextField
              label="Scope Description"
              value={bidForm.scope}
              onChange={(e) => handleChangeBidForm('scope', e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Line Items</Typography>
            
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1">Add items to break down the total cost</Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleLineItemChange([...lineItems, {
                    id: uuidv4(),
                    category: 'labor',
                    description: '',
                    quantity: 1,
                    unit: 'hours',
                    unitCost: 0,
                    totalCost: 0
                  }])}
                  sx={{ mr: 1 }}
                >
                  Add Labor
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleLineItemChange([...lineItems, {
                    id: uuidv4(),
                    category: 'material',
                    description: '',
                    quantity: 1,
                    unit: 'each',
                    unitCost: 0,
                    totalCost: 0
                  }])}
                >
                  Add Material
                </Button>
              </Box>
            </Box>
            
            <LineItemsTable
              lineItems={lineItems}
              onChange={handleLineItemChange}
              editable={true}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Payment Schedule</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Down Payment (%)"
                  value={bidForm.paymentTerms.downPaymentPercent}
                  onChange={(e) => handleChangePaymentTerms('downPaymentPercent', parseFloat(e.target.value) || 0)}
                  type="number"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: <Box component="span">%</Box>
                  }}
                  helperText={`Amount: ${formatCurrency((bidForm.totalAmount * bidForm.paymentTerms.downPaymentPercent) / 100)}`}
                />
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Installments</Typography>
            
            {bidForm.paymentTerms.installments?.map((installment: any, index: number) => (
              <Grid container spacing={2} key={installment.id} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Name"
                    value={installment.name}
                    onChange={(e) => handleChangeInstallment(installment.id, 'name', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label="Percentage (%)"
                    value={installment.percent}
                    onChange={(e) => handleChangeInstallment(installment.id, 'percent', parseFloat(e.target.value) || 0)}
                    fullWidth
                    type="number"
                    InputProps={{
                      endAdornment: <Box component="span">%</Box>
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" sx={{ pt: 2 }}>
                    Amount: {formatCurrency((bidForm.totalAmount * installment.percent) / 100)}
                  </Typography>
                </Grid>
                <Grid item xs={10} md={4}>
                  <TextField
                    label="Milestone Description"
                    value={installment.milestoneDescription}
                    onChange={(e) => handleChangeInstallment(installment.id, 'milestoneDescription', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={2} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    color="error" 
                    onClick={() => handleRemoveInstallment(installment.id)}
                    disabled={bidForm.paymentTerms.installments.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddInstallment}
              >
                Add Installment
              </Button>
              
              <Typography>
                Total: {bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((sum: number, item: any) => sum + parseFloat(item.percent || 0), 0)}%
              </Typography>
            </Box>
            
            {Math.abs((bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((sum: number, item: any) => sum + parseFloat(item.percent || 0), 0)) - 100) > 0.01 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Payment percentages should add up to 100%.
              </Alert>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>Notes</Typography>
            <TextField
              label="Additional Notes"
              value={bidForm.notes}
              onChange={(e) => handleChangeBidForm('notes', e.target.value)}
              fullWidth
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Add Subcontractor Dialog */}
      <Dialog open={showQuickAddSubcontractor} onClose={() => setShowQuickAddSubcontractor(false)}>
        <DialogTitle>Add New Subcontractor</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the details of the new subcontractor.
          </DialogContentText>
          
          <TextField
            label="Subcontractor Name"
            value={newSubcontractor.name}
            onChange={(e) => setNewSubcontractor(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            label="Specialty"
            value={newSubcontractor.specialty}
            onChange={(e) => setNewSubcontractor(prev => ({ ...prev, specialty: e.target.value }))}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Phone"
            value={newSubcontractor.contact.phone}
            onChange={(e) => setNewSubcontractor(prev => ({ 
              ...prev, 
              contact: { ...prev.contact, phone: e.target.value } 
            }))}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Email"
            value={newSubcontractor.contact.email}
            onChange={(e) => setNewSubcontractor(prev => ({ 
              ...prev, 
              contact: { ...prev.contact, email: e.target.value } 
            }))}
            fullWidth
            margin="normal"
            type="email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickAddSubcontractor(false)}>Cancel</Button>
          <Button 
            onClick={handleQuickAddSubcontractor} 
            variant="contained" 
            disabled={isSaving || !newSubcontractor.name.trim()}
          >
            {isSaving ? 'Adding...' : 'Add Subcontractor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BidForm; 