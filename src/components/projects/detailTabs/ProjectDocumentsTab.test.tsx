import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectDocumentsTab from './ProjectDocumentsTab';
import { useProjectDetail } from '../../../contexts/ProjectDetailContext';
import { useProjectDocuments } from '../../../hooks/use-documents';

jest.mock('../../../contexts/ProjectDetailContext', () => ({
  useProjectDetail: jest.fn(),
}));

jest.mock('../../../hooks/use-documents', () => ({
  useProjectDocuments: jest.fn(),
}));

const mockedUseProjectDetail = useProjectDetail as jest.MockedFunction<typeof useProjectDetail>;
const mockedUseProjectDocuments = useProjectDocuments as jest.MockedFunction<typeof useProjectDocuments>;

describe('ProjectDocumentsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseProjectDetail.mockReturnValue({
      projectId: 'project-1',
      project: {
        id: 'project-1',
        userId: 'user-1',
        name: 'Kitchen remodel',
        description: '',
        status: 'active',
        startDate: new Date('2024-01-01'),
        budget: 100000,
        location: '123 Main St',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        phases: [],
        progress: 0,
        requirements: {
          documents: ['HOA approval'],
          permits: ['Building'],
          inspections: ['Final'],
        },
      },
      phases: [],
      bids: [],
      expenses: [],
      subcontractors: [],
      loading: false,
      error: null,
    } as any);
  });

  it('renders checklist progress, document categories, and uploaded files', () => {
    mockedUseProjectDocuments.mockReturnValue({
      data: [
        {
          id: 'doc-1',
          userId: 'user-1',
          projectId: 'project-1',
          name: 'Signed contract',
          type: 'contract',
          url: 'https://example.com/contract.pdf',
          uploadedBy: 'Ryan',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
          size: 2048,
          isArchived: false,
        },
        {
          id: 'doc-2',
          userId: 'user-1',
          projectId: 'project-1',
          name: 'Approved plan set',
          type: 'blueprint',
          url: 'https://example.com/plans.pdf',
          uploadedBy: 'Ryan',
          createdAt: new Date('2024-02-02'),
          updatedAt: new Date('2024-02-02'),
          size: 2 * 1024 * 1024,
          isArchived: false,
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectDocumentsTab />);

    expect(screen.getByText('Builder Checklist')).toBeInTheDocument();
    expect(screen.getByText('2 of 8 items matched to uploaded files')).toBeInTheDocument();
    expect(screen.getByText('25% complete')).toBeInTheDocument();
    expect(screen.getByText('HOA approval')).toBeInTheDocument();
    expect(screen.getAllByText('No matching upload yet').length).toBeGreaterThan(0);
    expect(screen.getByText('Contracts')).toBeInTheDocument();
    expect(screen.getByText('Plans')).toBeInTheDocument();
    expect(screen.getAllByText('Signed contract').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approved plan set').length).toBeGreaterThan(0);
  });

  it('shows project requirement checklist even when documents fail to load', () => {
    mockedUseProjectDocuments.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Missing Firebase index'),
    } as any);

    render(<ProjectDocumentsTab />);

    expect(screen.getByText(/Documents could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByText('HOA approval')).toBeInTheDocument();
    expect(screen.getByText('Building permit')).toBeInTheDocument();
  });
});
