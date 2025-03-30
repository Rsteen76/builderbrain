import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../services/user';

const UserProfile: React.FC = () => {
  const { user, userData, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Partial<User>>({
    displayName: '',
    email: '',
    role: 'team_member',
    jobTitle: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        displayName: userData.displayName || '',
        email: userData.email || '',
        role: userData.role || 'team_member',
        jobTitle: userData.jobTitle || '',
        phone: userData.phone || '',
        companyName: userData.companyName || '',
      });
    }
  }, [userData]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    // Reset form to original data
    if (userData) {
      setProfileData({
        displayName: userData.displayName || '',
        email: userData.email || '',
        role: userData.role || 'team_member',
        jobTitle: userData.jobTitle || '',
        phone: userData.phone || '',
        companyName: userData.companyName || '',
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!profileData.displayName?.trim()) {
      setError('Display name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Email cannot be updated through this form, it's handled by Firebase Auth
      const updateData: Partial<User> = {
        displayName: profileData.displayName,
        role: profileData.role as UserRole,
        jobTitle: profileData.jobTitle,
        phone: profileData.phone,
        companyName: profileData.companyName,
      };
      
      await updateUserProfile(updateData);
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Please log in to view your profile
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Avatar
                src={user.photoURL || undefined}
                sx={{ width: 100, height: 100, mb: 2 }}
              >
                {!user.photoURL && <PersonIcon />}
              </Avatar>
              
              <Typography variant="h6">{userData.displayName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {userData.role.replace('_', ' ')}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {userData.email}
              </Typography>
              
              {userData.phone && (
                <Typography variant="body2" color="text.secondary">
                  {userData.phone}
                </Typography>
              )}
              
              {!isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mt: 3 }}
                >
                  Edit Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Display Name"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      disabled={!isEditing}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled={true} // Email can only be changed through Firebase Auth
                      helperText={isEditing ? "Email can't be changed here" : ""}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={profileData.role || 'team_member'}
                        label="Role"
                        onChange={(e) => setProfileData({ ...profileData, role: e.target.value as UserRole })}
                      >
                        <MenuItem value="admin">Administrator</MenuItem>
                        <MenuItem value="project_manager">Project Manager</MenuItem>
                        <MenuItem value="team_member">Team Member</MenuItem>
                        <MenuItem value="client">Client</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      value={profileData.jobTitle || ''}
                      onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                      disabled={!isEditing}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profileData.phone || ''}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={profileData.companyName || ''}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>
                
                {isEditing && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={loading}
                    >
                      Save Changes
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile; 