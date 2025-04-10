import React, { Suspense, lazy, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryProvider } from './contexts/QueryContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NewCustomProjectPage from './pages/NewCustomProjectPage';
import NewResidentialProjectForm from './components/projects/NewResidentialProjectForm';
import ResidentialTemplateLanding from './components/landing/ResidentialTemplateLanding';
import BidDeletePortal from './components/dialogs/BidDeletePortal';
import SharedReportView from './pages/SharedReportView';

// Lazy load components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Projects = lazy(() => import('./components/projects/Projects'));
const ProjectDetails = lazy(() => import('./components/projects/ProjectDetails'));
const ProjectSetupWizard = lazy(() => import('./components/projects/ProjectSetupWizard'));
const ProjectForm = lazy(() => import('./components/projects/ProjectForm'));
const ProjectTemplates = lazy(() => import('./components/projects/Templates'));
const Tasks = lazy(() => import('./components/tasks/Tasks'));
const Expenses = lazy(() => import('./components/expenses/Expenses'));
const Documents = lazy(() => import('./components/documents/Documents'));
const Bids = lazy(() => import('./components/bids/Bids'));
const BidDetails = lazy(() => import('./components/bids/BidDetails'));
const Subcontractors = lazy(() => import('./components/subcontractors/Subcontractors'));
const SubcontractorForm = lazy(() => import('./components/subcontractors/SubcontractorForm'));
const SubcontractorDetails = lazy(() => import('./components/subcontractors/SubcontractorDetails'));
const Settings = lazy(() => import('./components/settings/Settings'));
const Login = lazy(() => import('./components/auth/Login'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const Payments = lazy(() => import('./components/payments/Payments'));
const Timeline = lazy(() => import('./components/timeline/Timeline'));
const Calendar = lazy(() => import('./components/calendar/Calendar'));

// Create a wrapper component for the BidDeletePortal
const BidDeletePortalWrapper = () => {
  const { user } = useAuth();
  
  // Only render if user is logged in
  if (!user) return null;
  
  return (
    <BidDeletePortal 
      userId={user.uid} 
      onBidDeleted={(bidId) => {
        // Dispatch a custom event that other components can listen for
        window.dispatchEvent(new CustomEvent('bid-deleted', { 
          detail: { bidId } 
        }));
      }}
    />
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          '*': {
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
          },
          body: {
            backgroundColor: theme.palette.background.default,
            overflowX: 'hidden',
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: theme.palette.background.paper,
          },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.divider,
            borderRadius: '4px',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.action.hover,
          },
          // Add consistent spacing for mobile
          '.MuiContainer-root': {
            paddingLeft: { xs: 2, sm: 3 },
            paddingRight: { xs: 2, sm: 3 },
          },
          // Improve form elements on mobile
          'input, select, textarea': {
            fontSize: { xs: '16px', sm: '16px' }, // Prevent zoom on iOS
          },
          // Consistent card styling
          '.MuiCard-root': {
            borderRadius: '12px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          },
          // Improve button touch targets on mobile
          '.MuiButton-root': {
            minHeight: { xs: '36px', sm: '40px' },
            minWidth: { xs: '36px', sm: '40px' },
          },
          // Consistent spacing for lists
          '.MuiList-root': {
            padding: { xs: '8px', sm: '16px' },
          },
          // Improve table responsiveness
          '.MuiTable-root': {
            display: { xs: 'block', sm: 'table' },
            width: '100%',
            overflowX: 'auto',
          },
          // Consistent spacing for form groups
          '.MuiFormGroup-root': {
            marginBottom: { xs: '16px', sm: '24px' },
          },
          // Improve dialog responsiveness
          '.MuiDialog-paper': {
            margin: { xs: '16px', sm: '32px' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxWidth: { xs: '100%', sm: '600px' },
          },
          // Consistent spacing for alerts
          '.MuiAlert-root': {
            marginBottom: { xs: '16px', sm: '24px' },
            borderRadius: '8px',
          },
          // Improve mobile navigation
          '.MuiDrawer-paper': {
            width: { xs: '85%', sm: '280px' },
            maxWidth: '280px',
          },
          // Consistent spacing for tabs
          '.MuiTabs-root': {
            marginBottom: { xs: '16px', sm: '24px' },
          },
          // Improve mobile grid spacing
          '.MuiGrid-container': {
            marginTop: { xs: '8px', sm: '16px' },
            marginBottom: { xs: '8px', sm: '16px' },
          },
        }}
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <QueryProvider>
          <AuthProvider>
            <Router>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                    <Route path="projects/new" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
                    <Route path="projects/new-custom" element={<ProtectedRoute><NewCustomProjectPage /></ProtectedRoute>} />
                    <Route path="projects/new-residential" element={<ProtectedRoute><NewResidentialProjectForm /></ProtectedRoute>} />
                    <Route path="projects/residential-template" element={<ProtectedRoute><ResidentialTemplateLanding /></ProtectedRoute>} />
                    <Route path="projects/:id/edit" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
                    <Route path="projects/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                    <Route path="tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                    <Route path="documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                    <Route path="bids" element={<ProtectedRoute><Bids /></ProtectedRoute>} />
                    <Route path="bids/:id" element={<ProtectedRoute><BidDetails /></ProtectedRoute>} />
                    <Route path="payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                    <Route path="subcontractors" element={<ProtectedRoute><Subcontractors /></ProtectedRoute>} />
                    <Route path="subcontractors/new" element={<ProtectedRoute><SubcontractorForm /></ProtectedRoute>} />
                    <Route path="subcontractors/:id" element={<ProtectedRoute><SubcontractorDetails /></ProtectedRoute>} />
                    <Route path="subcontractors/:id/edit" element={<ProtectedRoute><SubcontractorForm /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="templates" element={<ProtectedRoute><ProjectTemplates /></ProtectedRoute>} />
                    <Route path="timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
                    <Route path="calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                    <Route path="shared-reports/:shareId" element={<ProtectedRoute><SharedReportView /></ProtectedRoute>} />
                  </Route>
                </Routes>
                
                {/* Add the global bid delete portal */}
                <BidDeletePortalWrapper />
              </Suspense>
            </Router>
          </AuthProvider>
        </QueryProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
