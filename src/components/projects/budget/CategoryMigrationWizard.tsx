import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { 
  AutoAwesome as EnhancedIcon,
  ViewList as MapIcon,
  CheckCircle as CompleteIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import CategoryMigrationInterface from './CategoryMigrationInterface';
import { 
  getCategoryMappingsForProject, 
  saveCategoryMapping,
  updateProjectCategorySystem 
} from '../../../services/category.service';

import { 
  getUserCategorySystemPreference, 
  saveUserCategorySystemPreference 
} from '../../../utils/categoryMappingUtils';

import { initCategoryMigration } from '../../../utils/categoryMigrationUtils';

interface CategoryMigrationWizardProps {
  projectId: string;
  usedCategories: string[];
  onMigrationComplete?: () => void;
  onCancel?: () => void;
}

const CategoryMigrationWizard: React.FC<CategoryMigrationWizardProps> = ({
  projectId,
  usedCategories = [],
  onMigrationComplete,
  onCancel
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({});
  
  // Initialize category migration when the component mounts
  useEffect(() => {
    initCategoryMigration();
  }, []);
  
  // Load existing category mappings
  useEffect(() => {
    const loadMappings = async () => {
      setLoading(true);
      try {
        const mappings = await getCategoryMappingsForProject(projectId);
        setCategoryMappings(mappings || {});
      } catch (err) {
        console.error('Error loading category mappings:', err);
        setError('Failed to load category mappings');
      } finally {
        setLoading(false);
      }
    };
    
    loadMappings();
  }, [projectId]);
  
  // Update a single category mapping
  const handleUpdateMapping = async (oldCategoryId: string, newCategoryId: string) => {
    try {
      await saveCategoryMapping(projectId, oldCategoryId, newCategoryId);
      setCategoryMappings(prev => ({
        ...prev,
        [oldCategoryId]: newCategoryId
      }));
      return true;
    } catch (err) {
      console.error('Error updating category mapping:', err);
      setError('Failed to update category mapping');
      throw err;
    }
  };
  
  // Move to the next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Move to the previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Complete the migration process
  const handleCompleteMigration = async () => {
    setLoading(true);
    try {
      // Update the project to use the enhanced category system
      await updateProjectCategorySystem(projectId, 'enhanced');
      
      // Update the user preference to the enhanced system
      saveUserCategorySystemPreference('enhanced');
      
      // Call the onMigrationComplete callback if provided
      if (onMigrationComplete) {
        onMigrationComplete();
      }
    } catch (err) {
      console.error('Error completing migration:', err);
      setError('Failed to complete migration');
    } finally {
      setLoading(false);
    }
  };
  
  const steps = [
    {
      label: 'Introduction',
      content: (
        <Box sx={{ my: 2 }}>
          <Typography variant="body1" gutterBottom>
            This wizard will help you migrate your project from the legacy category system to the new enhanced category system.
          </Typography>
          
          <Card variant="outlined" sx={{ my: 2, bgcolor: theme.palette.background.default }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <EnhancedIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Benefits of the Enhanced Category System:
              </Typography>
              <ul>
                <li>More detailed categorization based on industry standards</li>
                <li>Better organization of your construction costs</li>
                <li>Improved reporting and analytics capabilities</li>
                <li>More accurate cost tracking across projects</li>
              </ul>
            </CardContent>
          </Card>
          
          <Typography variant="body2" color="text.secondary">
            During this migration, you'll map your existing categories to the new enhanced categories.
            Your existing data will remain intact, but will be organized using the new category structure.
          </Typography>
        </Box>
      )
    },
    {
      label: 'Map Categories',
      content: (
        <Box sx={{ my: 2 }}>
          <CategoryMigrationInterface
            projectId={projectId}
            categoryMappings={categoryMappings}
            onUpdateMapping={handleUpdateMapping}
            usedLegacyCategories={usedCategories}
          />
        </Box>
      )
    },
    {
      label: 'Complete Migration',
      content: (
        <Box sx={{ my: 2 }}>
          <Typography variant="body1" gutterBottom>
            You've successfully mapped all categories! The next step will apply the enhanced category system to your project.
          </Typography>
          
          <Alert severity="info" sx={{ my: 2 }}>
            <Typography variant="body2">
              <strong>What happens next?</strong>
            </Typography>
            <ul>
              <li>Your project will use the enhanced category system by default</li>
              <li>All existing items will be categorized using the new system</li>
              <li>You can still view items using the legacy categories if needed</li>
            </ul>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            Click "Complete Migration" to finalize the process.
          </Typography>
        </Box>
      )
    },
  ];
  
  if (loading && activeStep === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Category System Migration Wizard
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mb: 2, mt: 3 }}>
                  <div>
                    {index === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleCompleteMigration}
                        sx={{ mt: 1, mr: 1 }}
                        disabled={loading}
                        endIcon={<CompleteIcon />}
                      >
                        {loading ? 'Completing...' : 'Complete Migration'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Continue
                      </Button>
                    )}
                    
                    <Button
                      disabled={index === 0 || loading}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                    
                    {onCancel && (
                      <Button
                        onClick={onCancel}
                        sx={{ mt: 1 }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default CategoryMigrationWizard;