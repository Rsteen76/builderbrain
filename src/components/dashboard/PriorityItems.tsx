import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Box,
  Button,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PriorityHigh as PriorityHighIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  priority: string;
  status: string;
  projectId: string;
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
  upcomingTasks: Task[];
  overduePayments: Payment[];
}

const PriorityItems: React.FC<PriorityItemsProps> = ({ upcomingTasks, overduePayments }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.background.paper,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PriorityHighIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Priority Items
          </Typography>
        </Stack>
        
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0
            }
          }}
        >
          <Tab label="Tasks" />
          <Tab label="Payments" />
        </Tabs>
      </Stack>
      
      {activeTab === 0 ? (
        upcomingTasks.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingTasks.slice(0, 5).map((task) => (
                  <TableRow 
                    key={task.id}
                    hover
                    onClick={() => navigate(`/projects/${task.projectId}/tasks`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.projectName}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={task.priority}
                        sx={{
                          bgcolor: 
                            task.priority === 'urgent'
                              ? alpha(theme.palette.error.dark, 0.1)
                              : task.priority === 'high' 
                              ? alpha(theme.palette.error.main, 0.1)
                              : task.priority === 'medium'
                              ? alpha(theme.palette.warning.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                          color: 
                            task.priority === 'urgent'
                              ? theme.palette.error.dark
                              : task.priority === 'high' 
                              ? theme.palette.error.main
                              : task.priority === 'medium'
                              ? theme.palette.warning.main
                              : theme.palette.success.main,
                          textTransform: 'capitalize',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={task.status.replace('_', ' ')}
                        sx={{
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/tasks')}
              >
                View all {upcomingTasks.length} tasks
              </Button>
            </Box>
          </TableContainer>
        ) : (
          <Alert 
            severity="success"
            sx={{ borderRadius: 2 }}
          >
            No urgent tasks due soon
          </Alert>
        )
      ) : (
        // Payment tab content
        overduePayments.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overduePayments.slice(0, 5).map((payment) => (
                  <TableRow 
                    key={payment.id}
                    hover
                    onClick={() => navigate(`/projects/${payment.projectId}/payments`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>{payment.projectName}</TableCell>
                    <TableCell>${payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{payment.dueDate}</TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={payment.status}
                        color="error"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/payments')}
              >
                View all {overduePayments.length} payments
              </Button>
            </Box>
          </TableContainer>
        ) : (
          <Alert 
            severity="success"
            sx={{ borderRadius: 2 }}
          >
            No overdue payments
          </Alert>
        )
      )}
    </Paper>
  );
};

export default PriorityItems; 