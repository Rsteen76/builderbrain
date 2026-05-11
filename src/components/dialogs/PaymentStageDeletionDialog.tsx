import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';

interface PaymentStageDeletionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (deleteExpense: boolean) => void;
  stageName: string;
  hasExpense: boolean;
  loading?: boolean;
}

const PaymentStageDeletionDialog: React.FC<PaymentStageDeletionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  stageName,
  hasExpense,
  loading = false,
}) => {
  const [deleteExpense, setDeleteExpense] = useState(true);

  // Reset to default state when dialog opens
  useEffect(() => {
    if (open) {
      setDeleteExpense(true);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="delete-payment-stage-dialog-title"
    >
      <DialogTitle id="delete-payment-stage-dialog-title">Delete Payment Stage</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete the payment stage "{stageName}"?
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {hasExpense && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  This payment stage has an associated expense
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Do you want to delete the expense along with this payment stage?
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button 
                    variant={deleteExpense ? "contained" : "outlined"} 
                    color="primary"
                    size="small"
                    onClick={() => setDeleteExpense(true)}
                    sx={{
                      boxShadow: deleteExpense ? 3 : 0,
                      border: deleteExpense ? '2px solid' : '1px solid',
                      borderColor: 'primary.main',
                      fontWeight: deleteExpense ? 'bold' : 'normal'
                    }}
                  >
                    Yes, delete both
                  </Button>
                  <Button 
                    variant={!deleteExpense ? "contained" : "outlined"}
                    color="secondary"
                    size="small"
                    onClick={() => setDeleteExpense(false)}
                    sx={{
                      boxShadow: !deleteExpense ? 3 : 0,
                      border: !deleteExpense ? '2px solid' : '1px solid',
                      borderColor: 'secondary.main',
                      fontWeight: !deleteExpense ? 'bold' : 'normal'
                    }}
                  >
                    No, keep the expense
                  </Button>
                </Box>
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button 
          onClick={() => {
            logger.log(`Confirming deletion with deleteExpense=${deleteExpense}`);
            onConfirm(deleteExpense);
          }} 
          color="error" 
          variant="contained"
          disabled={loading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentStageDeletionDialog;