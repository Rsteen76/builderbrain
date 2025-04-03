import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

interface QuickBidData {
  phaseId: string;
  contractorName: string;
  amount: number;
  description: string;
}

interface QuickBidDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (bid: QuickBidData) => void;
  phaseId: string | null;
  isSaving: boolean;
}

const QuickBidDialog: React.FC<QuickBidDialogProps> = ({
  open,
  onClose,
  onSubmit,
  phaseId,
  isSaving
}) => {
  const [bid, setBid] = useState<QuickBidData>({
    phaseId: phaseId || '',
    contractorName: '',
    amount: 0,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBid(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
      phaseId: phaseId || prev.phaseId
    }));
  };

  const handleSubmit = () => {
    onSubmit(bid);
    
    // Reset form fields after submission
    setBid({
      phaseId: phaseId || '',
      contractorName: '',
      amount: 0,
      description: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Contractor Bid</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Enter bid details to update phase cost.
        </DialogContentText>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              margin="dense"
              label="Contractor Name"
              name="contractorName"
              value={bid.contractorName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              margin="dense"
              label="Bid Amount"
              name="amount"
              type="number"
              value={bid.amount}
              onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              margin="dense"
              label="Description"
              name="description"
              value={bid.description}
              onChange={handleChange}
              placeholder="Work description"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!bid.contractorName || bid.amount <= 0 || isSaving}
        >
          {isSaving ? <CircularProgress size={24} /> : 'Add Bid'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickBidDialog; 