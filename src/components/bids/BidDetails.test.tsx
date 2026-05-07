import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BidDetails from './BidDetails';
import { BidService } from '../../services/bid';
import { ProjectService } from '../../services/project';
import { SubcontractorService } from '../../services/subcontractor';
import { submitBid } from '../../utils/bidOperations';
import { BidFormData } from '../../types/form.types';

const mockNavigate = jest.fn();
const mockAuthState = { user: { uid: 'user-1' } };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'bid-1' }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../../services/bid', () => ({
  BidService: {
    getBid: jest.fn(),
  },
}));

jest.mock('../../services/project', () => ({
  ProjectService: {
    getProjectById: jest.fn(),
  },
}));

jest.mock('../../services/subcontractor', () => ({
  SubcontractorService: {
    getSubcontractors: jest.fn(),
    createSubcontractor: jest.fn(),
  },
}));

jest.mock('../../utils/bidOperations', () => ({
  submitBid: jest.fn(),
}));

jest.mock('./ReusableBidForm', () => (props: {
  onSubmit: (data: BidFormData) => Promise<void>;
  onAddSubcontractor: () => void;
}) => (
  <div>
    <button
      type="button"
      onClick={() =>
        props.onSubmit({
          title: 'Updated framing bid',
          subcontractorId: 'sub-1',
          subcontractorName: 'Framing Co',
          projectId: 'project-1',
          projectName: 'Hillside Remodel',
          phaseId: 'phase-1',
          phaseName: 'Framing',
          totalAmount: 12500,
          scope: 'Updated framing scope',
          timeline: 20,
          paymentTerms: {
            downPaymentPercent: 20,
            isDownPaymentFixed: false,
            downPaymentAmount: 2500,
            installments: [],
            syncInstallmentPhases: true,
          },
          notes: '',
          status: 'submitted',
          attachments: [],
          tags: [],
        })
      }
    >
      Mock Update Bid
    </button>
    <button type="button" onClick={props.onAddSubcontractor}>
      Mock Add Subcontractor
    </button>
  </div>
));

jest.mock('../projects/BidPaymentSchedule', () => () => <div>Payment schedule</div>);
jest.mock('./BidDeletionWrapper', () => () => <div />);
jest.mock('./LineItemsTable', () => () => <div>Line items</div>);

const bid = {
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Hillside Remodel',
  phaseId: 'phase-1',
  phaseName: 'Framing',
  subcontractorId: 'sub-1',
  subcontractorName: 'Framing Co',
  title: 'Original framing bid',
  scope: 'Frame addition',
  status: 'submitted',
  totalAmount: 10000,
  timeline: 20,
  paymentSchedule: [],
  currentVersionId: 'version-1',
  versions: [
    {
      id: 'version-1',
      versionNumber: 1,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      totalAmount: 10000,
      lineItems: [],
      notes: 'Initial version',
    },
  ],
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
} as const;

describe('BidDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (BidService.getBid as jest.Mock).mockResolvedValue(bid);
    (ProjectService.getProjectById as jest.Mock).mockResolvedValue({
      id: 'project-1',
      name: 'Hillside Remodel',
      phases: [{ id: 'phase-1', name: 'Framing' }],
    });
    (SubcontractorService.getSubcontractors as jest.Mock).mockResolvedValue([
      { id: 'sub-1', name: 'Framing Co', specialty: 'Framing', contact: {} },
    ]);
    (SubcontractorService.createSubcontractor as jest.Mock).mockResolvedValue({
      id: 'sub-2',
      name: 'New Sub',
      specialty: '',
      contact: { phone: '', email: '' },
    });
    (submitBid as jest.Mock).mockResolvedValue({
      ...bid,
      title: 'Updated framing bid',
      totalAmount: 12500,
    });
  });

  test('saves edits through the shared bid submission flow', async () => {
    render(
      <MemoryRouter>
        <BidDetails />
      </MemoryRouter>
    );

    expect(await screen.findByText('Original framing bid')).toBeInTheDocument();
    expect(await screen.findByText('Payment schedule')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /edit/i }));
    fireEvent.click(await screen.findByRole('button', { name: /mock update bid/i }));

    await waitFor(() => {
      expect(submitBid).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          title: 'Updated framing bid',
          projectId: 'project-1',
          projectName: 'Hillside Remodel',
        }),
        'bid-1',
        'project-1',
        'Hillside Remodel'
      );
    });
    expect(await screen.findByText('Updated framing bid')).toBeInTheDocument();
  });

  test('opens quick-add subcontractor from the edit form and appends the created subcontractor', async () => {
    render(
      <MemoryRouter>
        <BidDetails />
      </MemoryRouter>
    );

    expect(await screen.findByText('Original framing bid')).toBeInTheDocument();
    expect(await screen.findByText('Payment schedule')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: /edit/i }));
    fireEvent.click(await screen.findByRole('button', { name: /mock add subcontractor/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New Sub' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(SubcontractorService.createSubcontractor).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          name: 'New Sub',
        })
      );
    });
  });
});
