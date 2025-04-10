/**
 * Types related to budget management
 */

// Define interface for BudgetItem
export interface BudgetItem {
  id: string;
  description?: string;
  phaseId?: string;
  amount?: number;
  status?: string;
  category?: string;
  type?: 'expense' | 'bid' | 'payment';
  // Add other common fields as needed
}

// Type for category mapping preferences
export type CategoryMappingPreferences = Record<string, string>; 