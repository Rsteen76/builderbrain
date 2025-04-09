import { useState, useCallback } from 'react';
import { Alert, Snackbar } from '@mui/material';
import * as React from 'react';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Using function component syntax instead of arrow function with explicit return
function NotificationSnackbar(props: {
  open: boolean;
  message: string;
  severity: NotificationState['severity'];
  onClose: () => void;
}) {
  const { open, message, severity, onClose } = props;
  
  if (!open) return null;
  
  return React.createElement(
    Snackbar,
    {
      open: open,
      autoHideDuration: 6000,
      onClose: onClose,
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
    },
    React.createElement(
      Alert,
      {
        onClose: onClose,
        severity: severity,
        sx: { width: '100%' }
      },
      message
    )
  );
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = useCallback((message: string, severity: NotificationState['severity'] = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const handleClose = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const NotificationComponent = useCallback(() => {
    return React.createElement(NotificationSnackbar, {
      open: notification.open,
      message: notification.message,
      severity: notification.severity,
      onClose: handleClose
    });
  }, [notification, handleClose]);

  return {
    showNotification,
    NotificationComponent
  };
};