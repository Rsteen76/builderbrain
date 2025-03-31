import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, List, ListItem, ListItemText, 
  CircularProgress, Alert, IconButton, Chip, Stack, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel
} from '@mui/material';
import { 
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
    Person as PersonIcon,
    Engineering as SubcontractorIcon
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { TaskService, Task, TaskStatus, TaskPriority } from '../../services/task';
import { Subcontractor, SubcontractorService } from '../../services/subcontractor';
import { Project } from '../../services/project';
import TaskFormModal from '../tasks/TaskFormModal'; 

interface MockUser { id: string; name: string; }
const mockUsers: MockUser[] = [
    {id: 'user1', name: 'Alice (PM)'},
    {id: 'user2', name: 'Bob (Site Super)'},
    {id: 'user3', name: 'Charlie (Admin)'}
];

// Helper to get status chip color
const getTaskStatusColor = (status: TaskStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'To Do': return 'default';
    case 'In Progress': return 'info';
    case 'Blocked': return 'error';
    case 'Done': return 'success';
    default: return 'default';
  }
};

// Helper to get priority indicator
const getPriorityIndicator = (priority: TaskPriority): React.ReactNode => {
    // Example: Use colored text or icons - adjust as needed
    const colors = {
        Low: 'text.secondary',
        Medium: 'info.main',
        High: 'warning.main',
        Urgent: 'error.main'
    }
    return <Typography variant="caption" sx={{ fontWeight: 'bold', color: colors[priority] }}>{priority}</Typography>
}

interface ProjectTaskManagerProps {
  project: Project;
  onProjectUpdate: (updatedProject: Project) => void;
}

// --- Sorting Types & Config ---

type Order = 'asc' | 'desc';
// Define keys that are sortable
type SortableTaskKeys = 'status' | 'priority' | 'title' | 'assigneeId' | 'dueDate' | 'createdAt'; 

interface HeadCell {
  id: SortableTaskKeys | 'actions' | 'assignee'; // Include non-sortable keys used for display
  label: string;
  numeric: boolean;
  sortable: boolean;
  disablePadding?: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'status', numeric: false, sortable: true, label: 'Status', disablePadding: true },
  { id: 'priority', numeric: false, sortable: true, label: 'Priority', disablePadding: false },
  { id: 'title', numeric: false, sortable: true, label: 'Title', disablePadding: false },
  { id: 'assignee', numeric: false, sortable: false, label: 'Assignee', disablePadding: false }, // Display column, sort by assigneeId
  { id: 'dueDate', numeric: false, sortable: true, label: 'Due Date', disablePadding: false },
  { id: 'actions', numeric: false, sortable: false, label: 'Actions', disablePadding: false },
];

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

const ProjectTaskManager: React.FC<ProjectTaskManagerProps> = ({ project, onProjectUpdate }) => {
  const tasks = useMemo(() => project.tasks || [], [project.tasks]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // Sorting State
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<SortableTaskKeys>('createdAt'); // Default sort

  useEffect(() => {
    let isMounted = true;
    const fetchRelatedData = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const fetchedSubcontractors = await SubcontractorService.getSubcontractors();
            if (isMounted) {
              setSubcontractors(fetchedSubcontractors);
            }
        } catch (err) {
            console.error("Error fetching related data for tasks:", err);
            if (isMounted) {
              setFetchError("Failed to load subcontractor data.");
            }
        } finally {
             if (isMounted) {
                setLoading(false);
             }
        }
    };

    fetchRelatedData();
    return () => { isMounted = false };
  }, []);

  const userNameMap = useMemo(() => {
    return users.reduce((map, user) => {
      map[user.id] = user.name;
      return map;
    }, {} as { [key: string]: string });
  }, [users]);

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
    setOrderBy(property);
  };

  // --- Memoized Sorted Tasks ---
  const sortedTasks = useMemo(() => {
      // Sort by the selected column
      return stableSort(tasks, getComparator<Task, keyof Task>(order, orderBy));
  }, [tasks, order, orderBy]);

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  const handleDeleteTask = async (taskId: string) => {
      if (!window.confirm('Are you sure you want to delete this task?')) return;
      setLoading(true);
      setActionError(null);
      try {
          await TaskService.deleteTask(taskId);
          const updatedTasks = tasks.filter(t => t.id !== taskId);
          onProjectUpdate({ ...project, tasks: updatedTasks });
      } catch(err) {
          console.error("Error deleting task:", err);
          setActionError("Failed to delete task.");
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
    <Paper sx={{ p: 3, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Project Tasks</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddTask} disabled={loading}>
          Add Task
        </Button>
      </Box>

      {fetchError && !loading && <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {showLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader aria-label="project tasks table">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: 'background.paper' }}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        // Pass the correct sortable key to handler
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
                     <TableCell padding="none">
                          <Chip label={task.status} size="small" color={getTaskStatusColor(task.status)} sx={{ m: 0.5 }}/>
                     </TableCell>
                     <TableCell>{getPriorityIndicator(task.priority)}</TableCell>
                     <TableCell>
                         <Typography variant="body2" sx={{ fontWeight: 500 }}>{task.title}</Typography>
                         {task.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{task.description}</Typography>}
                      </TableCell>
                     <TableCell>{getAssigneeDisplay(task)}</TableCell>
                     <TableCell sx={{ whiteSpace: 'nowrap' }}>
                       {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                     </TableCell>
                     <TableCell align="right">
                       <Tooltip title="Edit Task">
                          <IconButton size="small" onClick={() => handleEditTask(task)}>
                             <EditIcon fontSize="inherit" />
                          </IconButton>
                       </Tooltip>
                       <Tooltip title="Delete Task">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id!)}>
                              <DeleteIcon fontSize="inherit" />
                          </IconButton>
                       </Tooltip>
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
      /> 
    </Paper>
  );
};

export default ProjectTaskManager; 