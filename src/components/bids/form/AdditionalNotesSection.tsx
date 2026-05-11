import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { BidFormData } from '../../../types/form.types';

interface AdditionalNotesSectionProps {
  bidForm: BidFormData;
  handleChangeBidForm: (field: string, value: any) => void;
}

const AdditionalNotesSection: React.FC<AdditionalNotesSectionProps> = ({
  bidForm,
  handleChangeBidForm,
}) => (
  <Box className="form-section" sx={{ mb: 0 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
      Additional Notes
    </Typography>

    <TextField
      fullWidth
      multiline
      rows={3}
      label="Notes / Exclusions"
      placeholder="Include any notes, exclusions, or requirements..."
      value={bidForm.notes}
      onChange={(e) => handleChangeBidForm('notes', e.target.value)}
      variant="outlined"
      size="small"
      InputProps={{ sx: { borderRadius: 1 } }}
    />
  </Box>
);

export default AdditionalNotesSection;
