import React from 'react';
import { Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

export interface ExpenseSnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface ExpensePageNotificationsProps {
  paymentError: string | null;
  snackbar: ExpenseSnackbarState;
  onSnackbarClose: () => void;
}

export function ExpensePageNotifications({
  paymentError,
  snackbar,
  onSnackbarClose,
}: ExpensePageNotificationsProps) {
  return (
    <>
      {paymentError && (
        <Snackbar
          open={!!paymentError}
          autoHideDuration={6000}
          onClose={() => { /* setError(null) might be needed if error state is managed in hook */ }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MuiAlert elevation={6} variant="filled" severity="error" onClose={() => { /* setError(null) */ }}>
            Payment Error: {paymentError}
          </MuiAlert>
        </Snackbar>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={onSnackbarClose}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={snackbar.severity}
          onClose={onSnackbarClose}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
}
