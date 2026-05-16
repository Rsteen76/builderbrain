import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VendorSelector from './VendorSelector';
import { useAuth } from '../../contexts/AuthContext';
import { ExpenseService } from '../../services/expense';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/expense', () => ({
  ExpenseService: {
    getExpenses: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    log: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedExpenseService = ExpenseService as jest.Mocked<typeof ExpenseService>;

describe('VendorSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockedUseAuth.mockReturnValue({ user: { uid: 'user-1' } } as ReturnType<typeof useAuth>);
  });

  test('loads unique vendors from expenses and stored vendors', async () => {
    const onChange = jest.fn();
    window.localStorage.setItem('vendors_user-1', JSON.stringify(['Stored Supply']));
    mockedExpenseService.getExpenses.mockResolvedValue([
      { id: 'expense-1', vendor: 'Apex Concrete' },
      { id: 'expense-2', vendor: 'Apex Concrete' },
      { id: 'expense-3', vendor: 'Frame Right' },
      { id: 'expense-4', vendor: '   ' },
    ] as any);

    render(<VendorSelector value="" onChange={onChange} />);

    await waitFor(() => expect(mockedExpenseService.getExpenses).toHaveBeenCalledWith('user-1'));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /vendor/i }));
    expect(await screen.findByRole('option', { name: 'Apex Concrete' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Frame Right' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Stored Supply' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Frame Right' }));
    expect(onChange).toHaveBeenCalledWith('Frame Right');
  });

  test('falls back to default vendors when expense lookup fails', async () => {
    mockedExpenseService.getExpenses.mockRejectedValue(new Error('offline'));

    render(<VendorSelector value="" onChange={jest.fn()} />);

    await waitFor(() => expect(mockedExpenseService.getExpenses).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /vendor/i }));
    expect(await screen.findByRole('option', { name: 'Home Depot' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: "Lowe's" })).toBeInTheDocument();
  });

  test('does not fetch vendors without a user', async () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    render(<VendorSelector value="" onChange={jest.fn()} helperText="Pick a vendor" />);

    await waitFor(() => expect(mockedExpenseService.getExpenses).not.toHaveBeenCalled());
    expect(screen.getByText('Pick a vendor')).toBeInTheDocument();
  });
});
