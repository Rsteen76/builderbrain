import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Box, 
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  alpha,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  DownloadOutlined as DownloadIcon,
  PrintOutlined as PrintIcon,
  ShareOutlined as ShareIcon,
  FullscreenOutlined as FullscreenIcon,
  WarningAmber as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PieChart as PieChartIcon,
  StackedBarChart as StackedBarChartIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Email as EmailIcon,
  Link as LinkIcon,
  FileCopy as CopyIcon,
  PictureAsPdf as PdfIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as ContentCopyIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';
import { Project, Expense, ProjectPhase, Bid, BudgetProjection } from '../../../types';
import { formatCurrency, formatDate, formatPercentage } from '../../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReportService from '../../../services/ReportService';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategoryMappingsForProject } from '../../../services/category.service';
import { 
  MAIN_CATEGORIES, 
  getCategoryById, 
  getSubcategories, 
  getParentCategory, 
  mapSimpleToDetailedCategory 
} from '../../../data/hierarchicalCategories';
import { Category, CategoryMapping } from '../../../types/category.types';

// Props interface
interface BudgetReportProps {
  project: Project | null;
  expenses: Expense[];
  phases: ProjectPhase[];
  bids: Bid[];
  projections: BudgetProjection[];
  onClose?: () => void;
}

const BudgetReport: React.FC<BudgetReportProps> = ({ 
  project, 
  expenses, 
  phases, 
  bids,
  projections,
  onClose 
}) => {
  const theme = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const { user } = useAuth();
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  const [mappingsLoading, setMappingsLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Add effect to load user preferences
  useEffect(() => {
    if (project?.id) {
      setMappingsLoading(true);
      getCategoryMappingsForProject(project.id)
        .then((mappings) => {
          setCategoryMappings(mappings);
        })
        .catch((error) => {
          console.error("Error loading category mappings for report:", error);
          setSnackbar({ open: true, message: 'Error loading category data', severity: 'error' });
        })
        .finally(() => {
          setMappingsLoading(false);
        });
    } else {
      setCategoryMappings({});
      setMappingsLoading(false);
    }
  }, [project?.id]);

  // Calculate budget summary
  const budgetSummary = React.useMemo(() => {
    if (!project) {
      return { 
        totalBudget: 0, 
        totalSpent: 0, 
        pendingTotal: 0,
        remainingBudget: 0, 
        projectedTotal: 0, 
        projectedRemaining: 0,
        projectedPercentage: 0,
        spentPercentage: 0,
        pendingPercentage: 0
      };
    }

    const totalBudget = typeof project.budget === 'number' 
      ? project.budget 
      : project.budget?.total || 0;
    
    const totalSpent = expenses
      .filter(expense => expense.status === 'paid' || expense.status === 'approved')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate pending expenses (submitted but not approved/paid)
    const pendingTotal = expenses
      .filter(expense => expense.status === 'pending')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate projected total from projections array
    const projectionTotal = projections.reduce((sum, projection) => sum + projection.amount, 0);
    
    // Calculate remaining budget (without projections)
    const remainingBudget = totalBudget - totalSpent;
    
    // Calculate projected remaining after accounting for projections and pending expenses
    const projectedRemaining = remainingBudget - projectionTotal - pendingTotal;
    
    // Calculate percentage metrics
    const spentPercentage = totalBudget > 0 
      ? (totalSpent / totalBudget) * 100
      : 0;
      
    const pendingPercentage = totalBudget > 0
      ? (pendingTotal / totalBudget) * 100
      : 0;
      
    // Match dashboard calculation - include pending in the projected percentage
    const projectedPercentage = totalBudget > 0
      ? ((totalSpent + pendingTotal + projectionTotal) / totalBudget) * 100
      : 0;
    
    return {
      totalBudget,
      totalSpent,
      pendingTotal,
      remainingBudget,
      projectedTotal: projectionTotal,
      projectedRemaining,
      spentPercentage,
      pendingPercentage,
      projectedPercentage,
    };
  }, [project, expenses, projections]);

  // Prepare data for the spending status pie chart
  const spendingStatusData = React.useMemo(() => {
    return [
      { name: 'Spent', value: budgetSummary.totalSpent, color: theme.palette.primary.main },
      { name: 'Pending', value: budgetSummary.pendingTotal, color: theme.palette.warning.main },
      { name: 'Projected', value: budgetSummary.projectedTotal, color: theme.palette.info.main },
      { name: 'Remaining', value: Math.max(0, budgetSummary.projectedRemaining), color: theme.palette.success.main }
    ].filter(item => item.value > 0);
  }, [budgetSummary, theme]);

  // REFACTORED: Group expenses and projections by hierarchical main category
  const expensesByCategory = useMemo(() => {
    // Define the structure for grouped data
    const categoryMap = new Map<string, { 
      name: string; // Main category name
      spent: number;
      pending: number;
      projected: number;
      total: number;
      items: Array<Expense | BudgetProjection>; // Store original items for drill-down?
    }>();

    // Helper function to determine category ID for an item
    // (Leverages mappings and fallback logic)
    const getItemCategoryId = (item: Partial<Expense | BudgetProjection>): string => {
        if (item.id && categoryMappings[item.id]) {
          return categoryMappings[item.id];
        }
        // Fallback using mapSimpleToDetailedCategory for uncategorized items
        try {
            let itemTypeHint = 'other';
            if ('category' in item && item.category) itemTypeHint = item.category;
            else if ('categoryId' in item && item.categoryId) itemTypeHint = 'projection'; // Identify projections

            const itemDescription = ('description' in item ? item.description : ('notes' in item ? item.notes : '')) || '';
            const vendorOrSub = ('subcontractorName' in item ? item.subcontractorName : undefined) || ('vendor' in item ? item.vendor : '') || '';
            
            return mapSimpleToDetailedCategory(itemTypeHint, vendorOrSub, itemDescription);
        } catch (e) { 
            console.error("Mapping error in getItemCategoryId:", e);
            return 'uncategorized';
        }
    };

    // Process expenses
    expenses.forEach(expense => {
      if (!expense.id) return; // Need ID for mapping
      const detailedCategoryId = getItemCategoryId(expense);
      const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
      const mainCategoryId = mainCategory?.id || 'uncategorized';
      const mainCategoryName = mainCategory?.name || 'Uncategorized';

      if (!categoryMap.has(mainCategoryId)) {
        categoryMap.set(mainCategoryId, {
          name: mainCategoryName,
          spent: 0,
          pending: 0,
          projected: 0,
          total: 0,
          items: []
        });
      }
      
      const group = categoryMap.get(mainCategoryId)!;
      group.items.push(expense);
      if (expense.amount) {
        if (expense.status === 'paid' || expense.status === 'approved') {
          group.spent += expense.amount;
        } else if (expense.status === 'pending') {
          group.pending += expense.amount;
        }
        group.total += expense.amount; 
      }
    });
    
    // Process projections
    projections.forEach(projection => {
      const detailedCategoryId = projection.categoryId || 'uncategorized'; 
      const mainCategory = getParentCategory(detailedCategoryId) || getCategoryById(detailedCategoryId);
      const mainCategoryId = mainCategory?.id || 'uncategorized';
      const mainCategoryName = mainCategory?.name || 'Uncategorized';

      if (!categoryMap.has(mainCategoryId)) {
        categoryMap.set(mainCategoryId, {
          name: mainCategoryName,
          spent: 0,
          pending: 0,
          projected: 0,
          total: 0,
          items: []
        });
      }
      
      const group = categoryMap.get(mainCategoryId)!;
      // Optionally add projection to items array if needed for display
      // group.items.push(projection); 
      if (projection.amount) {
        group.projected += projection.amount;
        group.total += projection.amount; 
      }
    });
    
    // Return the final grouped categories, sorted by total amount
    return Array.from(categoryMap.values())
      .filter(category => category.total > 0) // Only include categories with some value
      .sort((a, b) => b.total - a.total); // Sort descending by total

  }, [expenses, projections, categoryMappings]); // Depend on mappings

  // Prepare data for the category spending chart (using the refactored data)
  const categoryChartData = React.useMemo(() => {
    // Map the new expensesByCategory structure
    return expensesByCategory
      .slice(0, 8) // Keep showing top 8 main categories
      .map(category => ({
        name: category.name,
        spent: category.spent,
        pending: category.pending,
        projected: category.projected
      }));
  }, [expensesByCategory]);

  // Handle print functionality
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  // Handle export (this would use a PDF library like jspdf in a real implementation)
  const handleExport = async () => {
    try {
      setIsPrinting(true); // Reuse the printing state for export
      
      // Wait a moment for any state updates to render
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!reportRef.current) {
        console.error('Report element not found');
        setIsPrinting(false);
        return;
      }
      
      // Remove any unwanted elements temporarily
      const actionButtons = reportRef.current.querySelectorAll('.no-print, button, [role="button"]');
      actionButtons.forEach((el: Element) => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Calculate the proper scaling
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Capture each element section by section to handle large reports better
      const sections = reportRef.current.querySelectorAll('.report-section');
      let currentPdfPage = 1;
      let currentOffsetY = 0;
      
      // Start with a title
      pdf.setFontSize(18);
      pdf.text(`Budget Report: ${project?.name || 'Construction Project'}`, 14, 22);
      pdf.setFontSize(12);
      pdf.text(`Generated on ${formatDate(new Date())}`, 14, 30);
      currentOffsetY = 40;
      
      // Process each section
      const processSections = async () => {
        if (!sections.length) {
          // If no sections found, capture the entire report as fallback
          const canvas = await html2canvas(reportRef.current!, {
            scale: 2,
            useCORS: true,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pdfWidth - 20;
          const pageHeight = pdfHeight;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 20;
          
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
        } else {
          // Process each section
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i] as HTMLElement;
            
            const canvas = await html2canvas(section, {
              scale: 2,
              useCORS: true,
              logging: false
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if we need a new page
            if (currentOffsetY + imgHeight > pdfHeight - 10) {
              pdf.addPage();
              currentPdfPage++;
              currentOffsetY = 20;
            }
            
            pdf.addImage(imgData, 'JPEG', 10, currentOffsetY, imgWidth, imgHeight);
            currentOffsetY += imgHeight + 10;
          }
        }
        
        // Add page numbers
        const totalPages = currentPdfPage;
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.text(`Page ${i} of ${totalPages}`, pdfWidth - 30, pdfHeight - 10);
        }
      
        // Restore display of action buttons
        actionButtons.forEach((el: Element) => {
          (el as HTMLElement).style.display = '';
        });
        
        // Save the PDF
        pdf.save(`${project?.name || 'Construction'}_Budget_Report.pdf`);
        setIsPrinting(false);
      };
      
      await processSections();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsPrinting(false);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleShareClick = async () => {
    if (!user || !project) {
      alert('You must be logged in to share reports');
      return;
    }
    
    try {
      setIsPrinting(true); // Reuse the state to show loading
      
      // Prepare report snapshot data (summary and category data)
      const reportSnapshot = {
        budgetSummary,
        expensesByCategory,
        expenseCount: expenses.length,
        projectionCount: projections.length
      };
      
      // Generate a secure link from the backend, with optional password
      const shareId = await ReportService.generateShareLink(
        project.id || 'unknown',
        project.name || 'Construction Project',
        user.uid,
        reportSnapshot,
        30, // 30 days expiration
        isPasswordProtected ? sharePassword : undefined
      );
      
      // Create the full shareable URL
      const baseUrl = window.location.origin;
      const generatedLink = `${baseUrl}/shared-reports/${shareId}`;
      
      // Update state and open dialog
      setShareLink(generatedLink);
      setShareDialogOpen(true);
      setIsPrinting(false);
    } catch (error) {
      console.error('Error generating share link:', error);
      setIsPrinting(false);
      alert('Failed to generate share link. Please try again.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleEmailShare = () => {
    // In a real app, you would send this to your backend to process
    const subject = `Budget Report: ${project?.name || 'Construction Project'}`;
    const body = `Here's the budget report for ${project?.name || 'our construction project'}.\n\nAccess it at: ${shareLink}`;
    
    // Simple email client launch (real implementation would use backend)
    window.open(`mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Budget Report: ${project?.name || 'Construction Project'}`,
        text: `Budget Report for ${project?.name || 'Construction Project'} - Total Budget: ${formatCurrency(budgetSummary.totalBudget)}`,
        url: shareLink,
      }).catch(err => {
        console.error('Share failed:', err);
      });
    } else {
      // Fallback for browsers that don't support native sharing
      handleCopyLink();
    }
  };

  // Snackbar for feedback
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box 
      ref={reportRef}
      sx={{ 
        p: 4, 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        '@media print': {
          p: 2,
          boxShadow: 'none'
        }
      }}
      className="budget-report"
    >
      {/* Report Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 3,
        '@media print': {
          mb: 2
        }
      }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Budget Report
          </Typography>
          <Typography variant="h6">
            {project?.name || 'Unnamed Project'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Generated on {formatDate(new Date())}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, '@media print': { display: 'none' } }}>
          <Tooltip title="Print Report">
            <IconButton onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? <CircularProgress size={24} /> : <PrintIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Export as PDF">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Report">
            <IconButton onClick={handleShareClick}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          {onClose && (
            <Tooltip title="Close Report">
              <IconButton onClick={onClose}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Budget Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }} className="report-section">
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <MoneyIcon sx={{ mr: 1 }} />
            Budget Overview
          </Typography>
        </Grid>
        
        {/* Key Metrics */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Financial Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Total Budget */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Total Budget</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(budgetSummary.totalBudget)}
                  </Typography>
                </Box>
                <Divider />
                
                {/* Spent to Date */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Spent to Date</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(budgetSummary.totalSpent)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({formatPercentage((budgetSummary.spentPercentage ?? 0) / 100)})
                    </Typography>
                  </Box>
                </Box>
                
                {/* Pending Expenses */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Pending Approval</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {formatCurrency(budgetSummary.pendingTotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({formatPercentage((budgetSummary.pendingPercentage ?? 0) / 100)})
                    </Typography>
                  </Box>
                </Box>
                
                {/* Projected Expenses */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Projected Future Costs</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {formatCurrency(budgetSummary.projectedTotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({formatPercentage((budgetSummary.projectedTotal / budgetSummary.totalBudget) || 0)})
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                
                {/* Total Estimated Costs */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.4), p: 1, borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Total Estimated Costs</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color={budgetSummary.projectedPercentage > 100 ? 'error.main' : 'success.main'}>
                      {formatCurrency(budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({formatPercentage(budgetSummary.projectedPercentage / 100)})
                    </Typography>
                  </Box>
                </Box>
                
                {/* Projected Remaining */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Projected Remaining</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      color={budgetSummary.projectedRemaining < 0 ? 'error.main' : 'success.main'}
                    >
                      {formatCurrency(Math.max(0, budgetSummary.projectedRemaining))}
                    </Typography>
                    {budgetSummary.projectedRemaining < 0 && (
                      <Chip 
                        label={`Over by ${formatCurrency(Math.abs(budgetSummary.projectedRemaining))}`} 
                        color="error" 
                        size="small" 
                        icon={<WarningIcon />} 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Budget Allocation Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card elevation={1} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PieChartIcon sx={{ mr: 1 }} />
                Budget Allocation
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {spendingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Chip 
                  label={budgetSummary.projectedPercentage > 100 
                    ? "Over Budget" 
                    : budgetSummary.projectedPercentage > 90 
                      ? "Near Limit" 
                      : "Under Budget"
                  } 
                  color={budgetSummary.projectedPercentage > 100 
                    ? "error" 
                    : budgetSummary.projectedPercentage > 90 
                      ? "warning" 
                      : "success"
                  } 
                  icon={budgetSummary.projectedPercentage > 100 
                    ? <WarningIcon /> 
                    : <CheckCircleIcon />
                  } 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Spending by Category */}
      <Box sx={{ mb: 4 }} className="report-section">
        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <StackedBarChartIcon sx={{ mr: 1 }} />
          Spending by Category
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                      <YAxis type="category" dataKey="name" width={110} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="spent" stackId="a" name="Spent" fill={theme.palette.primary.main} />
                      <Bar dataKey="pending" stackId="a" name="Pending" fill={theme.palette.warning.main} />
                      <Bar dataKey="projected" stackId="a" name="Projected" fill={theme.palette.info.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Detailed Expense Breakdown */}
      <Box sx={{ mb: 4 }} className="report-section">
        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <TimelineIcon sx={{ mr: 1 }} />
          Detailed Expense Breakdown
        </Typography>
        <Card elevation={1}>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Spent</TableCell>
                    <TableCell align="right">Pending</TableCell>
                    <TableCell align="right">Projected</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">% of Budget</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expensesByCategory.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell component="th" scope="row">
                        {category.name}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(category.spent)}</TableCell>
                      <TableCell align="right">{formatCurrency(category.pending)}</TableCell>
                      <TableCell align="right">{formatCurrency(category.projected)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(category.total)}</TableCell>
                      <TableCell align="right">
                        {budgetSummary.totalBudget > 0 
                          ? ((category.total / budgetSummary.totalBudget) * 100).toFixed(1) + '%'
                          : '0%'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ '& > td': { fontWeight: 'bold' } }}>
                    <TableCell>TOTAL</TableCell>
                    <TableCell align="right">{formatCurrency(budgetSummary.totalSpent)}</TableCell>
                    <TableCell align="right">{formatCurrency(budgetSummary.pendingTotal)}</TableCell>
                    <TableCell align="right">{formatCurrency(budgetSummary.projectedTotal)}</TableCell>
                    <TableCell align="right">{formatCurrency(budgetSummary.totalSpent + budgetSummary.pendingTotal + budgetSummary.projectedTotal)}</TableCell>
                    <TableCell align="right">{formatPercentage(budgetSummary.projectedPercentage / 100)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
      
      {/* Report Footer */}
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              ©{new Date().getFullYear()} Construction Management App
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Report generated on {formatDate(new Date())}
            </Typography>
          </Grid>
        </Grid>
      </Box>
      
      {/* Print Styles (applied when printing) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .budget-report,
          .budget-report * {
            visibility: visible;
          }
          .budget-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Budget Report</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>Share this report with investors and stakeholders</Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            value={shareLink}
            margin="normal"
            label="Shareable Link"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleCopyLink} size="small">
                    {copySuccess ? <CheckCircleIcon color="success" /> : <ContentCopyIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Share via:</Typography>
          
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleCopyLink}>
                <ListItemIcon>
                  <CopyIcon />
                </ListItemIcon>
                <ListItemText primary="Copy Link" secondary="Copy the link to clipboard" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton onClick={handleExport}>
                <ListItemIcon>
                  <PdfIcon />
                </ListItemIcon>
                <ListItemText primary="Export as PDF" secondary="Download the report as PDF" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton onClick={handleNativeShare}>
                <ListItemIcon>
                  <ShareIcon />
                </ListItemIcon>
                <ListItemText primary="Share..." secondary="Use your device's sharing options" />
              </ListItemButton>
            </ListItem>
          </List>
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Email the report:</Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Email Address"
              placeholder="investor@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <Button 
              variant="contained" 
              startIcon={<EmailIcon />} 
              onClick={handleEmailShare}
              disabled={!emailAddress || !emailAddress.includes('@')}
            >
              Send
            </Button>
          </Box>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                />
              }
              label="Password protect this report"
            />
            
            {isPasswordProtected && (
              <TextField
                fullWidth
                variant="outlined"
                label="Password"
                type="password"
                margin="normal"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                error={isPasswordProtected && !sharePassword}
                helperText={isPasswordProtected && !sharePassword ? "Password is required when protection is enabled" : ""}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default BudgetReport; 