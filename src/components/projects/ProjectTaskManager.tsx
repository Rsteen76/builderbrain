import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, 
  CircularProgress, Alert, IconButton, Chip, Stack, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  Card, useMediaQuery, useTheme, alpha, List, ListItem, ListItemText, Divider,
  Checkbox, FormControlLabel, Switch, TextField, MenuItem, Select,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Grid
} from '@mui/material';
import { 
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
    Person as PersonIcon,
    Engineering as SubcontractorIcon,
    Assignment as TaskIcon,
    CheckBox as CheckBoxIcon,
    FilterList as FilterIcon,
    Update as UpdateIcon
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
  // Bulk actions state
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [bulkStatus, setBulkStatus] = useState<Task['status']>('in_progress');
  const [bulkPriority, setBulkPriority] = useState<Task['priority']>('medium');
  const [bulkAssignee, setBulkAssignee] = useState<string>('');

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

  // Filter tasks for display
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by completion status
      if (!showCompletedTasks && task.status === 'completed') {
        return false;
      }
      
      // Filter by status
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      
      // Filter by priority
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      
      return true;
    });
  }, [tasks, showCompletedTasks, statusFilter, priorityFilter]);

  // Toggle row selection
  const handleSelectRow = (taskId: string) => {
    const selectedIndex = selected.indexOf(taskId);
    let newSelected: string[] = [];
    
    if (selectedIndex === -1) {
      newSelected = [...selected, taskId];
    } else {
      newSelected = selected.filter(id => id !== taskId);
    }
    
    setSelected(newSelected);
  };
  
  // Toggle all rows selection
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredTasks.map(task => task.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };
  
  // Bulk update tasks
  const handleBulkUpdate = () => {
    if (selected.length === 0) return;
    
    // Create a copy of tasks
    const updatedTasks = tasks.map(task => {
      // Only update if in selected array
      if (selected.includes(task.id)) {
        return {
          ...task,
          status: bulkStatus as Task['status'],
          priority: bulkPriority as Task['priority'],
          ...(bulkAssignee && { assigneeId: bulkAssignee }),
          updatedAt: new Date()
        };
      }
      return task;
    });
    
    // Update state
    setTasks(updatedTasks);
    
    // Update project with new tasks
    const updatedProject = {
      ...project,
      tasks: updatedTasks
    };
    onProjectUpdate(updatedProject);
    
    // Close dialog and clear selection
    setBulkUpdateOpen(false);
    setSelected([]);
    
    // Here you would also update the backend
    // TaskService.bulkUpdateTasks(selected, { status: bulkStatus, priority: bulkPriority, assigneeId: bulkAssignee });
  };
  
  // Quick mark as complete
  const handleQuickComplete = () => {
    if (selected.length === 0) return;
    
    // Create a copy of tasks
    const updatedTasks = tasks.map(task => {
      // Only update if in selected array
      if (selected.includes(task.id)) {
        return {
          ...task,
          status: 'completed' as Task['status'],
          updatedAt: new Date()
        };
      }
      return task;
    });
    
    // Update state
    setTasks(updatedTasks);
    
    // Update project with new tasks
    const updatedProject = {
      ...project,
      tasks: updatedTasks
    };
    onProjectUpdate(updatedProject);
    
    // Clear selection
    setSelected([]);
  };

  // Reset bulk update form
  const handleCloseBulkUpdate = () => {
    setBulkUpdateOpen(false);
    setBulkStatus('in_progress');
    setBulkPriority('medium');
    setBulkAssignee('');
  };

  const isSelected = (taskId: string) => selected.indexOf(taskId) !== -1;

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Action Toolbar */}
      <Card 
        elevation={0} 
        sx={{ 
          mb: 3, 
          borderRadius: 2, 
          p: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Tasks</Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddTask}
              sx={{ borderRadius: 1.5 }}
            >
              Add Task
            </Button>
            
            {selected.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CheckBoxIcon />}
                  onClick={handleQuickComplete}
                  sx={{ borderRadius: 1.5 }}
                >
                  Mark as Complete
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UpdateIcon />}
                  onClick={() => setBulkUpdateOpen(true)}
                  sx={{ borderRadius: 1.5 }}
                >
                  Bulk Update
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        {/* Filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={showCompletedTasks}
                    onChange={(e) => setShowCompletedTasks(e.target.checked)}
                    size="small"
                  />
                }
                label="Show Completed"
              />
            </Box>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="todo">To Do</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="review">In Review</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priority"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {selected.length > 0 
                  ? `${selected.length} task${selected.length > 1 ? 's' : ''} selected` 
                  : `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
      
      {/* Task Table */}
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        }}
      >
        <Table sx={{ minWidth: 650 }} size="medium">
          <TableHead sx={{ bgcolor: theme.palette.background.default }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < filteredTasks.length}
                  checked={filteredTasks.length > 0 && selected.length === filteredTasks.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all tasks' }}
                  size="small"
                />
              </TableCell>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  padding={headCell.disablePadding ? 'none' : 'normal'}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ 
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {headCell.id !== 'actions' ? (
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Loading tasks...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 3 }}>
                  <TaskIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">No tasks found</Typography>
                  <Button
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={handleAddTask}
                    sx={{ mt: 1 }}
                  >
                    Add a new task
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              stableSort(filteredTasks, getComparator(order, orderBy))
                .map((task) => {
                  const isItemSelected = isSelected(task.id);
                  
                  return (
                    <TableRow
                      hover
                      key={task.id}
                      selected={isItemSelected}
                      sx={{ 
                        '&.Mui-selected': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.12),
                          }
                        },
                        '&:hover': {
                          cursor: 'pointer',
                        }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={() => handleSelectRow(task.id)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell 
                        onClick={() => handleSelectRow(task.id)}
                        sx={{ fontWeight: 500, color: 'text.primary' }}
                      >
                        {task.title}
                      </TableCell>
                      <TableCell onClick={() => handleSelectRow(task.id)}>
                        <Chip 
                          label={task.status.replace('_', ' ')} 
                          color={getTaskStatusColor(task.status)}
                          size="small"
                          sx={{ 
                            borderRadius: 1,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={() => handleSelectRow(task.id)}>
                        {getPriorityIndicator(task.priority)}
                      </TableCell>
                      <TableCell onClick={() => handleSelectRow(task.id)}>
                        {getAssigneeDisplay(task)}
                      </TableCell>
                      <TableCell onClick={() => handleSelectRow(task.id)}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit Task">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditTask(task)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Task">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteTask(task.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Modal - existing code */}
      
      {/* Bulk Update Dialog */}
      <Dialog 
        open={bulkUpdateOpen}
        onClose={handleCloseBulkUpdate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk Update Tasks
          <Typography variant="subtitle2" color="text.secondary">
            Update {selected.length} selected task{selected.length !== 1 ? 's' : ''}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="bulk-status-label">Status</InputLabel>
                <Select
                  labelId="bulk-status-label"
                  value={bulkStatus}
                  label="Status"
                  onChange={(e) => setBulkStatus(e.target.value as Task['status'])}
                >
                  <MenuItem value="todo">To Do</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="review">In Review</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="bulk-priority-label">Priority</InputLabel>
                <Select
                  labelId="bulk-priority-label"
                  value={bulkPriority}
                  label="Priority"
                  onChange={(e) => setBulkPriority(e.target.value as Task['priority'])}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="bulk-assignee-label">Assignee</InputLabel>
                <Select
                  labelId="bulk-assignee-label"
                  value={bulkAssignee}
                  label="Assignee"
                  onChange={(e) => setBulkAssignee(e.target.value)}
                >
                  <MenuItem value="">
                    <em>No Change</em>
                  </MenuItem>
                  {mockUsers.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                  {subcontractors.map(sub => (
                    <MenuItem key={sub.id} value={sub.id}>
                      {sub.name} (Subcontractor)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkUpdate}>Cancel</Button>
          <Button 
            onClick={handleBulkUpdate} 
            variant="contained"
            disabled={selected.length === 0}
          >
            Update {selected.length} Task{selected.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTaskManager;