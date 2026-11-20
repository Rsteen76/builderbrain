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
  nextMilestone: { name: 'Design Lock', date: '2026-11-23T00:00:00.000Z', projectId: 'p1' },
  budgetVariance: 1121150,
  materialsToOrder: 0,
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
  it('names the scope of the money tiles and shows whole dollars so they are not clipped', () => {
    renderInsights();

    expect(screen.getByText('$1,260,000')).toBeInTheDocument();
    expect(screen.getByText('Budget, All Projects')).toBeInTheDocument();
    expect(screen.getByText('$1,121,150')).toBeInTheDocument();
    expect(screen.getByText('Remaining, All Projects')).toBeInTheDocument();
  });

  it('says over budget when spending is above budget', () => {
    renderInsights({ budgetVariance: -20000 });

    expect(screen.getByText('$20,000')).toBeInTheDocument();
    expect(screen.getByText('Over Budget, All Projects')).toBeInTheDocument();
  });
});
