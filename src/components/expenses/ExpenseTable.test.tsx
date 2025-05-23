import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ExpenseTable } from './ExpenseTable';
import { Expense } from '../../types'; // Adjust path as necessary

const mockTheme = createTheme();

const mockExpenseRowContent = 'Mocked Expense Row';
const mockRenderExpenseRow = jest.fn((expense: Expense) => <tr key={expense.id}><td>{mockExpenseRowContent}</td><td>{expense.description}</td></tr>);
const mockHandleSortClick = jest.fn();

const mockExpenses: Expense[] = [
  { id: 'e1', projectId: 'p1', category: 'materials', description: 'Cement Bags', amount: 150, date: new Date('2023-01-10'), status: 'paid', userId: 'u1', createdBy: 'u1', createdAt: new Date(), updatedAt: new Date(), projectName: 'Project Alpha' },
  { id: 'e2', projectId: 'p1', category: 'labor', description: 'Wiring Labor', amount: 1200, date: new Date('2023-01-12'), status: 'pending', userId: 'u1', createdBy: 'u1', createdAt: new Date(), updatedAt: new Date(), projectName: 'Project Alpha' },
  { id: 'e3', projectId: 'p2', category: 'equipment', description: 'Excavator Rental', amount: 500, date: new Date('2023-01-15'), status: 'approved', userId: 'u1', createdBy: 'u1', createdAt: new Date(), updatedAt: new Date(), projectName: 'Project Beta' },
];

const defaultProps = {
  theme: mockTheme,
  loading: false,
  sortedExpenses: mockExpenses,
  groupedExpenses: { 'All Expenses': mockExpenses },
  groupBy: 'none' as 'none' | 'project' | 'category' | 'vendor' | 'subcontractor',
  groupTotals: { 'All Expenses': mockExpenses.reduce((sum, exp) => sum + exp.amount, 0) },
  renderExpenseRow: mockRenderExpenseRow,
  handleSortClick: mockHandleSortClick,
  sortField: null as 'amount' | 'date' | null,
  sortDirection: 'desc' as 'asc' | 'desc',
  searchTerm: '',
};

// Custom render function
const renderWithTheme = (ui: React.ReactElement, props = {}) => {
  return render(<ThemeProvider theme={mockTheme}>{React.cloneElement(ui, { ...defaultProps, ...props })}</ThemeProvider>);
};

describe('ExpenseTable', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state correctly', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // MUI CircularProgress has this role
  });

  test('renders "No expenses found" message when sortedExpenses is empty and not loading', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} sortedExpenses={[]} groupedExpenses={{}} groupTotals={{}} />);
    expect(screen.getByText('No expenses found')).toBeInTheDocument();
    expect(screen.getByText('Click "Add Expense" to create your first expense')).toBeInTheDocument();
  });

  test('renders "No expenses found" with search term message when sortedExpenses is empty due to search', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} sortedExpenses={[]} groupedExpenses={{}} groupTotals={{}} searchTerm="nonexistent" />);
    expect(screen.getByText('No expenses found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  test('renders table with data and no grouping', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument(); // Header
    expect(screen.getByText('Amount')).toBeInTheDocument();    // Header
    expect(mockRenderExpenseRow).toHaveBeenCalledTimes(mockExpenses.length);
    expect(screen.getAllByText(mockExpenseRowContent).length).toBe(mockExpenses.length);
  });

  test('renders table with data and grouping by project', () => {
    const groupedByProject = {
      'Project Alpha': [mockExpenses[0], mockExpenses[1]],
      'Project Beta': [mockExpenses[2]],
    };
    const groupTotalsByProject = {
      'Project Alpha': (mockExpenses[0].amount + mockExpenses[1].amount),
      'Project Beta': mockExpenses[2].amount,
    };
    renderWithTheme(
      <ExpenseTable 
        {...defaultProps} 
        groupBy="project" 
        groupedExpenses={groupedByProject} 
        groupTotals={groupTotalsByProject} 
      />
    );
    
    expect(screen.getByRole('table', { name: /expenses table for group Project Alpha/i })).toBeInTheDocument();
    expect(screen.getByText('Project Alpha')).toBeInTheDocument(); // Group header
    expect(screen.getByText(`$${groupTotalsByProject['Project Alpha'].toFixed(2)}`)).toBeInTheDocument(); // Group total in header
    
    expect(screen.getByRole('table', { name: /expenses table for group Project Beta/i })).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();   // Group header
    expect(screen.getByText(`$${groupTotalsByProject['Project Beta'].toFixed(2)}`)).toBeInTheDocument(); // Group total in header
    
    expect(mockRenderExpenseRow).toHaveBeenCalledTimes(mockExpenses.length);
    
    // Check for group total rows within table body
    const projectAlphaTable = screen.getByRole('table', { name: /expenses table for group Project Alpha/i });
    expect(within(projectAlphaTable).getByText('Group Total')).toBeInTheDocument();

    const projectBetaTable = screen.getByRole('table', { name: /expenses table for group Project Beta/i });
    expect(within(projectBetaTable).getByText('Group Total')).toBeInTheDocument();
  });

  test('calls handleSortClick when Amount header is clicked', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} />);
    const amountHeader = screen.getByText('Amount');
    fireEvent.click(amountHeader);
    expect(mockHandleSortClick).toHaveBeenCalledWith('amount');
  });

  test('calls handleSortClick when Date header is clicked', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} />);
    const dateHeader = screen.getByText('Date');
    fireEvent.click(dateHeader);
    expect(mockHandleSortClick).toHaveBeenCalledWith('date');
  });
  
  test('displays sort direction indicator for Amount', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} sortField="amount" sortDirection="asc" />);
    const amountHeader = screen.getByText('Amount').closest('th');
    expect(within(amountHeader!).getByTestId('ArrowDropUpIcon')).toBeInTheDocument(); // MUI icons often have data-testid

    renderWithTheme(<ExpenseTable {...defaultProps} sortField="amount" sortDirection="desc" />);
    expect(within(amountHeader!).getByTestId('ArrowDropDownIcon')).toBeInTheDocument();
  });

  test('displays sort direction indicator for Date', () => {
    renderWithTheme(<ExpenseTable {...defaultProps} sortField="date" sortDirection="asc" />);
    const dateHeader = screen.getByText('Date').closest('th');
    expect(within(dateHeader!).getByTestId('ArrowDropUpIcon')).toBeInTheDocument();

    renderWithTheme(<ExpenseTable {...defaultProps} sortField="date" sortDirection="desc" />);
    expect(within(dateHeader!).getByTestId('ArrowDropDownIcon')).toBeInTheDocument();
  });

  test('conditionally renders project, category, vendor, subcontractor columns based on groupBy prop', () => {
    const { rerender } = renderWithTheme(<ExpenseTable {...defaultProps} groupBy="none" />);
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    // Vendor and Subcontractor might not be direct column headers but part of renderExpenseRow.
    // This test focuses on the table headers managed by ExpenseTable itself.

    rerender(
      <ThemeProvider theme={mockTheme}>
        <ExpenseTable {...defaultProps} groupBy="project" />
      </ThemeProvider>
    );
    expect(screen.queryByText('Project')).not.toBeInTheDocument(); // Hidden when grouping by project
    expect(screen.getByText('Category')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={mockTheme}>
        <ExpenseTable {...defaultProps} groupBy="category" />
      </ThemeProvider>
    );
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument(); // Hidden when grouping by category
  });
});
