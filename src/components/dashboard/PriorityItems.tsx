import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  useTheme,
  alpha,
  Stack,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Paper,
  Tooltip,
  Badge,
  Grid,
  Collapse,
} from '@mui/material';
import {
  Warning as WarningIcon,
  PriorityHigh as PriorityHighIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Assignment as AssignmentIcon,
  MonetizationOn as MoneyIcon,
  Alarm as AlarmIcon,
  AttachMoney as AttachMoneyIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

interface DashboardTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  projectId: string;
  projectName: string;
}

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: string;
  projectId: string;
  projectName: string;
}

interface PriorityItemsProps {
  upcomingTasks: DashboardTask[];
  overduePayments: Payment[];
}

// Priority badge component for task cards
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const theme = useTheme();
  
  const getPriorityColor = () => {
    switch(priority) {
      case 'urgent': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Chip
      label={priority}
      size="small"
      sx={{
        backgroundColor: alpha(getPriorityColor(), 0.12),
        color: getPriorityColor(),
        fontWeight: 600,
        fontSize: '0.6875rem',
        textTransform: 'uppercase',
        height: 22,
      }}
    />
  );
};

// Task card component
const TaskCard: React.FC<{ task: DashboardTask }> = ({ task }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const getPriorityColor = () => {
    switch(task.priority) {
      case 'urgent': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const priorityColor = getPriorityColor();
  
  return (
    <Paper
      elevation={isHovered ? 2 : 0}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isHovered 
          ? alpha(priorityColor, 0.3)
          : alpha(theme.palette.divider, 0.08),
        transition: 'all 0.2s ease-in-out',
        transform: isHovered ? 'translateX(4px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => navigate(task.projectId ? `/projects/${task.projectId}` : '/tasks')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Colored left border based on priority */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          bgcolor: priorityColor,
          transition: 'all 0.2s ease',
          width: isHovered ? '6px' : '4px',
        }}
      />
      
      <Box sx={{ pl: 0.5 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}>
          <PriorityBadge priority={task.priority} />
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <AlarmIcon sx={{ fontSize: '0.9rem' }} />
            {task.dueDate}
          </Typography>
        </Box>
        
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            mb: 0.75,
            transition: 'color 0.2s ease',
            color: isHovered ? priorityColor : theme.palette.text.primary,
          }}
        >
          {task.title}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {task.projectName}
        </Typography>
        
        {isHovered && (
          <Box
            sx={{
              position: 'absolute',
              right: '12px',
              bottom: '50%',
              transform: 'translateY(50%)',
              color: alpha(priorityColor, 0.5),
              transition: 'right 0.2s ease',
            }}
          >
            <KeyboardArrowRightIcon />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// Payment card component
const PaymentCard: React.FC<{ payment: Payment }> = ({ payment }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Paper
      elevation={isHovered ? 2 : 0}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isHovered 
          ? alpha(theme.palette.error.main, 0.3)
          : alpha(theme.palette.divider, 0.08),
        transition: 'all 0.2s ease-in-out',
        transform: isHovered ? 'translateX(4px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: alpha(theme.palette.error.main, isHovered ? 0.04 : 0),
      }}
      onClick={() => navigate('/payments')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Colored left border */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          bgcolor: theme.palette.error.main,
          transition: 'all 0.2s ease',
          width: isHovered ? '6px' : '4px',
        }}
      />
      
      <Box sx={{ pl: 0.5 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1
        }}>
          <Chip
            icon={<ErrorIcon sx={{ fontSize: '0.75rem !important' }} />}
            label="Overdue"
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.error.main, 0.12),
              color: theme.palette.error.main,
              fontWeight: 600,
              fontSize: '0.6875rem',
              height: 22,
              '& .MuiChip-icon': {
                color: 'inherit',
              }
            }}
          />
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.error.main,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <ScheduleIcon sx={{ fontSize: '0.9rem' }} />
            {payment.dueDate}
          </Typography>
        </Box>
        
        <Typography 
          variant="subtitle2" 
          sx={{ 
            fontWeight: 600,
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            transition: 'color 0.2s ease',
            color: isHovered ? theme.palette.error.main : theme.palette.text.primary,
          }}
        >
          <AttachMoneyIcon sx={{ fontSize: '1.1rem' }} />
          {formatCurrency(payment.amount)}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary,
            display: 'block',
          }}
        >
          {payment.description}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {payment.projectName}
        </Typography>
        
        {isHovered && (
          <Box
            sx={{
              position: 'absolute',
              right: '12px',
              bottom: '50%',
              transform: 'translateY(50%)',
              color: alpha(theme.palette.error.main, 0.5),
              transition: 'right 0.2s ease',
            }}
          >
            <KeyboardArrowRightIcon />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const PriorityItems: React.FC<PriorityItemsProps> = ({ upcomingTasks, overduePayments }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState(true);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const totalPriorityItems = upcomingTasks.length + overduePayments.length;

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            px: 0.5,
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                }}
              >
                <PriorityHighIcon 
                  sx={{ fontSize: 24, color: theme.palette.error.main }} 
                />
              </Box>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ fontSize: '1.25rem' }}
                >
                  Priority Items
                </Typography>
                
                {totalPriorityItems > 0 && (
                  <Badge 
                    badgeContent={totalPriorityItems} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontWeight: 'bold',
                        minWidth: '22px',
                        height: '22px',
                        fontSize: '0.75rem',
                      }
                    }}
                  />
                )}
              </Stack>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title={expanded ? "Collapse" : "Expand"}>
                <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
              </Tooltip>
              
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowForwardIcon fontSize="small" />}
                onClick={() => navigate(activeTab === 0 ? '/tasks' : '/payments')}
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
            </Stack>
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleChangeTab}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 56,
                    fontWeight: 600,
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                  }
                }}
              >
                <Tab 
                  icon={
                    <Badge 
                      badgeContent={upcomingTasks.length} 
                      color="error"
                      sx={{ 
                        '& .MuiBadge-badge': { 
                          fontSize: '0.65rem', 
                          height: '16px', 
                          minWidth: '16px',
                        } 
                      }}
                    >
                      <AssignmentIcon />
                    </Badge>
                  } 
                  label="Upcoming Tasks" 
                  iconPosition="start"
                  sx={{ 
                    fontSize: '0.825rem',
                    textTransform: 'none',
                  }}
                />
                <Tab 
                  icon={
                    <Badge 
                      badgeContent={overduePayments.length} 
                      color="error"
                      sx={{ 
                        '& .MuiBadge-badge': { 
                          fontSize: '0.65rem', 
                          height: '16px', 
                          minWidth: '16px',
                        } 
                      }}
                    >
                      <MoneyIcon />
                    </Badge>
                  } 
                  label="Overdue Payments" 
                  iconPosition="start"
                  sx={{ 
                    fontSize: '0.825rem',
                    textTransform: 'none',
                  }}
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 2.5, maxHeight: '400px', overflowY: 'auto' }}>
              {activeTab === 0 && (
                <Box>
                  {upcomingTasks.length > 0 ? (
                    [...upcomingTasks]
                      .sort((a, b) => {
                        // Sort by priority first
                        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                          return priorityOrder[a.priority] - priorityOrder[b.priority];
                        }
                        // Then by due date
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      })
                      .map((task, index) => (
                        <TaskCard key={task.id} task={task} />
                      ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1, opacity: 0.6 }} />
                      <Typography variant="body1" color="text.secondary">
                        No upcoming tasks. You're all caught up!
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/tasks')}
                      >
                        Create New Task
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box>
                  {overduePayments.length > 0 ? (
                    [...overduePayments]
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map((payment, index) => (
                        <PaymentCard key={payment.id} payment={payment} />
                      ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1, opacity: 0.6 }} />
                      <Typography variant="body1" color="text.secondary">
                        No overdue payments. Everything is up to date!
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
};

export default PriorityItems;
