import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Box,
  Button,
  alpha,
  Theme,
} from '@mui/material';
import {
  BarChart as ChartIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { ProjectPhase } from '../../../../types';

interface ProgressChartSectionProps {
  phases: ProjectPhase[];
  theme: Theme;
  handleAddPhase: () => void;
}

const ProgressChartSection: React.FC<ProgressChartSectionProps> = ({
  phases,
  theme,
  handleAddPhase
}) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        height: '100%'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ChartIcon sx={{ mr: 1 }} /> Progress Overview
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {phases.length > 0 ? (
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={phases}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                style={{ fontSize: '0.75rem' }}
              />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`${value}%`, name]} 
                labelFormatter={(label: string) => `Phase: ${label}`}
              />
              <Legend />
              <Bar 
                dataKey="progress" 
                name="Progress" 
                fill={theme.palette.primary.main}
                barSize={15}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box sx={{ 
          height: 300, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
          <TimelineIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="body1" color="text.secondary" align="center">
            No phases available to show progress
          </Typography>
          <Button 
            variant="text" 
            size="small" 
            startIcon={<AddIcon />} 
            onClick={handleAddPhase}
            sx={{ mt: 1 }}
          >
            Add Project Phases
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ProgressChartSection; 