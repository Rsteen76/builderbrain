import React from 'react';
import {
  Box,
  Typography,
  Card,
  alpha,
  useTheme, // Keep useTheme if theme prop is not passed or for fallback
  Theme,
} from '@mui/material';
import {
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { ProjectPhase } from '../../../types'; // Adjusted path
import { formatCurrency } from '../../../utils/formatters'; // Adjusted path

interface PhaseTimelineChartProps {
  phases: ProjectPhase[];
  // Removed theme prop, will use useTheme hook internally for simplicity
}

const PhaseTimelineChart: React.FC<PhaseTimelineChartProps> = ({ phases }) => {
  const theme = useTheme(); // Get theme contextually

  const chartData = phases.map(phase => ({
    name: phase.name,
    budget: phase.budget || 0, // Ensure budget is a number
    spent: phase.actualCost || 0, // Ensure actualCost is a number
    // Removed progress and status as they are not used in this specific chart
  }));

  // Add a check for empty phases to avoid rendering an empty chart
  if (!phases || phases.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
          mb: 4,
          p: 3,
          textAlign: 'center'
        }}
      >
        <TimelineIcon sx={{ fontSize: 40, color: theme.palette.text.secondary, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No phase data available for timeline chart.
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
        mb: 4,
        overflow: 'hidden',
        p: 0
      }}
    >
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(45deg, ${alpha(theme.palette.background.default, 0.5)}, ${alpha(theme.palette.background.default, 0.8)})`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
        }}
      >
        <Typography variant="h6" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
          <TimelineIcon sx={{ mr: 1.5, fontSize: '1.2rem', color: theme.palette.primary.main }} />
          Project Timeline (Budget vs Spent)
        </Typography>
      </Box>

      <Box sx={{ p: 2, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
          >
            <defs>
              <linearGradient id="timelineChartColorBudget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="timelineChartColorSpent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
            <XAxis dataKey="name" fontSize={12} tick={{ fill: theme.palette.text.secondary }} />
            <YAxis fontSize={12} tick={{ fill: theme.palette.text.secondary }} />
            <RechartsTooltip
              formatter={(value: number, name: string) => [ // Added types
                `${formatCurrency(value)}`,
                name === 'budget' ? 'Budget' : 'Spent'
              ]}
              labelFormatter={(label: string) => `Phase: ${label}`} // Added type
              contentStyle={{
                background: alpha(theme.palette.background.paper, 0.9),
                borderRadius: 4,
                fontSize: '0.8rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: 'none',
                padding: '4px 8px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="budget"
              name="Budget"
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#timelineChartColorBudget)" // Use unique ID
            />
            <Area
              type="monotone"
              dataKey="spent"
              name="Spent"
              stroke={theme.palette.secondary.main}
              fillOpacity={1}
              fill="url(#timelineChartColorSpent)" // Use unique ID
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
};

export default PhaseTimelineChart; 