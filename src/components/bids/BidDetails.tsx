import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logger } from '../../utils/logger';
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
  Tooltip,
  Alert,
  AlertTitle,
  Stack,
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
import { useAuth } from '../../contexts/AuthContext';
import BidDeletionWrapper from './BidDeletionWrapper';
import ReusableBidForm from './ReusableBidForm';
import { SubcontractorService } from '../../services/subcontractor';
import BidPaymentSchedule from '../projects/BidPaymentSchedule';
import QuickAddSubcontractorDialog from '../dialogs/QuickAddSubcontractorDialog';
import { submitBid } from '../../utils/bidOperations';
import BidOverview from './details/BidOverview';
import VersionCard from './details/VersionCard';
import {
  formatVersionDate,
  formatVersionTime,
  getInitialBidFormData,
  sortVersionsByNumberDesc,
} from './details/displayUtils';

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
              logger.error("Error fetching project details:", projErr);
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
        logger.error('Error fetching bid:', err);
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
          logger.error("Error fetching subcontractors for BidDetails:", err);
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
      logger.error('BidDetails: Failed to save bid', err);
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
      logger.error('BidDetails: Failed to add subcontractor', err);
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
            initialBidData={getInitialBidFormData(bid)}
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
      <BidOverview bid={bid} />

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
                sortVersionsByNumberDesc(bid.versions).map((version: BidVersion) => (
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
                    {currentVersion.createdAt
                      ? <>Created on {formatVersionDate(currentVersion.createdAt)} at {formatVersionTime(currentVersion.createdAt)}</>
                      : 'Creation date unknown'}
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
