import React, { useState, Suspense } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Stack,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Lazy load components to avoid circular dependencies
const TasksList = React.lazy(() => import('./TasksList'));

const Tasks: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const [error] = useState<string | null>(null);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setListVersion((version) => version + 1);
    setIsRefreshing(false);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please sign in to view tasks.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 3,
          p: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack spacing={3}>
          {/* Title and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Tasks
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  {isRefreshing ? (
                    <CircularProgress size={24} />
                  ) : (
                    <RefreshIcon />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        }}
      >
        <Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>}>
          <TasksList key={listVersion} />
        </Suspense>
      </Paper>
    </Container>
  );
};

export default Tasks; 
