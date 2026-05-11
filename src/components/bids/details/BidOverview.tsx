import React from 'react';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { GetApp as DownloadIcon } from '@mui/icons-material';
import { Bid } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import {
  formatDisplayDate,
  getAttachmentDisplay,
  PRIORITY_COLORS,
  PRIORITY_DISPLAY,
  STATUS_COLORS,
  STATUS_DISPLAY,
} from './displayUtils';

interface BidOverviewProps {
  bid: Bid;
}

const BidOverview: React.FC<BidOverviewProps> = ({ bid }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Bid Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={bid.status && typeof bid.status === 'string' && STATUS_DISPLAY[bid.status] ? STATUS_DISPLAY[bid.status] : 'Unknown'}
                  size="small"
                  color={bid.status && typeof bid.status === 'string' && STATUS_COLORS[bid.status] ? STATUS_COLORS[bid.status] as any : 'default'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Priority</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={bid.priority && typeof bid.priority === 'string' && PRIORITY_DISPLAY[bid.priority] ? PRIORITY_DISPLAY[bid.priority] : 'N/A'}
                  size="small"
                  color={bid.priority && typeof bid.priority === 'string' && PRIORITY_COLORS[bid.priority] ? PRIORITY_COLORS[bid.priority] as any : 'default'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Project</Typography>
              <Typography variant="body1">{bid.projectName ? String(bid.projectName) : 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Subcontractor</Typography>
              <Typography variant="body1">{bid.subcontractorName ? String(bid.subcontractorName) : 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Submission Deadline</Typography>
              <Typography variant="body1">{formatDisplayDate(bid.submissionDeadline)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
              <Typography variant="h6" color="primary.main">
                {typeof bid.totalAmount === 'number' ? formatCurrency(bid.totalAmount) : 'N/A'}
              </Typography>
            </Grid>
            {bid.startDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Start Date</Typography>
                <Typography variant="body1">{formatDisplayDate(bid.startDate)}</Typography>
              </Grid>
            )}
            {bid.completionDate && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Completion Date</Typography>
                <Typography variant="body1">{formatDisplayDate(bid.completionDate)}</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Requirements & Tags</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Insurance Required</Typography>
              <Typography variant="body1">{bid.requiresInsurance === true ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Bond Required</Typography>
              <Typography variant="body1">{bid.requiresBond === true ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Public to Subcontractor</Typography>
              <Typography variant="body1">{bid.isPublic === true ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Approved</Typography>
              <Typography variant="body1">{bid.isApproved === true ? 'Yes' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Tags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Array.isArray(bid.tags) ? (
                  bid.tags.map((tag: string, index: number) => (
                    <Chip key={index} label={String(tag)} size="small" />
                  ))
                ) : bid.tags ? (
                  <Chip label={String(bid.tags)} size="small" />
                ) : null}
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {Array.isArray(bid.paymentSchedule) && bid.paymentSchedule.length > 0 && (
          <Grid item xs={12}>
            <Box>
              <Typography variant="h6" gutterBottom>Payment Schedule</Typography>
              <Grid container spacing={2}>
                {bid.paymentSchedule.map((stage, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle2">
                        {typeof stage.name === 'string' ? stage.name : `Stage ${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Percentage: {typeof stage.percentage === 'number' ? `${stage.percentage}%` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount: {typeof stage.amount === 'number' ? formatCurrency(stage.amount) : 'N/A'}
                      </Typography>
                      {stage.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {String(stage.description)}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        )}

        {bid.paymentProgress && typeof bid.paymentProgress === 'object' && (
          <Grid item xs={12}>
            <Box>
              <Typography variant="h6" gutterBottom>Payment Progress</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'success.light' }}>
                    <Typography variant="subtitle2">Paid</Typography>
                    <Typography variant="h6">
                      {typeof bid.paymentProgress.paid === 'number'
                        ? formatCurrency(bid.paymentProgress.paid)
                        : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'warning.light' }}>
                    <Typography variant="subtitle2">Pending</Typography>
                    <Typography variant="h6">
                      {typeof bid.paymentProgress.pending === 'number'
                        ? formatCurrency(bid.paymentProgress.pending)
                        : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light' }}>
                    <Typography variant="subtitle2">Remaining</Typography>
                    <Typography variant="h6">
                      {typeof bid.paymentProgress.remaining === 'number'
                        ? formatCurrency(bid.paymentProgress.remaining)
                        : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box>
            <Typography variant="h6" gutterBottom>Scope</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {bid.scope ? String(bid.scope) : 'No scope description provided.'}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box>
            <Typography variant="h6" gutterBottom>Attachments</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Array.isArray(bid.attachments) && bid.attachments.length > 0 ? (
                bid.attachments.map((attachment, index) => {
                  const { name, url } = getAttachmentDisplay(attachment);
                  return (
                    <Chip
                      key={index}
                      label={name}
                      icon={<DownloadIcon />}
                      onClick={() => window.open(url, '_blank')}
                    />
                  );
                })
              ) : (
                <Typography variant="body1">No attachments</Typography>
              )}
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box>
            <Typography variant="h6" gutterBottom>Notes</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {bid.notes ? String(bid.notes) : 'No notes available.'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BidOverview;
