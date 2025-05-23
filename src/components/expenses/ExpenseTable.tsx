import React from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Tooltip,
  alpha,
  Theme,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { Expense } from '../../types'; // Assuming Project type is in '../../types'
import { formatCurrency } from '../../utils/formatters'; // Assuming formatters are here

interface ExpenseTableProps {
  theme: Theme; // Pass theme for consistent styling
  loading: boolean;
  sortedExpenses: Expense[]; // Used for the "No expenses found" check and potentially if not grouping
  groupedExpenses: Record<string, Expense[]>;
  groupBy: 'none' | 'project' | 'category' | 'vendor' | 'subcontractor';
  groupTotals: Record<string, number>;
  renderExpenseRow: (expense: Expense) => JSX.Element;
  handleSortClick: (field: 'amount' | 'date') => void;
  sortField: 'amount' | 'date' | null;
  sortDirection: 'asc' | 'desc';
  searchTerm: string; // Needed for the "No expenses found" message
}

export function ExpenseTable({
  theme,
  loading,
  sortedExpenses,
  groupedExpenses,
  groupBy,
  groupTotals,
  renderExpenseRow,
  handleSortClick,
  sortField,
  sortDirection,
  searchTerm,
}: ExpenseTableProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sortedExpenses.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No expenses found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchTerm ? 'Try adjusting your search or filters' : 'Click "Add Expense" to create your first expense'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {Object.entries(groupedExpenses).map(([groupName, groupItems]) => (
        <Box key={groupName} sx={{ mb: 4 }}>
          {/* Group header - only shown when grouping is enabled */}
          {groupBy !== 'none' && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                bgcolor: 'background.paper',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" color="text.primary">
                {groupName}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {formatCurrency(groupTotals[groupName])}
              </Typography>
            </Box>
          )}

          {/* Table */}
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: 3,
              ...(groupBy !== 'none' && {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              })
            }}
          >
            <Table aria-label={`expenses table for group ${groupName}`}>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                  <TableCell>Description</TableCell>
                  <TableCell
                    align="right"
                    onClick={() => handleSortClick('amount')}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    <Tooltip title={`Sort by amount (${sortField === 'amount' && sortDirection === 'asc' ? 'lowest first' : 'highest first'})`}>
                      <span>
                        Amount
                        {sortField === 'amount' && (
                          <span style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                            {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                          </span>
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSortClick('date')}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    Date
                    {sortField === 'date' && (
                      <Tooltip title={`Sort by date (${sortDirection === 'asc' ? 'oldest first' : 'newest first'})`}>
                        <span style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                          {sortDirection === 'asc' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>Status</TableCell>
                  {groupBy !== 'project' && <TableCell>Project</TableCell>}
                  {groupBy !== 'category' && <TableCell>Category</TableCell>}
                  {groupBy !== 'vendor' && <TableCell>Vendor</TableCell>}
                  {groupBy !== 'subcontractor' && <TableCell>Subcontractor</TableCell>}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupItems.map((expense) => renderExpenseRow(expense))}

                {/* Group total row */}
                {groupBy !== 'none' && (
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.light, 0.1) }}>
                    <TableCell component="th" scope="row">
                      <Typography variant="subtitle2">Group Total</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {formatCurrency(groupTotals[groupName])}
                      </Typography>
                    </TableCell>
                    {/* Adjust colspan based on visible columns */}
                    <TableCell colSpan={
                        1 + // Status
                        (groupBy !== 'project' ? 1 : 0) +
                        (groupBy !== 'category' ? 1 : 0) +
                        (groupBy !== 'vendor' ? 1 : 0) +
                        (groupBy !== 'subcontractor' ? 1 : 0) +
                        1 // Actions
                    } />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </>
  );
}
