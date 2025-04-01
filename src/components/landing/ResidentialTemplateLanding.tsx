import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Container,
  Paper,
  useTheme,
  alpha,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  House as HouseIcon,
  Engineering as EngineeringIcon,
  Architecture as ArchitectureIcon,
  Construction as ConstructionIcon,
  Schedule as ScheduleIcon,
  ElectricalServices as ElectricalIcon,
  Handyman as CarpenterIcon,
  Yard as LandscapingIcon,
  DoorFront as DoorsIcon,
  Deck as DeckIcon,
  Home as RoofingIcon,
  CheckCircleOutline as CheckIcon,
  ArrowForward as ArrowForwardIcon,
  Plumbing
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ResidentialTemplateLanding: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const phases = [
    { 
      name: "Pre-Construction", 
      icon: <ArchitectureIcon />, 
      description: "Plans, permits, and preparations before breaking ground" 
    },
    { 
      name: "Site Work & Foundation", 
      icon: <EngineeringIcon />, 
      description: "Land clearing, excavation, and foundation installation" 
    },
    { 
      name: "Framing", 
      icon: <CarpenterIcon />, 
      description: "Structural framing, sheathing, and roof trusses" 
    },
    { 
      name: "Rough-Ins", 
      icon: <ElectricalIcon />, 
      description: "Electrical, plumbing, and HVAC systems installation" 
    },
    { 
      name: "Insulation & Drywall", 
      icon: <ConstructionIcon />, 
      description: "Thermal insulation and interior wall installation" 
    },
    { 
      name: "Interior Finishes", 
      icon: <DoorsIcon />, 
      description: "Doors, trim work, painting, and interior finishes" 
    },
    { 
      name: "Flooring & Fixtures", 
      icon: <Plumbing />, 
      description: "Flooring installation and fixture placement" 
    },
    { 
      name: "Exterior Finishes", 
      icon: <DeckIcon />, 
      description: "Siding, outdoor structures, and exterior details" 
    },
    { 
      name: "Landscaping", 
      icon: <LandscapingIcon />, 
      description: "Grading, planting, and hardscape installation" 
    },
    { 
      name: "Final Inspections", 
      icon: <CheckIcon />, 
      description: "Final walk-through and completion of punch list items" 
    },
  ];
  
  const features = [
    "10 pre-configured construction phases",
    "45+ common tasks distributed across phases",
    "17 subcontractor types included",
    "Timeline planning with task dependencies",
    "Budget allocation across phases",
    "Quality control checklists",
    "Permits and inspections tracking",
    "Client approval workflows",
    "Material procurement planning",
    "Payment milestone tracking"
  ];
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          mb: 4,
          borderRadius: 3,
          backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.02)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography 
              variant="h3" 
              component="h1" 
              fontWeight={700} 
              gutterBottom
              sx={{ 
                color: theme.palette.text.primary,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' }
              }}
            >
              Residential Construction
              <Box component="span" sx={{ color: theme.palette.primary.main }}> Project Template</Box>
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                fontWeight: 400,
                color: alpha(theme.palette.text.primary, 0.8),
                fontSize: { xs: '1rem', sm: '1.15rem' }
              }}
            >
              Jumpstart your residential projects with our comprehensive template featuring all standard phases, tasks, and subcontractors for successful home construction.
            </Typography>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={<HouseIcon />}
                onClick={() => navigate('/projects/new-residential')}
                sx={{ borderRadius: 2, px: 3, py: 1.5 }}
              >
                Start New Residential Project
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/projects')}
                sx={{ borderRadius: 2, px: 3, py: 1.5 }}
              >
                View All Projects
              </Button>
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box
              sx={{
                position: 'relative',
                height: 300,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <HouseIcon 
                sx={{ 
                  fontSize: 220, 
                  color: alpha(theme.palette.primary.main, 0.12),
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} 
              />
              <ConstructionIcon 
                sx={{ 
                  fontSize: 140, 
                  color: alpha(theme.palette.primary.main, 0.2),
                  position: 'absolute',
                  top: '60%',
                  left: '60%',
                  transform: 'translate(-50%, -50%) rotate(15deg)',
                }} 
              />
              <ArchitectureIcon 
                sx={{ 
                  fontSize: 160, 
                  color: alpha(theme.palette.primary.main, 0.15),
                  position: 'absolute',
                  top: '30%',
                  left: '40%',
                  transform: 'translate(-50%, -50%)',
                }} 
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Features Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight={600}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: 2 
              }}
            >
              <CheckIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
              Template Features
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <List sx={{ p: 0 }}>
              {features.map((feature, index) => (
                <ListItem 
                  key={index} 
                  disableGutters 
                  sx={{ 
                    py: 1, 
                    px: 0,
                    borderBottom: index < features.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none' 
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon sx={{ color: theme.palette.success.main }} />
                  </ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight={600}
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: 2 
              }}
            >
              <ScheduleIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              Construction Phases
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              {phases.map((phase, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      height: '100%',
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.04)}`,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                        <Box 
                          sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        >
                          {phase.icon}
                        </Box>
                        <Stack spacing={0}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {phase.name}
                          </Typography>
                          <Chip 
                            label={`Phase ${index + 1}`} 
                            size="small" 
                            sx={{ 
                              height: 22, 
                              '& .MuiChip-label': { px: 1, fontSize: '0.75rem' } 
                            }}
                          />
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {phase.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* CTA Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mt: 4,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h5" 
          fontWeight={600} 
          gutterBottom
          sx={{ 
            mb: 2,
            color: theme.palette.text.primary 
          }}
        >
          Ready to streamline your residential project management?
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 3,
            mx: 'auto',
            maxWidth: 700,
            color: alpha(theme.palette.text.primary, 0.7) 
          }}
        >
          Our residential project template saves you hours of setup time and ensures you follow industry best practices for successful construction management.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          color="primary"
          startIcon={<HouseIcon />}
          onClick={() => navigate('/projects/new-residential')}
          sx={{ borderRadius: 2, px: 4, py: 1.5 }}
        >
          Create Your Project Now
        </Button>
      </Paper>
    </Container>
  );
};

export default ResidentialTemplateLanding; 