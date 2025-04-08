import { Project, Expense } from '../types'; // Adjust path if needed

/**
 * Calculates budget summary data for a project.
 * 
 * @param project The project object (or null).
 * @param expenses An array of expense objects for the project.
 * @returns An object containing totalBudget, totalActual, difference, and percentUsed.
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
  
  const totalActual = expenses.reduce((sum, e) => sum + (e.amount || 0), 0); // Ensure amount is treated as number
  const difference = numericBudget - totalActual;
  const percentUsed = numericBudget > 0 ? Math.min(100, Math.max(0, Math.round((totalActual / numericBudget) * 100))) : 0;
  
  return {
    totalBudget: numericBudget,
    totalActual,
    difference,
    percentUsed,
  };
}; 