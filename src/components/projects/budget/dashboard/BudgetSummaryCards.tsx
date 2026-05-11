import React from "react";
import { Box, Card, Grid, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";

import type { Project } from "../../../../types";
import { formatCurrency } from "../../../../utils/formatters";
import type { BudgetSummary } from "./budgetDashboardUtils";

interface BudgetSummaryCardsProps {
  project: Project;
  summary: BudgetSummary;
}

const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({ project, summary }) => {
  const theme = useTheme();
  const cards = [
    {
      title: "Total Budget",
      tooltip: "Total budget allocated for this project",
      value: formatCurrency(summary.totalBudget),
      detail:
        project.budget && typeof project.budget === "object" && project.budget.contingency
          ? `Includes ${project.budget.contingency}% contingency`
          : "No contingency set",
    },
    {
      title: "Current Expenses",
      tooltip: "Total amount already paid or approved",
      value: formatCurrency(summary.totalSpent),
      detail:
        summary.totalBudget > 0
          ? `${((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)}% of budget used`
          : "0.0% of budget used",
    },
    {
      title: "Pending Expenses",
      tooltip: "Expenses submitted but not yet approved/paid",
      value: formatCurrency(summary.pendingTotal),
      detail:
        summary.totalBudget > 0
          ? `${((summary.pendingTotal / summary.totalBudget) * 100).toFixed(1)}% of budget`
          : "0.0% of budget",
    },
    {
      title: "Projected Costs",
      tooltip: "Estimated future costs that haven't been recorded as expenses yet",
      value: formatCurrency(summary.projectedTotal),
      detail:
        summary.totalBudget > 0
          ? `${((summary.projectedTotal / summary.totalBudget) * 100).toFixed(1)}% of budget`
          : "0.0% of budget",
      valueColor: theme.palette.info.main,
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.title}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2,
              height: "100%",
              bgcolor: "background.paper",
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Typography variant="subtitle2" color="text.secondary">
                {card.title}
              </Typography>
              <Tooltip title={card.tooltip} arrow>
                <InfoIcon fontSize="small" color="action" sx={{ fontSize: "0.9rem" }} />
              </Tooltip>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: card.valueColor }}>
              {card.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {card.detail}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default BudgetSummaryCards;
