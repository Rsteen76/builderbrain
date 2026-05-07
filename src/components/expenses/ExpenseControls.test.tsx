import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ExpenseControls } from './ExpenseControls';
import { Project } from '../../types'; // Adjust path as necessary

const mockTheme = createTheme();

const makeProject = (id: string, name: string): Project => ({
  id,
  name,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'u1',
  description: '',
  status: 'active',
  startDate: new Date(),
  budget: { total: 0, spent: 0, remaining: 0 },
  location: { address: '', city: '', state: '', zipCode: '' },
  phases: [],
  progress: 0,
});

const mockProjects: Project[] = [
  makeProject('p1', 'Project Alpha'),
  makeProject('p2', 'Project Beta'),
];

const defaultProps = {
  theme: mockTheme,
  searchTerm: '',
  onSearchTermChange: jest.fn(),
  projectFilter: null,
  onProjectFilterChange: jest.fn(),
  projects: mockProjects,
  categoryFilter: null,
  onCategoryFilterChange: jest.fn(),
  groupBy: 'none' as 'none' | 'project' | 'category' | 'vendor' | 'subcontractor',
  onGroupByChange: jest.fn(),
  onRefresh: jest.fn(),
  projectId: undefined,
};

// Custom render function to include ThemeProvider
const renderWithTheme = (ui: React.ReactElement, props = {}) => {
  return render(<ThemeProvider theme={mockTheme}>{React.cloneElement(ui, props)}</ThemeProvider>);
};


describe('ExpenseControls', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all controls correctly', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search expenses...')).toBeInTheDocument();
    expect(screen.getByLabelText('Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Group By')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh expenses/i })).toBeInTheDocument();
  });

  test('handles search term change', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Search expenses...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(defaultProps.onSearchTermChange).toHaveBeenCalledWith('test search');
  });

  test('shows and uses clear button for search input', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} searchTerm="has text" />);
    const searchInputContainer = screen.getByPlaceholderText('Search expenses...').closest('div'); // MUI TextField structure
    expect(searchInputContainer).toBeInTheDocument();

    if (searchInputContainer) {
      const clearButton = within(searchInputContainer).getByRole('button'); // Assuming clear is an IconButton
      expect(clearButton).toBeInTheDocument();
      fireEvent.click(clearButton);
      expect(defaultProps.onSearchTermChange).toHaveBeenCalledWith('');
    }
  });
  
  test('handles project filter change', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} />);
    const projectSelect = screen.getByLabelText('Project');
    fireEvent.mouseDown(projectSelect); // Open the select
    // Material UI Select renders options in a Popper, need to query globally
    const projectOption = screen.getByRole('option', { name: 'Project Alpha' });
    fireEvent.click(projectOption);
    expect(defaultProps.onProjectFilterChange).toHaveBeenCalledWith('p1');
  });

  test('hides project filter if projectId prop is provided', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} projectId="specificProject123" />);
    expect(screen.queryByLabelText('Project')).not.toBeInTheDocument();
  });

  test('handles category filter change', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} />);
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    const categoryOption = screen.getByRole('option', { name: 'Materials' });
    fireEvent.click(categoryOption);
    expect(defaultProps.onCategoryFilterChange).toHaveBeenCalledWith('materials');
  });

  test('handles group by filter change', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} />);
    const groupBySelect = screen.getByLabelText('Group By');
    fireEvent.mouseDown(groupBySelect);
    const groupByOption = screen.getByRole('option', { name: 'Project' }); // Assuming 'Project' is an option
    fireEvent.click(groupByOption);
    expect(defaultProps.onGroupByChange).toHaveBeenCalledWith('project');
  });

  test('handles refresh button click', () => {
    renderWithTheme(<ExpenseControls {...defaultProps} />);
    const refreshButton = screen.getByRole('button', { name: /refresh expenses/i });
    fireEvent.click(refreshButton);
    expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
  });
});
