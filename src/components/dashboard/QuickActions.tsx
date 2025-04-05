import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Button,
  useTheme,
  alpha,
  Grid,
  Box,
  Tooltip,
  Grow,
  useMediaQuery,
  IconButton,
  Zoom,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  BusinessCenter as ProjectIcon,
  TaskAlt as TaskIcon,
  People as TeamIcon,
  ReceiptLong as ExpenseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectService } from '../../services/project';
import { ExpenseService } from '../../services/expense';
import ExpenseFormModal from '../expenses/ExpenseFormModal';

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  primaryIcon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  color: string;
  delay: number;
}

// Individual Action Card component
const ActionCard: React.FC<ActionCardProps> = ({ 
  title, 
  description, 
  icon,
  primaryIcon, 
  path,
  onClick,
  color,
  delay
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };
  
  return (
    <Grow in={true} style={{ transformOrigin: '0 0 0' }} timeout={300 + delay * 100}>
      <Paper
        elevation={isHovered ? 4 : 0}
        sx={{
          p: 2.5,
          height: '100%',
          position: 'relative',
          borderRadius: 3,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${isHovered ? 'transparent' : alpha(theme.palette.divider, 0.08)}`,
          background: isHovered 
            ? `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.05)} 100%)`
            : alpha(theme.palette.background.paper, 0.8),
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-4px)' : 'none',
          '&:before': isHovered ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: color,
            borderRadius: '4px 4px 0 0',
          } : {},
          '&:after': {
            content: '""',
            position: 'absolute',
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${alpha(color, 0.1)} 0%, transparent 70%)`,
            borderRadius: '50%',
            bottom: '-100px',
            right: '-100px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 0,
          },
          cursor: 'pointer',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 2,
                backgroundColor: alpha(color, isHovered ? 0.15 : 0.08),
                color: color,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <Zoom in={isHovered} timeout={200}>
                <Box sx={{ position: 'absolute' }}>
                  {primaryIcon}
                </Box>
              </Zoom>
              
              <Box sx={{ 
                opacity: isHovered ? 0 : 1, 
                transition: 'opacity 0.2s ease',
              }}>
                {icon}
              </Box>
            </Box>

            <IconButton
              size="small"
              sx={{
                color: isHovered ? color : alpha(theme.palette.text.secondary, 0.4),
                transform: isHovered ? 'translateX(0)' : 'translateX(-5px)',
                opacity: isHovered ? 1 : 0,
                transition: 'all 0.3s ease',
              }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{ 
              color: isHovered ? color : theme.palette.text.primary,
              transition: 'color 0.2s ease',
              mb: 0.5,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ 
              color: alpha(theme.palette.text.secondary, 0.8),
              fontSize: '0.75rem',
              pr: 1,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Paper>
    </Grow>
  );
};

const QuickActions: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch projects when component mounts
  React.useEffect(() => {
    const fetchProjects = async () => {
      if (user?.uid) {
        try {
          const fetchedProjects = await ProjectService.getProjects(user.uid);
          setProjects(fetchedProjects);
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      }
    };
    fetchProjects();
  }, [user]);

  const handleAddExpense = () => {
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (expenseData: any) => {
    if (user?.uid) {
      try {
        await ExpenseService.createExpense(user.uid, expenseData);
        // You might want to show a success message or refresh the dashboard data here
      } catch (error) {
        console.error('Error creating expense:', error);
      }
    }
  };

  const actions = [
    {
      title: 'New Project',
      description: 'Start planning a new construction project',
      icon: <AddIcon sx={{ fontSize: 24 }} />,
      primaryIcon: <ProjectIcon sx={{ fontSize: 24 }} />,
      path: '/projects/new',
      color: theme.palette.primary.main,
      delay: 0,
    },
    {
      title: 'Create Task',
      description: 'Add new tasks for your team',
      icon: <AssignmentIcon sx={{ fontSize: 24 }} />,
      primaryIcon: <TaskIcon sx={{ fontSize: 24 }} />,
      path: '/tasks',
      color: theme.palette.success.main,
      delay: 1,
    },
    {
      title: 'Add Team Member',
      description: 'Invite contractors or employees',
      icon: <GroupIcon sx={{ fontSize: 24 }} />,
      primaryIcon: <TeamIcon sx={{ fontSize: 24 }} />,
      path: '/team',
      color: theme.palette.warning.main,
      delay: 2,
    },
    {
      title: 'Add Expense',
      description: 'Track costs and manage budget',
      icon: <ReceiptIcon sx={{ fontSize: 24 }} />,
      primaryIcon: <ExpenseIcon sx={{ fontSize: 24 }} />,
      onClick: handleAddExpense,
      color: theme.palette.info.main,
      delay: 3,
    },
  ];

  return (
    <Box 
      sx={{ 
        position: 'relative',
        mb: 4,
        pt: 1,
        pb: 0.5,
      }}
    >
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2.5,
        px: 0.5,
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '12px',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <ConstructionIcon 
              color="primary" 
              sx={{ fontSize: 20 }} 
            />
          </Box>
          
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ fontSize: '1.125rem' }}
          >
            Quick Actions
          </Typography>
        </Stack>
        
        <Tooltip title="View all actions" arrow>
          <Button
            variant="text"
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={() => navigate('/actions')}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: 'transparent',
                color: theme.palette.primary.main,
              }
            }}
          >
            View All
          </Button>
        </Tooltip>
      </Box>

      <Grid container spacing={2.5}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ActionCard {...action} />
          </Grid>
        ))}
      </Grid>

      <ExpenseFormModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        projects={projects}
      />
    </Box>
  );
};

export default QuickActions;