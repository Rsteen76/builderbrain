import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProjectCard from './ProjectCard';

const theme = createTheme();

type CardProject = { name: string; status: string; team?: string[]; phases?: Array<{ status: string }> };

const renderCard = (project: CardProject) =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectCard project={project} />
    </ThemeProvider>
  );

describe('ProjectCard', () => {
  it('shows the real team size', () => {
    renderCard({ name: 'Hillside Custom Home', status: 'active', team: ['a', 'b', 'c'] });

    expect(screen.getByText('Team Members').nextSibling).toHaveTextContent('3');
  });

  it('shows progress as the share of phases completed, whatever the project is called', () => {
    const phases = [
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'planning' },
      { status: 'planning' },
      { status: 'planning' },
    ];
    renderCard({ name: 'Hillside Custom Home', status: 'active', phases });
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('leaves the progress bar out when it has no phase list, instead of inventing a number', () => {
    renderCard({ name: 'Hillside Custom Home', status: 'active' });

    expect(screen.queryByText(/^\d+%$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
