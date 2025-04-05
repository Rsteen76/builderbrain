import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Button,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <ConstructionIcon 
          color="primary" 
          sx={{ fontSize: { xs: 24, sm: 28 } }} 
        />
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}
        >
          Quick Actions
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
            sx={{
              height: 48,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            New Project
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/tasks')}
            sx={{
              height: 48,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Create Task
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GroupIcon />}
            onClick={() => navigate('/team')}
            sx={{
              height: 48,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Add Team Member
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/expenses/new')}
            sx={{
              height: 48,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Add Expense
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QuickActions; 