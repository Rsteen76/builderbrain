import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BidCardHeaderContent from './BidCardHeaderContent';
import { Bid } from '../../../types';

const theme = createTheme();

const bid: Bid = {
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  title: 'Structural framing package',
  status: 'submitted',
  totalAmount: 92000,
  subcontractorName: 'Peak Framing Co.',
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-01T12:00:00.000Z'),
};

const renderHeader = (overrides: Partial<Bid>) =>
  render(
    <ThemeProvider theme={theme}>
      <BidCardHeaderContent
        bid={{ ...bid, ...overrides }}
        expanded={false}
        isDeadlineClose={false}
        paymentProgress={{ percentage: 0, paid: 0, pending: 0, remaining: 92000 }}
        upcomingPayment={null}
        theme={theme}
      />
    </ThemeProvider>
  );

describe('BidCardHeaderContent', () => {
  it("shows the bid's own submission deadline, not today's date", () => {
    renderHeader({ submissionDeadline: new Date('2026-11-26T12:00:00.000Z') });

    expect(screen.getByText(/Nov 26, 2026/)).toBeInTheDocument();
  });

  it('says N/A when the bid has no deadline instead of filling in today', () => {
    renderHeader({ submissionDeadline: undefined });

    expect(screen.getByText(/N\/A/)).toBeInTheDocument();
  });
});
