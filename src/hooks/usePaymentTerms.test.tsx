import { act, renderHook, waitFor } from '@testing-library/react';
import { usePaymentTerms } from './usePaymentTerms';
import type { ProjectPhase } from '../types';

let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    mockUuidCounter += 1;
    return `payment-term-${mockUuidCounter}`;
  }),
}));

const phases: ProjectPhase[] = [
  {
    id: 'phase-rough',
    projectId: 'project-1',
    name: 'Rough-In',
    status: 'not_started',
    progress: 0,
    budget: 10000,
    actualCost: 0,
  },
  {
    id: 'phase-finish',
    projectId: 'project-1',
    name: 'Finish',
    status: 'not_started',
    progress: 0,
    budget: 15000,
    actualCost: 0,
  },
];

describe('usePaymentTerms', () => {
  beforeEach(() => {
    mockUuidCounter = 0;
  });

  test('initializes a 20/80 schedule against the selected bid phase', async () => {
    const { result } = renderHook(() => usePaymentTerms(10000, phases, 'phase-rough'));

    await waitFor(() => expect(result.current.paymentTerms.downPaymentAmount).toBe(2000));

    expect(result.current.paymentTerms).toMatchObject({
      downPaymentPercent: 20,
      isDownPaymentFixed: false,
      syncInstallmentPhases: true,
    });
    expect(result.current.paymentTerms.installments[0]).toMatchObject({
      name: 'Final Payment',
      percent: 80,
      fixedAmount: 8000,
      phaseId: 'phase-rough',
      phaseName: 'Rough-In',
    });
    expect(result.current.getTotalScheduledAmount()).toBe(10000);
    expect(result.current.getTotalScheduledPercent(10000)).toBe(100);
  });

  test('updates percent and fixed down payments safely', async () => {
    const { result } = renderHook(() => usePaymentTerms(20000, phases, 'phase-rough'));

    await waitFor(() => expect(result.current.paymentTerms.downPaymentAmount).toBe(4000));

    act(() => {
      result.current.updateDownPayment(35, false);
    });

    expect(result.current.paymentTerms.downPaymentPercent).toBe(35);
    expect(result.current.paymentTerms.downPaymentAmount).toBe(7000);

    act(() => {
      result.current.updateDownPayment(5000, true);
    });

    expect(result.current.paymentTerms.isDownPaymentFixed).toBe(true);
    expect(result.current.paymentTerms.downPaymentAmount).toBe(5000);
    expect(result.current.paymentTerms.downPaymentPercent).toBe(25);
  });

  test('applies common payment templates with phase context', async () => {
    const { result } = renderHook(() => usePaymentTerms(50000, phases, 'phase-finish'));

    await waitFor(() => expect(result.current.paymentTerms.downPaymentAmount).toBe(10000));

    act(() => {
      result.current.applyPaymentTemplate('trades');
    });

    expect(result.current.paymentTerms.downPaymentPercent).toBe(30);
    expect(result.current.paymentTerms.downPaymentAmount).toBe(15000);
    expect(result.current.paymentTerms.installments).toEqual([
      expect.objectContaining({
        name: 'Rough-In',
        percent: 40,
        fixedAmount: 20000,
        phaseId: 'phase-finish',
        phaseName: 'Finish',
      }),
      expect.objectContaining({
        name: 'Final Payment',
        percent: 30,
        fixedAmount: 15000,
        phaseId: 'phase-finish',
        phaseName: 'Finish',
      }),
    ]);

    act(() => {
      result.current.applyPaymentTemplate('one-time');
    });

    expect(result.current.paymentTerms.downPaymentPercent).toBe(100);
    expect(result.current.paymentTerms.installments).toHaveLength(0);
  });

  test('adds, updates, and removes installments without losing manual phase choices', async () => {
    const { result, rerender } = renderHook(
      ({ currentBidPhaseId }) => usePaymentTerms(30000, phases, currentBidPhaseId),
      {
        initialProps: { currentBidPhaseId: 'phase-rough' },
      }
    );

    await waitFor(() => expect(result.current.paymentTerms.installments[0].fixedAmount).toBe(24000));

    act(() => {
      result.current.addInstallment();
    });

    expect(result.current.paymentTerms.installments.map(item => item.name)).toEqual([
      'Installment 1',
      'Final Payment',
    ]);

    const manuallyConfiguredId = result.current.paymentTerms.installments[0].id;
    act(() => {
      result.current.updateInstallment(manuallyConfiguredId, 'phaseId', 'phase-finish');
      result.current.updateInstallment(manuallyConfiguredId, 'percent', 25);
    });

    expect(result.current.paymentTerms.installments[0]).toMatchObject({
      phaseId: 'phase-finish',
      phaseName: 'Finish',
      manuallyConfigured: true,
      percent: 25,
      fixedAmount: 7500,
    });

    rerender({ currentBidPhaseId: 'phase-finish' });

    expect(result.current.paymentTerms.installments[0]).toMatchObject({
      phaseId: 'phase-finish',
      phaseName: 'Finish',
    });
    expect(result.current.paymentTerms.installments[1]).toMatchObject({
      phaseId: 'phase-finish',
      phaseName: 'Finish',
    });

    act(() => {
      result.current.removeInstallment(manuallyConfiguredId);
    });

    expect(result.current.paymentTerms.installments).toHaveLength(1);
    expect(result.current.paymentTerms.installments[0].name).toBe('Final Payment');
  });

  test('recalculates percentages when fixed amounts are updated', async () => {
    const { result } = renderHook(() => usePaymentTerms(40000, phases, 'phase-rough'));

    await waitFor(() => expect(result.current.paymentTerms.downPaymentAmount).toBe(8000));

    const installmentId = result.current.paymentTerms.installments[0].id;
    act(() => {
      result.current.updateInstallment(installmentId, 'isFixedAmount', true);
      result.current.updateInstallment(installmentId, 'fixedAmount', 12000);
    });

    expect(result.current.paymentTerms.installments[0]).toMatchObject({
      isFixedAmount: true,
      fixedAmount: 12000,
      percent: 30,
    });
    expect(result.current.getTotalScheduledAmount()).toBe(20000);
    expect(result.current.getTotalScheduledPercent(40000)).toBe(50);
  });
});
