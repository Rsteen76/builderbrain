import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Category as CategoryIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "../../../../utils/formatters";
import type { BudgetCategoryGroup, MonthlyTrendItem } from "./budgetDashboardUtils";

interface BudgetDashboardChartsProps {
  categoryDisplay: "summary" | "detailed";
  expensesByCategory: BudgetCategoryGroup[];
  monthlyTrends: MonthlyTrendItem[];
  onCategoryDisplayChange: (value: "summary" | "detailed") => void;
}

const BudgetDashboardCharts: React.FC<BudgetDashboardChartsProps> = ({
  categoryDisplay,
  expensesByCategory,
  monthlyTrends,
  onCategoryDisplayChange,
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={8}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            height: "100%",
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <CardHeader
            title="Expense Distribution by Category"
            titleTypographyProps={{ variant: "h6", fontWeight: "medium" }}
            action={
              <ToggleButtonGroup
                size="small"
                value={categoryDisplay}
                exclusive
                onChange={(_event, value) => value && onCategoryDisplayChange(value)}
              >
                <ToggleButton value="summary">Summary</ToggleButton>
                <ToggleButton value="detailed">Detailed</ToggleButton>
              </ToggleButtonGroup>
            }
            sx={{ px: 3, py: 2 }}
          />
          <Divider />
          <CardContent sx={{ p: 0, height: 400 }}>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {categoryDisplay === "summary" ? (
                  <BarChart
                    data={expensesByCategory}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      formatter={(value: any) => formatCurrency(value as number)}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      name="Paid"
                      dataKey="value"
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <Treemap
                    data={expensesByCategory.map((item) => ({ name: item.name, value: item.value }))}
                    dataKey="value"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill={theme.palette.primary.main}
                  >
                    <RechartsTooltip
                      formatter={(value: any) => formatCurrency(value as number)}
                      labelFormatter={(label) => `${label}`}
                    />
                  </Treemap>
                )}
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                icon={<CategoryIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />}
                title="No expenses found for this project"
                detail="Add expenses to see category distribution"
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            height: "100%",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <CardHeader
            title="Monthly Expense Trend"
            titleTypographyProps={{ variant: "h6", fontWeight: "medium" }}
            sx={{ px: 3, py: 2 }}
          />
          <Divider />
          <CardContent sx={{ p: 0, height: 400 }}>
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => formatCurrency(value as number)}
                    labelFormatter={(label) => label}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stackId="1"
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.6)}
                    name="Actual"
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stackId="1"
                    stroke={theme.palette.info.main}
                    fill={alpha(theme.palette.info.main, 0.6)}
                    name="Projected"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                icon={<TimelineIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />}
                title="No monthly expense data yet"
                detail="Add expenses with dates to see trends"
              />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

interface EmptyChartStateProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
}

const EmptyChartState: React.FC<EmptyChartStateProps> = ({ icon, title, detail }) => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
    }}
  >
    {icon}
    <Typography variant="body1" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      {detail}
    </Typography>
  </Box>
);

export default BudgetDashboardCharts;
