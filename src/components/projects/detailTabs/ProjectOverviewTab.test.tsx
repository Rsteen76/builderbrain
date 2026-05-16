import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectOverviewTab from './ProjectOverviewTab';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';

jest.mock('../../../contexts/ProjectDetailContext', () => ({
  useProjectDetail: jest.fn(),
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
}));

const mockedUseProjectDetail = useProjectDetail as jest.MockedFunction<typeof useProjectDetail>;

const addPhase = jest.fn();
const openNewExpenseDialog = jest.fn();
const refreshAllProjectData = jest.fn();

const makeContext = (overrides = {}) => ({
  projectId: 'project-1',
  project: {
    id: 'project-1',
    name: 'Hillside Build',
    description: 'Custom hillside residence',
    status: 'in_progress',
    startDate: new Date('2026-01-01T00:00:00'),
    endDate: new Date('2026-12-01T00:00:00'),
    location: {
      address: '100 Hill St',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202',
    },
    clientId: 'Owner One',
    budget: {
      total: 100000,
      spent: 0,
      remaining: 100000,
    },
  },
  phases: [
    {
      id: 'phase-1',
      projectId: 'project-1',
      name: 'Foundation',
      startDate: new Date('2026-01-10T00:00:00'),
      endDate: new Date('2026-02-01T00:00:00'),
      status: 'in_progress',
      progress: 25,
      budget: 20000,
      actualCost: 5000,
    },
    {
      id: 'phase-2',
      projectId: 'project-1',
      name: 'Framing',
      startDate: new Date('2026-02-02T00:00:00'),
      endDate: new Date('2026-03-15T00:00:00'),
      status: 'not_started',
      progress: 0,
      budget: 30000,
      actualCost: 0,
    },
  ],
  bids: [
    {
      id: 'bid-1',
      status: 'accepted',
      totalAmount: 18000,
    },
    {
      id: 'bid-2',
      status: 'submitted',
      totalAmount: 12000,
    },
  ],
  expenses: [
    {
      id: 'expense-1',
      category: 'Materials',
      amount: 7000,
      status: 'paid',
    },
    {
      id: 'expense-2',
      category: 'Labor',
      amount: 2500,
      status: 'approved',
    },
    {
      id: 'expense-3',
      category: 'Permits',
      amount: 500,
      status: 'pending',
    },
  ],
  subcontractors: [],
  loading: false,
  error: null,
  openNewExpenseDialog,
  refreshAllProjectData,
  addPhase,
  setPhases: jest.fn(),
  setBids: jest.fn(),
  setExpenses: jest.fn(),
  setSubcontractors: jest.fn(),
  showNotification: jest.fn(),
  NotificationComponent: () => null,
  openNewBidDialog: jest.fn(),
  openEditBidDialog: jest.fn(),
  closeBidDialog: jest.fn(),
  handleBidSubmitSuccess: jest.fn(),
  requestDeleteBid: jest.fn(),
  duplicateBid: jest.fn(),
  openEditExpenseDialog: jest.fn(),
  closeExpenseDialog: jest.fn(),
  updatePhaseStatus: jest.fn(),
  deletePhase: jest.fn(),
  isUpdatingPhase: false,
  isBidModalOpen: false,
  editingBidId: null,
  bidInitialData: null,
  isBidSubmitting: false,
  bidDialogError: null,
  isBidOperating: false,
  isExpenseDialogOpen: false,
  editingExpenseId: null,
  initialExpenseData: null,
  isExpenseOperating: false,
  addExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  ...overrides,
});

describe('ProjectOverviewTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseProjectDetail.mockReturnValue(makeContext() as unknown as ReturnType<typeof useProjectDetail>);
  });

  test('renders project, budget, phase, expense, and milestone summaries', () => {
    render(<ProjectOverviewTab />);

    expect(screen.getByText('Project Details')).toBeInTheDocument();
    expect(screen.getByText('Hillside Build')).toBeInTheDocument();
    expect(screen.getByText(/100 Hill St, Denver CO 80202/)).toBeInTheDocument();
    expect(screen.getByText('Owner One')).toBeInTheDocument();
    expect(screen.getByText('Custom hillside residence')).toBeInTheDocument();
    expect(screen.getByText('Financial Overview')).toBeInTheDocument();
    expect(screen.getAllByText('$100,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText('$18,000.00')).toBeInTheDocument();
    expect(screen.getByText('Project Phases')).toBeInTheDocument();
    expect(screen.getAllByText('Foundation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Framing').length).toBeGreaterThan(0);
    expect(screen.getByText('Upcoming Milestones')).toBeInTheDocument();
  });

  test('calls overview actions for refresh, expense, and phase creation', () => {
    render(<ProjectOverviewTab />);

    fireEvent.click(screen.getByLabelText(/Refresh financial data/i));
    expect(refreshAllProjectData).toHaveBeenCalled();

    mockedUseProjectDetail.mockReturnValue(makeContext({ expenses: [] }) as unknown as ReturnType<typeof useProjectDetail>);
    render(<ProjectOverviewTab />);
    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
    expect(openNewExpenseDialog).toHaveBeenCalled();

    jest.spyOn(window, 'prompt').mockReturnValueOnce('Punch List');
    fireEvent.click(screen.getAllByRole('button', { name: /add phase/i })[0]);
    expect(addPhase).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 'project-1',
      name: 'Punch List',
      status: 'not_started',
    }));
  });

  test('renders loading, error, and missing project states', () => {
    mockedUseProjectDetail.mockReturnValue(makeContext({ loading: true }) as unknown as ReturnType<typeof useProjectDetail>);
    const { rerender } = render(<ProjectOverviewTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    mockedUseProjectDetail.mockReturnValue(makeContext({ loading: false, error: 'Network down' }) as unknown as ReturnType<typeof useProjectDetail>);
    rerender(<ProjectOverviewTab />);
    expect(screen.getByText('Error loading project overview: Network down')).toBeInTheDocument();

    mockedUseProjectDetail.mockReturnValue(makeContext({ project: null }) as unknown as ReturnType<typeof useProjectDetail>);
    rerender(<ProjectOverviewTab />);
    expect(screen.getByText('Project data not available.')).toBeInTheDocument();
  });
});
