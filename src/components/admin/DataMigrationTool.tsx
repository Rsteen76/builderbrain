import React, { useState } from 'react';
import { Button, Alert, CircularProgress, Box, Typography, Paper } from '@mui/material';
import { migrateExpenseAndBidData } from '../../utils/migrations/expense-transaction-migration';
import { useAuth } from '../../hooks/useAuth';

const DataMigrationTool: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigration = async () => {
    if (!user?.uid) {
      setResult({
        success: false,
        message: 'User not authenticated. Please log in first.'
      });
      return;
    }

    setLoading(true);
    try {
      // Run the migration
      const migrationResult = await migrateExpenseAndBidData(user.uid);
      setResult(migrationResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Expense Tracking System Migration
      </Typography>
      
      <Typography variant="body1" paragraph>
        This tool will update your existing expense and bid data to the new transaction-based system.
        The migration includes:
      </Typography>
      
      <ul>
        <li>Adding transaction support for expenses</li>
        <li>Updating bid payment stages to link with expenses</li>
        <li>Calculating payment progress for all bids</li>
        <li>Adding remaining amount to all expenses</li>
      </ul>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        <strong>Note:</strong> This operation is irreversible. Make sure you have a backup of your data before proceeding.
      </Typography>
      
      <Box sx={{ mt: 3, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleMigration}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Migrating Data...' : 'Run Migration'}
        </Button>
      </Box>
      
      {result && (
        <Alert
          severity={result.success ? 'success' : 'error'}
          sx={{ mt: 2 }}
        >
          {result.message}
        </Alert>
      )}
    </Paper>
  );
};

export default DataMigrationTool; 