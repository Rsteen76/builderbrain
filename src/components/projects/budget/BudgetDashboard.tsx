import React, { useMemo, useState, useEffect } from "react";
import { logger } from '../../../utils/logger';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  InfoOutlined as InfoIcon,
  CheckCircle as CheckCircleIcon,
  HelpOutline as HelpOutlineIcon,
  PriorityHigh as PriorityHighIcon,
  ReportProblem as ReportProblemIcon,
  ThumbUp as ThumbUpIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

import { useProjectDetail } from "../../../contexts/ProjectDetailContext";
import type { BudgetProjection } from "../../../types";
import BudgetAllocationTracker from "./BudgetAllocationTracker";
import { useAuth } from '../../../contexts/AuthContext';
import { getCategoryMappingsForProject } from '../../../services/category.service';
import {
  normalizeBudgetProjection,
} from '../../../services/budget';
import BudgetDashboardCharts from "./dashboard/BudgetDashboardCharts";
import BudgetHealthCard from "./dashboard/BudgetHealthCard";
import BudgetSummaryCards from "./dashboard/BudgetSummaryCards";
import DashboardHeader from "./dashboard/DashboardHeader";
import {
  buildExpensesByCategory,
  buildMonthlyTrends,
  calculateBudgetSummary,
  getBudgetHealthDescriptor,
} from "./dashboard/budgetDashboardUtils";
import type {
  BudgetHealthStatus,
  BudgetHealthTone,
} from "./dashboard/budgetDashboardUtils";

interface BudgetDashboardProps {}

const getBudgetHealthColor = (tone: BudgetHealthTone, theme: Theme): string => {
  switch (tone) {
    case "errorDark":
      return theme.palette.error.dark;
    case "error":
      return theme.palette.error.main;
    case "warning":
      return theme.palette.warning.main;
    case "warningLight":
      return theme.palette.warning.light;
    case "success":
      return theme.palette.success.main;
    case "successDark":
      return theme.palette.success.dark;
    case "grey":
    default:
      return theme.palette.grey[500];
  }
};

const getBudgetHealthIcon = (status: BudgetHealthStatus): React.ReactElement => {
  switch (status) {
    case "Critical":
      return <PriorityHighIcon />;
    case "At Risk":
      return <WarningIcon />;
    case "Caution":
      return <ReportProblemIcon />;
    case "Near Limit":
      return <InfoIcon />;
    case "On Track":
      return <CheckCircleIcon />;
    case "Healthy":
      return <ThumbUpIcon />;
    case "Unknown":
    case "No Budget":
    default:
      return <HelpOutlineIcon />;
  }
};

const BudgetDashboard: React.FC<BudgetDashboardProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const { 
      project: contextProject, 
      phases: contextPhases, 
      expenses: contextExpenses, 
      bids: contextBids, 
      loading: contextLoading, 
      error: contextError, 
      projectId,
      refreshAllProjectData,
  } = useProjectDetail();

  const project = contextProject;
  const phases = contextPhases;
  const expenses = contextExpenses;
  const bids = contextBids;
  const loading = contextLoading; 
  const error = contextError;
  const projections = useMemo(() => (
      contextProject?.projections?.map(normalizeBudgetProjection) || []
  ), [contextProject?.projections]);
  
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [mappingsLoading, setMappingsLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [localProjections, setLocalProjections] = useState<BudgetProjection[]>([]);
  const [categoryDisplay, setCategoryDisplay] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    if (projections?.length > 0) {
      setLocalProjections(projections);
    }
  }, [projections]);

  const workingProjections = localProjections.length > 0 ? localProjections : projections;

  useEffect(() => {
    // Only attempt to fetch mappings when both projectId and user are available 
    // AND we're not in a loading state
    if (projectId && user && !loading) {
      setMappingsLoading(true);
      
      // Small delay to ensure auth token is fully processed by Firebase
      const timer = setTimeout(() => {
        getCategoryMappingsForProject(projectId)
          .then((mappings) => {
            setCategoryMappings(mappings);
            logger.log(`Successfully loaded ${Object.keys(mappings).length} category mappings for project ${projectId}`);
          })
          .catch((error) => {
            logger.error("Error loading category mappings for dashboard:", error);
            setSnackbar({ 
              open: true, 
              message: 'Error loading category settings. Using default categories.', 
              severity: 'info' 
            });
          })
          .finally(() => {
            setMappingsLoading(false);
          });
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (!projectId || !user) {
      setCategoryMappings({});
      setMappingsLoading(false);
    } else if (!loading) {
      // This ensures we don't get stuck in a loading state when project data is ready
      // but there's an issue with the mappings
      setMappingsLoading(false);
    }
  }, [projectId, user, loading]);

  const budgetSummary = useMemo(
    () => calculateBudgetSummary(project, expenses, workingProjections),
    [project, expenses, workingProjections],
  );

  const expensesByCategory = useMemo(() => {
    return buildExpensesByCategory(expenses, categoryMappings, theme.palette.grey[500]);
  }, [expenses, categoryMappings, theme.palette.grey]);

  const monthlyTrends = useMemo(() => {
    return buildMonthlyTrends(expenses, workingProjections);
  }, [expenses, workingProjections]);

  const budgetHealth = useMemo(() => {
    const descriptor = getBudgetHealthDescriptor(budgetSummary, Boolean(project));
    return {
      status: descriptor.status,
      color: getBudgetHealthColor(descriptor.tone, theme),
      icon: getBudgetHealthIcon(descriptor.status),
      advice: descriptor.advice,
    };
  }, [budgetSummary, project, theme.palette]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="h6" color="text.secondary">
          Loading budget data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Error loading budget data
        </Typography>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  if (!contextProject) { 
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <DashboardHeader
        project={contextProject}
        expenses={expenses}
        phases={phases}
        bids={bids}
        projections={workingProjections}
        onAddProjectionClick={() => document.getElementById("budget-allocation-tracker")?.scrollIntoView({ behavior: "smooth" })}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <BudgetHealthCard summary={budgetSummary} health={budgetHealth} />
        </Grid>
      </Grid>

      <BudgetSummaryCards project={contextProject} summary={budgetSummary} />

      <BudgetDashboardCharts
        categoryDisplay={categoryDisplay}
        expensesByCategory={expensesByCategory}
        monthlyTrends={monthlyTrends}
        onCategoryDisplayChange={setCategoryDisplay}
      />

      <div id="budget-allocation-tracker" style={{ scrollMarginTop: '80px' }}>
        <BudgetAllocationTracker 
          projectId={contextProject.id}
          expenses={expenses}
          bids={bids}
          phases={phases}
          allowEdit={true}
          isEmbedded={false}
          onBudgetUpdated={refreshAllProjectData}
        />
      </div>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetDashboard;
