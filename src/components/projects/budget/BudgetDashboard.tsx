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
  CircularProgress,
  Stack,
  Badge,
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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

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
  Treemap,
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

interface BudgetDashboardProps {}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  projectedTotal: number;
  projectedRemaining: number;
  projectedPercentage: number;
  pendingTotal: number;
}

interface BudgetHealth {
  status: string;
  color: string;
  icon: React.ReactElement;
  advice: string;
}

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
      refreshAllProjectData
  } = useProjectDetail();

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
  
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [mappingsLoading, setMappingsLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [expenseGrouping, setExpenseGrouping] = useState<'category' | 'contractor'>('category');
  const [localProjections, setLocalProjections] = useState<BudgetProjection[]>([]);
  const [categoryDisplay, setCategoryDisplay] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    if (projections?.length > 0) {
      setLocalProjections(projections);
    }
  }, [projections]);

  const workingProjections = localProjections.length > 0 ? localProjections : projections;

  const projectionsByMainCategory = useMemo(() => {
    if (!workingProjections || workingProjections.length === 0) {
      return [];
    }
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

  useEffect(() => {
    if (projectId) {
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
  }, [projectId]);

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
        : project.budget?.total || 0;

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
      projectedTotal: calculatedProjectionTotal,
      projectedRemaining,
      projectedPercentage,
      pendingTotal,
    };
  }, [project, expenses, workingProjections]);

  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, { 
      id: string; 
      name: string; 
      value: number; 
      count: number; 
      items: Expense[]; 
      color: string;
    }>();

    const getExpenseCategoryId = (expense: Expense): string => {
        if (expense.id && categoryMappings[expense.id]) {
          return categoryMappings[expense.id];
        }
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
      if (!expense.id || typeof expense.amount !== 'number') return;
      
      const detailedCategoryId = getExpenseCategoryId(expense);
      const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
      const mainCategoryId = mainCategory?.id || 'uncategorized';
      const mainCategoryName = mainCategory?.name || 'Uncategorized';

      if (!categoryMap.has(mainCategoryId)) {
        const categoryColor = mainCategory?.color || theme.palette.grey[500]; 

        categoryMap.set(mainCategoryId, {
          id: mainCategoryId,
          name: mainCategoryName,
          value: 0,
          count: 0,
          items: [],
          color: categoryColor
        });
      }
      
      const group = categoryMap.get(mainCategoryId)!;
      group.items.push(expense);
      if (expense.status === 'paid' || expense.status === 'approved' || expense.status === 'pending') {
           group.value += expense.amount;
      }
      group.count += 1;
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);

  }, [expenses, categoryMappings, theme]);

  const expensesByContractor = useMemo(() => {
     const contractorMap = new Map<string, { name: string, value: number, count: number, color: string }>();
    
    expenses.forEach(expense => {
       if (typeof expense.amount !== 'number') return;
 
       const name = expense.subcontractorName || expense.vendor || 'Unknown Contractor/Vendor';
 
       if (!contractorMap.has(name)) {
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
       if (expense.status === 'paid' || expense.status === 'approved' || expense.status === 'pending') {
            group.value += expense.amount;
       }
       group.count += 1;
     });
 
     return Array.from(contractorMap.values()).sort((a, b) => b.value - a.value);
  }, [expenses, theme]);

  const currentExpenseGroupingData = useMemo(() => {
    const data = expenseGrouping === "category"
      ? expensesByCategory 
      : expensesByContractor;
      
    return data;

  }, [expenseGrouping, expensesByCategory, expensesByContractor]);

  const handleExpenseGroupingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGrouping: "category" | "contractor" | null,
  ) => {
    if (newGrouping !== null) {
      setExpenseGrouping(newGrouping);
    }
  };

  const phaseAllocation = useMemo(() => {
    if (!phases || !expenses) {
      return [];
    }
    
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
      
        const phaseExpenses = expenses.filter(
          (expense) => expense.phaseId === phase.id,
        );
        const actualCost = phaseExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
      
      return {
        id: phase.id,
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
      .sort((a, b) => b.budget - a.budget);
  }, [phases, expenses, theme]);

  const monthlyTrends = useMemo(() => {
    if (!expenses) return [];
    
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
    
    const monthData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item, index, arr) => ({
        ...item,
        cumulative: arr
          .slice(0, index + 1)
          .reduce((sum, curr) => sum + curr.spent, 0),
      }));

    if (workingProjections.length > 0) {
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

      const totalProjectionAmount = Object.values(projectionsByCategory).reduce(
        (sum, amount) => sum + amount,
        0,
      );

      const currentDate = new Date();
      const futureMonths = [];

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

      const projectionPerMonth =
        totalProjectionAmount / (futureMonths.length || 1);

      futureMonths.forEach((futureMonth, index) => {
        const existingIndex = monthData.findIndex(
          (m) => m.month === futureMonth.month,
        );

        if (existingIndex >= 0) {
          monthData[existingIndex].projected =
            (monthData[existingIndex].projected || 0) +
            projectionPerMonth *
              (index === 0 ? 0.2 : index === 1 ? 0.3 : index === 2 ? 0.3 : 0.2);
      } else {
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

      monthData.sort((a, b) => a.month.localeCompare(b.month));
    }

    return monthData;
  }, [expenses, workingProjections]);

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

  const topExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [expenses]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading || mappingsLoading) {
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

      if (refreshAllProjectData) {
         console.log("Triggering context refreshAllProjectData after update...");
         await refreshAllProjectData();
      } else {
         console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error saving updated projections:", err);
      setSnackbar({ open: true, message: 'Failed to save projection update.', severity: 'error' });
      throw err;
    }
  };

  const handleAddProjection = async (newProjectionData: Omit<BudgetProjection, 'id' | 'createdAt'>) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot add projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot add: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }

    const newProjection: BudgetProjection = {
      ...newProjectionData,
      id: `projection-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
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

      if (refreshAllProjectData) {
         console.log("Triggering context refreshAllProjectData after add...");
         await refreshAllProjectData();
      } else {
         console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error adding projection:", err);
      setSnackbar({ open: true, message: 'Failed to add projection.', severity: 'error' });
      throw err; 
    }
  };

  const handleDeleteProjection = async (projectionId: string) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot delete projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot delete: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }

    const currentRawProjections = contextProject.projections || [];
    const updatedRawProjections = currentRawProjections.filter(p => p.id !== projectionId);

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

      if (refreshAllProjectData) {
        console.log("Triggering context refreshAllProjectData after deletion...");
        await refreshAllProjectData();
      } else {
        console.warn("ProjectDetailContext did not provide refreshAllProjectData! UI might be stale.");
      }

    } catch (err) {
      console.error("Error deleting projection:", err);
      setSnackbar({ open: true, message: 'Failed to delete projection.', severity: 'error' });
      throw err;
    }
  };

  const handleEditProjection = async (projectionId: string, updatedData: { amount: number; notes: string | null }) => {
    if (!contextProject || !contextProject.id) {
      console.error("Cannot edit projection: Project context data missing.");
      setSnackbar({ open: true, message: 'Cannot edit: Project data missing.', severity: 'error' });
      throw new Error("Project context data missing");
    }

    const currentRawProjections = contextProject.projections || [];
    const updatedRawProjections = currentRawProjections.map(p =>
      p.id === projectionId ? { ...p, amount: updatedData.amount, notes: updatedData.notes } : p
    );

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

      if (refreshAllProjectData) {
        console.log("Triggering context refreshAllProjectData after edit...");
        await refreshAllProjectData();
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
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
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
            {contextProject && (
              <BudgetReportButton
                project={contextProject}
                expenses={expenses}
                phases={phases}
                bids={bids}
                projections={workingProjections} 
                variant="outlined"
                size="medium"
              />
            )}
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            size="medium"
            onClick={() => document.getElementById("budget-allocation-tracker")?.scrollIntoView({ behavior: "smooth" })}
          >
            Add Projection
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card 
            elevation={0} 
            sx={{ 
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha(budgetHealth.color, 0.3)}`,
              bgcolor: alpha(budgetHealth.color, 0.05)
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(budgetHealth.color, 0.2),
                    color: budgetHealth.color,
                    width: 56,
                    height: 56,
                    mr: 2,
                  }}
                >
                  {budgetHealth.icon}
                </Avatar>
                
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Budget Health
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                      color: budgetHealth.color,
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
              
              <Box sx={{ flex: 1, minWidth: 300 }}>
                {budgetHealth.advice && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <InfoIcon 
                      fontSize="small" 
                      sx={{ 
                        verticalAlign: 'middle', 
                        mr: 0.5,
                        color: theme.palette.info.main
                      }}
                    />
                    {budgetHealth.advice}
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
                    Total Budget: {formatCurrency(budgetSummary.totalBudget)}
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
                        width: `${budgetSummary.totalBudget > 0 ? (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100 : 0}%`,
                        bgcolor: theme.palette.primary.main,
                        borderRadius: 2,
                      }}
                    />

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
                        borderTopRightRadius: 2,
                        borderBottomRightRadius: 2,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">
                      0%
                    </Typography>
                    <Typography variant="caption">
                      {budgetSummary.totalBudget > 0 
                        ? `${((budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal) / budgetSummary.totalBudget * 100).toFixed(1)}%`
                        : '0%'} Used
                    </Typography>
                    <Typography variant="caption">
                      100%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: theme.palette.primary.main,
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption">Paid</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: theme.palette.warning.main,
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption">Pending</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: theme.palette.info.main,
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption">Projected</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 2, 
            height: '100%',
            bgcolor: 'background.paper',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" color="text.secondary">Total Budget</Typography>
              <Tooltip 
                title="Total budget allocated for this project" 
                arrow
              >
                <InfoIcon fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
              </Tooltip>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
              {formatCurrency(budgetSummary.totalBudget)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {project?.budget && typeof project.budget === 'object' && project.budget.contingency ? 
                `Includes ${project.budget.contingency}% contingency` : 
                'No contingency set'}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 2, 
            height: '100%',
            bgcolor: 'background.paper',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" color="text.secondary">Current Expenses</Typography>
              <Tooltip 
                title="Total amount already paid or approved" 
                arrow
              >
                <InfoIcon fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
              </Tooltip>
            </Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {formatCurrency(budgetSummary.totalSpent)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {budgetSummary.totalBudget > 0 
                ? `${((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget used`
                : '0.0% of budget used'}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 2, 
            height: '100%',
            bgcolor: 'background.paper',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
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
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
              {formatCurrency(budgetSummary.pendingTotal)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {budgetSummary.totalBudget > 0 
                ? `${((budgetSummary.pendingTotal / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget`
                : '0.0% of budget'}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ 
            p: 2.5, 
            borderRadius: 2, 
            height: '100%',
            bgcolor: 'background.paper',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
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
            <Typography variant="caption" color="text.secondary">
              {budgetSummary.totalBudget > 0 
                ? `${((budgetSummary.projectedTotal / budgetSummary.totalBudget) * 100).toFixed(1)}% of budget`
                : '0.0% of budget'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardHeader
              title="Expense Distribution by Category"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
              action={
                <ToggleButtonGroup
                  size="small"
                  value={categoryDisplay}
                  exclusive
                  onChange={(e, value) => value && setCategoryDisplay(value)}
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
                  {categoryDisplay === 'summary' ? (
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
                      data={expensesByCategory.map(item => ({ name: item.name, value: item.value }))}
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
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <CategoryIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No expenses found for this project
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Add expenses to see category distribution
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2, 
              height: '100%',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardHeader
              title="Monthly Expense Trend"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'medium' }}
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
                      tickFormatter={(value) => `$${value/1000}k`}
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
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <TimelineIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No monthly expense data yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Add expenses with dates to see trends
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <div id="budget-allocation-tracker" style={{ scrollMarginTop: '80px' }}>
        <BudgetAllocationTracker 
          project={contextProject} 
          phases={phases}
          expenses={expenses}
          bids={bids}
          projections={workingProjections} 
          onAddProjection={handleAddProjection}
          onUpdateProjectionCategory={handleUpdateProjectionCategory} 
          onDeleteProjection={handleDeleteProjection}
          onEditProjection={handleEditProjection}
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
