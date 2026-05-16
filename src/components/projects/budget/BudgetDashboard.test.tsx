import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import BudgetDashboard from './BudgetDashboard';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategoryMappingsForProject } from '../../../services/category.service';

jest.mock('../../../contexts/ProjectDetailContext', () => ({
  useProjectDetail: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/category.service', () => ({
  getCategoryMappingsForProject: jest.fn(),
}));

jest.mock('../../../services/budget', () => ({
  normalizeBudgetProjection: jest.fn((projection) => ({
    id: projection.id,
    category: projection.category || projection.categoryId || 'Other',
    amount: projection.amount || 0,
    notes: projection.notes || '',
  })),
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    log: jest.fn(),
  },
}));

jest.mock('./BudgetAllocationTracker', () => ({
  __esModule: true,
  default: ({ projectId }: { projectId: string }) => <div>Budget Allocation Tracker {projectId}</div>,
}));

jest.mock('./dashboard/DashboardHeader', () => ({
  __esModule: true,
  default: ({ project, expenses, phases, bids, projections }: any) => (
    <div>
      Dashboard Header {project.name} {expenses.length} expenses {phases.length} phases {bids.length} bids {projections.length} projections
    </div>
  ),
}));

jest.mock('./dashboard/BudgetHealthCard', () => ({
  __esModule: true,
  default: ({ health }: any) => <div>Budget Health {health.status}</div>,
}));

jest.mock('./dashboard/BudgetSummaryCards', () => ({
  __esModule: true,
  default: ({ summary }: any) => <div>Budget Summary {summary.totalBudget}</div>,
}));

jest.mock('./dashboard/BudgetDashboardCharts', () => ({
  __esModule: true,
  default: ({ categoryDisplay, expensesByCategory, monthlyTrends }: any) => (
    <div>
      Budget Charts {categoryDisplay} {expensesByCategory.length} categories {monthlyTrends.length} months
    </div>
  ),
}));

const mockedUseProjectDetail = useProjectDetail as jest.MockedFunction<typeof useProjectDetail>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGetCategoryMappingsForProject = getCategoryMappingsForProject as jest.MockedFunction<typeof getCategoryMappingsForProject>;

const makeProjectDetail = (overrides = {}) => ({
  projectId: 'project-1',
  project: {
    id: 'project-1',
    name: 'Hillside Build',
    budget: {
      total: 100000,
      spent: 0,
      remaining: 100000,
    },
    projections: [
      {
        id: 'projection-1',
        category: 'Materials',
        amount: 5000,
        notes: 'Pending lumber package',
      },
    ],
  },
  phases: [
    {
      id: 'phase-1',
      name: 'Foundation',
      budget: 20000,
      actualCost: 5000,
    },
  ],
  expenses: [
    {
      id: 'expense-1',
      category: 'Materials',
      amount: 8000,
      status: 'paid',
      date: new Date('2026-05-01T00:00:00'),
    },
    {
      id: 'expense-2',
      category: 'Labor',
      amount: 2000,
      status: 'pending',
      date: new Date('2026-06-01T00:00:00'),
    },
  ],
  bids: [
    {
      id: 'bid-1',
      status: 'accepted',
      totalAmount: 18000,
    },
  ],
  loading: false,
  error: null,
  ...overrides,
});

describe('BudgetDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({
      user: { uid: 'user-1' },
    } as ReturnType<typeof useAuth>);
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail() as unknown as ReturnType<typeof useProjectDetail>);
    mockedGetCategoryMappingsForProject.mockResolvedValue({
      Materials: 'materials',
      Labor: 'labor',
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('loads category mappings and renders dashboard sections', async () => {
    render(<BudgetDashboard />);

    expect(screen.getByText(/Dashboard Header Hillside Build/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(mockedGetCategoryMappingsForProject).toHaveBeenCalledWith('project-1'));
    expect(mockedGetCategoryMappingsForProject).toHaveBeenCalledWith('project-1');
    expect(screen.getByText(/Budget Health/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget Summary 100000/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget Charts summary/i)).toBeInTheDocument();
    expect(screen.getByText('Budget Allocation Tracker project-1')).toBeInTheDocument();
  });

  test.each([
    ['Critical', 121000],
    ['At Risk', 111000],
    ['Caution', 101000],
    ['Near Limit', 91000],
    ['On Track', 61000],
  ])('renders %s budget health from projected spend', (expectedStatus, projectionAmount) => {
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({
      project: {
        id: 'project-1',
        name: 'Hillside Build',
        budget: {
          total: 100000,
          spent: 0,
          remaining: 100000,
        },
        projections: [
          {
            id: `projection-${expectedStatus}`,
            category: 'Materials',
            amount: projectionAmount,
            notes: '',
          },
        ],
      },
      expenses: [],
    }) as unknown as ReturnType<typeof useProjectDetail>);

    const { unmount } = render(<BudgetDashboard />);

    expect(screen.getByText(`Budget Health ${expectedStatus}`)).toBeInTheDocument();
    unmount();
  });

  test('renders loading, error, and missing project states', () => {
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ loading: true }) as unknown as ReturnType<typeof useProjectDetail>);
    const loadingRender = render(<BudgetDashboard />);
    expect(screen.getByText('Loading budget data...')).toBeInTheDocument();
    loadingRender.unmount();

    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ loading: false, error: 'Budget failed' }) as unknown as ReturnType<typeof useProjectDetail>);
    const errorRender = render(<BudgetDashboard />);
    expect(screen.getByText('Error loading budget data')).toBeInTheDocument();
    expect(screen.getByText('Budget failed')).toBeInTheDocument();
    errorRender.unmount();

    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ project: null, error: null }) as unknown as ReturnType<typeof useProjectDetail>);
    render(<BudgetDashboard />);
    expect(screen.getByText('Project not found')).toBeInTheDocument();
  });

  test('does not request mappings without a user or project id', async () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
    mockedUseProjectDetail.mockReturnValue(makeProjectDetail({ projectId: '' }) as unknown as ReturnType<typeof useProjectDetail>);

    render(<BudgetDashboard />);

    await waitFor(() => expect(screen.getByText(/Dashboard Header Hillside Build/i)).toBeInTheDocument());
    expect(mockedGetCategoryMappingsForProject).not.toHaveBeenCalled();
  });
});
