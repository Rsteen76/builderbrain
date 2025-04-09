import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import { ProjectPhase } from '../../../types'; // Adjusted path
import { formatCurrency } from '../../../utils/formatters'; // Adjusted path
import PhaseMetricsDisplay from './PhaseMetricsDisplay'; // Use the extracted component
// Removed PhaseBudgetPieChart import - not used here

// Import the new sub-components
import PhaseCardHeader from './phases/PhaseCardHeader';
import PhaseCardActions from './phases/PhaseCardActions';

// Remove local helper functions (assuming moved to utils/phaseUtils.ts)
// REMOVED: getPhaseInitials, getStatusText, formatPhaseDate definitions

// Props interface remains largely the same, but some props are passed down
interface PhaseCardProps {
  phase: ProjectPhase;
  proposedCost: number;
  actualCost: number;
  onStatusMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  onPhaseMenuOpen: (event: React.MouseEvent<HTMLElement>, phaseId: string) => void;
  onOpenQuickExpenseDialog: (phaseId: string) => void;
  onOpenQuickBidDialog: (phaseId: string) => void;
  onViewPhaseDetails: (phaseId: string) => void;
  getStatusColor: (status: string) => string;
  formatCurrency: (value: number) => string;
}

const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  proposedCost,
  actualCost,
  onStatusMenuOpen,
  onPhaseMenuOpen,
  onOpenQuickExpenseDialog,
  onOpenQuickBidDialog,
  onViewPhaseDetails,
  getStatusColor,
  formatCurrency,
}) => {
  const theme = useTheme();
  const budget = phase.budget || 0;
  const budgetUsedPercentage = budget > 0 ? Math.min((actualCost / budget) * 100, 100) : 0;
  const isOverBudget = budget > 0 && actualCost > budget;

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 5
        },
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Use the extracted header component */}
      <PhaseCardHeader
        phase={phase}
        getStatusColor={getStatusColor}
        onStatusMenuOpen={onStatusMenuOpen}
        onPhaseMenuOpen={onPhaseMenuOpen}
      />
      
      <CardContent
        sx={{
          p: 1.5,
          pt: 0.5,
          pb: '8px !important',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Keep Metrics Display here */}
        <PhaseMetricsDisplay
          phase={phase}
          proposedCost={proposedCost}
          actualCost={actualCost}
          formatCurrency={formatCurrency}
        />

        {/* Keep Budget progress indicator here */}
        <Box
          sx={{
            width: '100%',
            mt: 0.5,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={budgetUsedPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(
                    isOverBudget ? theme.palette.error.light : theme.palette.success.light,
                     0.3
                ),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor:
                    isOverBudget
                      ? theme.palette.error.main
                      : theme.palette.success.main,
                },
              }}
            />
          </Box>
          <Typography
            variant="body2"
            fontWeight="bold"
            color={isOverBudget ? "error.main" : "text.primary"}
            sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}
          >
            {budgetUsedPercentage.toFixed(0)}%
          </Typography>
        </Box>

        {/* Use the extracted actions component */}
        <PhaseCardActions 
          phaseId={phase.id}
          onOpenQuickExpenseDialog={onOpenQuickExpenseDialog}
          onOpenQuickBidDialog={onOpenQuickBidDialog}
          onViewPhaseDetails={onViewPhaseDetails}
        />
      </CardContent>
    </Card>
  );
};

export default PhaseCard; 