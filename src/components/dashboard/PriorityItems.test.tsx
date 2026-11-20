import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PriorityItems from './PriorityItems';

const tasks = [
  {
    id: 't1',
    title: 'Schedule footing inspection',
    dueDate: 'Nov 25, 2026',
    status: 'todo',
    priority: 'urgent' as const,
    projectId: 'p1',
    projectName: 'Hillside Custom Home',
  },
];

const renderItems = (upcoming = tasks) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <PriorityItems upcomingTasks={upcoming} />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('PriorityItems', () => {
  it('lists upcoming tasks and has no overdue payments tab that can only ever say zero', () => {
    renderItems();

    expect(screen.getByText('Schedule footing inspection')).toBeInTheDocument();
    expect(screen.queryByText(/Overdue Payments/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No overdue payments/)).not.toBeInTheDocument();
  });

  it('says so when there are no upcoming tasks', () => {
    renderItems([]);

    expect(screen.getByText(/No upcoming tasks/)).toBeInTheDocument();
  });
});
