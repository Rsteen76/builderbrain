import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box,
  Chip,
  IconButton,
  FormHelperText,
  Alert,
  SelectChangeEvent,
  Divider,
  CircularProgress,
  alpha,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import { Bid, Phase, Subcontractor } from '../../types';

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

// Interface for props
interface BidFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (bidForm: BidFormData) => Promise<void>;
  phases: Phase[];
  subcontractors: Subcontractor[];
  initialBidData?: Partial<BidFormData>;
  editingBidId: string | null;
  isSaving: boolean;
  onAddSubcontractor: () => void;
}

const BidFormDialog: React.FC<BidFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  phases,
  subcontractors,
  initialBidData,
  editingBidId,
  isSaving,
  onAddSubcontractor,
}) => {
  const theme = useTheme();
  
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          {editingBidId ? 'Edit Bid' : 'Add New Bid'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Bid Title"
              value={bidForm.title}
              onChange={(e) => handleChangeBidForm('title', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
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
              >
                {phases.map((phase) => (
                  <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
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
              renderInput={(params) => (
                <TextField {...params} label="Subcontractor" required />
              )}
            />
            <Button
              size="small"
              color="primary"
              onClick={onAddSubcontractor}
              sx={{ mt: 1 }}
              startIcon={<AddIcon />}
            >
              Add New Sub
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Total Amount"
              type="number"
              value={bidForm.totalAmount}
              onChange={(e) => handleChangeBidForm('totalAmount', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Timeline (days)"
              type="number"
              value={bidForm.timeline}
              onChange={(e) => handleChangeBidForm('timeline', parseInt(e.target.value) || 0)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Scope of Work"
              value={bidForm.scope}
              onChange={(e) => handleChangeBidForm('scope', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={bidForm.status}
                onChange={(e) => handleChangeBidForm('status', e.target.value as Bid['status'])}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Tags</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <>
                {bidForm.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </>
              <TextField
                size="small"
                variant="standard"
                placeholder="Add tag..."
                sx={{ flexGrow: 1, minWidth: 150 }}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    handleAddTag(tagInput.trim());
                    setTagInput('');
                  }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Payment Terms</Typography>
            <Divider sx={{ mb: 2 }}/>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="payment-template-label">Schedule Template</InputLabel>
              <Select
                labelId="payment-template-label"
                value={paymentTemplate}
                label="Schedule Template"
                onChange={handlePaymentTemplateChange}
              >
                <MenuItem value="standard">Standard (50/50)</MenuItem>
                <MenuItem value="trades">Trades (30/40/30)</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Down Payment (%)"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                  value={bidForm.paymentTerms.downPaymentPercent}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value)));
                    handleChangePaymentTerms('downPaymentPercent', val);
                    setPaymentTemplate('custom');
                  }}
                />
                <FormHelperText>
                  {formatCurrency(bidForm.totalAmount * bidForm.paymentTerms.downPaymentPercent / 100)}
                </FormHelperText>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2">Installments</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddInstallment}>Add</Button>
                </Box>
                {bidForm.paymentTerms.installments.map((installment) => (
                  <Box
                    key={installment.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      borderRadius: 1,
                      position: 'relative'
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 4, right: 4 }}
                      onClick={() => handleRemoveInstallment(installment.id)}
                    >
                      <DeleteIcon fontSize="small"/>
                    </IconButton>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Name"
                          value={installment.name}
                          onChange={(e) => handleChangeInstallment(installment.id, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          required
                          label="Percent (%)"
                          type="number"
                          value={installment.percent}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            handleChangeInstallment(installment.id, 'percent', val);
                            setPaymentTemplate('custom');
                          }}
                          helperText={`${formatCurrency(bidForm.totalAmount * installment.percent / 100)}`}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Phase</InputLabel>
                          <Select
                            value={installment.phaseId || ''}
                            label="Phase"
                            onChange={(e) => {
                              const pId = e.target.value;
                              const pName = phases.find(p => p.id === pId)?.name || '';
                              handleChangeInstallment(installment.id, 'phaseId', pId);
                              handleChangeInstallment(installment.id, 'phaseName', pName);
                            }}
                          >
                            {phases.map((p) => (
                              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Milestone Description"
                          value={installment.milestoneDescription}
                          onChange={(e) => handleChangeInstallment(installment.id, 'milestoneDescription', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
                {bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0) !== 100 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>Percentages must total 100%</Alert>
                )}
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes / Exclusions"
              value={bidForm.notes}
              onChange={(e) => handleChangeBidForm('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            isSaving ||
            !bidForm.title ||
            !bidForm.subcontractorName ||
            !bidForm.phaseId ||
            (bidForm.paymentTerms.downPaymentPercent + bidForm.paymentTerms.installments.reduce((s, i) => s + i.percent, 0)) !== 100
          }
        >
          {isSaving ? <CircularProgress size={24}/> : (editingBidId ? 'Update Bid' : 'Submit Bid')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BidFormDialog; 