import React from 'react';
import {
  Box,
  IconButton,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { BidPaymentProgress } from '../../../types';
import { calculateCompletionPercentage, formatCurrency } from './paymentScheduleUtils';

interface PaymentProgressHeaderProps {
  expanded: boolean;
  paidAmount: BidPaymentProgress['paid'];
  totalAmount: number;
  onToggleExpand: () => void;
}

const PaymentProgressHeader: React.FC<PaymentProgressHeaderProps> = ({
  expanded,
  paidAmount,
  totalAmount,
  onToggleExpand,
}) => {
  const completionPercentage = calculateCompletionPercentage(paidAmount, totalAmount);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        p: 1
      }}
      onClick={onToggleExpand}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
        <Typography variant="h6" component="div" sx={{ ml: 1 }}>
          Payment Schedule
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', width: '40%' }}>
        <Typography variant="body2" sx={{ mr: 1, minWidth: '100px' }}>
          {formatCurrency(paidAmount)} / {formatCurrency(totalAmount)}
        </Typography>
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: completionPercentage === 100 ? 'success.main' : 'primary.main',
              }
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ ml: 1, minWidth: '40px' }}>
          {completionPercentage}%
        </Typography>
      </Box>
    </Box>
  );
};

export default PaymentProgressHeader;
