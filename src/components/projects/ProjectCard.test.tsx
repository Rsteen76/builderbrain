import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectCard from './ProjectCard';

const theme = createTheme();

type CardProject = {
  name: string;
  status: string;
  team?: string[];
  phases?: Array<{ status: string }>;
};

const renderCard = (project: CardProject) =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectCard project={project} />
    </ThemeProvider>
  );

const fivePhases = [
  { status: 'completed' },
  { status: 'in_progress' },
  { status: 'planning' },
  { status: 'planning' },
  { status: 'planning' },
];

describe('ProjectCard', () => {
  it('shows the real team size', () => {
    renderCard({ name: 'Hillside Custom Home', status: 'active', team: ['a', 'b', 'c'] });

    expect(screen.getByText('Team Members').nextSibling).toHaveTextContent('3');
  });

  it('shows progress as the share of phases completed, whatever the project is called', () => {
    renderCard({ name: 'Hillside Custom Home', status: 'active', phases: fivePhases });

    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('shows 100% for a completed project even when some phases were never marked complete', () => {
    renderCard({ name: 'Riverside', status: 'completed', phases: fivePhases });

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('leaves the progress bar out when it has no phase list, instead of inventing a number', () => {
    renderCard({ name: 'Hillside Custom Home', status: 'active' });

    expect(screen.queryByText(/^\d+%$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it.each([
    ['planning', 'Planning'],
    ['active', 'Active'],
    ['in_progress', 'Active'],
    ['on_hold', 'On Hold'],
    ['cancelled', 'Cancelled'],
    ['completed', 'Completed'],
  ])('shows a %s project as %s, never "On Track"', (status, label) => {
    renderCard({ name: 'Hillside Custom Home', status });

    // Once in the chip and once in the Project Status row.
    expect(screen.getAllByText(label)).toHaveLength(2);
    expect(screen.queryByText(/on track/i)).not.toBeInTheDocument();
  });

  it('lets a long name wrap instead of cutting it with an ellipsis', () => {
    renderCard({ name: 'Maple Street Kitchen Remodel', status: 'planning' });

    const title = screen.getByText('Maple Street Kitchen Remodel');
    expect(title).not.toHaveStyle({ whiteSpace: 'nowrap' });
    expect(title).not.toHaveStyle({ textOverflow: 'ellipsis' });
  });
});
