import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectMetricCards from './ProjectMetricCards';
import { Project } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const theme = createTheme();

const project: Project = {
  id: 'project-1',
  userId: 'user-1',
  name: 'Hillside Custom Home',
  description: '',
  status: 'active',
  startDate: new Date('2026-03-26'),
  endDate: new Date('2026-12-03'),
  budget: 850000,
  location: 'Boulder, CO',
  createdAt: new Date(),
  updatedAt: new Date(),
  phases: [],
  progress: 20,
};

const renderCards = () =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectMetricCards
        project={project}
        projectProgress={20}
        budgetData={{
          totalBudget: 850000,
          totalActual: 85800,
          difference: 764200,
          percentUsed: 10,
        }}
        expenseBreakdown={{
          paid: 47300,
          approved: 38500,
          pending: 0,
          rejected: 0,
        }}
        timeline={{
          startDate: new Date('2026-03-26'),
          endDate: new Date('2026-12-03'),
          elapsedDays: 42,
          totalDays: 252,
          percentComplete: 17,
        }}
        theme={theme}
        getStatusIcon={() => <span />}
        getStatusColor={() => theme.palette.success.main}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </ThemeProvider>
  );

describe('ProjectMetricCards', () => {
  it('displays whole-number metric percentages as normal percentages', () => {
    renderCards();

    expect(screen.getByText('10% of budget used')).toBeInTheDocument();
    expect(screen.getByText('42 days elapsed (17%)')).toBeInTheDocument();
    expect(screen.queryByText(/1,000%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,700%/)).not.toBeInTheDocument();
  });
});
