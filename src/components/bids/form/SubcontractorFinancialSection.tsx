import React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Subcontractor } from '../../../types';
import { BidFormData } from '../../../types/form.types';

interface SubcontractorFinancialSectionProps {
  bidForm: BidFormData;
  bidFormErrors: Record<string, string>;
  subcontractors: Subcontractor[];
  selectedSubcontractor: Subcontractor | null;
  isLoading: boolean;
  onAddSubcontractor?: () => void;
  handleChangeBidForm: (field: string, value: any) => void;
}

const SubcontractorFinancialSection: React.FC<SubcontractorFinancialSectionProps> = ({
  bidForm,
  bidFormErrors,
  subcontractors,
  selectedSubcontractor,
  isLoading,
  onAddSubcontractor,
  handleChangeBidForm,
}) => (
  <Box className="form-section">
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
      Subcontractor & Financials
    </Typography>

    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Autocomplete
          fullWidth
          id="subcontractor-selector"
          options={subcontractors || []}
          loading={isLoading}
          value={selectedSubcontractor || null}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(event, newValue) => {
            if (newValue) {
              handleChangeBidForm('subcontractorId', newValue.id);
              handleChangeBidForm('subcontractorName', newValue.name);
            } else {
              handleChangeBidForm('subcontractorId', '');
              handleChangeBidForm('subcontractorName', '');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Subcontractor"
              required
              error={!!bidFormErrors.subcontractorName}
              helperText={bidFormErrors.subcontractorName}
            />
          )}
        />
        {onAddSubcontractor && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddSubcontractor}
            sx={{ mt: 1 }}
          >
            Add New Subcontractor
          </Button>
        )}
      </Grid>

      <Grid item xs={6} md={3}>
        <TextField
          fullWidth
          required
          id="total-amount"
          label="Total Amount"
          type="number"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          value={bidForm.totalAmount}
          onChange={(e) => handleChangeBidForm('totalAmount', Number(e.target.value))}
          size="small"
          error={!!bidFormErrors.totalAmount}
          helperText={bidFormErrors.totalAmount}
        />
      </Grid>

      <Grid item xs={6} md={3}>
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
);

export default SubcontractorFinancialSection;
