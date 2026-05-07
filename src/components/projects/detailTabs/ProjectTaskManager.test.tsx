import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectTaskManager from './ProjectTaskManager';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { useAuth } from '../../../hooks/useAuth';
import { TaskService } from '../../../services/task';
import { ProjectPhase, Task } from '../../../types';

jest.mock('../../../contexts/ProjectDetailContext', () => ({
  useProjectDetail: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/task', () => ({
  TaskService: {
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    getTasks: jest.fn(),
    updateTask: jest.fn(),
  },
}));

const mockedUseProjectDetail = useProjectDetail as jest.MockedFunction<typeof useProjectDetail>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedTaskService = TaskService as jest.Mocked<typeof TaskService>;
const originalConsoleError = console.error;

const theme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});

const phases: ProjectPhase[] = [
  {
    id: 'phase-1',
    projectId: 'project-1',
    name: 'Foundation',
    status: 'in_progress',
    progress: 50,
    budget: 1000,
    actualCost: 250,
    tasks: [],
  },
];

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  userId: 'user-1',
  projectId: 'project-1',
  phaseId: 'phase-1',
  phaseName: 'Foundation',
  title: 'Schedule inspection',
  description: 'Confirm city inspector window.',
  status: 'todo',
  priority: 'high',
  assigneeType: 'user',
  assigneeId: 'Avery PM',
  dueDate: new Date('2026-05-12T00:00:00.000Z'),
  completedAt: null,
  createdBy: 'user-1',
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  dependencies: [],
  attachments: [],
  ...overrides,
});

const refreshAllProjectData = jest.fn();
const showNotification = jest.fn();

const renderTaskManager = () =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectTaskManager />
    </ThemeProvider>
  );

describe('ProjectTaskManager', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      if (String(args[0]).includes('not wrapped in act')) return;
      originalConsoleError(...args);
    });
    mockedUseAuth.mockReturnValue({
      user: { uid: 'user-1' } as any,
      userData: null,
      loading: false,
      error: null,
      isAuthenticated: true,
      role: 'admin',
      signIn: jest.fn(),
      signUp: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      signOut: jest.fn(),
      updateUserProfile: jest.fn(),
    } as ReturnType<typeof useAuth>);
    mockedUseProjectDetail.mockReturnValue({
      projectId: 'project-1',
      project: null,
      phases,
      bids: [],
      expenses: [],
      subcontractors: [],
      loading: false,
      error: null,
      refreshAllProjectData,
      setPhases: jest.fn(),
      setBids: jest.fn(),
      setExpenses: jest.fn(),
      setSubcontractors: jest.fn(),
      showNotification,
      NotificationComponent: () => null,
      isBidModalOpen: false,
      editingBidId: null,
      bidInitialData: null,
      openNewBidDialog: jest.fn(),
      openEditBidDialog: jest.fn(),
      closeBidDialog: jest.fn(),
      handleBidSubmitSuccess: jest.fn(),
      isBidSubmitting: false,
      bidDialogError: null,
      isBidOperating: false,
      requestDeleteBid: jest.fn(),
      duplicateBid: jest.fn(),
      isExpenseDialogOpen: false,
      editingExpenseId: null,
      initialExpenseData: null,
      openNewExpenseDialog: jest.fn(),
      openEditExpenseDialog: jest.fn(),
      closeExpenseDialog: jest.fn(),
      isUpdatingPhase: false,
      updatePhaseStatus: jest.fn(),
      addPhase: jest.fn(),
      deletePhase: jest.fn(),
      isExpenseOperating: false,
      addExpense: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('loads and renders project tasks', async () => {
    mockedTaskService.getTasks.mockResolvedValue([makeTask()]);

    renderTaskManager();

    expect(mockedTaskService.getTasks).toHaveBeenCalledWith('user-1', {
      projectId: 'project-1',
      sortBy: 'dueDate',
      sortDirection: 'asc',
    });
    expect(await screen.findByText('Schedule inspection')).toBeInTheDocument();
    expect(screen.getByText('Confirm city inspector window.')).toBeInTheDocument();
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText('0 of 1 complete')).toBeInTheDocument();
  });

  test('creates a task from the add task dialog', async () => {
    const user = userEvent.setup();
    const createdTask = makeTask({
      id: 'task-2',
      title: 'Order concrete',
      description: 'Confirm mix design.',
      priority: 'urgent',
      dueDate: new Date('2026-05-20T00:00:00.000Z'),
    });
    mockedTaskService.getTasks.mockResolvedValue([]);
    mockedTaskService.createTask.mockResolvedValue(createdTask);

    renderTaskManager();

    await user.click(await screen.findByRole('button', { name: /add task/i }));
    const dialog = screen.getByRole('dialog', { name: /add task/i });

    await user.type(within(dialog).getByLabelText(/title/i), 'Order concrete');
    await user.type(within(dialog).getByLabelText(/description/i), 'Confirm mix design.');
    await user.click(within(dialog).getByRole('combobox', { name: /priority/i }));
    await user.click(screen.getByRole('option', { name: 'Urgent' }));
    await user.click(within(dialog).getByRole('combobox', { name: /phase/i }));
    await user.click(screen.getByRole('option', { name: 'Foundation' }));
    await user.type(within(dialog).getByLabelText(/assignee/i), 'Jordan Field Lead');
    await user.type(within(dialog).getByLabelText(/due date/i), '2026-05-20');
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockedTaskService.createTask).toHaveBeenCalled());
    expect(mockedTaskService.createTask).toHaveBeenCalledWith('user-1', expect.objectContaining({
      projectId: 'project-1',
      title: 'Order concrete',
      description: 'Confirm mix design.',
      status: 'todo',
      priority: 'urgent',
      phaseId: 'phase-1',
      phaseName: 'Foundation',
      assigneeId: 'Jordan Field Lead',
      createdBy: 'user-1',
      dueDate: expect.any(Date),
    }));
    expect(await screen.findByText('Order concrete')).toBeInTheDocument();
    expect(refreshAllProjectData).toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith('Task created successfully.', 'success');
  });

  test('updates an existing task', async () => {
    const user = userEvent.setup();
    mockedTaskService.getTasks.mockResolvedValue([makeTask()]);
    mockedTaskService.updateTask.mockResolvedValue(undefined);

    renderTaskManager();

    await user.click(await screen.findByRole('button', { name: /edit schedule inspection/i }));
    const dialog = screen.getByRole('dialog', { name: /edit task/i });
    const titleInput = within(dialog).getByLabelText(/title/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Schedule final inspection');
    await user.click(within(dialog).getByRole('combobox', { name: /status/i }));
    await user.click(screen.getByRole('option', { name: 'Completed' }));
    await user.click(within(dialog).getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockedTaskService.updateTask).toHaveBeenCalledWith('task-1', expect.objectContaining({
      title: 'Schedule final inspection',
      status: 'completed',
      completedAt: expect.any(Date),
    })));
    expect(await screen.findByText('Schedule final inspection')).toBeInTheDocument();
    expect(screen.getByText('1 of 1 complete')).toBeInTheDocument();
  });

  test('deletes a task after confirmation', async () => {
    const user = userEvent.setup();
    mockedTaskService.getTasks.mockResolvedValue([makeTask()]);
    mockedTaskService.deleteTask.mockResolvedValue(undefined);

    renderTaskManager();

    await user.click(await screen.findByRole('button', { name: /delete schedule inspection/i }));
    const dialog = screen.getByRole('dialog', { name: /delete task/i });
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(mockedTaskService.deleteTask).toHaveBeenCalledWith('task-1'));
    expect(screen.queryByText('Schedule inspection')).not.toBeInTheDocument();
    expect(showNotification).toHaveBeenCalledWith('Task deleted successfully.', 'success');
  });
});
