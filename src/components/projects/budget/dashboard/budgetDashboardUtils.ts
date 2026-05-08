import type { BudgetProjection, Expense, Project, ProjectPhase } from "../../../../types";
import {
  getCategoryById,
  getParentCategory,
  mapSimpleToDetailedCategory,
} from "../../../../data/hierarchicalCategories";

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  projectedTotal: number;
  projectedRemaining: number;
  projectedPercentage: number;
  pendingTotal: number;
}

export interface BudgetCategoryGroup {
  id: string;
  name: string;
  value: number;
  count: number;
  items: Expense[];
  color: string;
}

export interface ContractorExpenseGroup {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface ProjectionMainCategoryGroup {
  name: string;
  totalAmount: number;
}

export interface PhaseAllocationItem {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  color: string;
}

export interface MonthlyTrendItem {
  month: string;
  spent: number;
  projected: number;
  cumulative: number;
}

export type BudgetHealthStatus =
  | "Unknown"
  | "No Budget"
  | "Critical"
  | "At Risk"
  | "Caution"
  | "Near Limit"
  | "On Track"
  | "Healthy";

export type BudgetHealthTone =
  | "grey"
  | "errorDark"
  | "error"
  | "warning"
  | "warningLight"
  | "success"
  | "successDark";

export interface BudgetHealthDescriptor {
  status: BudgetHealthStatus;
  tone: BudgetHealthTone;
  advice: string;
}

export const EMPTY_BUDGET_SUMMARY: BudgetSummary = {
  totalBudget: 0,
  totalSpent: 0,
  remainingBudget: 0,
  projectedTotal: 0,
  projectedRemaining: 0,
  projectedPercentage: 0,
  pendingTotal: 0,
};

const COUNTED_EXPENSE_STATUSES = new Set(["paid", "approved", "pending"]);
const SPENT_EXPENSE_STATUSES = new Set(["paid", "approved"]);

export function getProjectBudgetTotal(project: Pick<Project, "budget"> | null | undefined): number {
  if (!project) {
    return 0;
  }

  return typeof project.budget === "number"
    ? project.budget
    : project.budget?.total || 0;
}

export function calculateBudgetSummary(
  project: Pick<Project, "budget"> | null | undefined,
  expenses: Expense[] = [],
  projections: BudgetProjection[] = [],
): BudgetSummary {
  if (!project) {
    return EMPTY_BUDGET_SUMMARY;
  }

  const totalBudget = getProjectBudgetTotal(project);
  const totalSpent = expenses
    .filter((expense) => SPENT_EXPENSE_STATUSES.has(expense.status))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pendingTotal = expenses
    .filter((expense) => expense.status === "pending")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const projectedTotal = projections.reduce((sum, projection) => sum + projection.amount, 0);
  const projectedRemaining = remainingBudget - projectedTotal;
  const projectedPercentage =
    totalBudget > 0
      ? ((totalSpent + projectedTotal + pendingTotal) / totalBudget) * 100
      : 0;

  return {
    totalBudget,
    totalSpent,
    remainingBudget,
    projectedTotal,
    projectedRemaining,
    projectedPercentage,
    pendingTotal,
  };
}

export function getBudgetHealthDescriptor(
  summary: BudgetSummary,
  hasProject: boolean,
): BudgetHealthDescriptor {
  if (!hasProject) {
    return { status: "Unknown", tone: "grey", advice: "" };
  }

  const { totalBudget, totalSpent, projectedTotal } = summary;

  if (totalBudget === 0) {
    return { status: "No Budget", tone: "grey", advice: "" };
  }

  const projectedPercentage = ((totalSpent + projectedTotal) / totalBudget) * 100;

  if (projectedPercentage > 120) {
    return {
      status: "Critical",
      tone: "errorDark",
      advice:
        "Your project is significantly over budget or projected to greatly exceed budget. Comprehensive financial review and corrective actions are required urgently.",
    };
  }

  if (projectedPercentage > 110) {
    return {
      status: "At Risk",
      tone: "error",
      advice:
        "Your project is projected to exceed budget by more than 10%. Immediate cost control measures are recommended.",
    };
  }

  if (projectedPercentage > 100) {
    return {
      status: "Caution",
      tone: "warning",
      advice:
        "Your project expenses plus projected costs are trending higher than expected. Review upcoming expenses and identify savings opportunities.",
    };
  }

  if (projectedPercentage > 90) {
    return {
      status: "Near Limit",
      tone: "warningLight",
      advice:
        "Your project has utilized most of the allocated budget. Carefully manage remaining funds and review projections to prevent overruns.",
    };
  }

  if (projectedPercentage > 60) {
    return {
      status: "On Track",
      tone: "success",
      advice:
        "Your project is progressing as expected financially. Continue monitoring expenses and upcoming projected costs to maintain budget compliance.",
    };
  }

  return {
    status: "Healthy",
    tone: "successDark",
    advice:
      "Your project is well under budget and on track. Current spending patterns and projections indicate you may finish below the allocated budget.",
  };
}

export function buildProjectionsByMainCategory(
  projections: BudgetProjection[] = [],
): ProjectionMainCategoryGroup[] {
  const grouped = new Map<string, ProjectionMainCategoryGroup>();

  projections.forEach((projection) => {
    const detailedCategoryId = projection.categoryId || "uncategorized";
    const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
    const mainCategoryId = mainCategory?.id || "uncategorized";
    const mainCategoryName = mainCategory?.name || "Uncategorized";

    if (!grouped.has(mainCategoryId)) {
      grouped.set(mainCategoryId, { name: mainCategoryName, totalAmount: 0 });
    }

    grouped.get(mainCategoryId)!.totalAmount += projection.amount;
  });

  return Array.from(grouped.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function buildExpensesByCategory(
  expenses: Expense[] = [],
  categoryMappings: Record<string, string> = {},
  fallbackColor: string,
): BudgetCategoryGroup[] {
  const categoryMap = new Map<string, BudgetCategoryGroup>();

  expenses.forEach((expense) => {
    if (!expense.id || typeof expense.amount !== "number") {
      return;
    }

    const detailedCategoryId = getExpenseCategoryId(expense, categoryMappings);
    const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
    const mainCategoryId = mainCategory?.id || "uncategorized";
    const mainCategoryName = mainCategory?.name || "Uncategorized";

    if (!categoryMap.has(mainCategoryId)) {
      categoryMap.set(mainCategoryId, {
        id: mainCategoryId,
        name: mainCategoryName,
        value: 0,
        count: 0,
        items: [],
        color: mainCategory?.color || fallbackColor,
      });
    }

    const group = categoryMap.get(mainCategoryId)!;
    group.items.push(expense);

    if (COUNTED_EXPENSE_STATUSES.has(expense.status)) {
      group.value += expense.amount;
    }

    group.count += 1;
  });

  return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
}

export function buildExpensesByContractor(
  expenses: Expense[] = [],
  colors: string[],
): ContractorExpenseGroup[] {
  const contractorMap = new Map<string, ContractorExpenseGroup>();

  expenses.forEach((expense) => {
    if (typeof expense.amount !== "number") {
      return;
    }

    const name = expense.subcontractorName || expense.vendor || "Unknown Contractor/Vendor";

    if (!contractorMap.has(name)) {
      const color = colors[contractorMap.size % colors.length];
      contractorMap.set(name, { name, value: 0, count: 0, color });
    }

    const group = contractorMap.get(name)!;

    if (COUNTED_EXPENSE_STATUSES.has(expense.status)) {
      group.value += expense.amount;
    }

    group.count += 1;
  });

  return Array.from(contractorMap.values()).sort((a, b) => b.value - a.value);
}

export function buildPhaseAllocation(
  phases: ProjectPhase[] = [],
  expenses: Expense[] = [],
  colors: string[],
): PhaseAllocationItem[] {
  return phases
    .map((phase, index) => {
      const phaseExpenses = expenses.filter((expense) => expense.phaseId === phase.id);
      const actualCost = phaseExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budget = phase.budget || 0;

      return {
        id: phase.id,
        name: phase.name,
        budget,
        spent: actualCost,
        remaining: budget - actualCost,
        percentUsed: budget > 0 ? (actualCost / budget) * 100 : 0,
        color: colors[index % colors.length],
      };
    })
    .sort((a, b) => b.budget - a.budget);
}

export function buildMonthlyTrends(
  expenses: Expense[] = [],
  projections: BudgetProjection[] = [],
  currentDate: Date = new Date(),
): MonthlyTrendItem[] {
  const monthlyData: Record<string, { month: string; spent: number; projected: number }> = {};

  expenses.forEach((expense) => {
    const date =
      typeof expense.date === "string"
        ? new Date(expense.date)
        : expense.date instanceof Date
          ? expense.date
          : new Date();

    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthName = date.toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        spent: 0,
        projected: 0,
      };
    }

    monthlyData[monthKey].spent += expense.amount;
  });

  const monthData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item, index, arr) => ({
      ...item,
      cumulative: arr.slice(0, index + 1).reduce((sum, curr) => sum + curr.spent, 0),
    }));

  if (projections.length > 0) {
    const projectionsByCategory = projections.reduce(
      (acc, projection) => {
        if (!acc[projection.categoryId]) {
          acc[projection.categoryId] = 0;
        }
        acc[projection.categoryId] += projection.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalProjectionAmount = Object.values(projectionsByCategory).reduce(
      (sum, amount) => sum + amount,
      0,
    );
    const futureMonths: Array<{ month: string; date: Date }> = [];
    const currentMonthStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, "0")}`;
    const currentMonthExists = monthData.some((month) => month.month.startsWith(currentMonthStr));

    if (!currentMonthExists) {
      futureMonths.push({
        month: currentMonthStr,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      });
    }

    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1,
      );
      const monthStr = `${futureDate.getFullYear()}-${String(
        futureDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      futureMonths.push({
        month: monthStr,
        date: futureDate,
      });
    }

    const projectionPerMonth = totalProjectionAmount / (futureMonths.length || 1);

    futureMonths.forEach((futureMonth, index) => {
      const existingIndex = monthData.findIndex((month) => month.month === futureMonth.month);
      const projected =
        projectionPerMonth * (index === 0 ? 0.2 : index === 1 ? 0.3 : index === 2 ? 0.3 : 0.2);

      if (existingIndex >= 0) {
        monthData[existingIndex].projected = (monthData[existingIndex].projected || 0) + projected;
      } else {
        monthData.push({
          month: futureMonth.month,
          spent: 0,
          cumulative: monthData.length > 0 ? monthData[monthData.length - 1].cumulative : 0,
          projected,
        });
      }
    });

    monthData.sort((a, b) => a.month.localeCompare(b.month));
  }

  return monthData;
}

export function getTopExpenses(expenses: Expense[] = [], limit = 5): Expense[] {
  return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

function getExpenseCategoryId(
  expense: Expense,
  categoryMappings: Record<string, string>,
): string {
  if (expense.id && categoryMappings[expense.id]) {
    return categoryMappings[expense.id];
  }

  try {
    return mapSimpleToDetailedCategory(
      expense.category || "other",
      expense.subcontractorName || expense.vendor || "",
      expense.description || "",
    );
  } catch (error) {
    console.error("Mapping error in getExpenseCategoryId:", error);
    return "uncategorized";
  }
}
