import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Projects = lazy(() => import('./components/projects/Projects'));
const ProjectDetails = lazy(() => import('./components/projects/ProjectDetails'));
const ProjectSetupWizard = lazy(() => import('./components/projects/ProjectSetupWizard'));
const Tasks = lazy(() => import('./components/tasks/Tasks'));
const Expenses = lazy(() => import('./components/expenses/Expenses'));
const Documents = lazy(() => import('./components/documents/Documents'));
const Bids = lazy(() => import('./components/bids/Bids'));
const Subcontractors = lazy(() => import('./components/subcontractors/Subcontractors'));
const Settings = lazy(() => import('./components/settings/Settings'));
const Login = lazy(() => import('./components/auth/Login'));
const SignUp = lazy(() => import('./components/auth/SignUp'));
const Payments = lazy(() => import('./components/payments/Payments'));

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
        }}
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  <Route path="projects/new" element={<ProtectedRoute><ProjectSetupWizard /></ProtectedRoute>} />
                  <Route path="projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
                  <Route path="tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                  <Route path="documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                  <Route path="bids" element={<ProtectedRoute><Bids /></ProtectedRoute>} />
                  <Route path="payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                  <Route path="subcontractors" element={<ProtectedRoute><Subcontractors /></ProtectedRoute>} />
                  <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
