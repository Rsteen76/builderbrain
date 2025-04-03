import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';

// Define the construction specialties
const CONSTRUCTION_SPECIALTIES = [
  'General Contractor',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Carpentry',
  'Masonry',
  'Drywall',
  'Painting',
  'Roofing',
  'Flooring',
  'Concrete',
  'Excavation',
  'Demolition',
  'Landscaping',
  'Glass & Windows',
  'Insulation',
  'Site Work',
  'Steel & Metal',
  'Tile & Stone',
  'Other'
];

interface SubcontractorData {
  name: string;
  specialty: string;
  contact: {
    phone: string;
    email: string;
  };
}

interface QuickAddSubcontractorDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (subcontractor: SubcontractorData) => Promise<void>;
  isSaving: boolean;
}

const QuickAddSubcontractorDialog: React.FC<QuickAddSubcontractorDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isSaving
}) => {
  const [subcontractor, setSubcontractor] = useState<SubcontractorData>({
    name: '',
    specialty: '',
    contact: {
      phone: '',
      email: ''
    }
  });

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSubcontractor(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, unknown>,
          [child]: value
        }
      }));
    } else {
      setSubcontractor(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    await onSubmit(subcontractor);
    // Reset form after successful submission
    setSubcontractor({
      name: '',
      specialty: '',
      contact: {
        phone: '',
        email: ''
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add New Subcontractor</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Name"
              value={subcontractor.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Specialty</InputLabel>
              <Select
                value={subcontractor.specialty}
                label="Specialty"
                onChange={(e: SelectChangeEvent) => handleChange('specialty', e.target.value)}
              >
                {CONSTRUCTION_SPECIALTIES.map((specialty) => (
                  <MenuItem key={specialty} value={specialty}>{specialty}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone"
              value={subcontractor.contact.phone}
              onChange={(e) => handleChange('contact.phone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={subcontractor.contact.email}
              onChange={(e) => handleChange('contact.email', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!subcontractor.name || isSaving}
        >
          {isSaving ? <CircularProgress size={24}/> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAddSubcontractorDialog; 