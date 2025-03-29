import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load components
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const Projects = React.lazy(() => import('./components/projects/Projects'));
const ProjectSetupWizard = React.lazy(() => import('./components/projects/ProjectSetupWizard'));
const Expenses = React.lazy(() => import('./components/expenses/ExpensesList'));
const ExpenseForm = React.lazy(() => import('./components/expenses/ExpenseForm'));
const ExpenseDetails = React.lazy(() => import('./components/expenses/ExpenseDetails'));
const Bids = React.lazy(() => import('./components/bids/Bids'));
const Tasks = React.lazy(() => import('./components/tasks/Tasks'));
const Documents = React.lazy(() => import('./components/documents/Documents'));
const Payments = React.lazy(() => import('./components/payments/Payments'));
const Settings = React.lazy(() => import('./components/settings/Settings'));
const ProjectsList = React.lazy(() => import('./components/projects/ProjectsList'));
const ProjectDetails = React.lazy(() => import('./components/projects/ProjectDetails'));
const ProjectForm = React.lazy(() => import('./components/projects/ProjectForm'));
const TasksList = React.lazy(() => import('./components/tasks/TasksList'));
const TaskDetails = React.lazy(() => import('./components/tasks/TaskDetails'));
const TaskForm = React.lazy(() => import('./components/tasks/TaskForm'));

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Router>
            <Suspense fallback={<div>Loading...</div>}>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="projects">
                    <Route index element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
                    <Route path="new" element={<ProtectedRoute><ProjectSetupWizard /></ProtectedRoute>} />
                    <Route path=":id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
                    <Route path=":id/edit" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
                  </Route>
                  <Route path="tasks">
                    <Route index element={<ProtectedRoute><TasksList /></ProtectedRoute>} />
                    <Route path="new" element={<ProtectedRoute><TaskForm /></ProtectedRoute>} />
                    <Route path=":id" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
                    <Route path=":id/edit" element={<ProtectedRoute><TaskForm /></ProtectedRoute>} />
                  </Route>
                  <Route path="expenses">
                    <Route index element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                    <Route path="new" element={<ProtectedRoute><ExpenseForm /></ProtectedRoute>} />
                    <Route path=":id" element={<ProtectedRoute><ExpenseDetails /></ProtectedRoute>} />
                    <Route path=":id/edit" element={<ProtectedRoute><ExpenseForm /></ProtectedRoute>} />
                  </Route>
                  <Route path="bids" element={<ProtectedRoute><Bids /></ProtectedRoute>} />
                  <Route path="documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                  <Route path="payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                  <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                </Routes>
              </MainLayout>
            </Suspense>
          </Router>
        </LocalizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
