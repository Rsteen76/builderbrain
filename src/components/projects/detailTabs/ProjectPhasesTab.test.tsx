import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectPhasesTab from './ProjectPhasesTab';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { usePhaseMenuState } from '../../../hooks/usePhaseMenuState';
import { usePhaseDetailsDialog } from '../../../hooks/usePhaseDetailsDialog';
import { useNotification } from '../../../hooks/useNotification';

jest.mock('../../../contexts/ProjectDetailContext', () => ({
  useProjectDetail: jest.fn(),
}));

jest.mock('../../../hooks/usePhaseMenuState', () => ({
  usePhaseMenuState: jest.fn(),
}));

jest.mock('../../../hooks/usePhaseDetailsDialog', () => ({
  usePhaseDetailsDialog: jest.fn(),
}));

jest.mock('../../../hooks/useNotification', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'phase-new'),
}));

jest.mock('../charts/PhaseTimelineChart', () => ({
  __esModule: true,
  default: ({ phases }: { phases: Array<{ name: string }> }) => (
    <div data-testid="phase-timeline">{phases.map(phase => phase.name).join(', ')}</div>
  ),
}));

jest.mock('./PhaseCard', () => ({
  __esModule: true,
  default: ({ phase, onOpenQuickBidDialog, onOpenQuickExpenseDialog, onViewPhaseDetails }: any) => (
    <div>
      <div>{phase.name}</div>
      <button onClick={() => onOpenQuickBidDialog(phase.id)}>Quick Bid {phase.name}</button>
      <button onClick={() => onOpenQuickExpenseDialog(phase.id)}>Quick Expense {phase.name}</button>
      <button onClick={() => onViewPhaseDetails(phase.id)}>Details {phase.name}</button>
    </div>
  ),
}));

jest.mock('../dialogs/PhaseDetailsDialog', () => ({
  __esModule: true,
  default: ({ selectedPhaseId, onClose }: { selectedPhaseId: string | null; onClose: () => void }) => (
    <div role="dialog">
      Phase Details {selectedPhaseId}
      <button onClick={onClose}>Close Details</button>
    </div>
  ),
}));

jest.mock('../TemplateAdjuster', () => ({
  __esModule: true,
  default: ({ open, onClose, onUpdateProject, project }: any) =>
    open ? (
      <div role="dialog">
        Template Adjuster
        <button onClick={() => onUpdateProject({ ...project, phases: [] })}>Apply Template</button>
        <button onClick={onClose}>Close Template</button>
      </div>
    ) : null,
}));

const mockedUseProjectDetail = useProjectDetail as jest.MockedFunction<typeof useProjectDetail>;
const mockedUsePhaseMenuState = usePhaseMenuState as jest.MockedFunction<typeof usePhaseMenuState>;
const mockedUsePhaseDetailsDialog = usePhaseDetailsDialog as jest.MockedFunction<typeof usePhaseDetailsDialog>;
const mockedUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

const addPhase = jest.fn();
const deletePhase = jest.fn();
const openNewBidDialog = jest.fn();
const openNewExpenseDialog = jest.fn();
const openPhaseDetailsDialog = jest.fn();
const closePhaseDetailsDialog = jest.fn();
const updatePhaseStatus = jest.fn();
const refreshAllProjectData = jest.fn();
const setPhases = jest.fn();
const showNotification = jest.fn();
const handleActionMenuClose = jest.fn();
const handleStatusMenuClose = jest.fn();

const phases = [
  {
    id: 'phase-1',
    projectId: 'project-1',
    name: 'Foundation',
    status: 'in_progress',
    progress: 50,
    order: 0,
    budget: 20000,
    actualCost: 5000,
    startDate: new Date('2026-01-01T00:00:00'),
    endDate: new Date('2026-02-01T00:00:00'),
  },
  {
    id: 'phase-2',
    projectId: 'project-1',
    name: 'Framing',
    status: 'not_started',
    progress: 0,
    order: 1,
    budget: 30000,
    actualCost: 0,
    startDate: new Date('2026-02-02T00:00:00'),
    endDate: new Date('2026-03-01T00:00:00'),
  },
];

const makeProjectDetail = (overrides = {}) => ({
  projectId: 'project-1',
  project: {
    id: 'project-1',
    name: 'Hillside Build',
    startDate: new Date('2026-01-01T00:00:00'),
    phases,
  },
  phases,
  bids: [
    {
      id: 'bid-1',
      phaseId: 'phase-1',
      status: 'accepted',
      totalAmount: 18000,
    },
  ],
  expenses: [
    {
      id: 'expense-1',
      phaseId: 'phase-1',
      status: 'paid',
      amount: 5000,
    },
  ],
  subcontractors: [],
  loading: false,
  error: null,
  openNewBidDialog,
  openNewExpenseDialog,
  refreshAllProjectData,
  setPhases,
  isUpdatingPhase: false,
  updatePhaseStatus,
  addPhase,
  deletePhase,
  setBids: jest.fn(),
  setExpenses: jest.fn(),
  setSubcontractors: jest.fn(),
  showNotification: jest.fn(),
  NotificationComponent: () => null,
  isBidModalOpen: false,
  editingBidId: null,
  bidInitialData: null,
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
  openEditExpenseDialog: jest.fn(),
  closeExpenseDialog: jest.fn(),
  isExpenseOperating: false,
  addExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  ...overrides,
});

const makePhaseMenu = (overrides = {}) => ({
  actionAnchorEl: null,
  statusAnchorEl: null,
  actionMenuPhaseId: null,
  statusMenuPhaseId: null,
  isActionMenuOpen: false,
  isStatusMenuOpen: false,
  handleActionMenuOpen: jest.fn(),
  handleStatusMenuOpen: jest.fn(),
  handleActionMenuClose,
  handleStatusMenuClose,
  ...overrides,
});

const makePhaseDialog = (overrides = {}) => ({
  isPhaseDetailsOpen: false,
  selectedPhase: null,
  openPhaseDetailsDialog,
  closePhaseDetailsDialog,
  ...overrides,
});

describe('ProjectPhasesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail() as unknown as ReturnType<typeof useProjectDetail>);
    mockedUsePhaseMenuState.mockReturnValue(makePhaseMenu() as ReturnType<typeof usePhaseMenuState>);
    mockedUsePhaseDetailsDialog.mockReturnValue(makePhaseDialog() as ReturnType<typeof usePhaseDetailsDialog>);
    mockedUseNotification.mockReturnValue({
      showNotification,
      hideNotification: jest.fn(),
      NotificationComponent: () => <></>,
    } as unknown as ReturnType<typeof useNotification>);
  });

  test('renders phase timeline, phase cards, and quick actions', () => {
    render(<ProjectPhasesTab />);

    expect(screen.getByText('Project Phases')).toBeInTheDocument();
    expect(screen.getByTestId('phase-timeline')).toHaveTextContent('Foundation, Framing');
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText('Framing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /quick bid foundation/i }));
    expect(openNewBidDialog).toHaveBeenCalledWith({ phaseId: 'phase-1', projectId: 'project-1' });

    fireEvent.click(screen.getByRole('button', { name: /quick expense foundation/i }));
    expect(openNewExpenseDialog).toHaveBeenCalledWith({ phaseId: 'phase-1', projectId: 'project-1' });

    fireEvent.click(screen.getByRole('button', { name: /details foundation/i }));
    expect(openPhaseDetailsDialog).toHaveBeenCalledWith(expect.objectContaining({ id: 'phase-1' }));
  });

  test('adds phases and opens the template adjuster', async () => {
    jest.spyOn(window, 'prompt').mockReturnValueOnce('Punch List');

    render(<ProjectPhasesTab />);

    fireEvent.click(screen.getByRole('button', { name: /^add phase$/i }));
    await waitFor(() =>
      expect(addPhase).toHaveBeenCalledWith(expect.objectContaining({
        id: 'phase-new',
        projectId: 'project-1',
        name: 'Punch List',
        order: 2,
        status: 'not_started',
      }))
    );

    fireEvent.click(screen.getByRole('button', { name: /adjust template/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Template Adjuster');

    fireEvent.click(screen.getByRole('button', { name: /apply template/i }));
    await waitFor(() => expect(setPhases).toHaveBeenCalledWith([]));
    expect(refreshAllProjectData).toHaveBeenCalled();
  });

  test('handles status and delete menu actions', async () => {
    mockedUsePhaseMenuState.mockReturnValue(makePhaseMenu({
      statusAnchorEl: document.createElement('button'),
      actionAnchorEl: document.createElement('button'),
      statusMenuPhaseId: 'phase-1',
      actionMenuPhaseId: 'phase-2',
      isStatusMenuOpen: true,
      isActionMenuOpen: true,
    }) as unknown as ReturnType<typeof usePhaseMenuState>);
    jest.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(<ProjectPhasesTab />);

    fireEvent.click(screen.getByText('Completed'));
    await waitFor(() => expect(updatePhaseStatus).toHaveBeenCalledWith('phase-1', 'completed'));
    expect(handleStatusMenuClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Delete Phase'));
    await waitFor(() => expect(deletePhase).toHaveBeenCalledWith('phase-2'));
    expect(handleActionMenuClose).toHaveBeenCalled();
  });

  test('renders loading, error, and empty states', () => {
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ loading: true }) as unknown as ReturnType<typeof useProjectDetail>);
    const { rerender } = render(<ProjectPhasesTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ loading: false, error: 'No access' }) as unknown as ReturnType<typeof useProjectDetail>);
    rerender(<ProjectPhasesTab />);
    expect(screen.getByText('Error loading phases: No access')).toBeInTheDocument();

    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ error: null, phases: [] }) as unknown as ReturnType<typeof useProjectDetail>);
    rerender(<ProjectPhasesTab />);
    expect(screen.getByText('No phases defined')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add first phase/i })).toBeInTheDocument();
  });

  test('disables template adjustment before project data loads', () => {
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ project: null }) as unknown as ReturnType<typeof useProjectDetail>);

    render(<ProjectPhasesTab />);

    expect(screen.getByRole('button', { name: /adjust template/i })).toBeDisabled();
  });
});
