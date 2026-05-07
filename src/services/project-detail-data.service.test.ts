jest.mock('./project', () => ({
  ProjectService: {
    getProject: jest.fn(),
  },
}));

jest.mock('./bid', () => ({
  BidService: {
    getBids: jest.fn(),
  },
}));

jest.mock('./expense', () => ({
  ExpenseService: {
    getProjectExpenses: jest.fn(),
  },
}));

jest.mock('./subcontractor', () => ({
  SubcontractorService: {
    getSubcontractor: jest.fn(),
    getSubcontractors: jest.fn(),
  },
}));

import { Bid, Expense, Project, Subcontractor } from '../types';
import { BidService } from './bid';
import { ExpenseService } from './expense';
import { ProjectDetailDataService } from './project-detail-data';
import { ProjectService } from './project';
import { SubcontractorService } from './subcontractor';

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  userId: 'user-1',
  name: 'Hillside Remodel',
  description: 'Kitchen and bath',
  status: 'active',
  startDate: new Date('2026-05-01T12:00:00.000Z'),
  endDate: new Date('2026-06-01T12:00:00.000Z'),
  budget: { total: 100000, spent: 25000, remaining: 75000 },
  location: '123 Main St',
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-02T12:00:00.000Z'),
  team: [],
  phases: [{
    id: 'phase-1',
    projectId: 'project-1',
    name: 'Demo',
    description: '',
    startDate: new Date('2026-05-01T12:00:00.000Z'),
    endDate: new Date('2026-05-10T12:00:00.000Z'),
    status: 'in_progress',
    order: 0,
    budget: 10000,
    actualCost: 2000,
    progress: 10,
  }],
  progress: 25,
  ...overrides,
});

const bid = (overrides: Partial<Bid> = {}): Bid => ({
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  title: 'Electrical rough-in',
  status: 'submitted',
  totalAmount: 15000,
  subcontractorId: 'sub-1',
  subcontractorName: 'Bright Electric',
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-01T12:00:00.000Z'),
  versions: [],
  ...overrides,
});

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  category: 'subcontractor',
  description: 'Plumbing draw',
  amount: 5000,
  date: new Date('2026-05-03T12:00:00.000Z'),
  status: 'pending',
  subcontractorId: 'sub-2',
  subcontractorName: 'Pipe Pros',
  createdBy: 'user-1',
  createdAt: new Date('2026-05-03T12:00:00.000Z'),
  updatedAt: new Date('2026-05-03T12:00:00.000Z'),
  ...overrides,
});

const subcontractor = (id: string): Subcontractor => ({
  id,
  userId: 'user-1',
  name: id === 'sub-1' ? 'Bright Electric' : 'Pipe Pros',
  specialty: id === 'sub-1' ? 'Electrical' : 'Plumbing',
  contact: {},
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-01T12:00:00.000Z'),
});

describe('ProjectDetailDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ProjectService.getProject as jest.Mock).mockResolvedValue(project());
    (BidService.getBids as jest.Mock).mockResolvedValue([bid()]);
    (ExpenseService.getProjectExpenses as jest.Mock).mockResolvedValue([expense()]);
    (SubcontractorService.getSubcontractor as jest.Mock).mockImplementation((_userId, id) =>
      Promise.resolve(subcontractor(id))
    );
  });

  test('loads project detail through one query boundary and derives phases from the project document', async () => {
    const detail = await ProjectDetailDataService.getProjectDetailData('user-1', 'project-1');

    expect(ProjectService.getProject).toHaveBeenCalledTimes(1);
    expect(ProjectService.getProject).toHaveBeenCalledWith('project-1', 'user-1');
    expect(BidService.getBids).toHaveBeenCalledWith(
      'user-1',
      { projectId: 'project-1' },
      undefined,
      Number.MAX_SAFE_INTEGER
    );
    expect(ExpenseService.getProjectExpenses).toHaveBeenCalledWith('user-1', 'project-1');
    expect(detail.project?.id).toBe('project-1');
    expect(detail.phases).toHaveLength(1);
    expect(detail.bids).toHaveLength(1);
    expect(detail.expenses).toHaveLength(1);
  });

  test('fetches only subcontractors referenced by project bids and expenses', async () => {
    await ProjectDetailDataService.getProjectDetailData('user-1', 'project-1');

    expect(SubcontractorService.getSubcontractor).toHaveBeenCalledTimes(2);
    expect(SubcontractorService.getSubcontractor).toHaveBeenCalledWith('user-1', 'sub-1');
    expect(SubcontractorService.getSubcontractor).toHaveBeenCalledWith('user-1', 'sub-2');
    expect(SubcontractorService.getSubcontractors).not.toHaveBeenCalled();
  });

  test('returns empty detail data when the project is not found', async () => {
    (ProjectService.getProject as jest.Mock).mockResolvedValue(null);

    const detail = await ProjectDetailDataService.getProjectDetailData('user-1', 'missing-project');

    expect(detail).toEqual({
      project: null,
      phases: [],
      bids: [],
      expenses: [],
      subcontractors: [],
    });
    expect(BidService.getBids).not.toHaveBeenCalled();
    expect(ExpenseService.getProjectExpenses).not.toHaveBeenCalled();
    expect(SubcontractorService.getSubcontractor).not.toHaveBeenCalled();
  });

  test('normalizes invalid phase dates without a second project fetch', async () => {
    (ProjectService.getProject as jest.Mock).mockResolvedValue(project({
      phases: [{
        ...project().phases[0],
        startDate: null as unknown as Date,
        endDate: null as unknown as Date,
      }],
    }));

    const detail = await ProjectDetailDataService.getProjectDetailData('user-1', 'project-1');

    expect(ProjectService.getProject).toHaveBeenCalledTimes(1);
    expect(detail.phases[0].startDate).toBeInstanceOf(Date);
    expect(detail.phases[0].endDate).toBeInstanceOf(Date);
  });
});
