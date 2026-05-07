import { renderHook } from '@testing-library/react';
import { useExpenseLineItems } from './useExpenseLineItems';

describe('useExpenseLineItems', () => {
  test('does not reset default line items on every rerender', () => {
    const { result, rerender } = renderHook(() => useExpenseLineItems());
    const initialLineItems = result.current.lineItems;

    rerender();

    expect(result.current.lineItems).toBe(initialLineItems);
  });
});
