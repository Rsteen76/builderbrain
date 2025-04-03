import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { BidService } from '../../services/bid';
import { ProjectService } from '../../services/project';
import { SubcontractorService } from '../../services/subcontractor';
import { Bid, Project, Subcontractor } from '../../types';
import ReusableBidForm from './ReusableBidForm';

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
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch data
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
      } catch (err) {
        setError('Error loading data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  // Handle form submission
  const handleSubmit = async (bidFormData: any) => {
    if (!user?.uid) return;
    
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
          id: uuidv4(),
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
      setError('Error saving bid. Please try again.');
      console.error('Error saving bid:', err);
    } finally {
      setIsSaving(false);
    }
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
        />
      </Paper>
    </Box>
  );
};

export default BidForm; 