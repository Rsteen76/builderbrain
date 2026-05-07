// src/hooks/useExpenseLineItems.ts
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Assuming LineItem from types is the main data structure for an expense line item
// For this hook, we'll use a slightly different structure for form handling if needed,
// or we can align it closely with the main LineItem type.
// Let's try to align it closely but ensure all fields are present for the form.

// Local form-specific type for line items within this hook/form
export interface ExpenseLineItemFormData {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalPrice: number; // Calculated: quantity * unitCost
  // category?: string; // Optional: if line items can have individual categories
}

export interface UseExpenseLineItemsReturn {
  lineItems: ExpenseLineItemFormData[];
  setLineItems: React.Dispatch<React.SetStateAction<ExpenseLineItemFormData[]>>;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  handleLineItemChange: (id: string, field: keyof Omit<ExpenseLineItemFormData, 'id' | 'totalPrice'>, value: string | number) => void;
  calculateTotalFromLineItems: () => number; // Kept for direct calculation if needed
  totalLineItemsAmount: number; // State for the calculated total
}

const DEFAULT_INITIAL_LINE_ITEMS: ExpenseLineItemFormData[] = [];

export const useExpenseLineItems = (initialLineItems: ExpenseLineItemFormData[] = DEFAULT_INITIAL_LINE_ITEMS): UseExpenseLineItemsReturn => {
  const [lineItems, setLineItems] = useState<ExpenseLineItemFormData[]>(initialLineItems);

  const calculateTotalFromLineItems = useCallback(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitCost)), 0);
  }, [lineItems]);

  const [totalLineItemsAmount, setTotalLineItemsAmount] = useState<number>(0);

  useEffect(() => {
    setTotalLineItemsAmount(calculateTotalFromLineItems());
  }, [lineItems, calculateTotalFromLineItems]);

  const addLineItem = () => {
    const newItem: ExpenseLineItemFormData = {
      id: uuidv4(),
      description: '',
      quantity: 1,
      unitCost: 0,
      totalPrice: 0, // Initial total price is 0
    };
    setLineItems(prevItems => [...prevItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleLineItemChange = (
    id: string,
    field: keyof Omit<ExpenseLineItemFormData, 'id' | 'totalPrice'>, // Exclude id and totalPrice from direct change
    value: string | number
  ) => {
    setLineItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = {
            ...item,
            // Ensure value is correctly typed for quantity and unitCost
            [field]: (field === 'quantity' || field === 'unitCost') ? Number(value) : value
          };
          // Recalculate total price for the changed item
          if (field === 'quantity' || field === 'unitCost') {
            updatedItem.totalPrice = Number(updatedItem.quantity) * Number(updatedItem.unitCost);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Effect to update lineItems if initialLineItems prop changes (e.g. when editing an expense)
  // This is crucial for re-initializing the hook's state when the modal opens with new expense data.
  useEffect(() => {
    // Only update if initialLineItems actually changes instance or content significantly.
    // A simple length check or deep comparison might be needed if initialLineItems is complex/large.
    // For now, this will re-initialize if the array reference changes.
    setLineItems(initialLineItems);
  }, [initialLineItems]);


  return {
    lineItems,
    setLineItems, // Expose setLineItems to allow initializing from modal's useEffect
    addLineItem,
    removeLineItem,
    handleLineItemChange,
    calculateTotalFromLineItems,
    totalLineItemsAmount,
  };
};
