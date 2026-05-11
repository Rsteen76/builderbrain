import React from "react";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

import type { Bid, BudgetProjection, Expense, Project, ProjectPhase } from "../../../../types";
import BudgetReportButton from "../BudgetReportButton";

interface DashboardHeaderProps {
  project: Project;
  expenses: Expense[];
  phases: ProjectPhase[];
  bids: Bid[];
  projections: BudgetProjection[];
  onAddProjectionClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  project,
  expenses,
  phases,
  bids,
  projections,
  onAddProjectionClick,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 3,
      flexDirection: { xs: "column", md: "row" },
      gap: { xs: 2, md: 0 },
    }}
  >
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Budget Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Track, visualize, and manage your project budget
      </Typography>
    </Box>

    <Stack direction="row" spacing={1}>
      <Tooltip title="Generate budget report">
        <span>
          <BudgetReportButton
            project={project}
            expenses={expenses}
            phases={phases}
            bids={bids}
            projections={projections}
            variant="outlined"
            size="medium"
          />
        </span>
      </Tooltip>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        size="medium"
        onClick={onAddProjectionClick}
      >
        Add Projection
      </Button>
    </Stack>
  </Box>
);

export default DashboardHeader;
