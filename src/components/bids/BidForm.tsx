import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { BidService } from '../../services/bid';
import { ProjectService } from '../../services/project';
import { SubcontractorService } from '../../services/subcontractor';
import { Bid, Project, Subcontractor, BidPaymentStage } from '../../types';
import ReusableBidForm from './ReusableBidForm';
import { toast } from 'react-hot-toast';

const BidForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [bidData, setBidData] = useState<Partial<Bid> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialBidData, setInitialBidData] = useState<any>(null);
  const [showAddSubcontractor, setShowAddSubcontractor] = useState(false);
  const [bidId, setBidId] = useState<string | null>(id || null);
  
  // Fetch data
  useEffect(() => {
    console.log("BidForm initialization - id:", id);
    console.log("Current initialBidData:", initialBidData);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Fetch projects
        const projectsList = await ProjectService.getProjects(user.uid);
        setProjects(projectsList);
        
        // Fetch subcontractors
        const subcontractorsList = await SubcontractorService.getSubcontractors(user.uid);
        setSubcontractors(subcontractorsList);
        
        // If editing, fetch the bid data
        if (id) {
          console.log('Fetching bid data for editing, ID:', id);
          const bidToEdit = await BidService.getBid(user.uid, id);
          
          if (!bidToEdit) {
            setError(`Bid with ID ${id} not found`);
            return;
          }
          
          console.log('Retrieved bid data from server:', JSON.stringify(bidToEdit, null, 2));
          setBidData(bidToEdit);
          
          // Process payment schedule into form format
          const paymentSchedule = bidToEdit.paymentSchedule || [];
          
          let downPaymentPercent = 20; // Default
          let installments = [{id: uuidv4(), name: 'Final Payment', percent: 80, milestoneDescription: 'Upon completion'}];
          
          if (paymentSchedule.length > 0) {
            // Find down payment
            const downPayment = paymentSchedule.find(p => p.name === 'Down Payment');
            if (downPayment) {
              downPaymentPercent = downPayment.percentage || 20;
            }
            
            // Extract installments (all except down payment)
            const installmentPayments = paymentSchedule.filter(p => p.name !== 'Down Payment');
            if (installmentPayments.length > 0) {
              installments = installmentPayments.map(p => ({
                id: p.id || uuidv4(),
                name: p.name || 'Installment',
                percent: p.percentage || 0,
                milestoneDescription: p.description || '',
                phaseId: p.phaseId || bidToEdit.phaseId,
                phaseName: p.phaseName || bidToEdit.phaseName
              }));
            }
          }
          
          // Ensure submission deadline is properly converted
          let submissionDeadline: Date | undefined = undefined;
          if (bidToEdit.submissionDeadline) {
            try {
              submissionDeadline = bidToEdit.submissionDeadline instanceof Date 
                ? bidToEdit.submissionDeadline 
                : new Date(bidToEdit.submissionDeadline);
                
              // Check if the date is valid
              if (isNaN(submissionDeadline.getTime())) {
                submissionDeadline = undefined;
              }
            } catch (error) {
              console.error('Error converting submission deadline:', error);
              submissionDeadline = undefined;
            }
          }
          
          // Format bid data for the form
          const formattedBidData = {
            title: bidToEdit.title || '',
            subcontractorName: bidToEdit.subcontractorName || '',
            subcontractorId: bidToEdit.subcontractorId || '',
            totalAmount: bidToEdit.totalAmount || 0,
            phaseId: bidToEdit.phaseId || '',
            phaseName: bidToEdit.phaseName || '',
            scope: bidToEdit.scope || '',
            timeline: bidToEdit.timeline || 30,
            submissionDeadline: submissionDeadline,
            paymentTerms: {
              downPaymentPercent: downPaymentPercent,
              installments: installments
            },
            notes: bidToEdit.notes || '',
            status: bidToEdit.status || 'draft',
            attachments: Array.isArray(bidToEdit.attachments) 
                         ? bidToEdit.attachments.map(att => typeof att === 'string' ? att : (att && typeof att === 'object' && 'url' in att ? att.url : ''))
                         : [],
            tags: Array.isArray(bidToEdit.tags) ? [...bidToEdit.tags] : []
          };
          
          console.log('Setting initial bid data for form:', JSON.stringify(formattedBidData, null, 2));
          setInitialBidData(formattedBidData);
          setBidId(id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid, id]);

  // Handle form submission
  const handleSubmit = async (bidFormData: any) => {
    console.log("BidForm - handleSubmit called with data:", bidFormData);
    if (!user?.uid) return;
    
    console.log('Submitting bid form data:', JSON.stringify(bidFormData, null, 2));
    setIsSaving(true);
    
    try {
      const now = new Date();
      
      // Find the project and phase to get projectId
      const phase = projects.flatMap(p => p.phases || []).find(p => p.id === bidFormData.phaseId);
      const project = projects.find(p => p.phases?.some(ph => ph.id === bidFormData.phaseId));
      
      if (!project) {
        throw new Error('Project not found for the selected phase');
      }
      
      // Create payment schedule
      const paymentSchedule = [
        {
          id: uuidv4(),
          name: 'Down Payment',
          percentage: bidFormData.paymentTerms.downPaymentPercent,
          amount: (bidFormData.totalAmount * bidFormData.paymentTerms.downPaymentPercent) / 100,
          status: 'pending',
          phaseId: bidFormData.phaseId,
          phaseName: bidFormData.phaseName,
          dueDate: now,
          description: 'Initial payment to start work',
          createdAt: now,
          updatedAt: now
        },
        ...bidFormData.paymentTerms.installments.map((installment: any) => ({
          id: installment.id || uuidv4(),
          name: installment.name,
          percentage: installment.percent,
          amount: (bidFormData.totalAmount * installment.percent) / 100,
          status: 'pending',
          phaseId: installment.phaseId || bidFormData.phaseId,
          phaseName: installment.phaseName || bidFormData.phaseName,
          dueDate: now,
          description: installment.milestoneDescription,
          createdAt: now,
          updatedAt: now
        }))
      ];
      
      // Create bid data
      const bidData = {
        userId: user.uid,
        projectId: project.id,
        projectName: project.name,
        title: bidFormData.title || '',
        subcontractorName: bidFormData.subcontractorName || '',
        subcontractorId: bidFormData.subcontractorId || '',
        phaseId: bidFormData.phaseId || '',
        phaseName: bidFormData.phaseName || '',
        totalAmount: bidFormData.totalAmount || 0,
        scope: bidFormData.scope || '',
        timeline: bidFormData.timeline || 0,
        notes: bidFormData.notes || '',
        status: bidFormData.status || 'draft',
        priority: bidFormData.priority || 'medium',
        requiresInsurance: bidFormData.requiresInsurance || false,
        requiresBond: bidFormData.requiresBond || false,
        isPublic: bidFormData.isPublic || false,
        isApproved: bidFormData.isApproved || false,
        tags: Array.isArray(bidFormData.tags) ? bidFormData.tags : [],
        attachments: Array.isArray(bidFormData.attachments) ? bidFormData.attachments : [],
        submissionDeadline: bidFormData.submissionDeadline || null,
        startDate: bidFormData.startDate || null,
        completionDate: bidFormData.completionDate || null,
        paymentSchedule,
        updatedAt: now,
        paymentProgress: {
          paid: 0,
          pending: bidFormData.totalAmount,
          remaining: bidFormData.totalAmount
        }
      };
      
      if (id) {
        console.log('Updating existing bid:', id);
        console.log('Update data:', JSON.stringify(bidData, null, 2));
        
        // Update existing bid
        await BidService.updateBid(id, bidData);
        setSuccess('Bid updated successfully');
      } else {
        // Create new bid
        const newBid = {
          id: uuidv4(),
          ...bidData,
          createdAt: now,
        };
        await BidService.createBid(user.uid, newBid);
        setSuccess('Bid created successfully');
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      console.error('Error saving bid:', err);
      setError('Error saving bid. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubcontractor = () => {
    // Toggle the state to show/hide the QuickAddSubcontractor dialog
    setShowAddSubcontractor(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" component="h1">
          {id ? 'Edit Bid' : 'New Bid'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <ReusableBidForm
          onSubmit={handleSubmit}
          phases={projects.flatMap(p => p.phases || [])}
          subcontractors={subcontractors}
          isDialog={false}
          isSaving={isSaving}
          initialBidData={initialBidData}
          editingBidId={bidId}
          onAddSubcontractor={handleAddSubcontractor}
        />
      </Paper>

      {showAddSubcontractor && (
        <Dialog
          open={showAddSubcontractor}
          onClose={() => setShowAddSubcontractor(false)}
          aria-labelledby="quick-add-subcontractor-dialog"
        >
          <DialogTitle id="quick-add-subcontractor-dialog">Add New Subcontractor</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Subcontractor Name"
              fullWidth
              variant="outlined"
              // Add your state and onChange handling here
            />
            {/* Add more fields as needed */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddSubcontractor(false)}>Cancel</Button>
            <Button onClick={() => {
              // Handle saving the new subcontractor
              setShowAddSubcontractor(false);
            }}>Add</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default BidForm; 