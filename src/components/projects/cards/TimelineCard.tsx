import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  LinearProgress,
  alpha,
  Theme,
} from '@mui/material';

interface TimelineCardProps {
  timeline: {
    startDate: Date;
    endDate: Date;
    elapsedDays: number;
    totalDays: number;
    percentComplete: number;
  };
  theme: Theme;
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  timeline,
  theme,
}) => {
  return (
    <Card elevation={0} sx={{ 
      borderRadius: 2, 
      height: '100%',
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Timeline
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h6" component="div" fontWeight="bold" sx={{ mr: 1 }}>
            {timeline.elapsedDays} <Typography variant="body2" component="span">days elapsed</Typography>
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Start
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {timeline.startDate && !isNaN(timeline.startDate.getTime()) 
                ? timeline.startDate.toLocaleDateString() 
                : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              End
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {timeline.endDate && !isNaN(timeline.endDate.getTime()) 
                ? timeline.endDate.toLocaleDateString() 
                : 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {timeline.totalDays} days
            </Typography>
          </Box>
        </Stack>
        
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={timeline.percentComplete} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: alpha(theme.palette.primary.main, 0.1) 
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {timeline.percentComplete}% of timeline elapsed
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimelineCard; 