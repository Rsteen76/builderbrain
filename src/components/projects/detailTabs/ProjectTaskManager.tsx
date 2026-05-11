import React, { useEffect, useMemo, useState } from 'react';
import { logger } from '../../../utils/logger';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Task, TaskPriority, TaskStatus } from '../../../types';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { useAuth } from '../../../hooks/useAuth';
import { TaskService } from '../../../services/task';

const TASK_STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

const TASK_PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusLabels = Object.fromEntries(TASK_STATUSES.map((status) => [status.value, status.label]));
const priorityLabels = Object.fromEntries(TASK_PRIORITIES.map((priority) => [priority.value, priority.label]));

const formatDate = (date?: Date | null) => {
  if (!date) return 'No due date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  phaseId: string;
  assigneeId: string;
  dueDate: string;
}

const emptyForm: TaskFormState = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  phaseId: '',
  assigneeId: '',
  dueDate: '',
};

const taskToForm = (task: Task): TaskFormState => ({
  title: task.title,
  description: task.description || '',
  status: task.status,
  priority: task.priority,
  phaseId: task.phaseId || '',
  assigneeId: task.assigneeId || '',
  dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : '',
});

const parseDueDate = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ProjectTaskManager: React.FC = () => {
  const {
    projectId,
    phases,
    loading: contextLoading,
    error: contextError,
    refreshAllProjectData,
    showNotification,
  } = useProjectDetail();
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      if (!user?.uid || !projectId) return;

      setLoading(true);
      setError(null);
      try {
        const projectTasks = await TaskService.getTasks(user.uid, {
          projectId,
          sortBy: 'dueDate',
          sortDirection: 'asc',
        });
        if (isMounted) {
          setTasks(projectTasks);
        }
      } catch (err) {
        logger.error('ProjectTaskManager: Failed to load tasks', err);
        if (isMounted) {
          setError('Failed to load project tasks.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [projectId, user?.uid]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (!normalizedSearch) return true;

      return [
        task.title,
        task.description,
        task.phaseName,
        task.assigneeId,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [priorityFilter, searchTerm, statusFilter, tasks]);

  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const openNewTaskDialog = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setForm(taskToForm(task));
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    if (saving) return;
    setIsFormOpen(false);
    setEditingTask(null);
    setForm(emptyForm);
  };

  const updateForm = <K extends keyof TaskFormState>(field: K, value: TaskFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.uid || !projectId || !form.title.trim()) return;

    const selectedPhase = phases.find((phase) => phase.id === form.phaseId);
    const dueDate = parseDueDate(form.dueDate);
    const completedAt =
      form.status === 'completed'
        ? editingTask?.completedAt || new Date()
        : null;

    setSaving(true);
    setError(null);
    try {
      if (editingTask) {
        const updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'projectId'>> = {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          priority: form.priority,
          phaseId: form.phaseId || undefined,
          phaseName: selectedPhase?.name,
          assigneeId: form.assigneeId.trim() || undefined,
          assigneeType: form.assigneeId.trim() ? 'user' : undefined,
          dueDate,
          completedAt,
        };

        await TaskService.updateTask(editingTask.id, updates);
        setTasks((current) =>
          current.map((task) =>
            task.id === editingTask.id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          )
        );
        showNotification('Task updated successfully.', 'success');
      } else {
        const createdTask = await TaskService.createTask(user.uid, {
          projectId,
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          priority: form.priority,
          phaseId: form.phaseId || undefined,
          phaseName: selectedPhase?.name,
          assigneeId: form.assigneeId.trim() || undefined,
          assigneeType: form.assigneeId.trim() ? 'user' : undefined,
          dueDate,
          completedAt,
          createdBy: user.uid,
          dependencies: [],
          attachments: [],
        });
        setTasks((current) => [...current, createdTask]);
        showNotification('Task created successfully.', 'success');
      }

      await refreshAllProjectData();
      closeFormDialog();
    } catch (err) {
      logger.error('ProjectTaskManager: Failed to save task', err);
      setError('Failed to save task.');
      showNotification('Failed to save task.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    setError(null);
    try {
      await TaskService.deleteTask(deleteTarget.id);
      setTasks((current) => current.filter((task) => task.id !== deleteTarget.id));
      setDeleteTarget(null);
      showNotification('Task deleted successfully.', 'success');
      await refreshAllProjectData();
    } catch (err) {
      logger.error('ProjectTaskManager: Failed to delete task', err);
      setError('Failed to delete task.');
      showNotification('Failed to delete task.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (contextLoading || authLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />;
  }

  if (contextError) {
    return <Alert severity="error" sx={{ mt: 2 }}>Error loading project context: {contextError}</Alert>;
  }

  if (!user) {
    return <Alert severity="error" sx={{ mt: 2 }}>User not authenticated.</Alert>;
  }

  if (!projectId) {
    return <Alert severity="warning" sx={{ mt: 2 }}>Project context not available.</Alert>;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedCount} of {tasks.length} complete
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNewTaskDialog}>
          Add Task
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search tasks"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          size="small"
          fullWidth
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="task-status-filter-label">Status</InputLabel>
          <Select
            labelId="task-status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
          >
            <MenuItem value="all">All statuses</MenuItem>
            {TASK_STATUSES.map((status) => (
              <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="task-priority-filter-label">Priority</InputLabel>
          <Select
            labelId="task-priority-filter-label"
            label="Priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}
          >
            <MenuItem value="all">All priorities</MenuItem>
            {TASK_PRIORITIES.map((priority) => (
              <MenuItem key={priority.value} value={priority.value}>{priority.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="project tasks">
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Phase</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ py: 3 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">Loading tasks...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No tasks found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="text.secondary">
                        {task.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{task.phaseName || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip label={statusLabels[task.status]} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={priorityLabels[task.priority]} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell>{task.assigneeId || 'Unassigned'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit task">
                      <IconButton aria-label={`Edit ${task.title}`} size="small" onClick={() => openEditTaskDialog(task)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete task">
                      <IconButton aria-label={`Delete ${task.title}`} size="small" onClick={() => setDeleteTarget(task)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isFormOpen} onClose={closeFormDialog} fullWidth maxWidth="sm" transitionDuration={0}>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Title"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="task-status-label">Status</InputLabel>
                  <Select
                    labelId="task-status-label"
                    label="Status"
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value as TaskStatus)}
                  >
                    {TASK_STATUSES.map((status) => (
                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="task-priority-label">Priority</InputLabel>
                  <Select
                    labelId="task-priority-label"
                    label="Priority"
                    value={form.priority}
                    onChange={(event) => updateForm('priority', event.target.value as TaskPriority)}
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>{priority.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <FormControl fullWidth>
                <InputLabel id="task-phase-label">Phase</InputLabel>
                <Select
                  labelId="task-phase-label"
                  label="Phase"
                  value={form.phaseId}
                  onChange={(event) => updateForm('phaseId', event.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {phases.map((phase) => (
                    <MenuItem key={phase.id} value={phase.id}>{phase.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Assignee"
                value={form.assigneeId}
                onChange={(event) => updateForm('assigneeId', event.target.value)}
                fullWidth
              />
              <TextField
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateForm('dueDate', event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeFormDialog} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => !saving && setDeleteTarget(null)} fullWidth maxWidth="xs" transitionDuration={0}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Delete {deleteTarget?.title}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTaskManager;
