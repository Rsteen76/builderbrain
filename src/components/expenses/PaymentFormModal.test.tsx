import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PaymentFormModal from './PaymentFormModal';
import { Expense } from '../../types';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1' },
  }),
}));

jest.mock('../../services/bid', () => ({
  BidService: {
    getBid: jest.fn(),
  },
}));

const expense: Expense = {
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  category: 'materials',
  description: 'Permit fee',
  amount: 100,
  amountPaid: 40,
  amountRemaining: 60,
  date: new Date('2024-01-10T00:00:00.000Z'),
  status: 'partially_paid',
  createdBy: 'user-1',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const choosePaymentMethod = () => {
  fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
  fireEvent.click(within(screen.getByRole('listbox')).getByText('Check'));
};

describe('PaymentFormModal', () => {
  test('blocks payments that exceed the remaining expense balance', async () => {
    const onSave = jest.fn();
    render(<PaymentFormModal open onClose={jest.fn()} expense={expense} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Payment'), { target: { value: '61' } });
    choosePaymentMethod();
    fireEvent.click(screen.getByRole('button', { name: /mark as paid/i }));

    expect(await screen.findByText(/payment cannot exceed the remaining balance/i)).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });

  test('submits valid partial payments', async () => {
    const onSave = jest.fn();
    render(<PaymentFormModal open onClose={jest.fn()} expense={expense} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Payment'), { target: { value: '25' } });
    choosePaymentMethod();
    fireEvent.click(screen.getByRole('button', { name: /mark as paid/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toBe(25);
    expect(onSave.mock.calls[0][1]).toMatchObject({ method: 'check' });
  });
});
