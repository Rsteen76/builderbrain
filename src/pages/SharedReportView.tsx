import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Divider,
  Grid,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  AccessTime as AccessTimeIcon,
  Print as PrintIcon,
  Home as HomeIcon,
  Visibility as ViewIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import ReportService from '../services/ReportService';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RouteParams {
  shareId: string;
}

const SharedReportView: React.FC = () => {
  const { shareId } = useParams<keyof RouteParams>() as RouteParams;
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  useEffect(() => {
    loadReport();
  }, [shareId]);
  
  const loadReport = async (inputPassword?: string) => {
    if (!shareId) {
      setError('Invalid report link');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Try to get the report with the given shareId and optional password
      const report = await ReportService.getSharedReport(shareId, inputPassword);
      
      if (!report) {
        // Check if it's a password issue or expired/invalid report
        const testReport = await ReportService.getSharedReport(shareId);
        
        if (testReport && testReport.isPasswordProtected) {
          // Report exists but is password protected
          setIsPasswordProtected(true);
          setShowPasswordDialog(true);
          setLoading(false);
          
          if (passwordAttempt) {
            setError('Incorrect password');
          }
        } else {
          // Report doesn't exist or has expired
          setError('This report has expired or is no longer available');
          setLoading(false);
        }
      } else {
        // Successfully loaded the report
        setReportData(report);
        setLoading(false);
        setError(null);
        setShowPasswordDialog(false);
      }
    } catch (error) {
      console.error('Error loading shared report:', error);
      setError('Failed to load the report. Please try again later.');
      setLoading(false);
    }
  };
  
  const handlePasswordSubmit = () => {
    setPasswordAttempt(true);
    loadReport(password);
  };
  
  const handleExportPDF = async () => {
    if (!reportData) return;
    
    try {
      setIsPrinting(true);
      
      const reportElement = document.getElementById('shared-report');
      if (!reportElement) {
        setIsPrinting(false);
        return;
      }
      
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Get page dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Capture the report content
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 20;
      
      // Add first page image
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 40);
      
      // Add new pages if the content is too long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 20;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 40);
      }
      
      // Save the PDF
      pdf.save(`Budget_Report_${shareId}.pdf`);
      setIsPrinting(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsPrinting(false);
      alert('Failed to export as PDF. Please try again.');
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !showPasswordDialog) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', p: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            width: '100%', 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <WarningIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Report Unavailable
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<HomeIcon />} 
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <>
      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ mr: 1 }} color="primary" />
            Password Protected Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This budget report is password protected. Please enter the password to view it.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/')} color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePasswordSubmit} variant="contained" disabled={!password}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Content */}
      {reportData && (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }} id="shared-report">
          {/* Report Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Budget Report
              </Typography>
              <Typography variant="h6">
                {reportData.projectName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Generated on {formatDate(reportData.createdAt?.toDate() || new Date())}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ '@media print': { display: 'none' } }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={isPrinting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={handleExportPDF}
                disabled={isPrinting}
                sx={{ '@media print': { display: 'none' } }}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
          
          {reportData.expiresAt && (
            <Chip 
              icon={<AccessTimeIcon />} 
              label={`Report expires on ${formatDate(reportData.expiresAt.toDate())}`}
              color="default"
              variant="outlined"
              size="small"
              sx={{ mb: 3 }}
            />
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Budget Overview */}
          <Box className="report-section" sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Budget Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                    
                    {/* Total Budget */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">Total Budget</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(reportData.reportSnapshot.budgetSummary.totalBudget)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {/* Spent to Date */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">Spent to Date</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {formatCurrency(reportData.reportSnapshot.budgetSummary.totalSpent)}
                      </Typography>
                    </Box>
                    
                    {/* Pending Expenses */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">Pending Approval</Typography>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {formatCurrency(reportData.reportSnapshot.budgetSummary.pendingTotal)}
                      </Typography>
                    </Box>
                    
                    {/* Projected Expenses */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">Projected Future Costs</Typography>
                      <Typography variant="h6" fontWeight="bold" color="info.main">
                        {formatCurrency(reportData.reportSnapshot.budgetSummary.projectedTotal)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {/* Total Estimated Costs */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 1, 
                      bgcolor: alpha(theme.palette.background.default, 0.4),
                      borderRadius: 1
                    }}>
                      <Typography variant="body1" fontWeight="bold">Total Estimated Costs</Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        color={
                          reportData.reportSnapshot.budgetSummary.projectedPercentage > 100 
                            ? 'error.main' 
                            : 'success.main'
                        }
                      >
                        {formatCurrency(
                          reportData.reportSnapshot.budgetSummary.totalSpent + 
                          reportData.reportSnapshot.budgetSummary.pendingTotal + 
                          reportData.reportSnapshot.budgetSummary.projectedTotal
                        )}
                      </Typography>
                    </Box>
                    
                    {/* Projected Remaining */}
                    {reportData.reportSnapshot.budgetSummary.projectedRemaining !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body1">Projected Remaining</Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight="bold" 
                          color={
                            reportData.reportSnapshot.budgetSummary.projectedRemaining < 0 
                              ? 'error.main' 
                              : 'success.main'
                          }
                        >
                          {formatCurrency(Math.max(0, reportData.reportSnapshot.budgetSummary.projectedRemaining))}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Budget Status</Typography>
                    
                    <Box sx={{ mt: 2, mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        This budget report provides an overview of the current financial status of the project.
                        It includes all expenses recorded up to {formatDate(reportData.createdAt?.toDate() || new Date())}.
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 2,
                        bgcolor: alpha(
                          reportData.reportSnapshot.budgetSummary.projectedPercentage > 100
                            ? theme.palette.error.main
                            : reportData.reportSnapshot.budgetSummary.projectedPercentage > 90
                              ? theme.palette.warning.main
                              : theme.palette.success.main,
                          0.1
                        ),
                        borderRadius: 2,
                        mt: 2
                      }}>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          align="center"
                          color={
                            reportData.reportSnapshot.budgetSummary.projectedPercentage > 100
                              ? 'error.main'
                              : reportData.reportSnapshot.budgetSummary.projectedPercentage > 90
                                ? 'warning.main'
                                : 'success.main'
                          }
                        >
                          {reportData.reportSnapshot.budgetSummary.projectedPercentage > 100
                            ? 'Over Budget'
                            : reportData.reportSnapshot.budgetSummary.projectedPercentage > 90
                              ? 'Near Budget Limit'
                              : 'Under Budget'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Budget utilization: {formatPercentage(reportData.reportSnapshot.budgetSummary.projectedPercentage / 100)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider />
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Report access count: {reportData.accessCount || 1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last accessed: {formatDate(reportData.lastAccessedAt?.toDate() || new Date())}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          {/* Expense Breakdown */}
          <Box className="report-section" sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Expense Breakdown
            </Typography>
            
            {reportData.reportSnapshot.expensesByCategory?.length > 0 ? (
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ 
                    overflowX: 'auto', 
                    '& table': { minWidth: 650 } 
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                          <th style={{ textAlign: 'left', padding: '12px 16px' }}>Category</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>Spent</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>Pending</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>Projected</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px' }}>% of Budget</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.reportSnapshot.expensesByCategory.map((category: any, index: number) => (
                          <tr 
                            key={index} 
                            style={{ 
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              backgroundColor: index % 2 === 0 ? alpha(theme.palette.background.default, 0.3) : 'transparent'
                            }}
                          >
                            <td style={{ padding: '12px 16px' }}>{category.name}</td>
                            <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                              {formatCurrency(category.spent)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                              {formatCurrency(category.pending)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                              {formatCurrency(category.projected)}
                            </td>
                            <td style={{ 
                              textAlign: 'right', 
                              padding: '12px 16px',
                              fontWeight: 'bold'
                            }}>
                              {formatCurrency(category.total)}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                              {reportData.reportSnapshot.budgetSummary.totalBudget > 0
                                ? ((category.total / reportData.reportSnapshot.budgetSummary.totalBudget) * 100).toFixed(1) + '%'
                                : '0%'
                              }
                            </td>
                          </tr>
                        ))}
                        
                        {/* Totals row */}
                        <tr style={{ 
                          borderTop: `2px solid ${theme.palette.divider}`,
                          backgroundColor: alpha(theme.palette.background.default, 0.6)
                        }}>
                          <td style={{ 
                            padding: '12px 16px', 
                            fontWeight: 'bold'
                          }}>
                            TOTAL
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '12px 16px',
                            fontWeight: 'bold'
                          }}>
                            {formatCurrency(reportData.reportSnapshot.budgetSummary.totalSpent)}
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '12px 16px',
                            fontWeight: 'bold'
                          }}>
                            {formatCurrency(reportData.reportSnapshot.budgetSummary.pendingTotal)}
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '12px 16px',
                            fontWeight: 'bold'
                          }}>
                            {formatCurrency(reportData.reportSnapshot.budgetSummary.projectedTotal)}
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '12px 16px',
                            fontWeight: 'bold'
                          }}>
                            {formatCurrency(
                              reportData.reportSnapshot.budgetSummary.totalSpent + 
                              reportData.reportSnapshot.budgetSummary.pendingTotal + 
                              reportData.reportSnapshot.budgetSummary.projectedTotal
                            )}
                          </td>
                          <td style={{ 
                            textAlign: 'right', 
                            padding: '12px 16px',
                            fontWeight: 'bold'
                          }}>
                            {formatPercentage(reportData.reportSnapshot.budgetSummary.projectedPercentage / 100)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">
                No detailed expense breakdown available in this report.
              </Alert>
            )}
          </Box>
          
          {/* Report Footer */}
          <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  ©{new Date().getFullYear()} Construction Management App
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Report generated on {formatDate(reportData.createdAt?.toDate() || new Date())}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          {/* Button to go back to app (only visible on screen, not in print) */}
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            justifyContent: 'center',
            '@media print': { display: 'none' }
          }}>
            <Button 
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
            >
              Return to App
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body {
            background-color: white;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}} />
    </>
  );
};

export default SharedReportView; 