import React from "react";
import { Avatar, Box, Card, Typography, alpha, useTheme } from "@mui/material";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";

import { formatCurrency } from "../../../../utils/formatters";
import type { BudgetSummary } from "./budgetDashboardUtils";

interface BudgetHealthCardProps {
  summary: BudgetSummary;
  health: {
    status: string;
    color: string;
    icon: React.ReactElement;
    advice: string;
  };
}

const BudgetHealthCard: React.FC<BudgetHealthCardProps> = ({ summary, health }) => {
  const theme = useTheme();
  const totalCommitted = summary.totalSpent + summary.pendingTotal + summary.projectedTotal;
  const budgetVariance = Math.abs(summary.totalBudget - totalCommitted);

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(health.color, 0.3)}`,
        bgcolor: alpha(health.color, 0.05),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              bgcolor: alpha(health.color, 0.2),
              color: health.color,
              width: 56,
              height: 56,
              mr: 2,
            }}
          >
            {health.icon}
          </Avatar>

          <Box>
            <Typography color="text.secondary" variant="body2">
              Budget Health
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: health.color, lineHeight: 1.2 }}
            >
              {health.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {summary.totalBudget > 0
                ? totalCommitted <= summary.totalBudget
                  ? `Under budget by ${formatCurrency(budgetVariance)}`
                  : `Over budget by ${formatCurrency(budgetVariance)}`
                : "No budget set"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 300 }}>
          {health.advice && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <InfoIcon
                fontSize="small"
                sx={{
                  verticalAlign: "middle",
                  mr: 0.5,
                  color: theme.palette.info.main,
                }}
              />
              {health.advice}
            </Typography>
          )}

          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: alpha(theme.palette.background.default, 0.4),
              borderRadius: 1,
              position: "relative",
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Total Budget: {formatCurrency(summary.totalBudget)}
            </Typography>

            <Box
              sx={{
                mt: 1,
                mb: 0.5,
                height: 20,
                bgcolor: alpha(theme.palette.grey[200], 0.6),
                borderRadius: 2,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0}%`,
                  bgcolor: theme.palette.primary.main,
                  borderRadius: 2,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: `${summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0}%`,
                  top: 0,
                  height: "100%",
                  width: `${summary.totalBudget > 0 ? (summary.pendingTotal / summary.totalBudget) * 100 : 0}%`,
                  bgcolor: theme.palette.warning.main,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: `${summary.totalBudget > 0 ? ((summary.totalSpent + summary.pendingTotal) / summary.totalBudget) * 100 : 0}%`,
                  top: 0,
                  height: "100%",
                  width: `${summary.totalBudget > 0 ? (summary.projectedTotal / summary.totalBudget) * 100 : 0}%`,
                  bgcolor: theme.palette.info.main,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderTopRightRadius: 2,
                  borderBottomRightRadius: 2,
                }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption">0%</Typography>
              <Typography variant="caption">
                {summary.totalBudget > 0 ? `${summary.projectedPercentage.toFixed(1)}%` : "0%"} Used
              </Typography>
              <Typography variant="caption">100%</Typography>
            </Box>

            <Box sx={{ mt: 1, display: "flex", gap: 2 }}>
              <BudgetLegendDot color={theme.palette.primary.main} label="Paid" />
              <BudgetLegendDot color={theme.palette.warning.main} label="Pending" />
              <BudgetLegendDot color={theme.palette.info.main} label="Projected" />
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

interface BudgetLegendDotProps {
  color: string;
  label: string;
}

const BudgetLegendDot: React.FC<BudgetLegendDotProps> = ({ color, label }) => (
  <Box sx={{ display: "flex", alignItems: "center" }}>
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: color,
        mr: 0.5,
      }}
    />
    <Typography variant="caption">{label}</Typography>
  </Box>
);

export default BudgetHealthCard;
