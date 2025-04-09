import React from 'react';
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Theme,
} from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters'; // Adjusted path

interface PhaseBudgetPieChartProps {
  budget: number;
  proposedCost: number;
  actualCost: number;
}

const PhaseBudgetPieChart: React.FC<PhaseBudgetPieChartProps> = ({
  budget,
  proposedCost,
  actualCost,
}) => {
  const theme = useTheme();

  // Prepare data for the pie chart based on original implementation
  const pieChartData = [
    { name: 'Budget', value: budget, color: theme.palette.primary.main },
    { name: 'Proposed', value: proposedCost, color: theme.palette.warning.main },
    { name: 'Actual', value: Math.max(actualCost, 0), color:
      actualCost > budget
        ? theme.palette.error.main
        : theme.palette.success.main
    },
  ].filter(d => d.value > 0); // Filter out zero/negative values

  // Check if there's any meaningful data to display
  if (pieChartData.length === 0) {
    return (
      <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', mt: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          No cost data available for chart.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexGrow: 1,
      height: 160,
      mt: 0.5
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          margin={{ top: 0, right: 0, bottom: 20, left: 0 }} // Ensure space for legend
        >
          <Pie
            data={pieChartData}
            cx="50%"
            cy="50%" // Center vertically
            innerRadius={35}
            outerRadius={60}
            paddingAngle={2}
            dataKey="value"
          >
            {pieChartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={alpha(entry.color, 0.2)}
                strokeWidth={1} // Reduced stroke width slightly
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            iconSize={8}
            iconType="circle"
            wrapperStyle={{
              fontSize: '0.75rem',
              // No need for marginTop if verticalAlign="bottom" is used correctly
            }}
          />
          <RechartsTooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              background: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 4,
              fontSize: '0.8rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: 'none',
              padding: '4px 8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PhaseBudgetPieChart; 