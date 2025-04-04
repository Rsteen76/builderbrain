import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemText,
  alpha,
  Theme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Compare as CompareIcon,
  Description as DocumentIcon,
  Gavel as BidsIcon,
} from '@mui/icons-material';
import { Bid, BidPaymentStage } from '../../../types';
import BidDeletionWrapper from '../../bids/BidDeletionWrapper';
import { useAuth } from '../../../hooks/useAuth';

interface ProjectBidsTabProps {
  bids: Bid[];
  recentBids: Bid[];
  theme: Theme;
  handleAddBid: () => void;
  handleEditBid: (bidId: string) => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | string) => string;
}

const ProjectBidsTab: React.FC<ProjectBidsTabProps> = ({
  bids,
  recentBids,
  theme,
  handleAddBid,
  handleEditBid,
  formatCurrency,
  formatDate,
}) => {
  const { user } = useAuth();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Project Bids</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddBid}
          sx={{ borderRadius: 1.5 }}
        >
          Add New Bid
        </Button>
      </Box>
      
      {/* Bid Comparison Section */}
      {recentBids.length > 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2, 
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CompareIcon sx={{ mr: 1 }} /> Bid Comparison
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell>Down Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBids.map((bid) => {
                  // Calculate down payment from payment schedule
                  const downPayment = bid.paymentSchedule?.[0]?.amount || 0;
                  
                  return (
                    <TableRow key={bid.id} hover>
                      <TableCell>{bid.subcontractorName}</TableCell>
                      <TableCell>{formatCurrency(bid.totalAmount)}</TableCell>
                      <TableCell>{bid.timeline} days</TableCell>
                      <TableCell>{formatCurrency(downPayment)}</TableCell>
                      <TableCell>
                        <Chip
                          label={bid.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: '12px',
                            bgcolor: alpha(
                              bid.status === 'accepted' ? theme.palette.success.main : 
                              bid.status === 'rejected' ? theme.palette.error.main : 
                              bid.status === 'draft' ? theme.palette.grey[500] :
                              bid.status === 'submitted' ? theme.palette.info.main : 
                              theme.palette.warning.main, 0.1
                            ),
                            color: bid.status === 'accepted' ? theme.palette.success.main : 
                                  bid.status === 'rejected' ? theme.palette.error.main : 
                                  bid.status === 'draft' ? theme.palette.grey[700] :
                                  bid.status === 'submitted' ? theme.palette.info.main : 
                                  theme.palette.warning.main,
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleEditBid(bid.id)}
                          sx={{ mr: 1, borderRadius: 1.5 }}
                        >
                          View
                        </Button>
                        <BidDeletionWrapper
                          bid={bid}
                          userId={user?.uid || ''}
                          onBidDeleted={() => {
                            // The parent component will handle the state update
                            // through its own data fetching mechanism
                          }}
                          variant="icon"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {bids.map((bid) => (
          <Grid item xs={12} md={6} lg={4} key={bid.id}>
            <Card elevation={0} sx={{ 
              borderRadius: 2, 
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                borderColor: 'transparent',
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>{bid.title || `Bid from ${bid.subcontractorName}`}</Typography>
                  <Chip
                    label={bid.status.replace('_', ' ')}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: alpha(
                        bid.status === 'accepted' ? theme.palette.success.main : 
                        bid.status === 'rejected' ? theme.palette.error.main : 
                        bid.status === 'draft' ? theme.palette.grey[500] :
                        bid.status === 'submitted' ? theme.palette.info.main : 
                        theme.palette.warning.main, 0.1
                      ),
                      color: bid.status === 'accepted' ? theme.palette.success.main : 
                             bid.status === 'rejected' ? theme.palette.error.main : 
                             bid.status === 'draft' ? theme.palette.grey[700] :
                             bid.status === 'submitted' ? theme.palette.info.main : 
                             theme.palette.warning.main,
                      borderRadius: 1,
                      textTransform: 'capitalize'
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Contractor</Typography>
                  <Typography variant="body1">{bid.subcontractorName || 'Not assigned'}</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Bid Amount</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatCurrency(bid.totalAmount)}</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Timeline</Typography>
                  <Typography variant="body1">{bid.timeline} days</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Submission Date</Typography>
                  <Typography variant="body1">
                    {bid.createdAt ? formatDate(bid.createdAt) : 'N/A'}
                  </Typography>
                </Box>
                
                {/* Payment Terms Section */}
                {bid.paymentSchedule && bid.paymentSchedule.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Payment Terms</Typography>
                    <List dense disablePadding>
                      {bid.paymentSchedule.map((payment: BidPaymentStage, index: number) => (
                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">{payment.name}</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(payment.amount)}</Typography>
                              </Box>
                            }
                            secondary={payment.description}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {bid.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{bid.notes}</Typography>
                  </Box>
                )}
                
                {bid.attachments && bid.attachments.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Documents</Typography>
                    {bid.attachments.map((doc: any, index: number) => {
                      const docName = typeof doc === 'string' ? doc : doc.name;
                      const docUrl = typeof doc === 'string' ? '#' : doc.url;
                      
                      return (
                        <Chip
                          key={index}
                          label={docName}
                          size="small"
                          icon={<DocumentIcon fontSize="small" />}
                          clickable
                          onClick={() => window.open(docUrl, '_blank')}
                          sx={{ mr: 0.5, mb: 0.5, borderRadius: 1 }}
                        />
                      );
                    })}
                  </Box>
                )}
              </CardContent>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <Tooltip title="Edit Bid">
                  <IconButton size="small" onClick={() => handleEditBid(bid.id)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <BidDeletionWrapper
                  bid={bid}
                  userId={user?.uid || ''}
                  onBidDeleted={() => {
                    // The parent component will handle the state update
                    // through its own data fetching mechanism
                  }}
                  variant="icon"
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {bids.length === 0 && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 6 
        }}>
          <BidsIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No bids available</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Start by adding a new bid for this project</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleAddBid}
            sx={{ borderRadius: 1.5 }}
          >
            Add New Bid
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProjectBidsTab; 