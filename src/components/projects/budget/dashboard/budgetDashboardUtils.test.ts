import type { BudgetProjection, Expense, ProjectPhase } from "../../../../types";
import {
  buildExpensesByCategory,
  buildExpensesByContractor,
  buildMonthlyTrends,
  buildPhaseAllocation,
  calculateBudgetSummary,
  getBudgetHealthDescriptor,
} from "./budgetDashboardUtils";

const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: "expense-1",
  userId: "user-1",
  projectId: "project-1",
  category: "materials",
  description: "Concrete",
  amount: 100,
  date: new Date("2026-01-15"),
  status: "paid",
  createdBy: "user-1",
  createdAt: new Date("2026-01-15"),
  updatedAt: new Date("2026-01-15"),
  ...overrides,
});

const projection = (overrides: Partial<BudgetProjection> = {}): BudgetProjection => ({
  id: "projection-1",
  categoryId: "foundation-concrete",
  amount: 100,
  notes: null,
  createdAt: new Date("2026-01-15"),
  userId: "user-1",
  projectId: "project-1",
  ...overrides,
});

const phase = (overrides: Partial<ProjectPhase> = {}): ProjectPhase => ({
  id: "phase-1",
  name: "Foundation",
  status: "in_progress",
  progress: 0,
  budget: 500,
  actualCost: 0,
  ...overrides,
});

describe("budgetDashboardUtils", () => {
  test("calculates budget summary from paid, approved, pending, and projected costs", () => {
    const summary = calculateBudgetSummary(
      { budget: { total: 1000, spent: 0, remaining: 1000 } },
      [
        expense({ amount: 100, status: "paid" }),
        expense({ id: "expense-2", amount: 200, status: "approved" }),
        expense({ id: "expense-3", amount: 50, status: "pending" }),
        expense({ id: "expense-4", amount: 999, status: "rejected" }),
      ],
      [
        projection({ amount: 75 }),
        projection({ id: "projection-2", amount: 25 }),
      ],
    );

    expect(summary).toEqual({
      totalBudget: 1000,
      totalSpent: 300,
      remainingBudget: 700,
      projectedTotal: 100,
      projectedRemaining: 600,
      projectedPercentage: 45,
      pendingTotal: 50,
    });
  });

  test("maps budget health descriptors at key thresholds", () => {
    expect(getBudgetHealthDescriptor(calculateBudgetSummary(null), false).status).toBe("Unknown");
    expect(
      getBudgetHealthDescriptor(calculateBudgetSummary({ budget: 0 }, [], []), true).status,
    ).toBe("No Budget");
    expect(
      getBudgetHealthDescriptor(
        calculateBudgetSummary({ budget: 100 }, [expense({ amount: 61 })], []),
        true,
      ).status,
    ).toBe("On Track");
    expect(
      getBudgetHealthDescriptor(
        calculateBudgetSummary({ budget: 100 }, [expense({ amount: 100 })], [projection({ amount: 21 })]),
        true,
      ).status,
    ).toBe("Critical");
  });

  test("groups expenses by mapped main category while excluding rejected amounts from value", () => {
    const groups = buildExpensesByCategory(
      [
        expense({ id: "expense-1", amount: 100, status: "paid" }),
        expense({ id: "expense-2", amount: 40, status: "pending" }),
        expense({ id: "expense-3", amount: 20, status: "rejected" }),
      ],
      {
        "expense-1": "site-work-demolition",
        "expense-2": "site-work-excavation",
        "expense-3": "site-work-utilities",
      },
      "#999",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(expect.objectContaining({
      id: "site-work",
      name: "Site Work",
      value: 140,
      count: 3,
    }));
    expect(groups[0].items).toHaveLength(3);
  });

  test("builds contractor and phase summaries in descending budget/value order", () => {
    expect(
      buildExpensesByContractor(
        [
          expense({ amount: 100, vendor: "Acme" }),
          expense({ id: "expense-2", amount: 300, subcontractorName: "Bright Build" }),
          expense({ id: "expense-3", amount: 50, vendor: "Acme", status: "rejected" }),
        ],
        ["red", "blue"],
      ),
    ).toEqual([
      { name: "Bright Build", value: 300, count: 1, color: "blue" },
      { name: "Acme", value: 100, count: 2, color: "red" },
    ]);

    expect(
      buildPhaseAllocation(
        [phase({ id: "phase-1", budget: 500 }), phase({ id: "phase-2", name: "Framing", budget: 1000 })],
        [
          expense({ amount: 125, phaseId: "phase-1" }),
          expense({ id: "expense-2", amount: 250, phaseId: "phase-2" }),
        ],
        ["red", "blue"],
      ),
    ).toEqual([
      {
        id: "phase-2",
        name: "Framing",
        budget: 1000,
        spent: 250,
        remaining: 750,
        percentUsed: 25,
        color: "blue",
      },
      {
        id: "phase-1",
        name: "Foundation",
        budget: 500,
        spent: 125,
        remaining: 375,
        percentUsed: 25,
        color: "red",
      },
    ]);
  });

  test("builds monthly trend rows with projected future months", () => {
    const trends = buildMonthlyTrends(
      [expense({ amount: 100, date: new Date("2026-01-15") })],
      [projection({ amount: 1000 })],
      new Date("2026-05-08"),
    );

    expect(trends.find((trend) => trend.month === "Jan 26")).toEqual({
      month: "Jan 26",
      spent: 100,
      projected: 0,
      cumulative: 100,
    });
    expect(trends.filter((trend) => trend.month.startsWith("2026-")).map((trend) => ({
      month: trend.month,
      projected: trend.projected,
      cumulative: trend.cumulative,
    }))).toEqual([
      { month: "2026-05", projected: 50, cumulative: 100 },
      { month: "2026-06", projected: 75, cumulative: 100 },
      { month: "2026-07", projected: 75, cumulative: 100 },
      { month: "2026-08", projected: 50, cumulative: 100 },
    ]);
  });
});
