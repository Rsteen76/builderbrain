import React from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { captureException } from '../../utils/monitoring';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  resetKey?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      source: 'react.error_boundary',
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
  };

  private handleGoHome = (): void => {
    window.location.assign('/');
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          minHeight: '100vh',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={2}
          sx={{
            maxWidth: 560,
            mx: 'auto',
            p: { xs: 3, sm: 4 },
            width: '100%',
          }}
        >
          <Stack spacing={3}>
            <Alert severity="error">The app hit an unexpected error.</Alert>
            <Box>
              <Typography component="h1" variant="h5" gutterBottom>
                Something went wrong
              </Typography>
              <Typography color="text.secondary">
                Try reloading this view. If the problem keeps happening, return to the dashboard.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button startIcon={<RefreshIcon />} variant="contained" onClick={this.handleReset}>
                Try again
              </Button>
              <Button startIcon={<HomeIcon />} variant="outlined" onClick={this.handleGoHome}>
                Go to dashboard
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }
}

export default ErrorBoundary;
