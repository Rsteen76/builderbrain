import React from 'react';
import { Box, Card, CardContent, Chip, Typography, useTheme } from '@mui/material';
import { BidVersion } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { formatVersionDate, formatVersionTime } from './displayUtils';

interface VersionCardProps {
  version: BidVersion;
  isSelected: boolean;
  onSelect: () => void;
}

const VersionCard: React.FC<VersionCardProps> = ({ version, isSelected, onSelect }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Version {version.versionNumber || '?'}</Typography>
          {isSelected && (
            <Chip label="Current" color="primary" size="small" />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Created on {formatVersionDate(version.createdAt)} at {formatVersionTime(version.createdAt)}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Total: {typeof version.totalAmount === 'number' ? formatCurrency(version.totalAmount) : 'N/A'}
        </Typography>
        <Typography variant="body2">
          Line items: {Array.isArray(version.lineItems) ? version.lineItems.length : 0}
        </Typography>
        {version.notes && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" fontWeight="bold">Notes:</Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {String(version.notes)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VersionCard;
