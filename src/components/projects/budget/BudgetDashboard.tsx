import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  useTheme,
  alpha,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  ReceiptLong as ReceiptIcon,
  Handshake as HandshakeIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  InfoOutlined as InfoIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  AccountBalance as AccountBalanceIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  HelpOutline as HelpOutlineIcon,
  PriorityHigh as PriorityHighIcon,
  ReportProblem as ReportProblemIcon,
  ThumbUp as ThumbUpIcon,
  GroupWork as GroupWorkIcon,
} from "@mui/icons-material";
import { Timestamp } from "firebase/firestore";
import { doc, updateDoc } from 'firebase/firestore'; // <--- Import Firestore update functions
import { db } from '../../../config/firebase'; // <--- Import db instance

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from "recharts";

import { useProjectDetail } from "../../../contexts/ProjectDetailContext";
import {
  formatCurrency,
  formatPercentage,
  formatDate,
} from "../../../utils/formatters";
import {
  Project,
  ProjectPhase,
  Bid,
  Expense,
  BudgetProjection,
} from "../../../types";
import BudgetAllocationTracker from "./BudgetAllocationTracker";
import { CONSTRUCTION_CATEGORIES } from "../../../utils/constructionCategories";
import BudgetReportButton from "./BudgetReportButton";
import { getProjectById } from '../../../services/project';
import { ExpenseService } from '../../../services/expense';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategoryMappingsForProject } from '../../../services/category.service';
import { MAIN_CATEGORIES, getCategoryById, getParentCategory, mapSimpleToDetailedCategory } from '../../../data/hierarchicalCategories';
import { Category } from '../../../types/category.types';

interface BudgetDashboardProps {
  // projectId: string; // No longer needed as prop, get from context
}

// Add type definition for budget summary
interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  projectedTotal: number;
  projectedRemaining: number;
  projectedPercentage: number;
  pendingTotal: number;
}

// Define structure for budget health
interface BudgetHealth {
  status: string;
  color: string;
  icon: React.ReactElement;
  advice: string;
}

const BudgetDashboard: React.FC<BudgetDashboardProps> = (/*{ projectId }*/) => {
  // REMOVE component start log
  // console.log("--- BudgetDashboard Rendering Start ---");

  const theme = useTheme();
  const { user } = useAuth();
  
  // GET DATA FROM CONTEXT, including the refresh function
  const { 
      project: contextProject, 
      phases: contextPhases, 
      expenses: contextExpenses, 
      bids: contextBids, 
      loading: contextLoading, 
      error: contextError, 
      projectId,
      refreshAllProjectData // **** Get the EXISTING refresh function ****
  } = useProjectDetail();

  // REMOVE context values log
  // console.log("Context Values:", { ... });
  
  // Use context data directly instead of fetching via useEffect
  const project = contextProject;
  const phases = contextPhases;
  const expenses = contextExpenses;
  const bids = contextBids;
  const loading = contextLoading; 
  const error = contextError;
  const projections = useMemo(() => (
      contextProject?.projections?.map(p => ({ 
          ...p, 
          createdAt: p.createdAt instanceof Timestamp ? p.createdAt.toDate() : new Date(p.createdAt)
      })) || []
  ), [contextProject?.projections]);
  
  // State for category mappings & loading
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [mappingsLoading, setMappingsLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

  // State for expense grouping
  const [expenseGrouping, setExpenseGrouping] = useState<'category' | 'contractor'>('category');

  // State for local projections to allow for optimistic updates
  const [localProjections, setLocalProjections] = useState<BudgetProjection[]>([]);
  
  // Initialize local projections from context projections
  useEffect(() => {
    if (projections?.length > 0) {
      setLocalProjections(projections);
    }
  }, [projections]);

  // Use local projections in our calculations instead of context projections
  const workingProjections = localProjections.length > 0 ? localProjections : projections;

  // Moved this hook *before* the early return for !project
  const projectionsByMainCategory = useMemo(() => {
    if (!workingProjections || workingProjections.length === 0) {
      // REMOVE log
      // console.log("Skipping projectionsByMainCategory: No projections");
      return [];
    }
    // REMOVE log
    // console.log("Calculating projectionsByMainCategory...");
    const grouped = new Map<string, { name: string; totalAmount: number }>();
    workingProjections.forEach(projection => {
      const detailedCategoryId = projection.categoryId || 'uncategorized';
      const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
      const mainCategoryId = mainCategory?.id || 'uncategorized';
      const mainCategoryName = mainCategory?.name || 'Uncategorized';
      if (!grouped.has(mainCategoryId)) {
        grouped.set(mainCategoryId, { name: mainCategoryName, totalAmount: 0 });
      }
      grouped.get(mainCategoryId)!.totalAmount += projection.amount;
    });
    return Array.from(grouped.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [workingProjections]);

  // REMOVE Fetch data useEffect
  // useEffect(() => { ... }, [projectId, user]);
  
  // Load Category Mappings based on context projectId
  useEffect(() => {
    if (projectId) { // Use projectId from context
      setMappingsLoading(true);
      getCategoryMappingsForProject(projectId)
        .then((mappings) => {
          setCategoryMappings(mappings);
        })
        .catch((error) => {
          console.error("Error loading category mappings for dashboard:", error);
          setSnackbar({ open: true, message: 'Error loading category settings', severity: 'error' });
        })
        .finally(() => {
          setMappingsLoading(false);
        });
    } else {
      setCategoryMappings({});
      setMappingsLoading(false);
    }
  }, [projectId]); // Depend on projectId from context

  // REMOVE Handle adding new projections (should be handled by parent/context)
  // const handleAddProjection = (projection: BudgetProjection) => { ... };

  // Update budget summary calculation
  const budgetSummary = useMemo<BudgetSummary>(() => {
    if (!project) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0, 
        projectedTotal: 0, 
        projectedRemaining: 0,
        projectedPercentage: 0, 
        pendingTotal: 0 
      }; 
    }

    const totalBudget =
      typeof project.budget === "number"
        ? project.budget
        : project.budget?.total || 0; // Use optional chaining and default

    const totalSpent = expenses
      .filter((expense) => expense.status === "paid" || expense.status === "approved")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const pendingTotal = expenses
      .filter((expense) => expense.status === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0);
      
    const remainingBudget = totalBudget - totalSpent;
    const currentProjections = workingProjections || [];
    const calculatedProjectionTotal = currentProjections.reduce((sum, p) => sum + p.amount, 0);
    const projectedRemaining = remainingBudget - calculatedProjectionTotal;
    const projectedPercentage = totalBudget > 0 ? ((totalSpent + calculatedProjectionTotal + pendingTotal) / totalBudget) * 100 : 0;
    
    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      projectedTotal: calculatedProjectionTotal, // Assign calculated value to the correct field name
      projectedRemaining,
      projectedPercentage,
      pendingTotal,
    };
  }, [project, expenses, workingProjections]); // Depend on context data

  // REFACTORED: Group expenses by hierarchical main category
  const expensesByCategory = useMemo(() => {
    // Define the structure for grouped data
    const categoryMap = new Map<string, { 
      id: string; 
      name: string; 
      value: number; 
      count: number; 
      items: Expense[]; 
      color: string; // ADD color to type definition
    }>();

    // Helper function to get category ID for an expense
    const getExpenseCategoryId = (expense: Expense): string => {
        if (expense.id && categoryMappings[expense.id]) {
          return categoryMappings[expense.id];
        }
        // Fallback using mapSimpleToDetailedCategory
        try {
            return mapSimpleToDetailedCategory(
                expense.category || 'other',
                expense.subcontractorName || expense.vendor || '',
                expense.description || ''
            );
        } catch (e) { 
            console.error("Mapping error in getExpenseCategoryId:", e);
            return 'uncategorized';
        }
    };
    
    expenses.forEach(expense => {
      if (!expense.id || typeof expense.amount !== 'number') return; // Need ID and amount
      
      const detailedCategoryId = getExpenseCategoryId(expense);
      const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
      const mainCategoryId = mainCategory?.id || 'uncategorized';
      const mainCategoryName = mainCategory?.name || 'Uncategorized';

      if (!categoryMap.has(mainCategoryId)) {
        // Assign color based on main category or index if no specific color defined
        const categoryColor = mainCategory?.color || theme.palette.grey[500]; 

        categoryMap.set(mainCategoryId, {
          id: mainCategoryId,
          name: mainCategoryName,
          value: 0,
          count: 0,
          items: [],
          color: categoryColor // Color is now part of the type
        });
      }
      
      const group = categoryMap.get(mainCategoryId)!;
      group.items.push(expense);
      // Include both spent and pending amounts in the total value for the dashboard breakdown
      if (expense.status === 'paid' || expense.status === 'approved' || expense.status === 'pending') {
           group.value += expense.amount;
      }
      group.count += 1;
    });
    
    // Return as an array, sorted by value descending
    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

  }, [expenses, categoryMappings, theme]); // Add theme dependency for color fallback

  // Group expenses by contractor/vendor
  const expensesByContractor = useMemo(() => {
      // ... (This logic remains the same, grouping by subcontractorName or vendor)
     const contractorMap = new Map<string, { name: string, value: number, count: number, color: string }>();
    
    expenses.forEach(expense => {
       if (typeof expense.amount !== 'number') return;
 
       const name = expense.subcontractorName || expense.vendor || 'Unknown Contractor/Vendor';
 
       if (!contractorMap.has(name)) {
         // Add colors based on index for contractors
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
        theme.palette.grey[700],
      ];
         const color = colors[contractorMap.size % colors.length];
         contractorMap.set(name, { name, value: 0, count: 0, color });
       }
 
       const group = contractorMap.get(name)!;
       // Include both spent and pending
       if (expense.status === 'paid' || expense.status === 'approved' || expense.status === 'pending') {
            group.value += expense.amount;
       }
       group.count += 1;
     });
 
     return Array.from(contractorMap.values()).sort((a, b) => b.value - a.value);
  }, [expenses, theme]);

  // Get the current expense grouping data based on selected view
  const currentExpenseGroupingData = useMemo(() => {
    // Return type needs to match the structure used in the table
    const data = expenseGrouping === "category"
      ? expensesByCategory 
      : expensesByContractor;
      
    // Ensure the returned structure matches what the table expects 
    // (name, value, count - which it does now for both groupings)
    return data;

  }, [expenseGrouping, expensesByCategory, expensesByContractor]);

  // Handle toggle change for expense grouping
  const handleExpenseGroupingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGrouping: "category" | "contractor" | null,
  ) => {
    if (newGrouping !== null) {
      setExpenseGrouping(newGrouping);
    }
  };

  // Budget allocation by phase for visualization
  const phaseAllocation = useMemo(() => {
    // REMOVE hook start log
    // console.log("ENTERING phaseAllocation useMemo... ");
    if (!phases || !expenses) {
      // REMOVE log
      // console.log("phaseAllocation: Phases or expenses not available...");
      return [];
    }
    
    // REMOVE raw phase data log
    // console.log("RAW PHASES FOR KEY CHECK (inside useMemo):", ...);

    return phases
      .map((phase, index) => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
      ];
      
      // Calculate actual cost by summing expenses associated with this phase
        const phaseExpenses = expenses.filter(
          (expense) => expense.phaseId === phase.id,
        );
        const actualCost = phaseExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
      
      return {
        id: phase.id, // Keep id property
        name: phase.name,
        budget: phase.budget || 0,
        spent: actualCost,
        remaining: (phase.budget || 0) - actualCost,
          percentUsed:
            phase.budget && phase.budget > 0
              ? (actualCost / phase.budget) * 100
              : 0,
          color: colors[index % colors.length],
        };
      })
      .sort((a, b) => b.budget - a.budget); // Sort by budget size, largest first
  }, [phases, expenses, theme]);

  // Budget vs. Actual monthly data for trend visualization
  const monthlyTrends = useMemo(() => {
    if (!expenses) return [];
    
    // Group expenses by month
    const monthlyData: Record<
      string,
      { month: string; spent: number; projected: number }
    > = {};
    
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
    
    // Convert to array and sort by date
    const monthData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item, index, arr) => ({
        ...item,
        cumulative: arr
          .slice(0, index + 1)
          .reduce((sum, curr) => sum + curr.spent, 0),
      }));

    // Add projected expenses to future months
    if (workingProjections.length > 0) {
      // Group projections by category
      const projectionsByCategory = workingProjections.reduce(
        (acc, proj) => {
          if (!acc[proj.categoryId]) {
            acc[proj.categoryId] = 0;
          }
          acc[proj.categoryId] += proj.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Calculate total projection amount
      const totalProjectionAmount = Object.values(projectionsByCategory).reduce(
        (sum, amount) => sum + amount,
        0,
      );

      // Get the current month and next three months
      const currentDate = new Date();
      const futureMonths = [];

      // Add the current month if not already in trends
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const currentMonthExists = monthData.some((m) =>
        m.month.startsWith(currentMonthStr),
      );

      if (!currentMonthExists) {
        futureMonths.push({
          month: currentMonthStr,
          date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        });
      }

      // Add next three months
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + i,
          1,
        );
        const monthStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`;
        futureMonths.push({
          month: monthStr,
          date: futureDate,
        });
      }

      // Distribute projections over future months
      const projectionPerMonth =
        totalProjectionAmount / (futureMonths.length || 1);

      // Add or update trend data with projections
      futureMonths.forEach((futureMonth, index) => {
        const existingIndex = monthData.findIndex(
          (m) => m.month === futureMonth.month,
        );

        if (existingIndex >= 0) {
          // Update existing month
          monthData[existingIndex].projected =
            (monthData[existingIndex].projected || 0) +
            projectionPerMonth *
              (index === 0 ? 0.2 : index === 1 ? 0.3 : index === 2 ? 0.3 : 0.2);
      } else {
          // Add new month with projection
          monthData.push({
            month: futureMonth.month,
            spent: 0,
            cumulative:
              monthData.length > 0
                ? monthData[monthData.length - 1].cumulative
                : 0,
            projected:
              projectionPerMonth *
              (index === 0 ? 0.2 : index === 1 ? 0.3 : index === 2 ? 0.3 : 0.2),
          });
        }
      });

      // Sort to ensure chronological order
      monthData.sort((a, b) => a.month.localeCompare(b.month));
    }

    return monthData;
  }, [expenses, workingProjections]);

  // Update budget health calculation to include projections
  const budgetHealth = useMemo(() => {
    if (!project) {
      return {
        status: "Unknown",
        color: theme.palette.grey[500],
        icon: <HelpOutlineIcon />,
        advice: "",
      };
    }

    const { totalBudget, totalSpent, projectedTotal } = budgetSummary;
    
    // Avoid division by zero
    if (totalBudget === 0) {
      return {
        status: "No Budget",
        color: theme.palette.grey[500],
        icon: <HelpOutlineIcon />,
        advice: "",
      };
    }

    const spentPercentage = (totalSpent / totalBudget) * 100;
    const projectedPercentage = ((totalSpent + projectedTotal) / totalBudget) * 100;
    
    // Determine health status based on both actual and projected spending
    if (projectedPercentage > 120) {
      return {
        status: "Critical",
        color: theme.palette.error.dark,
        icon: <PriorityHighIcon />,
        advice: "Your project is significantly over budget or projected to greatly exceed budget. Comprehensive financial review and corrective actions are required urgently.",
      };
    } else if (projectedPercentage > 110) {
      return {
        status: "At Risk",
        color: theme.palette.error.main,
        icon: <WarningIcon />,
        advice: "Your project is projected to exceed budget by more than 10%. Immediate cost control measures are recommended.",
      };
    } else if (projectedPercentage > 100) {
      return {
        status: "Caution",
        color: theme.palette.warning.main,
        icon: <ReportProblemIcon />,
        advice: "Your project expenses plus projected costs are trending higher than expected. Review upcoming expenses and identify savings opportunities.",
      };
    } else if (projectedPercentage > 90) {
      return {
        status: "Near Limit",
        color: theme.palette.warning.light,
        icon: <InfoIcon />,
        advice: "Your project has utilized most of the allocated budget. Carefully manage remaining funds and review projections to prevent overruns.",
      };
    } else if (projectedPercentage > 60) {
      return {
        status: "On Track",
        color: theme.palette.success.main,
        icon: <CheckCircleIcon />,
        advice: "Your project is progressing as expected financially. Continue monitoring expenses and upcoming projected costs to maintain budget compliance.",
      };
    } else {
      return {
        status: "Healthy",
        color: theme.palette.success.dark,
        icon: <ThumbUpIcon />,
        advice: "Your project is well under budget and on track. Current spending patterns and projections indicate you may finish below the allocated budget.",
      };
    }
  }, [budgetSummary, project, theme.palette]);

  // Top expense items
  const topExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [expenses]);

  // Snackbar for feedback
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Use context loading state
  if (loading || mappingsLoading) {
    // REMOVE log
    // console.log("Rendering Loading state");
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Loading budget data...
        </Typography>
      </Box>
    );
  }

  // Use context error state
  if (error) {
    // REMOVE log
    // console.log("Rendering Error state:", error);
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Error loading budget data
        </Typography>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }

  // Use context project state
  if (!contextProject) { 
    // REMOVE log
    // console.log("Rendering Project Not Found state");
    // Early return ONLY after all hooks have been called
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Project not found</Typography>
      </Box>
    );
  }

  // REMOVE log before final return
  // console.log("Rendering BudgetDashboard main content");

  // **** ADD THE HANDLER FUNCTION ****
  const handleUpdateProjectionCategory = async (projectionId: string, newCategoryId: string) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot update projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot update: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }
    
    const currentRawProjections = contextProject.projections || [];
    const updatedRawProjections = currentRawProjections.map(p =>
      p.id === projectionId ? { ...p, categoryId: newCategoryId } : p
    );

    try {
      const projectRef = doc(db, 'projects', contextProject.id);
      const projectionsToSave = updatedRawProjections.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        amount: p.amount,
        notes: p.notes || null,
        createdAt: p.createdAt instanceof Date ? Timestamp.fromDate(p.createdAt) : p.createdAt 
      }));

      await updateDoc(projectRef, { 
        projections: projectionsToSave
      });

      setSnackbar({ open: true, message: 'Projection category updated successfully!', severity: 'success' });

      // **** TRIGGER CONTEXT REFRESH using existing function ****
      if (refreshAllProjectData) {
         console.log("Triggering context refreshAllProjectData after update...");
         await refreshAllProjectData(); // Tell the context to get fresh data
      } else {
         // This case should ideally not happen if context is set up correctly
         console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error saving updated projections:", err);
      setSnackbar({ open: true, message: 'Failed to save projection update.', severity: 'error' });
      throw err; // Re-throw error to allow child component to potentially handle it
    }
  };

  // **** Restore handleAddProjection ****
  const handleAddProjection = async (newProjectionData: Omit<BudgetProjection, 'id' | 'createdAt'>) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot add projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot add: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }

    const newProjection: BudgetProjection = {
      ...newProjectionData,
      id: `projection-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(), // Use current date
    };

    const currentRawProjections = contextProject.projections || [];
    const updatedRawProjections = [...currentRawProjections, newProjection];

    try {
      const projectRef = doc(db, 'projects', contextProject.id);
      const projectionsToSave = updatedRawProjections.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        amount: p.amount,
        notes: p.notes || null,
        createdAt: p.createdAt instanceof Date ? Timestamp.fromDate(p.createdAt) : p.createdAt 
      }));

      await updateDoc(projectRef, { 
        projections: projectionsToSave
      });
      
      setSnackbar({ open: true, message: 'Projection added successfully!', severity: 'success' });

      // **** TRIGGER CONTEXT REFRESH using existing function ****
      if (refreshAllProjectData) {
         console.log("Triggering context refreshAllProjectData after add...");
         await refreshAllProjectData(); // Tell the context to get fresh data
      } else {
         // This case should ideally not happen if context is set up correctly
         console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error adding projection:", err);
      setSnackbar({ open: true, message: 'Failed to add projection.', severity: 'error' });
      throw err; 
    }
  };

  // Handle deleting a projection
  const handleDeleteProjection = async (projectionId: string) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot delete projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot delete: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }

    // Filter out the projection to remove
    const currentRawProjections = contextProject.projections || [];
    const updatedRawProjections = currentRawProjections.filter(p => p.id !== projectionId);

    // Also update local state for optimistic UI update
    setLocalProjections(prev => prev.filter(p => p.id !== projectionId));

    try {
      const projectRef = doc(db, 'projects', contextProject.id);
      const projectionsToSave = updatedRawProjections.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        amount: p.amount,
        notes: p.notes || null,
        createdAt: p.createdAt instanceof Date ? Timestamp.fromDate(p.createdAt) : p.createdAt 
      }));

      await updateDoc(projectRef, { 
        projections: projectionsToSave
      });
      
      setSnackbar({ open: true, message: 'Projection deleted successfully!', severity: 'success' });

      // Trigger context refresh using existing function
      if (refreshAllProjectData) {
        console.log("Triggering context refreshAllProjectData after deletion...");
        await refreshAllProjectData(); // Tell the context to get fresh data
      } else {
        console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error deleting projection:", err);
      setSnackbar({ open: true, message: 'Failed to delete projection.', severity: 'error' });
      throw err;
    }
  };

  // Handle editing a projection
  const handleEditProjection = async (projectionId: string, updatedData: { amount: number; notes: string | null }) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot edit projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot edit: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }

    // Update the projection with new data
    const currentRawProjections = contextProject.projections || [];
    const updatedRawProjections = currentRawProjections.map(p =>
      p.id === projectionId ? { ...p, amount: updatedData.amount, notes: updatedData.notes } : p
    );

    // Also update local state for optimistic UI update
    setLocalProjections(prev => prev.map(p => 
      p.id === projectionId ? { ...p, amount: updatedData.amount, notes: updatedData.notes } : p
    ));

    try {
      const projectRef = doc(db, 'projects', contextProject.id);
      const projectionsToSave = updatedRawProjections.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        amount: p.amount,
        notes: p.notes || null,
        createdAt: p.createdAt instanceof Date ? Timestamp.fromDate(p.createdAt) : p.createdAt 
      }));

      await updateDoc(projectRef, { 
        projections: projectionsToSave
      });
      
      setSnackbar({ open: true, message: 'Projection updated successfully!', severity: 'success' });

      // Trigger context refresh using existing function
      if (refreshAllProjectData) {
        console.log("Triggering context refreshAllProjectData after edit...");
        await refreshAllProjectData(); // Tell the context to get fresh data
      } else {
        console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error updating projection:", err);
      setSnackbar({ open: true, message: 'Failed to update projection.', severity: 'error' });
      throw err;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Budget Overview Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Budget Overview
      </Typography>
        {/* **** FIX TS ERROR: Conditionally render button **** */}
        {contextProject && (
          <BudgetReportButton
            project={contextProject} // Now guaranteed to be non-null here
            expenses={expenses}
            phases={phases}
            bids={bids}
            projections={workingProjections} 
            variant="outlined"
            color="primary"
            size="medium"
          />
        )}
      </Box>
      
      {/* Budget Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* First Row - Key Budget Figures - Commented out as redundant */}
        {/*
        <Grid item xs={12}>
          <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ 
                p: 2.5, 
                borderRadius: 2, 
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, 0.7) 
              }}>
            <Typography variant="subtitle2" color="text.secondary">Total Budget</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {formatCurrency(budgetSummary.totalBudget)}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ 
                p: 2.5, 
                borderRadius: 2, 
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, 0.7) 
              }}>
            <Typography variant="subtitle2" color="text.secondary">Spent to Date</Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: theme.palette.primary.main }}>
              {formatCurrency(budgetSummary.totalSpent)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                    {budgetSummary.totalBudget > 0 
                      ? `${((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget used`
                      : '0.0% of budget used'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ 
                p: 2.5, 
                borderRadius: 2, 
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, 0.7) 
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" color="text.secondary">Pending Expenses</Typography>
                  <Tooltip 
                    title="Expenses submitted but not yet approved/paid" 
                    arrow
                  >
                    <InfoIcon fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                  </Tooltip>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: theme.palette.warning.main }}>
                  {formatCurrency(budgetSummary.pendingTotal)}
            </Typography>
                {budgetSummary.pendingTotal > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                      {budgetSummary.totalBudget > 0 
                        ? `${((budgetSummary.pendingTotal / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget`
                        : '0.0% of budget'}
              </Typography>
            </Box>
                )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ 
                p: 2.5, 
                borderRadius: 2, 
                height: '100%',
                bgcolor: alpha(theme.palette.background.paper, 0.7) 
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle2" color="text.secondary">Projected Costs</Typography>
                  <Tooltip 
                    title="Estimated future costs that haven't been recorded as expenses yet" 
                    arrow
                  >
                    <InfoIcon fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                  </Tooltip>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: theme.palette.info.main }}>
                  {formatCurrency(budgetSummary.projectedTotal)}
                </Typography>
                {budgetSummary.projectedTotal > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {budgetSummary.totalBudget > 0 
                        ? `${((budgetSummary.projectedTotal / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget`
                        : '0.0% of budget'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        */}

        {/* Second Row - Analysis Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Estimated Total Cost Card */}
            <Grid item xs={12} sm={6}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  height: "100%",
                  boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Estimated Total Cost
                  </Typography>
                  <Tooltip title="Current + Pending + Projected expenses" arrow>
                    <InfoIcon
                      fontSize="small"
                      color="action"
                      sx={{ fontSize: "0.9rem" }}
                    />
                  </Tooltip>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-end", mt: 1 }}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                      color:
                        budgetSummary.totalSpent +
                          budgetSummary.pendingTotal +
                          budgetSummary.projectedTotal >
                        budgetSummary.totalBudget
                          ? theme.palette.error.main
                          : theme.palette.success.main,
                    }}
                  >
                    {formatCurrency(
                      budgetSummary.totalSpent +
                        budgetSummary.pendingTotal +
                        budgetSummary.projectedTotal,
                    )}
            </Typography>
                </Box>

                {/* Budget usage breakdown */}
                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Budget Usage
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight="medium"
                      sx={{
                        color:
                          budgetSummary.projectedPercentage > 100
                            ? theme.palette.error.main
                            : theme.palette.text.secondary,
                      }}
                    >
                      {budgetSummary.totalBudget > 0
                        ? `${(((budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal) / budgetSummary.totalBudget) * 100).toFixed(1)}%`
                        : "0.0%"}
                  </Typography>
                </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(budgetSummary.projectedPercentage, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: alpha(theme.palette.grey[500], 0.1),
                      "& .MuiLinearProgress-bar": {
                        bgcolor:
                          budgetSummary.projectedPercentage > 100
                            ? theme.palette.error.main
                            : budgetSummary.projectedPercentage > 90
                              ? theme.palette.warning.main
                              : theme.palette.success.main,
                      },
                    }}
                  />
                </Box>

                {/* Detailed breakdown */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ mb: 1.5 }}
                  >
                    Detailed Breakdown:
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: theme.palette.primary.main,
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Current Expenses
                  </Typography>
                </Box>
                    <Typography variant="body2">
                      {formatCurrency(budgetSummary.totalSpent)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: theme.palette.warning.main,
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Pending Expenses
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatCurrency(budgetSummary.pendingTotal)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: theme.palette.info.main,
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Projected Costs
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatCurrency(budgetSummary.projectedTotal)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="subtitle2">Total</Typography>
                    <Typography variant="subtitle2">
                      {formatCurrency(
                        budgetSummary.totalSpent +
                          budgetSummary.pendingTotal +
                          budgetSummary.projectedTotal,
                      )}
                    </Typography>
            </Box>
                </Box>
              </Card>
            </Grid>

            {/* Budget Status Card */}
            <Grid item xs={12} sm={6}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  height: "100%",
                  boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.7),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Overall Budget Status
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", mt: 1, mb: 2 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(budgetHealth.color, 0.1),
                      color: budgetHealth.color,
                      width: 36,
                      height: 36,
                      mr: 2,
                    }}
                  >
                    {budgetHealth.icon}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: budgetHealth.color,
                        fontWeight: "bold",
                        lineHeight: 1.2,
                      }}
                    >
                      {budgetHealth.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {budgetSummary.totalBudget > 0
                        ? budgetSummary.totalSpent +
                            budgetSummary.pendingTotal +
                            budgetSummary.projectedTotal <=
                          budgetSummary.totalBudget
                          ? `Under budget by ${formatCurrency(budgetSummary.totalBudget - (budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal))}`
                          : `Over budget by ${formatCurrency(budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal - budgetSummary.totalBudget)}`
                        : "No budget set"}
                    </Typography>
                  </Box>
                </Box>

                {/* Simple budget meter */}
                <Box
                  sx={{
                    mb: 3,
                    px: 2,
                    py: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.4),
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Budget Spent + Pending + Projected
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight="medium"
                      sx={{
                        color:
                          budgetSummary.projectedPercentage > 100
                            ? theme.palette.error.main
                            : theme.palette.text.secondary,
                      }}
                    >
                      {budgetSummary.totalBudget > 0
                        ? `${(((budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal) / budgetSummary.totalBudget) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </Typography>
                  </Box>

                  {/* Stacked progress bar */}
                  <Box
                    sx={{
                      position: "relative",
                      height: 12,
                      bgcolor: alpha(theme.palette.grey[300], 0.3),
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* Current expenses */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${budgetSummary.totalBudget > 0 ? (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100 : 0}%`,
                        bgcolor: theme.palette.primary.main,
                        borderRadius: 2,
                      }}
                    />

                    {/* Pending expenses */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: `${budgetSummary.totalBudget > 0 ? (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100 : 0}%`,
                        top: 0,
                        height: "100%",
                        width: `${budgetSummary.totalBudget > 0 ? (budgetSummary.pendingTotal / budgetSummary.totalBudget) * 100 : 0}%`,
                        bgcolor: theme.palette.warning.main,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
                    />

                    {/* Projected expenses */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: `${budgetSummary.totalBudget > 0 ? ((budgetSummary.totalSpent + budgetSummary.pendingTotal) / budgetSummary.totalBudget) * 100 : 0}%`,
                        top: 0,
                        height: "100%",
                        width: `${budgetSummary.totalBudget > 0 ? (budgetSummary.projectedTotal / budgetSummary.totalBudget) * 100 : 0}%`,
                        bgcolor: theme.palette.info.main,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${alpha(theme.palette.info.dark, 0.5)} 5px, ${alpha(theme.palette.info.dark, 0.5)} 10px)`,
                      }}
                    />
                  </Box>

                  {/* Legend for stacked bar */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      mt: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mr: 2,
                        mb: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: theme.palette.primary.main,
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption">Current</Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mr: 2,
                        mb: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: theme.palette.warning.main,
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption">Pending</Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: theme.palette.info.main,
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption">Projected</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Recommendations section */}
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Key Recommendations:
                </Typography>
                <Box sx={{ pl: 1.5 }}>
                  {budgetSummary.projectedTotal > 0 &&
                    budgetHealth.status !== "Healthy" &&
                    budgetHealth.status !== "On Track" && (
                      <Box sx={{ display: "flex", mb: 1 }}>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{ display: "flex", alignItems: "flex-start" }}
                        >
                          <Box
                            component="span"
                            sx={{
                              mr: 1,
                              mt: 0.5,
                              color: theme.palette.info.main,
                            }}
                          >
                            •
                          </Box>
                          <Box component="span">
                            Review projected costs of{" "}
                            {formatCurrency(budgetSummary.projectedTotal)}
                          </Box>
                        </Typography>
                      </Box>
                    )}

                  {budgetSummary.pendingTotal > 0 &&
                    (budgetHealth.status === "At Risk" ||
                      budgetHealth.status === "Critical") && (
                      <Box sx={{ display: "flex", mb: 1 }}>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{ display: "flex", alignItems: "flex-start" }}
                        >
                          <Box
                            component="span"
                            sx={{
                              mr: 1,
                              mt: 0.5,
                              color: theme.palette.warning.main,
                            }}
                          >
                            •
                          </Box>
                          <Box component="span">
                            Review pending expenses of{" "}
                            {formatCurrency(budgetSummary.pendingTotal)}
                          </Box>
                        </Typography>
                      </Box>
                    )}

                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{ display: "flex", alignItems: "flex-start" }}
                    >
                      <Box component="span" sx={{ mr: 1, mt: 0.5 }}>
                        •
                      </Box>
                      <Box component="span">
                        {budgetHealth.status === "Healthy" &&
                          "Document cost management practices"}
                        {budgetHealth.status === "On Track" &&
                          "Monitor phases with higher spending"}
                        {(budgetHealth.status === "Near Limit" ||
                          budgetHealth.status === "Caution") &&
                          "Identify cost-saving opportunities"}
                        {(budgetHealth.status === "At Risk" ||
                          budgetHealth.status === "Critical") &&
                          "Conduct immediate financial review"}
                      </Box>
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex" }}>
                    <Typography
                      variant="body2"
                      component="div"
                      sx={{ display: "flex", alignItems: "flex-start" }}
                    >
                      <Box component="span" sx={{ mr: 1, mt: 0.5 }}>
                        •
                      </Box>
                      <Box component="span">
                        {budgetHealth.status === "Healthy" &&
                          "Consider allocating surplus to enhance quality"}
                        {budgetHealth.status === "On Track" &&
                          "Update projections based on actual spending"}
                        {(budgetHealth.status === "Near Limit" ||
                          budgetHealth.status === "Caution") &&
                          "Review all pending expenses for necessity"}
                        {(budgetHealth.status === "At Risk" ||
                          budgetHealth.status === "Critical") &&
                          "Consider budget increase or scope reduction"}
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Main content grid */}
      <Grid container spacing={3}>
        {/* Phase Budget Allocation */}
        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{
            borderRadius: 2, 
              height: "100%",
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            }}
          >
            <CardHeader
              title="Phase Budget Allocation"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Tooltip title="Add New Phase">
                  <IconButton>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Phase</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Budget
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Spent
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Remaining
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Usage
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* **** FINAL FIX: Revert key back to phase.id **** */}
                    {phaseAllocation.map((phase) => (
                      <TableRow
                        key={phase.id} // **** USE STABLE UNIQUE ID ****
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: "50%",
                                bgcolor: phase.color,
                                mr: 1,
                              }} 
                            />
                            {phase.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(phase.budget)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(phase.spent)}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color:
                              phase.remaining >= 0
                                ? theme.palette.success.main
                                : theme.palette.error.main,
                            fontWeight: "medium",
                          }}
                        >
                          {formatCurrency(phase.remaining)}
                        </TableCell>
                        <TableCell align="right" sx={{ width: "20%" }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(phase.percentUsed, 100)}
                              sx={{ 
                                flexGrow: 1,
                                mr: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(phase.color, 0.2),
                                ".MuiLinearProgress-bar": {
                                  bgcolor:
                                    phase.percentUsed > 100
                                    ? theme.palette.error.main 
                                    : phase.color,
                                },
                              }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {phase.percentUsed.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {phaseAllocation.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{ textAlign: "center", py: 3 }}
                        >
                          <Typography color="text.secondary">
                            No phases defined.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Expense Category Breakdown */}
        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{
            borderRadius: 2, 
              height: "100%",
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            }}
          >
            <CardHeader
              title={`Expense Breakdown by ${expenseGrouping === "category" ? "Category" : "Contractor"}`}
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ToggleButtonGroup
                    value={expenseGrouping}
                    exclusive
                    onChange={handleExpenseGroupingChange}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <ToggleButton value="category" aria-label="category">
                      <Tooltip title="Group by Category">
                        <CategoryIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="contractor" aria-label="contractor">
                      <Tooltip title="Group by Contractor">
                        <GroupWorkIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title="View All Expenses">
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              {currentExpenseGroupingData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={currentExpenseGroupingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={1}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${percent ? (percent * 100).toFixed(0) : "0"}%)`
                        }
                      >
                        {currentExpenseGroupingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Amount",
                        ]}
                        contentStyle={{
                          backgroundColor: alpha(
                            theme.palette.background.paper,
                            0.9,
                          ),
                          border: "none",
                          borderRadius: 8,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No expense data available.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* NEW: Add a detailed expense breakdown table grouped by the selected option */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
              mb: 3,
            }}
          >
            <CardHeader
              title={`Detailed Expense Breakdown by ${expenseGrouping === "category" ? "Category" : "Contractor"}`}
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {expenseGrouping === "category"
                          ? "Category"
                          : "Contractor"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Amount
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        % of Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Items
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentExpenseGroupingData.map((item) => {
                      const percentOfTotal =
                        budgetSummary.totalSpent > 0
                        ? (item.value / budgetSummary.totalSpent) * 100 
                        : 0;
                      
                      // Count number of expenses for this group
                      const itemCount = expenses.filter((exp) => {
                        if (expenseGrouping === "category") {
                          return (
                            exp.category === item.name.toLowerCase() ||
                            exp.category ===
                              item.name.toLowerCase().replace(" ", "_")
                          );
                        } else {
                          // For contractor view
                          const contractorName =
                            exp.subcontractorName ||
                            exp.vendor ||
                            "Direct Expense";
                          return contractorName === item.name;
                        }
                      }).length;
                      
                      return (
                        <TableRow key={item.name} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: "50%",
                                  bgcolor: item.color,
                                  mr: 1,
                                }} 
                              />
                              {item.name}
                            </Box>
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: "medium" }}
                          >
                            {formatCurrency(item.value)}
                          </TableCell>
                          <TableCell align="right">
                            {percentOfTotal.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">{itemCount}</TableCell>
                        </TableRow>
                      );
                    })}
                    {currentExpenseGroupingData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          sx={{ textAlign: "center", py: 3 }}
                        >
                          <Typography color="text.secondary">
                            No expense data available.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Expense Trend Chart - Commented out as requested */}
        {/* 
        <Grid item xs={12}>
          <Card elevation={0} sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardHeader
              title="Budget & Expense Trends"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {budgetSummary.projectedTotal > 0 && (
                    <Chip 
                      icon={<TimelineIcon fontSize="small" />} 
                      label="Includes Projections" 
                      size="small" 
                      color="info"
                      variant="outlined"
                      sx={{ mr: 2 }}
                    />
                  )}
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Add Expense
                </Button>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              {monthlyTrends.length > 0 ? (
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyTrends}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => {
                          // Format the value and customize the series name
                          return [
                            formatCurrency(value), 
                            name === 'projected' ? 'Projected Expenses' : 
                            name === 'spent' ? 'Monthly Expenses' : 
                            name === 'cumulative' ? 'Cumulative Expenses' : name
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: alpha(theme.palette.background.paper, 0.9),
                          border: 'none',
                          borderRadius: 8,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        labelFormatter={(label) => {
                          // Convert the month string to a more readable format
                          const [year, month] = label.split('-');
                          return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`;
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="spent" 
                        name="Monthly Expenses" 
                        fill={alpha(theme.palette.primary.main, 0.2)} 
                        stroke={theme.palette.primary.main} 
                        activeDot={{ r: 6 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        name="Cumulative Expenses" 
                        fill={alpha(theme.palette.secondary.main, 0.2)} 
                        stroke={theme.palette.secondary.main} 
                        activeDot={{ r: 6 }}
                      />
                      
                      <defs>
                        <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                        </linearGradient>
                        <pattern id="projectionPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="8" stroke={theme.palette.info.main} strokeWidth="1" />
                        </pattern>
                      </defs>
                      
                      {monthlyTrends.some(item => item.projected > 0) && (
                        <>
                          <Area 
                            type="monotone" 
                            dataKey="projected" 
                            name="Projected Expenses" 
                            fill="url(#projectionGradient)"
                            stroke="none"
                            activeDot={false}
                            isAnimationActive={false}
                            fillOpacity={0.3}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                            name="Projected Expenses" 
                            stroke={theme.palette.info.main} 
                            strokeWidth={2}
                        strokeDasharray="5 5"
                            activeDot={{ r: 6, stroke: theme.palette.info.dark, strokeWidth: 1 }}
                            dot={{ stroke: theme.palette.info.main, fill: theme.palette.background.paper, r: 3 }}
                          />
                        </>
                      )}
                      
                      <ReferenceLine 
                        y={budgetSummary.totalBudget} 
                        stroke={theme.palette.error.main}
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'Total Budget', 
                          position: 'right',
                          fill: theme.palette.error.main,
                          fontSize: 12
                        }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography color="text.secondary">No expense trend data available.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        */}
        
        {/* Top Expenses */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
            borderRadius: 2,
              height: "100%",
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            }}
          >
            <CardHeader
              title="Top Expenses"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Tooltip title="View All Expenses">
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Description
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Category
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topExpenses.map((expense) => (
                      <TableRow
                        key={expense.id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={expense.category.replace("_", " ")}
                            sx={{ 
                              textTransform: "capitalize",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {typeof expense.date === "string"
                            ? expense.date 
                            : formatDate(expense.date)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "medium" }}>
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topExpenses.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          sx={{ textAlign: "center", py: 3 }}
                        >
                          <Typography color="text.secondary">
                            No expenses recorded.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Budget Health & Recommendations */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
            borderRadius: 2,
              height: "100%",
            boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            }}
          >
            <CardHeader
              title="Budget Health Analysis"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              avatar={
                <Avatar sx={{ bgcolor: budgetHealth.color }}>
                  {budgetHealth.icon}
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Typography
                variant="h5"
                sx={{ mb: 2, color: budgetHealth.color, fontWeight: "bold" }}
              >
                {budgetHealth.status}
              </Typography>

              {/* Add projection indicator if we have projections */}
              {budgetSummary.projectedTotal > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.light, 0.1),
                    border: `1px dashed ${theme.palette.info.main}`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Current
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {budgetSummary.totalBudget > 0
                        ? (
                            (budgetSummary.totalSpent /
                              budgetSummary.totalBudget) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      budgetSummary.totalBudget > 0
                        ? (budgetSummary.totalSpent /
                            budgetSummary.totalBudget) *
                          100
                        : 0
                    }
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      With Projections
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {budgetSummary.totalBudget > 0
                        ? (
                            ((budgetSummary.totalSpent +
                              budgetSummary.projectedTotal) /
                              budgetSummary.totalBudget) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      budgetSummary.totalBudget > 0
                        ? ((budgetSummary.totalSpent +
                            budgetSummary.projectedTotal) /
                            budgetSummary.totalBudget) *
                          100
                        : 0
                    }
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      "& .MuiLinearProgress-bar": {
                        backgroundImage: `repeating-linear-gradient(45deg, ${theme.palette.info.main} 0, ${theme.palette.info.main} 8px, ${alpha(theme.palette.info.main, 0.8)} 8px, ${alpha(theme.palette.info.main, 0.8)} 16px)`,
                      },
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" paragraph>
                  {budgetHealth.status === "Healthy" &&
                    "Your project is well under budget and on track. Current spending patterns and projections indicate you may finish below the allocated budget."}
                  {budgetHealth.status === "On Track" &&
                    "Your project is progressing as expected financially. Continue monitoring expenses and upcoming projected costs to maintain budget compliance."}
                  {budgetHealth.status === "Near Limit" &&
                    "Your project has utilized most of the allocated budget. Carefully manage remaining funds and review projections to prevent overruns."}
                  {budgetHealth.status === "Caution" &&
                    "Your project expenses plus projected costs are trending higher than expected. Review upcoming expenses and identify savings opportunities."}
                  {budgetHealth.status === "At Risk" &&
                    "Your project is projected to exceed budget by more than 10%. Immediate cost control measures are recommended."}
                  {budgetHealth.status === "Critical" &&
                    "Your project is significantly over budget or projected to greatly exceed budget. Comprehensive financial review and corrective actions are required urgently."}
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Recommendations:
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                {/* Projection-specific recommendations */}
                {budgetSummary.projectedTotal > 0 &&
                  budgetHealth.status !== "Healthy" &&
                  budgetHealth.status !== "On Track" && (
                    <Typography
                      component="li"
                      variant="body2"
                      sx={{ mb: 1, color: theme.palette.info.main }}
                    >
                      Review projected costs of{" "}
                      {formatCurrency(budgetSummary.projectedTotal)} for
                      potential savings
                    </Typography>
                  )}

                {/* Standard recommendations based on health status */}
                {budgetHealth.status === "Healthy" && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Consider allocating surplus to enhance project quality or
                      features
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Document effective cost management practices for future
                      projects
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Continue regular financial reviews to maintain budget
                      health
                    </Typography>
                  </>
                )}
                
                {budgetHealth.status === "On Track" && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Monitor phases with higher spending percentages
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Review upcoming expenses for potential savings
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Update cashflow projections based on actual spending
                    </Typography>
                  </>
                )}
                
                {(budgetHealth.status === "Near Limit" ||
                  budgetHealth.status === "Caution") && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Review all pending expenses for necessity and timing
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Identify cost-saving opportunities in remaining work
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Consider reallocating budget from under-spending phases
                    </Typography>
                  </>
                )}
                
                {(budgetHealth.status === "At Risk" ||
                  budgetHealth.status === "Critical") && (
                  <>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Conduct immediate comprehensive financial review
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Pause non-essential expenses and renegotiate pending
                      contracts
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Prepare budget variance report for stakeholders
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Consider requesting budget increase or scope reduction
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add a CTA card for projections when none exist */}
      {budgetSummary.projectedTotal === 0 && (
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
              mb: 3,
            }}
          >
            <CardContent
              sx={{
                p: 3,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ mb: { xs: 2, md: 0 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="info.main"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <TimelineIcon sx={{ mr: 1 }} />
                  Enhance Your Budget with Projections
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add projected costs to categories to anticipate future
                  expenses and improve budget planning. Projections help
                  identify potential budget gaps and improve financial
                  forecasting.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="info"
                size="large"
                startIcon={<AddIcon />}
                onClick={() =>
                  document
                    .getElementById("budget-allocation-tracker")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{ minWidth: 200 }}
              >
                Add Projections
              </Button>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Add Projections Summary Section if projections exist */}
      {budgetSummary.projectedTotal > 0 && (
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
              mb: 3,
            }}
          >
            <CardHeader
              title="Projected Costs Summary"
              titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
              action={
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<TimelineIcon />}
                  onClick={() =>
                    document
                      .getElementById("budget-allocation-tracker")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Manage Projections
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Box sx={{ py: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Projections By Category
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell align="right">Date Added</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workingProjections
                        .filter(projection => 
                          projection.categoryId && 
                          projection.categoryId !== 'uncategorized' && 
                          getCategoryById(projection.categoryId) !== undefined
                        )
                        .map((projection) => {
                          // Find the category name by ID
                          const category = getCategoryById(projection.categoryId);
                          const categoryName = category ? category.name : "Unknown Category";

                          return (
                            <TableRow key={projection.id}>
                              <TableCell>
                                <Typography variant="body2">
                                  {categoryName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {projection.notes || "No notes provided"}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {formatDate(projection.createdAt)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "medium",
                                    color: "info.main",
                                  }}
                                >
                                  {formatCurrency(projection.amount)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                      {/* Show message when no categorized projections */}
                      {workingProjections.filter(p => 
                        p.categoryId && 
                        p.categoryId !== 'uncategorized' && 
                        getCategoryById(p.categoryId) !== undefined
                      ).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary">
                              No categorized projections available. Please categorize your projections.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Total row - only show if there are categorized projections */}
                      {workingProjections.filter(p => 
                        p.categoryId && 
                        p.categoryId !== 'uncategorized' && 
                        getCategoryById(p.categoryId) !== undefined
                      ).length > 0 && (
                        <TableRow>
                          <TableCell sx={{ borderBottom: "none" }}></TableCell>
                          <TableCell sx={{ borderBottom: "none" }}></TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: "bold", borderBottom: "none" }}
                          >
                            Total Categorized:
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: "bold",
                              color: "info.main",
                              borderBottom: "none",
                            }}
                          >
                            {formatCurrency(
                              workingProjections
                                .filter(p => 
                                  p.categoryId && 
                                  p.categoryId !== 'uncategorized' && 
                                  getCategoryById(p.categoryId) !== undefined
                                )
                                .reduce((sum, p) => sum + p.amount, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Check if there are any uncategorized projections */}
              {workingProjections.filter(p => 
                !p.categoryId || 
                p.categoryId === 'uncategorized' || 
                getCategoryById(p.categoryId) === undefined
              ).length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.light, 0.1), borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    <WarningIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Uncategorized Projections
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {workingProjections.filter(p => 
                      !p.categoryId || 
                      p.categoryId === 'uncategorized' || 
                      getCategoryById(p.categoryId) === undefined
                    ).length} projection(s) totaling {formatCurrency(
                      workingProjections
                        .filter(p => 
                          !p.categoryId || 
                          p.categoryId === 'uncategorized' || 
                          getCategoryById(p.categoryId) === undefined
                        )
                        .reduce((sum, p) => sum + p.amount, 0)
                    )} are not assigned to valid categories.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="warning" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() =>
                      document
                        .getElementById("budget-allocation-tracker")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Categorize Projections
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
      
      {/* --- Projections Section --- */}
      {workingProjections && workingProjections.length > 0 && (
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <Divider />
            <CardContent>
              <Box sx={{ py: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Projections By Main Category {/* Updated Title */}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Main Category</TableCell> {/* Updated Header */}
                        {/* Remove Notes and Date Added? */}
                        {/* <TableCell>Notes</TableCell> */}
                        {/* <TableCell align="right">Date Added</TableCell> */}
                        <TableCell align="right">Total Projected</TableCell> {/* Updated Header */}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Map over the new grouped data */}
                      {projectionsByMainCategory.map((group, index) => (
                        <TableRow key={`${group.name}-${index}`}> 
                          <TableCell>
                            <Typography variant="body2">
                              {group.name} {/* Display main category name */}
                            </Typography>
                          </TableCell>
                          {/* Removed Notes/Date cells */}
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "medium",
                                color: "info.main",
                              }}
                            >
                              {formatCurrency(group.totalAmount)} {/* Display grouped amount */}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Total row - Remains the same */}
                      <TableRow>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: "bold", borderBottom: "none" }}
                          // colSpan={2} // Adjust colSpan if columns removed
                        >
                          Total Projected:
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: "bold",
                            color: "info.main",
                            borderBottom: "none",
                          }}
                        >
                          {formatCurrency(budgetSummary.projectedTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
      {/* --- End Projections Section --- */}
      
      {/* Add Budget Allocation Tracker here, right before the final closing tag */}
      <div id="budget-allocation-tracker">
      <BudgetAllocationTracker 
        project={contextProject} 
        phases={phases}
        expenses={expenses}
        bids={bids}
        projections={workingProjections} 
        onAddProjection={handleAddProjection} // **** PASS ADD HANDLER ****
        onUpdateProjectionCategory={handleUpdateProjectionCategory} 
        onDeleteProjection={handleDeleteProjection} // **** PASS DELETE HANDLER ****
        onEditProjection={handleEditProjection} // **** PASS EDIT HANDLER ****
      />
      </div>

      {/* Snackbar for feedback */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetDashboard; 
