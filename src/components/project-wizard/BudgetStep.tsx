import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Divider,
  LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useProjectWizard, BudgetItem } from '../../contexts/ProjectWizardContext';

// Budget categories
const BUDGET_CATEGORIES = [
  'Phase Budget',
  'Materials',
  'Labor',
  'Equipment',
  'Permits',
  'Subcontractors',
  'Overhead',
  'Contingency',
  'Other'
];

const BudgetStep: React.FC = () => {
  const { state, addBudgetItem, removeBudgetItem, validateStep } = useProjectWizard();
  const { budget, projectInfo } = state;

  const [newBudgetItem, setNewBudgetItem] = useState<Partial<BudgetItem>>({
    description: '',
    category: '',
    estimatedCost: 0,
    actualCost: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBudgetItem(prev => ({
      ...prev,
      [name]: name === 'estimatedCost' || name === 'actualCost' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setNewBudgetItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBudgetItem = () => {
    if (newBudgetItem.description && newBudgetItem.category && newBudgetItem.estimatedCost) {
      addBudgetItem({
        id: Date.now().toString(),
        description: newBudgetItem.description,
        category: newBudgetItem.category as string,
        estimatedCost: newBudgetItem.estimatedCost,
        actualCost: newBudgetItem.actualCost || 0
      });

      // Reset form
      setNewBudgetItem({
        description: '',
        category: '',
        estimatedCost: 0,
        actualCost: 0
      });

      // Validate the step
      validateStep('budget');
    }
  };

  // Calculate total budget
  const totalBudgeted = budget.reduce((sum: number, item: BudgetItem) => sum + item.estimatedCost, 0);
  const totalBudget = projectInfo.totalBudget || 0;
  const budgetPercentage = totalBudget > 0 ? (totalBudgeted / totalBudget) * 100 : 0;

  // Get budget by category
  const budgetByCategory = budget.reduce((acc: Record<string, number>, item: BudgetItem) => {
    acc[item.category] = (acc[item.category] || 0) + item.estimatedCost;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Project Budget
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Add budget items to track expected costs for your project.
      </Typography>

      {/* Budget status card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                Total Budget: {projectInfo.currency || 'USD'} {totalBudget.toLocaleString()}
              </Typography>
              <Typography variant="subtitle1">
                Allocated: {projectInfo.currency || 'USD'} {totalBudgeted.toLocaleString()}
                ({budgetPercentage.toFixed(1)}%)
              </Typography>
              <Typography variant="subtitle1">
                Remaining: {projectInfo.currency || 'USD'} {(totalBudget - totalBudgeted).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Budget Allocation Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(budgetPercentage, 100)}
                color={budgetPercentage > 100 ? "error" : "primary"}
                sx={{ height: 10, borderRadius: 5 }}
              />
              {budgetPercentage > 100 && (
                <Typography variant="caption" color="error">
                  Warning: You've exceeded your total budget by {(budgetPercentage - 100).toFixed(1)}%
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Add budget item form */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Item Description"
              name="description"
              value={newBudgetItem.description || ''}
              onChange={handleInputChange}
              placeholder="e.g., Concrete"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={newBudgetItem.category || ''}
                label="Category"
                onChange={handleSelectChange}
              >
                {BUDGET_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              required
              label="Estimated Cost"
              name="estimatedCost"
              type="number"
              value={newBudgetItem.estimatedCost || ''}
              onChange={handleInputChange}
              InputProps={{
                inputProps: { min: 0 },
                startAdornment: <Typography variant="subtitle2" sx={{ mr: 1 }}>{projectInfo.currency || '$'}</Typography>
              }}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddBudgetItem}
              disabled={!newBudgetItem.description || !newBudgetItem.category || !newBudgetItem.estimatedCost}
            >
              Add Item
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Actual Cost (if known)"
              name="actualCost"
              type="number"
              value={newBudgetItem.actualCost || ''}
              onChange={handleInputChange}
              placeholder="Leave at 0 if not yet incurred"
              variant="outlined"
              InputProps={{
                inputProps: { min: 0 },
                startAdornment: <Typography variant="subtitle2" sx={{ mr: 1 }}>{projectInfo.currency || '$'}</Typography>
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" gutterBottom>
        Budget Items
      </Typography>

      {budget.length === 0 ? (
        <Card variant="outlined" sx={{ bgcolor: 'background.default', mb: 2 }}>
          <CardContent>
            <Typography variant="body1" align="center" color="text.secondary">
              No budget items added yet. Add items to allocate your budget.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Category</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2">Estimated Cost</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2">Actual Cost</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budget
                .sort((a, b) => a.category.localeCompare(b.category) || a.description.localeCompare(b.description))
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell align="right">
                      {projectInfo.currency || '$'} {item.estimatedCost.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {item.actualCost ? `${projectInfo.currency || '$'} ${item.actualCost.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeBudgetItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Budget summary by category */}
      {Object.keys(budgetByCategory).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Budget Summary by Category
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="subtitle2">Category</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">Amount</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">% of Total</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(budgetByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell>{category}</TableCell>
                      <TableCell align="right">
                        {projectInfo.currency || '$'} {amount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {totalBudgeted > 0 ? ((amount / totalBudgeted) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {projectInfo.currency || '$'} {totalBudgeted.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    100%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default BudgetStep;
