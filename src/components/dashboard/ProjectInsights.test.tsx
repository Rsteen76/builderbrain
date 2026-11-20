import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectInsights from './ProjectInsights';

const stats = {
  activeProjects: 1,
  totalBudget: 1260000,
  teamMembers: 7,
  tasksDue: 5,
  projectsAtRisk: 0,
  nextMilestone: { name: 'Design Lock', date: '2026-11-23T12:00:00.000Z', projectId: 'p1' },
};

const renderInsights = (override: Partial<typeof stats> = {}) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <ProjectInsights stats={{ ...stats, ...override }} />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('ProjectInsights', () => {
  it('shows exactly four tiles with their figures', () => {
    renderInsights();

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('$1,260,000')).toBeInTheDocument();
    expect(screen.getByText('Budget, All Projects')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Tasks Due Soon')).toBeInTheDocument();
    expect(screen.getByText('Nov 23')).toBeInTheDocument();
    expect(screen.getByText('Next Milestone')).toBeInTheDocument();
    expect(screen.getAllByText(/^(Active Projects?|Budget, All Projects|Tasks Due Soon|Next Milestone)$/)).toHaveLength(4);
  });

  it('does not show tiles that have no real data behind them', () => {
    renderInsights();

    expect(screen.queryByText(/Materials to Order/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Remaining|Over Budget|Variance/)).not.toBeInTheDocument();
  });

  it('reads "Active Project" for one and "Active Projects" for other counts', () => {
    const { unmount } = renderInsights({ activeProjects: 1 });
    expect(screen.getByText('Active Project')).toBeInTheDocument();
    expect(screen.queryByText('Active Projects')).not.toBeInTheDocument();
    unmount();

    renderInsights({ activeProjects: 2 });
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
  });
});
