import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Alert,
  AlertTitle,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  FileCopy as DuplicateIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { Bid, BidVersion, Subcontractor, ProjectPhase } from '../../types';
import { BidFormData } from '../../types/form.types';
import { BidService } from '../../services/bid';
import { ProjectService } from '../../services/project';
import LineItemsTable from './LineItemsTable';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import BidDeletionWrapper from './BidDeletionWrapper';
import ReusableBidForm from './ReusableBidForm';
import { SubcontractorService } from '../../services/subcontractor';
import { v4 as uuidv4 } from 'uuid';
import BidPaymentSchedule from '../projects/BidPaymentSchedule';
import QuickAddSubcontractorDialog from '../dialogs/QuickAddSubcontractorDialog';
import { submitBid } from '../../utils/bidOperations';

// Status chip colors (Align with Bid['status'] from types/index.ts)
const STATUS_COLORS: Record<Bid['status'], string> = {
  draft: 'default',
  submitted: 'info',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
  withdrawn: 'default',
  revision_requested: 'warning',
};

// Priority chip colors (NonNullable handles potential undefined)
const PRIORITY_COLORS: Record<NonNullable<Bid['priority']>, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

// Status display names (Align with Bid['status'] from types/index.ts)
const STATUS_DISPLAY: Record<Bid['status'], string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  revision_requested: 'Revision Requested',
};

// Priority display names
const PRIORITY_DISPLAY: Record<NonNullable<Bid['priority']>, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Version card component for showing bid version history
interface VersionCardProps {
  version: BidVersion;
  isSelected: boolean;
  onSelect: () => void;
}

const VersionCard: React.FC<VersionCardProps> = ({ version, isSelected, onSelect }) => {
  const theme = useTheme();
  
  // Safely get version creation date
  const getVersionDate = (dateVal: any) => {
    if (!dateVal) return 'Unknown date';
    try {
      const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Safely get version creation time
  const getVersionTime = (dateVal: any) => {
    if (!dateVal) return 'Unknown time';
    try {
      const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
      return date.toLocaleTimeString();
    } catch (e) {
      return 'Invalid time';
    }
  };
  
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
          Created on {getVersionDate(version.createdAt)} at {getVersionTime(version.createdAt)}
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

const BidDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSavingBid, setIsSavingBid] = useState<boolean>(false);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loadingSubcontractors, setLoadingSubcontractors] = useState<boolean>(false);
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [loadingProject, setLoadingProject] = useState<boolean>(false);
  const [showAddSubcontractor, setShowAddSubcontractor] = useState<boolean>(false);
  const [isAddingSubcontractor, setIsAddingSubcontractor] = useState<boolean>(false);
  
  // Callback for when bid is updated (for BidPaymentSchedule component)
  const handleBidUpdate = (updatedBid: Bid) => {
    setBid(updatedBid);
  };
  
  useEffect(() => {
    const fetchBidAndProjectDetails = async () => {
      if (!id || !user?.uid) {
        setError(!id ? 'Bid ID is missing' : 'User not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch Bid
        const bidData = await BidService.getBid(user.uid, id);
        if (!bidData) {
          setError('Bid not found or access denied');
          setBid(null);
        } else {
          setBid(bidData);
          setSelectedVersionId(bidData.currentVersionId || null);

          // ---> Fetch Project Phases if Bid found and has projectId <----
          if (bidData.projectId) {
            setLoadingProject(true);
            try {
              const projectData = await ProjectService.getProjectById(bidData.projectId);
              setProjectPhases(projectData?.phases || []);
            } catch (projErr) {
              console.error("Error fetching project details:", projErr);
              setError('Failed to load associated project phases.'); // Add specific error
              setProjectPhases([]);
            } finally {
              setLoadingProject(false);
            }
          } else {
            setProjectPhases([]); // No project ID associated with the bid
          }
          // ---> END Fetch Project Phases <----
        }
      } catch (err) {
        console.error('Error fetching bid:', err);
        setError('Failed to load bid details');
        setBid(null);
        setProjectPhases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBidAndProjectDetails();
  }, [id, user]); // Rerun if id or user changes
  
  useEffect(() => {
    const fetchSubcontractors = async () => {
      if (user?.uid) {
        setLoadingSubcontractors(true);
        try {
          const fetchedSubs = await SubcontractorService.getSubcontractors(user.uid);
          setSubcontractors(fetchedSubs);
        } catch (err) {
          console.error("Error fetching subcontractors for BidDetails:", err);
        } finally {
          setLoadingSubcontractors(false);
        }
      }
    };
    fetchSubcontractors();
  }, [user]);
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersionId(versionId);
  };
  
  const handleEdit = () => {
    if (!id) return;
    setError(null);
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    if (isSavingBid) return;
    setError(null);
    setIsEditing(false);
  };
  
  const handleAddNewSubcontractor = () => {
    setShowAddSubcontractor(true);
  };
  
  const handleSave = async (formData: BidFormData) => {
    if (!id || !user?.uid || !bid) return;

    setIsSavingBid(true);
    setError(null);
    try {
      const finalProjectId = formData.projectId || bid.projectId;
      if (!finalProjectId) {
        throw new Error('Project ID is missing for this bid.');
      }

      const savedBid = await submitBid(
        user.uid,
        {
          ...formData,
          projectId: finalProjectId,
          projectName: formData.projectName || bid.projectName,
        },
        id,
        finalProjectId,
        formData.projectName || bid.projectName || 'Unknown Project'
      );

      if (!savedBid) {
        throw new Error('Failed to save bid.');
      }

      setBid(savedBid);
      setSelectedVersionId(savedBid.currentVersionId || null);
      setIsEditing(false);
    } catch (err) {
      console.error('BidDetails: Failed to save bid', err);
      setError(err instanceof Error ? err.message : 'Failed to save bid.');
    } finally {
      setIsSavingBid(false);
    }
  };

  const handleQuickAddSubcontractor = async (subcontractorData: {
    name: string;
    specialty: string;
    contact: {
      phone: string;
      email: string;
    };
  }) => {
    if (!user?.uid) return;

    setIsAddingSubcontractor(true);
    setError(null);
    try {
      const newSubcontractor = await SubcontractorService.createSubcontractor(user.uid, {
        name: subcontractorData.name,
        specialty: subcontractorData.specialty,
        contact: subcontractorData.contact,
        rating: 0,
        totalProjects: 0,
      });

      setSubcontractors((current) => [...current, newSubcontractor]);
      setShowAddSubcontractor(false);
    } catch (err) {
      console.error('BidDetails: Failed to add subcontractor', err);
      setError('Failed to add subcontractor.');
    } finally {
      setIsAddingSubcontractor(false);
    }
  };
  
  const handleDuplicate = () => {
    if (!bid) return;
    navigate('/bids/new', { state: { duplicate: bid } });
  };
  
  const handleBack = () => {
    navigate('/bids');
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  // Get current version details
  const getCurrentVersion = (): BidVersion | null => {
    if (!bid?.versions || !selectedVersionId) return null;
    // Ensure find callback uses correct type
    return bid.versions.find((v: BidVersion) => v.id === selectedVersionId) || null;
  };
  
  const currentVersion = getCurrentVersion();
  
  // Adjust loading state to include project loading
  if (loading || loadingProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !bid) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || 'Bid not found'}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Bids
        </Button>
      </Box>
    );
  }
  
  // ---> MAP Bid to Initial Form Data (inside return, before render) <----
  const getInitialFormData = (): Partial<BidFormData> | undefined => {
    if (!bid) return undefined;
    
    // Helper to convert status
    const convertBidStatus = (status: Bid['status']): 'submitted' | 'draft' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'revision_requested' => {
        // Keep all statuses available in the form
        return status;
    };
    
    // Helper to convert attachments
    const convertAttachments = (attachments: Bid['attachments']): string[] => {
        if (!attachments) return [];
        // Assuming attachments are stored as { name: string, url: string } or similar
        // Adjust this based on your actual Attachment type structure
        return attachments.map(att => 
            typeof att === 'string' ? att : (att?.url || 'invalid-attachment')
        );
    };
    
    return {
      title: bid.title || '',
      subcontractorId: bid.subcontractorId || '',
      subcontractorName: bid.subcontractorName || '',
      totalAmount: bid.totalAmount || 0,
      phaseId: bid.phaseId || '', // Use bid's phaseId directly
      phaseName: bid.phaseName || '', // Use bid's phaseName directly
      scope: bid.scope || '',
      timeline: bid.timeline || 30, // Assuming timeline is stored on bid
      status: convertBidStatus(bid.status),
      submissionDeadline: bid.submissionDeadline || null,
      paymentTerms: {
        downPaymentPercent: bid.paymentSchedule?.[0]?.percentage || 0,
        isDownPaymentFixed: false,
        downPaymentAmount: bid.paymentSchedule?.[0]?.amount || 0,
        installments: bid.paymentSchedule?.slice(1).map(payment => ({
          id: payment.id || uuidv4(), // Need uuidv4 import if not already there
          name: payment.name || '',
          percent: payment.percentage || 0,
          isFixedAmount: Boolean(payment.isFixedAmount),
          fixedAmount: payment.amount || 0,
          milestoneDescription: payment.description || '',
          phaseId: payment.phaseId || '',
          phaseName: payment.phaseName || '',
        })) || [],
        syncInstallmentPhases: true
      },
      notes: bid.notes || '',
      attachments: convertAttachments(bid.attachments),
      tags: Array.isArray(bid.tags) ? bid.tags : [],
      projectId: bid.projectId, // Keep projectId
    };
  };
  // ---> END MAP Bid to Initial Form Data <----

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4">{bid.title || 'Untitled Bid'}</Typography>
        </Box>
        <Box>
          <Stack direction="row" spacing={1}>
            {isEditing ? (
              <>
                <Button variant="outlined" onClick={handleCancelEdit} disabled={isSavingBid}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outlined" 
                  startIcon={<DuplicateIcon />} 
                  onClick={handleDuplicate}
                  sx={{ mr: 1 }}
                >
                  Duplicate
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<EditIcon />} 
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <BidDeletionWrapper
                  bid={bid}
                  userId={user?.uid || ''}
                  onBidDeleted={() => navigate('/bids')}
                />
                <Tooltip title="More actions"><IconButton><HistoryIcon /></IconButton></Tooltip>
                <Tooltip title="Print/Download"><IconButton onClick={handlePrint}><PrintIcon /></IconButton></Tooltip>
              </>
            )}
          </Stack>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isEditing ? (
        <Paper sx={{ p: { xs: 1.5, md: 2.5 }, mb: 3 }}>
          <ReusableBidForm
            initialBidData={getInitialFormData()}
            onSubmit={handleSave}
            onClose={handleCancelEdit}
            subcontractors={subcontractors}
            onAddSubcontractor={handleAddNewSubcontractor}
            phases={projectPhases}
            isDialog={false}
            editingBidId={bid.id}
            isSaving={isSavingBid || loadingSubcontractors}
            projectId={bid.projectId}
            projectName={bid.projectName}
            error={error}
          />
        </Paper>
      ) : (
        <>
      {/* Status and details section */}
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
                <Typography variant="body1">
                  {bid.submissionDeadline && 
                   (bid.submissionDeadline instanceof Date || 
                    (typeof bid.submissionDeadline === 'string' && !isNaN(Date.parse(bid.submissionDeadline)))) ? 
                    new Date(bid.submissionDeadline).toLocaleDateString() : 'N/A'}
                </Typography>
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
                  <Typography variant="body1">
                    {bid.startDate && 
                     (bid.startDate instanceof Date || 
                      (typeof bid.startDate === 'string' && !isNaN(Date.parse(bid.startDate)))) ? 
                      new Date(bid.startDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
              )}
              {bid.completionDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Completion Date</Typography>
                  <Typography variant="body1">
                    {bid.completionDate && 
                     (bid.completionDate instanceof Date || 
                      (typeof bid.completionDate === 'string' && !isNaN(Date.parse(bid.completionDate)))) ? 
                      new Date(bid.completionDate).toLocaleDateString() : 'N/A'}
                  </Typography>
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
          
          {/* Add payment schedule if it exists */}
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
          
          {/* Add payment progress if it exists */}
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
                    // Handle both string and object attachment formats
                    const attachmentName = typeof attachment === 'string' 
                      ? attachment 
                      : (attachment && typeof attachment === 'object' && 'name' in attachment 
                        ? attachment.name 
                        : 'Unnamed Attachment');
                    const attachmentUrl = typeof attachment === 'string' 
                      ? attachment 
                      : (attachment && typeof attachment === 'object' && 'url' in attachment 
                        ? attachment.url 
                        : '#');
                    return (
                      <Chip
                        key={index}
                        label={String(attachmentName)}
                        icon={<DownloadIcon />}
                        onClick={() => window.open(attachmentUrl, '_blank')}
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

      {/* Payment Management Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Payment Management</Typography>
        {user && bid && bid.projectId && (
          <BidPaymentSchedule 
            bid={bid} 
            userId={user.uid} 
            projectId={bid.projectId} 
            onBidUpdate={handleBidUpdate}
          />
        )}
      </Paper>
      
      {/* Tabs for Line Items and Version History */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Line Items" />
          <Tab label="Version History" />
        </Tabs>
        
        {/* Line Items Tab */}
        {tabValue === 0 && currentVersion && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Line Items (Version {currentVersion.versionNumber})
              </Typography>
              <Box>
                <Tooltip title="Print Bid">
                  <IconButton onClick={handlePrint}>
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download as PDF">
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <LineItemsTable 
              lineItems={currentVersion.lineItems || []} 
              onChange={() => {}} // Read-only mode 
              editable={false}
            />
          </Box>
        )}
        
        {/* Version History Tab */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Version History
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a version to view its details
              </Typography>
              {Array.isArray(bid.versions) && bid.versions.length > 0 ? 
                bid.versions
                  .sort((a: BidVersion, b: BidVersion) => 
                    (typeof a.versionNumber === 'number' && typeof b.versionNumber === 'number') 
                      ? b.versionNumber - a.versionNumber 
                      : 0
                  )
                  .map((version: BidVersion) => (
                    <VersionCard 
                      key={version.id} 
                      version={version} 
                      isSelected={version.id === selectedVersionId}
                      onSelect={() => handleVersionSelect(version.id)}
                    />
                  ))
                : 
                <Typography variant="body1">No version history available</Typography>
              }
            </Grid>
            <Grid item xs={12} md={8}>
              {currentVersion && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Version {currentVersion.versionNumber || '?'} Details
                    {currentVersion.id === bid.currentVersionId && (
                      <Chip label="Current" color="primary" size="small" sx={{ ml: 2 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {currentVersion.createdAt ? (
                      <>
                        Created on {
                          (() => {
                            try {
                              const date = currentVersion.createdAt instanceof Date 
                                ? currentVersion.createdAt 
                                : new Date(currentVersion.createdAt);
                              return date.toLocaleDateString();
                            } catch (e) {
                              return 'Invalid date';
                            }
                          })()
                        } at {
                          (() => {
                            try {
                              const date = currentVersion.createdAt instanceof Date 
                                ? currentVersion.createdAt 
                                : new Date(currentVersion.createdAt);
                              return date.toLocaleTimeString();
                            } catch (e) {
                              return 'Invalid time';
                            }
                          })()
                        }
                      </>
                    ) : 'Creation date unknown'}
                  </Typography>
                  
                  {currentVersion.notes && (
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>Version Notes:</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {String(currentVersion.notes)}
                      </Typography>
                    </Paper>
                  )}
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Line Items
                  </Typography>
                  <LineItemsTable 
                    lineItems={Array.isArray(currentVersion.lineItems) ? currentVersion.lineItems : []} 
                    onChange={() => {}} // Read-only mode 
                    editable={false}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </Box>
        </>
      )}

      <QuickAddSubcontractorDialog
        open={showAddSubcontractor}
        onClose={() => setShowAddSubcontractor(false)}
        onSubmit={handleQuickAddSubcontractor}
        isSaving={isAddingSubcontractor}
      />
    </Box>
  );
};

export default BidDetails;
