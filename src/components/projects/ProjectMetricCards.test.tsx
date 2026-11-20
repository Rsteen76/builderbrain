import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectMetricCards from './ProjectMetricCards';
import { Expense, Project } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { calculateBudgetData } from '../../utils/projectMetrics';

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

const expenses = (...amounts: number[]): Expense[] => amounts.map((amount) => ({ amount, status: 'paid' } as Expense));

interface RenderOptions {
  spent?: number[];
  status?: Project['status'];
  progress?: number;
  phaseCounts?: { completed: number; total: number };
  elapsedDays?: number;
  totalDays?: number;
}

const renderCards = ({
  spent = [47300, 38500],
  status = 'active',
  progress = 20,
  phaseCounts = { completed: 1, total: 5 },
  elapsedDays = 42,
  totalDays = 252,
}: RenderOptions = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectMetricCards
        project={{ ...project, status }}
        projectProgress={progress}
        phaseCounts={phaseCounts}
        budgetData={calculateBudgetData(project, expenses(...spent))}
        expenseBreakdown={{
          paid: 47300,
          approved: 38500,
          pending: 0,
          rejected: 0,
        }}
        timeline={{
          startDate: new Date('2026-03-26'),
          endDate: new Date('2026-12-03'),
          elapsedDays,
          totalDays,
          percentComplete: Math.round((elapsedDays / totalDays) * 100),
        }}
        theme={theme}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
      />
    </ThemeProvider>
  );

describe('ProjectMetricCards', () => {
  it('shows $85,800 of $850,000 as 10.1% of budget used', () => {
    renderCards();

    expect(screen.getByText('$850,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('$85,800.00').length).toBeGreaterThan(0);
    expect(screen.getByText('10.1% of budget used')).toBeInTheDocument();
    expect(screen.queryByText(/1,000%/)).not.toBeInTheDocument();
  });

  it('shows timeline percentages as normal percentages', () => {
    renderCards();

    expect(screen.getByText('42 days elapsed (17%)')).toBeInTheDocument();
    expect(screen.queryByText(/1,700%/)).not.toBeInTheDocument();
  });

  it('describes the progress number by phases, not by days', () => {
    renderCards();

    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('1 of 5 phases complete')).toBeInTheDocument();
    expect(screen.queryByText('42 of 252 days elapsed')).not.toBeInTheDocument();
  });

  it('shows an over-budget project above 100% with a full, capped bar', () => {
    renderCards({ spent: [1020000] });

    expect(screen.getByText('120% of budget used')).toBeInTheDocument();
    expect(screen.getByText('-$170,000.00')).toBeInTheDocument();

    const budgetBar = screen
      .getAllByRole('progressbar')
      .find((bar) => bar.getAttribute('aria-valuenow') === '100');
    expect(budgetBar).toBeDefined();
  });

  it('reads the seeded Hillside project as on track', () => {
    renderCards();

    expect(screen.getByText('Project Health:')).toHaveTextContent('Project Health: On track');
  });

  it('reads an over-budget project as over budget', () => {
    renderCards({ spent: [900000] });

    expect(screen.getByText('Project Health:')).toHaveTextContent('Project Health: Over budget');
  });

  it('reads a project whose phases trail the clock by more than 10 points as behind schedule', () => {
    renderCards({ progress: 20, phaseCounts: { completed: 1, total: 5 }, elapsedDays: 31, totalDays: 100 });

    expect(screen.getByText('Project Health:')).toHaveTextContent('Project Health: Behind schedule');
  });

  it('reads a gap of exactly 10 points as on track', () => {
    renderCards({ progress: 20, elapsedDays: 30, totalDays: 100 });

    expect(screen.getByText('Project Health:')).toHaveTextContent('Project Health: On track');
  });

  it.each([
    ['planning', 'PLANNING'],
    ['active', 'ACTIVE'],
    ['on_hold', 'ON HOLD'],
    ['cancelled', 'CANCELLED'],
    ['completed', 'COMPLETED'],
  ])('shows a %s project with a %s chip', (status, label) => {
    renderCards({ status: status as Project['status'] });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('shows the active chip with its own icon, not the question-mark fallback', () => {
    renderCards({ status: 'active' });

    expect(screen.queryByTestId('HelpOutlineIcon')).not.toBeInTheDocument();
    expect(screen.getByTestId('PlayCircleOutlineIcon')).toBeInTheDocument();
  });

  it('says so when a completed project shows 100% with unfinished phases', () => {
    renderCards({ status: 'completed', progress: 100, phaseCounts: { completed: 2, total: 3 } });

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Project marked completed (2 of 3 phases marked)')).toBeInTheDocument();
  });
});
