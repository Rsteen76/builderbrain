import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  alpha,
  useTheme,
  Theme,
} from '@mui/material';
import {
  Task as TaskIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Construction as ConstructionIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { ProjectPhase } from '../../../types'; // Adjusted path
import { formatCurrency } from '../../../utils/formatters'; // Adjusted path

interface PhaseMetricsDisplayProps {
  phase: ProjectPhase;
  proposedCost: number;
  actualCost: number;
  formatCurrency: (value: number) => string;
}

// Internal helper component for each metric item
const MetricItem: React.FC<{
  icon: React.ReactElement;
  value: string | number;
  label: string;
  color: string; // Pass color directly
  theme: Theme; // Pass theme for alpha
}> = ({ icon, value, label, color, theme }) => (
  <Paper
    elevation={0}
    sx={{
      p: 0.75,
      textAlign: 'center',
      borderRadius: 2,
      bgcolor: alpha(color, 0.1),
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '70px', // Ensure consistent height
    }}
  >
    {React.cloneElement(icon, { sx: { color: color, fontSize: '1.2rem', mb: 0.3, mx: 'auto' }})}
    <Typography
      variant="h6"
      // Apply error color directly if needed based on logic in parent or props
      color={label === 'Actual' && theme.palette.error.main === color ? "error.main" : "text.primary"} 
      sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}
    >
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{label}</Typography>
  </Paper>
);


const PhaseMetricsDisplay: React.FC<PhaseMetricsDisplayProps> = ({
  phase,
  proposedCost,
  actualCost,
  formatCurrency,
}) => {
  const theme = useTheme();
  const budget = phase.budget || 0;
  const isOverBudget = budget > 0 && actualCost > budget; // Check if over budget and budget exists

  return (
    <Grid
      container
      spacing={1}
      sx={{
        mb: 1.5,
        mt: 0.5
      }}
    >
      {/* Tasks Summary */}
      <Grid item xs={6} sm={3}>
        <MetricItem
          icon={<TaskIcon />}
          value={phase.tasks?.length || 0}
          label="Tasks"
          color={theme.palette.info.main}
          theme={theme}
        />
      </Grid>

      {/* Budget */}
      <Grid item xs={6} sm={3}>
        <MetricItem
          icon={<AccountBalanceWalletIcon />}
          value={formatCurrency(budget)}
          label="Budget"
          color={theme.palette.primary.main}
          theme={theme}
        />
      </Grid>

      {/* Proposed Cost */}
      <Grid item xs={6} sm={3}>
        <MetricItem
          icon={<ConstructionIcon />}
          value={formatCurrency(proposedCost)}
          label="Proposed"
          color={theme.palette.warning.main}
          theme={theme}
        />
      </Grid>

      {/* Actual Cost */}
      <Grid item xs={6} sm={3}>
         <MetricItem
          icon={<ReceiptIcon />}
          value={formatCurrency(actualCost)}
          label="Actual"
          color={isOverBudget ? theme.palette.error.main : theme.palette.success.main}
          theme={theme}
        />
      </Grid>
    </Grid>
  );
};

export default PhaseMetricsDisplay; 