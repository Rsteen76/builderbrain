import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Payments from './Payments';
import { PaymentService } from '../../services/payment';

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../services/payment', () => ({
  PaymentService: {
    getPaymentsDashboard: jest.fn(),
  },
}));

const renderPayments = () =>
  render(
    <MemoryRouter>
      <Payments />
    </MemoryRouter>
  );

describe('Payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { uid: 'user-1' } });
  });

  test('loads and renders payment dashboard data', async () => {
    (PaymentService.getPaymentsDashboard as jest.Mock).mockResolvedValue({
      summary: {
        totalReceived: 1250,
        pending: 500,
        overdue: 200,
        thisMonth: 750,
      },
      payments: [
        {
          id: 'payment-1',
          expenseId: 'expense-1',
          projectId: 'project-1',
          projectName: 'Project One',
          description: 'Material invoice',
          amount: 750,
          date: new Date('2026-05-03T00:00:00.000Z'),
          status: 'paid',
          paymentMethod: 'Bank Transfer',
          referenceNumber: 'ACH-1',
          vendor: 'Vendor One',
        },
      ],
    });

    renderPayments();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    expect(await screen.findByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getAllByText('$750.00')).toHaveLength(2);
    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Material invoice')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    expect(PaymentService.getPaymentsDashboard).toHaveBeenCalledWith('user-1');
  });

  test('renders an empty state when there are no payments', async () => {
    (PaymentService.getPaymentsDashboard as jest.Mock).mockResolvedValue({
      summary: {
        totalReceived: 0,
        pending: 0,
        overdue: 0,
        thisMonth: 0,
      },
      payments: [],
    });

    renderPayments();

    expect(
      await screen.findByText('No payments have been recorded yet.')
    ).toBeInTheDocument();
  });

  test('renders service errors', async () => {
    (PaymentService.getPaymentsDashboard as jest.Mock).mockRejectedValue(
      new Error('Unable to load payment data')
    );

    renderPayments();

    expect(await screen.findByText('Unable to load payment data')).toBeInTheDocument();
    expect(screen.getByText('No payments have been recorded yet.')).toBeInTheDocument();
  });

  test('navigates to expenses for payment actions', async () => {
    (PaymentService.getPaymentsDashboard as jest.Mock).mockResolvedValue({
      summary: {
        totalReceived: 0,
        pending: 0,
        overdue: 0,
        thisMonth: 0,
      },
      payments: [],
    });

    renderPayments();

    await screen.findByText('No payments have been recorded yet.');
    fireEvent.click(screen.getByRole('button', { name: /record payment/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/expenses');
  });

  test('does not call the service without an authenticated user', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderPayments();

    await waitFor(() =>
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    );
    expect(PaymentService.getPaymentsDashboard).not.toHaveBeenCalled();
    expect(screen.getByText('No payments have been recorded yet.')).toBeInTheDocument();
  });
});
