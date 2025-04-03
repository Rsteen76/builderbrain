import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  Grid,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import { ProjectPhase } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Helper function to get status color
const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    'planning': '#3f51b5',       // Indigo
    'in_progress': '#ff9800',    // Orange
    'completed': '#4caf50',      // Green
    'on_hold': '#f44336',        // Red
    'not_started': '#9e9e9e',    // Grey
    'delayed': '#d32f2f',        // Dark Red
  };
  
  return statusColors[status.toLowerCase()] || '#9e9e9e';
};

interface QuickUpdateModeProps {
  phasesBeingUpdated: { [id: string]: ProjectPhase };
  renderingKey: string;
  handleQuickUpdatePhase: (phaseId: string, field: string, value: any) => void;
}

const QuickUpdateMode: React.FC<QuickUpdateModeProps> = ({
  phasesBeingUpdated,
  renderingKey,
  handleQuickUpdatePhase
}) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        bgcolor: alpha(theme.palette.primary.main, 0.05)
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={600} color="primary">Quick Update Mode</Typography>
      </Box>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Make multiple updates across phases to catch up on project progress quickly. Update status, progress, and actual costs for each phase.
      </Typography>
      
      <Grid container spacing={3}>
        {Object.values(phasesBeingUpdated).map((phase) => (
          <Grid item xs={12} sm={6} md={6} lg={4} key={`${renderingKey}-phase-${phase.id}`}>
            <Card 
              elevation={2} 
              sx={{ 
                p: 0, 
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                overflow: 'hidden',
              }}
            >
              <Box 
                sx={{ 
                  p: 2.5,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(getStatusColor(phase.status), 0.05),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {phase.name}
                </Typography>
                <Chip
                  label={phase.status.replace('_', ' ')}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: alpha(getStatusColor(phase.status), 0.15),
                    color: getStatusColor(phase.status),
                    borderRadius: '12px',
                  }}
                />
              </Box>
              
              <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                    {phasesBeingUpdated[phase.id]?.progress || phase.progress || 0}% Complete
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {['not_started', 'in_progress', 'completed', 'delayed'].map((status) => (
                      <Chip
                        key={status}
                        label={status.replace('_', ' ')}
                        clickable
                        size="small"
                        onClick={() => handleQuickUpdatePhase(phase.id, 'status', status)}
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: (phasesBeingUpdated[phase.id]?.status || phase.status) === status 
                                ? alpha(getStatusColor(status), 0.15)
                                : alpha(theme.palette.background.default, 0.6),
                          color: (phasesBeingUpdated[phase.id]?.status || phase.status) === status 
                                ? getStatusColor(status)
                                : theme.palette.text.secondary,
                          borderRadius: '12px',
                          border: `1px solid ${alpha(getStatusColor(status), (phasesBeingUpdated[phase.id]?.status || phase.status) === status ? 0.5 : 0.1)}`,
                          '&:hover': {
                            bgcolor: alpha(getStatusColor(status), 0.1),
                          }
                        }}
                      />
                    ))}
                  </Box>
                  
                  <Box sx={{ width: '100%', height: 6, bgcolor: alpha(theme.palette.divider, 0.1), borderRadius: 3, mb: 1, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%',
                        width: `${(phasesBeingUpdated[phase.id]?.status || phase.status) === 'completed' ? 100 : (phasesBeingUpdated[phase.id]?.status || phase.status) === 'in_progress' ? 50 : (phasesBeingUpdated[phase.id]?.status || phase.status) === 'delayed' ? 25 : 0}%`,
                        bgcolor: getStatusColor(phasesBeingUpdated[phase.id]?.status || phase.status),
                        borderRadius: 3,
                        transition: 'width 0.5s ease-in-out',
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      Budget Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {(phasesBeingUpdated[phase.id]?.actualCost || phase.actualCost || 0) > phase.budget && (
                        <Chip 
                          label="Over Budget" 
                          size="small" 
                          color="error" 
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Budget:</Typography>
                    <Typography variant="body2" color="text.primary">
                      {formatCurrency(phase.budget)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default QuickUpdateMode; 