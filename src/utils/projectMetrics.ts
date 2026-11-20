import { Project, Expense } from '../types'; // Adjust path if needed
import { calculateSpent } from './expenseAnalytics';

/**
 * Calculates budget summary data for a project.
 * 
 * @param project The project object (or null).
 * @param expenses An array of expense objects for the project. Only paid and approved ones count as spent.
 * @returns An object containing totalBudget, totalActual, difference, and percentUsed.
 * percentUsed is the exact share of budget spent (10.09 means 10.09%). It is not capped,
 * so an over-budget project reports more than 100; callers cap the progress bar themselves.
 */
export const calculateBudgetData = (
  project: Project | null,
  expenses: Expense[]
): { totalBudget: number; totalActual: number; difference: number; percentUsed: number } => {
  // Handle potential object type for project.budget
  let numericBudget = 0;
  if (project?.budget) {
    if (typeof project.budget === 'number') {
      numericBudget = project.budget;
    } else if (typeof project.budget === 'object' && 'total' in project.budget && typeof project.budget.total === 'number') {
      numericBudget = project.budget.total;
    }
  }
  
  const totalActual = calculateSpent(expenses);
  const difference = numericBudget - totalActual;
  const percentUsed = numericBudget > 0 ? Math.max(0, (totalActual / numericBudget) * 100) : 0;
  
  return {
    totalBudget: numericBudget,
    totalActual,
    difference,
    percentUsed,
  };
}; 