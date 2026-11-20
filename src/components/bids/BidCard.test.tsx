import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BidCard from './BidCard';
import { Bid } from '../../types';

const bid: Bid = {
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  title: 'Structural framing package',
  status: 'submitted',
  totalAmount: 92000,
  subcontractorName: 'Peak Framing Co.',
  submissionDeadline: new Date('2026-11-26T12:00:00.000Z'),
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-01T12:00:00.000Z'),
};

const renderCard = (overrides: Partial<Bid> = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <BidCard
        bid={{ ...bid, ...overrides }}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDeleteRequest={jest.fn()}
        onDuplicate={jest.fn()}
      />
    </ThemeProvider>
  );

describe('BidCard dates', () => {
  it('shows the same deadline in the header and in the expanded Submission Deadline row', () => {
    renderCard();

    expect(screen.getByText(/Submission deadline: Nov 26, 2026/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('show more'));

    const row = screen.getByText('Submission Deadline').closest('tr') as HTMLElement;
    expect(within(row).getByText('Nov 26, 2026')).toBeInTheDocument();
  });

  it('says N/A in both places when the bid has no deadline, never today', () => {
    renderCard({ submissionDeadline: undefined });

    expect(screen.getByText(/Submission deadline: N\/A/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('show more'));

    const row = screen.getByText('Submission Deadline').closest('tr') as HTMLElement;
    expect(within(row).getByText('N/A')).toBeInTheDocument();
  });
});
