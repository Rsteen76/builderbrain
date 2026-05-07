import React, { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';
import { expenseService } from '../api';
import { Expense } from '../types';
import {
  useCreateExpense,
  useDeleteExpense,
  useGetExpenses,
  useProjectExpenses,
  useUpdateExpense,
} from './use-expenses';

jest.mock('../api', () => ({
  expenseService: {
    create: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
    getExpenses: jest.fn(),
    getExpensesByProject: jest.fn(),
    update: jest.fn(),
  },
}));

setLogger({
  log: console.log,
  warn: console.warn,
  error: () => undefined,
});

const mockedExpenseService = expenseService as jest.Mocked<typeof expenseService>;

const createExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  userId: 'user-1',
  projectId: 'project-1',
  phaseId: 'phase-1',
  category: 'materials',
  description: 'Framing lumber',
  amount: 250,
  date: new Date('2024-02-01T00:00:00.000Z'),
  vendor: 'Lumber Yard',
  subcontractorId: 'sub-1',
  status: 'pending',
  createdBy: 'user-1',
  createdAt: new Date('2024-01-31T00:00:00.000Z'),
  updatedAt: new Date('2024-01-31T00:00:00.000Z'),
  tags: [],
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: PropsWithChildren<{}>) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
};

describe('use-expenses React Query hooks', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    (console.warn as jest.Mock).mockRestore();
  });

  test('useProjectExpenses fetches project expenses with filters and respects enabled state', async () => {
    const filters = { category: 'materials', status: 'pending' };
    const expenses = [createExpense()];
    mockedExpenseService.getExpensesByProject.mockResolvedValue({
      data: expenses,
      status: 'success',
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useProjectExpenses('project-1', filters, true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedExpenseService.getExpensesByProject).toHaveBeenCalledWith('project-1', filters);
    expect(result.current.data).toEqual(expenses);
  });

  test('useProjectExpenses does not fetch without a project id or when disabled', () => {
    const { wrapper } = createWrapper();

    renderHook(() => useProjectExpenses('', undefined, true), { wrapper });
    renderHook(() => useProjectExpenses('project-1', undefined, false), { wrapper });

    expect(mockedExpenseService.getExpensesByProject).not.toHaveBeenCalled();
  });

  test('useGetExpenses fetches user expenses with filters and throws service errors', async () => {
    const filters = { projectId: 'project-1', status: ['pending', 'approved'] as Expense['status'][] };
    const expenses = [createExpense()];
    mockedExpenseService.getExpenses.mockResolvedValueOnce({
      data: expenses,
      status: 'success',
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetExpenses('user-1', filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedExpenseService.getExpenses).toHaveBeenCalledWith('user-1', filters);
    expect(result.current.data).toEqual(expenses);

    mockedExpenseService.getExpenses.mockResolvedValueOnce({
      error: 'Permission denied',
      status: 'error',
    });
    const { wrapper: errorWrapper } = createWrapper();
    const errorResult = renderHook(() => useGetExpenses('user-1'), { wrapper: errorWrapper });

    await waitFor(() => expect(errorResult.result.current.isError).toBe(true));
    expect(errorResult.result.current.error).toEqual(new Error('Permission denied'));
  });

  test('useCreateExpense normalizes undefined paymentDetails and invalidates related caches', async () => {
    const createdExpense = createExpense();
    mockedExpenseService.create.mockResolvedValue({
      data: createdExpense,
      status: 'success',
    });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');
    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    const input = {
      userId: 'user-1',
      projectId: 'project-1',
      phaseId: 'phase-1',
      category: 'materials' as const,
      description: 'Framing lumber',
      amount: 250,
      date: new Date('2024-02-01T00:00:00.000Z'),
      vendor: 'Lumber Yard',
      subcontractorId: 'sub-1',
      status: 'pending' as const,
      createdBy: 'user-1',
      paymentDetails: undefined,
    };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(mockedExpenseService.create).toHaveBeenCalledWith(expect.objectContaining({
      paymentDetails: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    }));
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'project', 'project-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'phase', 'phase-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'vendor', 'Lumber Yard']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'subcontractor', 'sub-1']);
    expect(setQueryDataSpy).toHaveBeenCalledWith(['expenses', 'expense-1'], createdExpense);
  });

  test('useUpdateExpense normalizes undefined paymentDetails and refreshes updated expense caches', async () => {
    const updatedExpense = createExpense({
      amount: 275,
      status: 'approved',
    });
    mockedExpenseService.update.mockResolvedValue({
      data: updatedExpense,
      status: 'success',
    });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');
    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'expense-1',
        expense: {
          amount: 275,
          paymentDetails: undefined,
        },
      });
    });

    expect(mockedExpenseService.update).toHaveBeenCalledWith('expense-1', {
      amount: 275,
      paymentDetails: null,
    });
    expect(setQueryDataSpy).toHaveBeenCalledWith(['expenses', 'expense-1'], updatedExpense);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'project', 'project-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'phase', 'phase-1']);
  });

  test('useDeleteExpense fetches the expense first, deletes it, and removes related caches', async () => {
    const deletedExpense = createExpense();
    mockedExpenseService.getById.mockResolvedValue({
      data: deletedExpense,
      status: 'success',
    });
    mockedExpenseService.delete.mockResolvedValue({
      data: true,
      status: 'success',
    });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');
    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('expense-1');
    });

    expect(mockedExpenseService.getById).toHaveBeenCalledWith('expense-1');
    expect(mockedExpenseService.delete).toHaveBeenCalledWith('expense-1');
    expect(removeQueriesSpy).toHaveBeenCalledWith(['expenses', 'expense-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'project', 'project-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'phase', 'phase-1']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'vendor', 'Lumber Yard']);
    expect(invalidateSpy).toHaveBeenCalledWith(['expenses', 'subcontractor', 'sub-1']);
  });
});
