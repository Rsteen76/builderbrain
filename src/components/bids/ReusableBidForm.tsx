import React, { useState, useEffect } from 'react';
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
  DialogActions,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';
import { Bid, BidPaymentStage, Project, Subcontractor, Phase } from '../../types';

// Interface for bid form data
interface BidFormData {
  title: string;
  subcontractorName: string;
  subcontractorId?: string;
  totalAmount: number;
  phaseId?: string;
  phaseName?: string;
  scope: string;
  timeline: number;
  submissionDeadline?: Date;
  paymentTerms: {
    downPaymentPercent: number;
    installments: {
      id: string;
      name: string;
      percent: number;
      milestoneDescription: string;
      phaseId?: string;
      phaseName?: string;
    }[];
  };
  notes: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired';
  attachments: string[];
  tags: string[];
}

interface ReusableBidFormProps {
  open?: boolean;
  onClose?: () => void;
  onSubmit: (bidForm: BidFormData) => Promise<void>;
  phases: Phase[];
  subcontractors: Subcontractor[];
  initialBidData?: Partial<BidFormData>;
  editingBidId?: string | null;
  isSaving?: boolean;
  onAddSubcontractor?: () => void;
  isDialog?: boolean;
  projectId?: string;
  projectName?: string;
}

const ReusableBidForm: React.FC<ReusableBidFormProps> = ({
  open,
  onClose,
  onSubmit,
  phases,
  subcontractors,
  initialBidData,
  editingBidId,
  isSaving = false,
  onAddSubcontractor,
  isDialog = false,
  projectId,
  projectName,
}) => {
  // Default bid form state
  const defaultBidForm: BidFormData = {
    title: '',
    subcontractorName: '',
    totalAmount: 0,
    phaseId: phases.length > 0 ? phases[0].id : '',
    phaseName: phases.length > 0 ? phases[0].name : '',
    scope: '',
    timeline: 30,
    paymentTerms: {
      downPaymentPercent: 20,
      installments: [
        {id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}
      ]
    },
    notes: '',
    status: 'submitted',
    attachments: [],
    tags: []
  };

  // State for form
  const [bidForm, setBidForm] = useState<BidFormData>(initialBidData ? { ...defaultBidForm, ...initialBidData } : defaultBidForm);
  const [paymentTemplate, setPaymentTemplate] = useState('standard');
  const [tagInput, setTagInput] = useState('');

  // Form change handlers
  const handleChangeBidForm = (field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePaymentTerms = (field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        [field]: value
      }
    }));
  };

  const handleAddInstallment = () => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: [
          ...prev.paymentTerms.installments,
          {id: uuidv4(), name: `Installment ${prev.paymentTerms.installments.length + 1}`, percent: 0, milestoneDescription: ''}
        ]
      }
    }));
    setPaymentTemplate('custom');
  };

  const handleChangeInstallment = (id: string, field: string, value: any) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.map(item => 
          item.id === id ? {...item, [field]: value} : item
        )
      }
    }));
    setPaymentTemplate('custom');
  };

  const handleRemoveInstallment = (id: string) => {
    setBidForm(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        installments: prev.paymentTerms.installments.filter(item => item.id !== id)
      }
    }));
    setPaymentTemplate('custom');
  };

  const handlePaymentTemplateChange = (e: SelectChangeEvent<string>) => {
    const template = e.target.value;
    setPaymentTemplate(template);
    
    // Get default phase for new payments
    const defaultPhase = phases.length > 0 ? phases[0] : null;
    
    // Update payment terms based on template
    switch(template) {
      case 'standard':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 50,
            installments: [
              {
                id: uuidv4(), 
                name: 'Final Payment', 
                percent: 50, 
                milestoneDescription: 'Upon completion',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              }
            ]
          }
        }));
        break;
      case 'trades':
        setBidForm(prev => ({
          ...prev,
          paymentTerms: {
            downPaymentPercent: 30,
            installments: [
              {
                id: uuidv4(), 
                name: 'Rough-In', 
                percent: 40, 
                milestoneDescription: 'After rough-in inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              },
              {
                id: uuidv4(), 
                name: 'Final/Top-Out', 
                percent: 30, 
                milestoneDescription: 'After final inspection',
                phaseId: defaultPhase?.id,
                phaseName: defaultPhase?.name
              }
            ]
          }
        }));
        break;
      case 'custom':
        // Keep current values, user will modify manually
        break;
    }
  };

  // Tag handling
  const handleAddTag = (tag: string) => {
    if (tag && !bidForm.tags.includes(tag)) {
      setBidForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setBidForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Submit handler
  const handleSubmit = async () => {
    await onSubmit(bidForm);
  };

  const formContent = (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        p: { xs: 1.5, md: 2.5 }, // Reduced padding
        '& .MuiGrid-item': { 
          display: 'flex',
          flexDirection: 'column', 
          justifyContent: 'flex-start' 
        },
        '& .form-section': {
          mb: 3, // Reduced spacing between sections
        },
        // Apply size="small" globally where applicable
        '& .MuiTextField-root': { size: 'small' },
        '& .MuiFormControl-root': { size: 'small' },
        '& .MuiAutocomplete-root': { size: 'small' },
        '& .MuiButton-root': { textTransform: 'none' }, // Consistent button text
      }}>
        {/* Bid Details Section */}
        <Box className="form-section">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}> {/* Adjusted Typography & reduced margin */}
            Bid Details
          </Typography>
          
          <Grid container spacing={2}> {/* Reduced spacing */} 
            <Grid item xs={12} md={8}> {/* Wider title field */}
              <TextField
                fullWidth
                required
                label="Bid Title"
                value={bidForm.title}
                onChange={(e) => handleChangeBidForm('title', e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{ sx: { borderRadius: 1 } }} 
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Submission Deadline"
                value={bidForm.submissionDeadline || null}
                onChange={(date) => handleChangeBidForm('submissionDeadline', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "small",
                    InputProps: { sx: { borderRadius: 1 } }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={8}> {/* Wider Phase field */}
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="bid-phase-select-label">Project Phase</InputLabel>
                <Select
                  labelId="bid-phase-select-label"
                  value={bidForm.phaseId || ''}
                  label="Project Phase"
                  onChange={(e) => {
                    const phaseId = e.target.value;
                    const phase = phases.find(p => p.id === phaseId);
                    handleChangeBidForm('phaseId', phaseId);
                    handleChangeBidForm('phaseName', phase?.name || '');
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  {phases.map((phase) => (
                    <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={bidForm.status}
                  onChange={(e) => handleChangeBidForm('status', e.target.value as Bid['status'])}
                  label="Status"
                  sx={{ borderRadius: 1 }}
                >
                  {/* Status MenuItems with smaller dots */}
                  <MenuItem value="draft">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'grey.400', mr: 1 }} /> Draft
                    </Box>
                  </MenuItem>
                  <MenuItem value="submitted">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'info.main', mr: 1 }} /> Submitted
                    </Box>
                  </MenuItem>
                  <MenuItem value="accepted">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} /> Accepted
                    </Box>
                  </MenuItem>
                  <MenuItem value="rejected">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} /> Rejected
                    </Box>
                  </MenuItem>
                  <MenuItem value="expired">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.dark', mr: 1 }} /> Expired
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Subcontractor & Financial Section */}
        <Box className="form-section">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}> {/* Adjusted Typography & reduced margin */}
            Subcontractor & Financials
          </Typography>

          <Grid container spacing={2}> 
            <Grid item xs={12} md={6}> 
              <Autocomplete
                fullWidth
                options={subcontractors}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={subcontractors.find(s => s.id === bidForm.subcontractorId) || null}
                onChange={(_, newValue) => {
                  handleChangeBidForm('subcontractorName', newValue?.name || '');
                  handleChangeBidForm('subcontractorId', newValue?.id || '');
                }}
                size="small"
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Subcontractor" 
                    required 
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      sx: { borderRadius: 1 }
                    }} 
                  />
                )}
              />
              {onAddSubcontractor && (
                <Button
                  size="small"
                  color="primary"
                  onClick={onAddSubcontractor}
                  sx={{ mt: 0.5, alignSelf: 'flex-start', borderRadius: 1, fontSize: '0.8rem' }} // Smaller button
                  startIcon={<AddIcon fontSize="small"/>}
                >
                  Add New Sub
                </Button>
              )}
            </Grid>

            <Grid item xs={6} md={3}> {/* More compact grid */}
              <TextField
                fullWidth
                required
                label="Total Amount"
                type="number"
                value={bidForm.totalAmount}
                onChange={(e) => handleChangeBidForm('totalAmount', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  sx: { borderRadius: 1 }
                }}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={6} md={3}> {/* More compact grid */}
              <TextField
                fullWidth
                required
                label="Timeline (days)"
                type="number"
                value={bidForm.timeline}
                onChange={(e) => handleChangeBidForm('timeline', parseInt(e.target.value) || 0)}
                variant="outlined"
                size="small"
                InputProps={{ sx: { borderRadius: 1 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Scope of Work"
                placeholder="Describe the scope of work..."
                value={bidForm.scope}
                onChange={(e) => handleChangeBidForm('scope', e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{ sx: { borderRadius: 1 } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Payment Terms Section */}
        <Box className="form-section">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}> {/* Reduced margin */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}> {/* Adjusted Typography */}
              Payment Terms
            </Typography>
            <FormControl size="small" variant="outlined" sx={{ minWidth: 160 }}> {/* Reduced width */}
              <InputLabel id="payment-template-label">Template</InputLabel>
              <Select
                labelId="payment-template-label"
                value={paymentTemplate}
                label="Template"
                onChange={handlePaymentTemplateChange}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="standard">Standard (50/50)</MenuItem>
                <MenuItem value="trades">Trades (30/40/30)</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Down Payment & Add Installment Button */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
             <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Initial Payment (%)"
                  type="number"
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    sx: { borderRadius: 1 }
                  }}
                  value={bidForm.paymentTerms.downPaymentPercent}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value)));
                    handleChangePaymentTerms('downPaymentPercent', val);
                    setPaymentTemplate('custom');
                  }}
                  variant="outlined"
                />
                <FormHelperText sx={{ textAlign: 'right', mt: 0.5 }}>
                  Amount: {formatCurrency(bidForm.totalAmount * bidForm.paymentTerms.downPaymentPercent / 100)}
                </FormHelperText>
              </Grid>
              <Grid item xs={12} sm={6}> 
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddInstallment}
                  sx={{ borderRadius: 1 }}
                >
                  Add Installment
                </Button>
              </Grid>
          </Grid>

          {/* Installments List */}
          {bidForm.paymentTerms.installments.map((installment, index) => (
            <Paper
              key={installment.id}
              elevation={0}
              variant="outlined"
              sx={{
                p: 1.5, // Reduced padding
                mb: 1.5, // Reduced spacing
                borderRadius: 1,
                borderColor: 'divider',
                position: 'relative' 
              }}
            >
              <IconButton 
                size="small" 
                onClick={() => handleRemoveInstallment(installment.id)} 
                color="inherit"
                sx={{ position: 'absolute', top: 6, right: 6, opacity: 0.5 }} // Adjusted position
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              
               <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}> {/* Smaller title */}
                 Installment {index + 1}: {installment.name}
               </Typography>

              <Grid container spacing={1.5}> {/* Reduced spacing */}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    required
                    label="Name"
                    size="small"
                    value={installment.name}
                    onChange={(e) => handleChangeInstallment(installment.id, 'name', e.target.value)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={2}> {/* Tighter grid */}
                  <TextField
                    fullWidth
                    required
                    label="Percent"
                    type="number"
                    size="small"
                    value={installment.percent}
                    InputProps={{ 
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      sx: { borderRadius: 1 } 
                    }}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      handleChangeInstallment(installment.id, 'percent', val);
                      setPaymentTemplate('custom');
                    }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={6} sm={3} md={2}> {/* Amount display (read-only) */}
                   <TextField
                     fullWidth
                     disabled
                     label="Amount"
                     size="small"
                     value={formatCurrency(bidForm.totalAmount * installment.percent / 100)}
                     variant="outlined"
                     InputProps={{ 
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        sx: { borderRadius: 1 } 
                      }}
                   />
                </Grid>

                <Grid item xs={12} sm={6} md={4}> {/* Tighter grid */}
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel>Related Phase</InputLabel>
                    <Select
                      value={installment.phaseId || ''}
                      label="Related Phase"
                      onChange={(e) => {
                        const pId = e.target.value;
                        const pName = phases.find(p => p.id === pId)?.name || '';
                        handleChangeInstallment(installment.id, 'phaseId', pId);
                        handleChangeInstallment(installment.id, 'phaseName', pName);
                      }}
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value=""><em>None</em></MenuItem> 
                      {phases.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={8}> {/* Wider milestone */}
                  <TextField
                    fullWidth
                    label="Milestone Description"
                    placeholder="Payment trigger..."
                    size="small"
                    value={installment.milestoneDescription}
                    onChange={(e) => handleChangeInstallment(installment.id, 'milestoneDescription', e.target.value)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          {bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0) !== 100 && (
            <Alert 
              severity="warning" 
              variant="outlined" 
              sx={{ mt: 1, mb: 3, borderRadius: 1, py: 0.5, fontSize: '0.875rem' }} // Compact Alert
            >
              Payments must total 100%. Current: {bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)}%
            </Alert>
          )}
        </Box>

        {/* Notes Section */}
        <Box className="form-section" sx={{ mb: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}> {/* Ensured reduced margin */}
            Additional Notes
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3} // Reduced rows
            label="Notes / Exclusions"
            placeholder="Include any notes, exclusions, or requirements..."
            value={bidForm.notes}
            onChange={(e) => handleChangeBidForm('notes', e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{ sx: { borderRadius: 1 } }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );

  // Dialog Variant
  if (isDialog) {
    return (
      <Dialog 
        open={open || false} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }} // Adjusted rounding
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2.5, py: 1.5 }}> {/* Tighter header */}
          <Typography variant="h6" fontWeight={500}> 
            {editingBidId ? 'Edit Bid' : 'Create New Bid'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}> {/* Added top padding */} 
          {formContent}
        </DialogContent>
        <DialogActions 
          sx={{ 
            p: 1.5, // Tighter actions
            borderTop: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper', 
            justifyContent: 'space-between' 
          }}
        >
          <Button 
            onClick={onClose} 
            color="inherit" 
            variant="outlined" 
            size="medium"
            sx={{ borderRadius: 1, px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            size="medium"
            disabled={
              isSaving ||
              !bidForm.title ||
              !bidForm.subcontractorName ||
              !bidForm.phaseId ||
              (bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)) !== 100
            }
            sx={{ borderRadius: 1, px: 2 }}
          >
            {isSaving ? 
              <CircularProgress size={22} color="inherit"/> : // Smaller spinner
              (editingBidId ? 'Update Bid' : 'Create Bid')
            }
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Standalone Paper Variant
  return (
    <Paper 
      sx={{ 
        borderRadius: 1.5, // Adjusted rounding
        overflow: 'hidden',
        boxShadow: (theme) => theme.shadows[2] 
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: { xs: 1.5, md: 2 }, // Tighter header
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="h6" fontWeight={500}> {/* Adjusted size/weight */}
          {editingBidId ? 'Edit Bid' : 'Create New Bid'}
        </Typography>
        <Button
          variant="contained"
          onClick={handleSubmit}
          size="medium"
          disabled={
            isSaving ||
            !bidForm.title ||
            !bidForm.subcontractorName ||
            !bidForm.phaseId ||
            (bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)) !== 100
          }
          sx={{ borderRadius: 1, px: 2 }}
        >
          {isSaving ? <CircularProgress size={22} color="inherit"/> : (editingBidId ? 'Update Bid' : 'Create Bid')}
        </Button>
      </Box>
      {formContent}
    </Paper>
  );
};

export default ReusableBidForm; 