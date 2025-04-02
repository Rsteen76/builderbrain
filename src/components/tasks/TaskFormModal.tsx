import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, FormControl, InputLabel, Select, Alert, CircularProgress,
  RadioGroup, FormControlLabel, Radio, FormLabel, Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TaskService } from '../../services/task';
import { SubcontractorService } from '../../services/subcontractor';
import { Task, Subcontractor } from '../../types';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: (task: Task) => void;
  initialData?: Task | null;
  projectId: string;
  userId: string;
}

interface MockUser { id: string; name: string; }

const taskStatuses: Task['status'][] = ['todo', 'in_progress', 'review', 'completed'];
const taskPriorities: Task['priority'][] = ['low', 'medium', 'high', 'urgent'];
const mockUsers: MockUser[] = [
    {id: 'user1', name: 'Alice (PM)'},
    {id: 'user2', name: 'Bob (Site Super)'},
    {id: 'user3', name: 'Charlie (Admin)'}
];

const TaskFormModal: React.FC<TaskFormModalProps> = ({ open, onClose, onSubmitSuccess, initialData, projectId, userId }) => {
  const [task, setTask] = useState<Partial<Task>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [assigneeType, setAssigneeType] = useState<'user' | 'subcontractor' | 'none'>('none');

  useEffect(() => {
    if (open) {
      const type = initialData?.assigneeType || 'none';
      setAssigneeType(type);
      setTask(initialData || {
        projectId: projectId,
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: '',
        dueDate: null,
        assigneeType: undefined,
        completedAt: null,
        dependencies: [],
        attachments: [],
      });
      if (initialData?.assigneeId) {
          setTask(prev => ({...prev, assigneeId: initialData.assigneeId}));
      }
      setErrors({});
      setSubmitError(null);
      setLoading(false);

      const fetchSubs = async () => {
          if (!userId) {
              console.error("TaskFormModal: userId not provided, cannot fetch subcontractors.");
              setSubmitError("User information missing.");
              return;
          }
          try {
              const subs: Subcontractor[] = await SubcontractorService.getSubcontractors(userId);
              setSubcontractors(subs);
          } catch (err) { console.error("Failed to fetch subcontractors for task form", err); }
      };
      
      if (userId) {
          fetchSubs();
      }

    } else {
        setTask({});
        setErrors({});
        setSubmitError(null);
        setAssigneeType('none');
        setSubcontractors([]);
    }
  }, [open, initialData, projectId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name!]: value }));
    validateField(name!, value);
  };

  const handleDateChange = (date: Date | null) => {
    setTask(prev => ({ ...prev, dueDate: date }));
    validateField('dueDate', date);
  };

  const validateField = (name: string, value: any): boolean => {
    let error = '';
    switch (name) {
      case 'title':
        if (!value) error = 'Title is required';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const fieldsToValidate: (keyof Task)[] = ['title', 'status', 'priority', 'projectId'];
    fieldsToValidate.forEach(field => {
        if (task.hasOwnProperty(field)) {
             if (!validateField(field, task[field])) {
                isValid = false;
             }
        } else if (field === 'projectId' && !projectId) {
             isValid = false;
             setSubmitError("Project ID is missing.");
        } else if (field === 'title'){
             if (!validateField(field, task[field])) {
                 isValid = false;
             }
        }
    });
    return isValid;
  };

  const handleAssigneeTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newType = event.target.value as 'user' | 'subcontractor' | 'none';
      setAssigneeType(newType);
      setTask(prev => ({ ...prev, assigneeId: '', assigneeType: newType === 'none' ? undefined : newType })); 
  };

  const handleAssigneeChange = (newValue: MockUser | Subcontractor | null) => {
      setTask(prev => ({ 
          ...prev, 
          assigneeId: newValue?.id || '',
      }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    if (!userId) {
        setSubmitError("Cannot save task: User information is missing.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setSubmitError(null);

    const finalAssigneeType = assigneeType !== 'none' && task.assigneeId ? assigneeType : undefined;
    const finalAssigneeId = assigneeType !== 'none' && task.assigneeId ? task.assigneeId : undefined;

    const taskData = { 
        ...task,
        assigneeType: finalAssigneeType,
        assigneeId: finalAssigneeId
     };
    taskData.status = taskData.status || 'todo';
    taskData.priority = taskData.priority || 'medium';
    taskData.title = taskData.title || '';

    try {
      let savedTask: Task;
      if (initialData?.id) {
        const updatePayload: any = {
            ...(taskData.title !== undefined ? { title: taskData.title } : {}),
            ...(taskData.description !== undefined ? { description: taskData.description } : {}),
            ...(taskData.status !== undefined ? { status: taskData.status } : {}),
            ...(taskData.priority !== undefined ? { priority: taskData.priority } : {}),
            ...(taskData.assigneeId ? { assigneeId: taskData.assigneeId } : { assigneeId: null }),
            ...(taskData.assigneeType ? { assigneeType: taskData.assigneeType } : {}),
            ...(taskData.dueDate !== undefined ? { dueDate: taskData.dueDate } : {}),
            ...(taskData.completedAt !== undefined ? { completedAt: taskData.completedAt } : {}),
            ...(taskData.parentTaskId ? { parentTaskId: taskData.parentTaskId } : {}),
            ...(taskData.dependencies ? { dependencies: taskData.dependencies } : {}),
            ...(taskData.attachments ? { attachments: taskData.attachments } : {}),
        };
        await TaskService.updateTask(initialData.id, updatePayload);
        const updatedTaskData = await TaskService.getTask(userId, initialData.id);
        if (!updatedTaskData) throw new Error("Failed to refetch updated task");
        savedTask = updatedTaskData;

      } else {
        if (!taskData.projectId) {
             throw new Error("Project ID is missing");
        }
         const createPayload: any = {
            projectId: taskData.projectId!,
            title: taskData.title || '',
            description: taskData.description || '',
            status: taskData.status!,
            priority: taskData.priority!,
            ...(taskData.assigneeId ? { assigneeId: taskData.assigneeId } : { assigneeId: null }),
            ...(taskData.assigneeType ? { assigneeType: taskData.assigneeType } : {}),
            dueDate: taskData.dueDate || null,
            completedAt: taskData.completedAt || null,
            createdBy: taskData.createdBy || userId,
            ...(taskData.parentTaskId ? { parentTaskId: taskData.parentTaskId } : {}),
            dependencies: taskData.dependencies || [],
            attachments: taskData.attachments || [],
        };
        savedTask = await TaskService.createTask(userId, createPayload);
      }
      onSubmitSuccess(savedTask);
      onClose();
    } catch (err) {
      console.error("Error saving task:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save task. Please try again.");
      setLoading(false);
    }
  };

  const getAssigneeValue = (): MockUser | Subcontractor | null => {
      if (!task.assigneeId || assigneeType === 'none') return null;
      if (assigneeType === 'user') {
          return users.find(u => u.id === task.assigneeId) || null;
      }
      if (assigneeType === 'subcontractor') {
          return subcontractors.find(s => s.id === task.assigneeId) || null;
      }
      return null;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus
        disableScrollLock
      >
        <DialogTitle>{initialData ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent dividers>
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                name="title"
                value={task.title || ''}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                multiline
                rows={3}
                value={task.description || ''}
                onChange={handleChange}
              />
            </Grid>
             <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    label="Status"
                    value={task.status || 'todo'}
                    onChange={handleChange as any}
                  >
                    {taskStatuses.map(stat => (
                      <MenuItem key={stat} value={stat}>{stat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
             <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    label="Priority"
                    value={task.priority || 'medium'}
                    onChange={handleChange as any}
                  >
                    {taskPriorities.map(prio => (
                      <MenuItem key={prio} value={prio}>{prio}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
             <Grid item xs={12} md={6}> 
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ mb: 1 }}>Assign To</FormLabel>
                <RadioGroup
                  row
                  aria-label="assignee-type"
                  name="assigneeType"
                  value={assigneeType}
                  onChange={handleAssigneeTypeChange}
                >
                  <FormControlLabel value="none" control={<Radio size="small"/>} label="None" />
                  <FormControlLabel value="user" control={<Radio size="small"/>} label="Team Member" />
                  <FormControlLabel value="subcontractor" control={<Radio size="small"/>} label="Subcontractor" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}> 
              {assigneeType === 'user' && (
                 <Autocomplete
                    options={users}
                    getOptionLabel={(option) => option.name}
                    value={getAssigneeValue() as MockUser | null}
                    onChange={(event, newValue) => handleAssigneeChange(newValue)}
                    renderInput={(params) => 
                        <TextField {...params} label="Select Team Member" />
                    }
                    sx={{ minWidth: 200 }}
                 />
              )}
              {assigneeType === 'subcontractor' && (
                 <Autocomplete
                    options={subcontractors}
                    getOptionLabel={(option) => `${option.name} (${option.specialty})`}
                    value={getAssigneeValue() as Subcontractor | null}
                    onChange={(event, newValue) => handleAssigneeChange(newValue)}
                    renderInput={(params) => 
                        <TextField {...params} label="Select Subcontractor" />
                    }
                    sx={{ minWidth: 200 }}
                 />
              )}
            </Grid>
             <Grid item xs={12} sm={6}>
               <DatePicker
                 label="Due Date (Optional)"
                 value={task.dueDate || null}
                 onChange={handleDateChange}
               />
             </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (initialData ? 'Save Changes' : 'Add Task')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskFormModal; 