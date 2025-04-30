import React, { useState, forwardRef } from 'react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  IconButton, 
  Tooltip, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Assessment as AssessmentIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import BudgetReport from './BudgetReport';
import { Project, Expense, ProjectPhase, Bid, BudgetProjection } from '../../../types';

interface BudgetReportButtonProps {
  project: Project;
  expenses: Expense[];
  phases: ProjectPhase[];
  bids: Bid[];
  projections: BudgetProjection[];
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const BudgetReportButton = forwardRef<HTMLButtonElement, BudgetReportButtonProps>(({
  project,
  expenses,
  phases,
  bids,
  projections,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  showIcon = true
}, ref) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        ref={ref}
        variant={variant}
        color={color}
        size={size}
        onClick={handleOpen}
        startIcon={showIcon ? <AssessmentIcon /> : undefined}
      >
        Budget Report
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={fullScreen}
        maxWidth="xl"
        PaperProps={{
          sx: {
            minHeight: '90vh',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            overflowY: 'auto'
          }
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 1,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            boxShadow: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <DialogContent sx={{ p: 0 }}>
          <BudgetReport
            project={project}
            expenses={expenses}
            phases={phases}
            bids={bids}
            projections={projections}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
});

BudgetReportButton.displayName = 'BudgetReportButton';

export default BudgetReportButton;