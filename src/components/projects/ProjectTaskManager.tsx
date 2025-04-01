import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, 
  CircularProgress, Alert, IconButton, Chip, Stack, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  Card, useMediaQuery, useTheme, alpha, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { 
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
    Person as PersonIcon,
    Engineering as SubcontractorIcon,
    Assignment as TaskIcon
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { Task, Project, Subcontractor } from '../../types'; // Import correct Task type
import { TaskService } from '../../services/task'; // Keep service import
import { SubcontractorService } from '../../services/subcontractor';
import TaskFormModal from '../tasks/TaskFormModal'; // Ensure path is correct
import { useAuth } from '../../contexts/AuthContext'; // Added useAuth
import { ProjectService } from '../../services/project';

interface MockUser { id: string; name: string; }
const mockUsers: MockUser[] = [
    {id: 'user1', name: 'Alice (PM)'},
    {id: 'user2', name: 'Bob (Site Super)'},
    {id: 'user3', name: 'Charlie (Admin)'}
];

// Helper to get status chip color
const getTaskStatusColor = (status: Task['status']): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'todo': return 'default';
    case 'in_progress': return 'info';
    case 'review': return 'warning';
    case 'completed': return 'success';
    default: return 'default';
  }
};

// Helper to get priority indicator
const getPriorityIndicator = (priority: Task['priority']): React.ReactNode => {
    const colors = {
        low: 'text.secondary',
        medium: 'info.main',
        high: 'warning.main',
        urgent: 'error.main'
    }
    return <Typography variant="caption" sx={{ fontWeight: 'bold', color: colors[priority] }}>{priority}</Typography>
}

// --- Local Types and Mappings ---
// Define status colors based on Task['status'] values
const taskStatusColors = {
  todo: 'default',
  in_progress: 'info',
  review: 'warning',
  completed: 'success',
} as const; // Use const assertion for stricter type mapping

// Define priority colors based on Task['priority'] values
const taskPriorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
} as const; // Use const assertion

// Use imported Task type for props
interface ProjectTaskManagerProps {
  project: Project; // Use imported Project type
  onProjectUpdate: (updatedProject: Project) => void;
  userId: string;
}

// Use imported Task type for head cells
interface HeadCell {
  id: keyof Task | 'actions';
  numeric: boolean;
  disablePadding: boolean;
  label: string;
}

const headCells: readonly HeadCell[] = [
  { id: 'title', numeric: false, disablePadding: false, label: 'Title' },
  { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'priority', numeric: false, disablePadding: false, label: 'Priority' },
  { id: 'assigneeId', numeric: false, disablePadding: false, label: 'Assignee' }, // Use assigneeId
  { id: 'dueDate', numeric: false, disablePadding: false, label: 'Due Date' },
  { id: 'actions', numeric: true, disablePadding: false, label: 'Actions' },
];

// --- Sorting Types & Config ---

type Order = 'asc' | 'desc';
// Define keys that are sortable
type SortableTaskKeys = 'status' | 'priority' | 'title' | 'assigneeId' | 'dueDate' | 'createdAt'; 

// --- Helper Functions (Sorting - adapted from BidManager) ---

// getComparator needs to handle Task type and potentially null values like dueDate
function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const aValue = a[orderBy];
  const bValue = b[orderBy];

  if (aValue == null) return 1; // null/undefined first in descending
  if (bValue == null) return -1;

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  // Handle Dates specifically (including nulls)
  if (aValue instanceof Date && bValue instanceof Date) {
     if (bValue.getTime() < aValue.getTime()) return -1;
     if (bValue.getTime() > aValue.getTime()) return 1;
     return 0;
  }
  // String comparison (case-insensitive)
  const aStr = String(aValue).toLowerCase();
  const bStr = String(bValue).toLowerCase();
   if (bStr < aStr) return -1;
   if (bStr > aStr) return 1;
   return 0;
}

function getComparator<T, Key extends keyof T>(
  order: Order,
  orderBy: Key,
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const ProjectTaskManager: React.FC<ProjectTaskManagerProps> = ({ project, onProjectUpdate, userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth(); // Get user auth context if needed
  
  // State uses imported Task type
  const [tasks, setTasks] = useState<Task[]>(project.tasks || []);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<keyof Task>('createdAt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subcontractors for assignee mapping
  useEffect(() => {
      const fetchSubs = async () => {
          if (!userId) return;
          try {
              const subs = await SubcontractorService.getSubcontractors(userId);
              setSubcontractors(subs);
          } catch(err) {
              console.error("Failed to load subcontractors for Task Manager", err);
              setError("Couldn't load subcontractor list.");
          }
      }
      fetchSubs();
  }, [userId]);

  // Update tasks state if project prop changes
  useEffect(() => {
    setTasks(project.tasks || []);
  }, [project.tasks]);

  const userNameMap = useMemo(() => {
    return mockUsers.reduce((map, user) => {
      map[user.id] = user.name;
      return map;
    }, {} as { [key: string]: string });
  }, []);

  const subcontractorNameMap = useMemo(() => {
    return subcontractors.reduce((map, sub) => {
      if(sub.id) map[sub.id] = sub.name;
      return map;
    }, {} as { [key: string]: string });
  }, [subcontractors]);

  const getAssigneeDisplay = (task: Task): React.ReactNode => {
      if (!task.assigneeId) {
          return <Typography variant="caption" color="text.secondary">Unassigned</Typography>;
      }
      
      let name = `ID: ${task.assigneeId}`;
      let icon = null;
      
      if (task.assigneeType === 'user') {
          name = userNameMap[task.assigneeId] || name;
          icon = <Tooltip title="Team Member"><PersonIcon fontSize="inherit" sx={{ verticalAlign: 'bottom', mr: 0.5 }} color="action"/></Tooltip>;
      } else if (task.assigneeType === 'subcontractor') {
          name = subcontractorNameMap[task.assigneeId] || name;
          icon = <Tooltip title="Subcontractor"><SubcontractorIcon fontSize="inherit" sx={{ verticalAlign: 'bottom', mr: 0.5 }} color="action"/></Tooltip>;
      }
      
      return <Stack direction="row" alignItems="center">{icon}<Typography variant="caption">{name}</Typography></Stack>;
  }

  // --- Sorting Handler ---
  const handleRequestSort = (event: React.MouseEvent<unknown>, property: SortableTaskKeys) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property as keyof Task);
  };

  // --- Memoized Sorted Tasks ---
  const sortedTasks = useMemo(() => {
      // Sort by the selected column
      return stableSort(tasks, getComparator<Task, keyof Task>(order, orderBy));
  }, [tasks, order, orderBy]);

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
    setError(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  const handleDeleteTask = async (taskId: string) => {
      if (!window.confirm('Are you sure you want to delete this task?')) return;
      setLoading(true);
      setError(null);
      try {
          await TaskService.deleteTask(taskId);
          const updatedTasks = tasks.filter(t => t.id !== taskId);
          onProjectUpdate({ ...project, tasks: updatedTasks });
      } catch(err) {
          console.error("Error deleting task:", err);
          setError("Failed to delete task.");
      } finally {
          setLoading(false);
      }
  };

  const handleTaskSubmit = (submittedTask: Task) => {
      let updatedTasks;
      if (tasks.some(t => t.id === submittedTask.id)) {
          updatedTasks = tasks.map(t => t.id === submittedTask.id ? submittedTask : t);
      } else {
          updatedTasks = [submittedTask, ...tasks];
      }
      const sortedTasks = updatedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      onProjectUpdate({ ...project, tasks: sortedTasks });
  };

  const showLoading = loading && tasks.length === 0 && subcontractors.length === 0;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TaskIcon color="primary" />
          <Typography variant="h6">Project Tasks</Typography>
        </Stack>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleAddTask} 
          disabled={loading}
          sx={{ 
            borderRadius: 1.5,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Add Task
        </Button>
      </Box>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {showLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
      ) : sortedTasks.length === 0 ? (
        <Alert 
          severity="info" 
          icon={<TaskIcon />}
          sx={{ 
            my: 2,
            borderRadius: 1,
            '& .MuiAlert-message': { width: '100%', textAlign: 'center' }
          }}
        >
          No tasks found for this project. Click "Add Task" to get started.
        </Alert>
      ) : isMobile ? (
        // Mobile view - List of cards instead of table
        <List sx={{ p: 0 }}>
          {sortedTasks.map((task) => (
            <Card
              key={task.id}
              elevation={0}
              sx={{
                mb: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                borderRadius: 1.5,
              }}
            >
              <Box sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1
                }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {task.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditTask(task)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteTask(task.id!)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {task.description && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {task.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} mb={1.5}>
                  <Chip 
                    label={task.status} 
                    size="small" 
                    color={taskStatusColors[task.status] as any || 'default'} 
                  />
                  <Chip 
                    label={task.priority} 
                    size="small"
                    color={taskPriorityColors[task.priority] as any || 'default'} 
                  />
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Assignee</Typography>
                    <Box sx={{ mt: 0.5 }}>{getAssigneeDisplay(task)}</Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" align="right" display="block">
                      Due Date
                    </Typography>
                    <Typography variant="body2" align="right">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Card>
          ))}
        </List>
      ) : (
        // Desktop view - Table
        <TableContainer 
          component={Paper} 
          variant="outlined" 
          sx={{ 
            borderRadius: 1.5,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            maxHeight: 600
          }}
        >
          <Table size="small" stickyHeader aria-label="project tasks table">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{ 
                      fontWeight: 600, 
                      whiteSpace: 'nowrap', 
                      backgroundColor: alpha(theme.palette.primary.main, 0.03),
                      color: 'text.primary',
                      px: 2
                    }}
                  >
                    {(headCell.id === 'status' || headCell.id === 'priority' || headCell.id === 'title' || 
                      headCell.id === 'dueDate') ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={(event) => handleRequestSort(event, headCell.id as SortableTaskKeys)}
                      >
                        {headCell.label}
                        {orderBy === headCell.id ? (
                          <Box component="span" sx={visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTasks.length === 0 ? (
                <TableRow><TableCell colSpan={headCells.length} align="center">No tasks found.</TableCell></TableRow>
              ) : (
                sortedTasks.map((task) => (
                  <TableRow hover key={task.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                      {task.description && (
                        <Typography variant="caption" color="text.secondary" sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '250px'
                        }}>
                          {task.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={task.status} 
                        size="small" 
                        color={taskStatusColors[task.status] as any || 'default'} 
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>{getPriorityIndicator(task.priority)}</TableCell>
                    <TableCell>{getAssigneeDisplay(task)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Edit Task">
                          <IconButton size="small" onClick={() => handleEditTask(task)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id!)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TaskFormModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmitSuccess={handleTaskSubmit}
        initialData={editingTask}
        projectId={project.id!}
        userId={userId}
      /> 
    </Paper>
  );
};

export default ProjectTaskManager;