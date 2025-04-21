import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { useProjectWizard, TeamMember } from '../../contexts/ProjectWizardContext';

// Team role options
const TEAM_ROLES = [
  'Project Manager',
  'Architect',
  'Engineer',
  'Foreman',
  'Contractor',
  'Subcontractor',
  'Inspector',
  'Consultant',
  'Client Representative',
  'Other'
];

const TeamStep: React.FC = () => {
  const { state, addTeamMember, removeTeamMember, validateStep } = useProjectWizard();
  const { team } = state;

  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.role) {
      addTeamMember({
        id: Date.now().toString(),
        name: newMember.name,
        role: newMember.role as string,
        email: newMember.email || '',
        phone: newMember.phone || '',
        company: newMember.company || '',
        notes: newMember.notes || ''
      });

      // Reset form
      setNewMember({
        name: '',
        role: '',
        email: '',
        phone: '',
        company: '',
        notes: ''
      });

      // Validate step
      validateStep('team');
    }
  };

  // Group team members by role
  const teamByRole = team.members.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Project Team
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Add team members who will be working on this project.
      </Typography>

      {/* Add team member form */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Name"
              name="name"
              value={newMember.name || ''}
              onChange={handleInputChange}
              placeholder="Full name"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={newMember.role || ''}
                label="Role"
                onChange={handleSelectChange}
              >
                {TEAM_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={newMember.email || ''}
              onChange={handleInputChange}
              placeholder="Email address"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={newMember.phone || ''}
              onChange={handleInputChange}
              placeholder="Phone number"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={newMember.company || ''}
              onChange={handleInputChange}
              placeholder="Company or organization"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMember}
              disabled={!newMember.name || !newMember.role}
            >
              Add Team Member
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={newMember.notes || ''}
              onChange={handleInputChange}
              placeholder="Additional information about this team member"
              multiline
              rows={2}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" gutterBottom>
        Team Members
      </Typography>

      {team.members.length === 0 ? (
        <Card variant="outlined" sx={{ bgcolor: 'background.default', mb: 2 }}>
          <CardContent>
            <Typography variant="body1" align="center" color="text.secondary">
              No team members added yet. Add team members to build your project team.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Team summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Team Composition:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(teamByRole).map(([role, members]) => (
                <Chip 
                  key={role}
                  label={`${role}: ${members.length}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Team list by role */}
          {Object.entries(teamByRole).map(([role, members]) => (
            <Box key={role} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {role}
              </Typography>
              <List>
                {members.map((member) => (
                  <ListItem
                    key={member.id}
                    component={Paper}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name}
                      secondary={
                        <>
                          {member.company && (
                            <Typography component="span" variant="body2" display="block">
                              Company: {member.company}
                            </Typography>
                          )}
                          {member.email && (
                            <Typography component="span" variant="body2" display="block">
                              Email: {member.email}
                            </Typography>
                          )}
                          {member.phone && (
                            <Typography component="span" variant="body2" display="block">
                              Phone: {member.phone}
                            </Typography>
                          )}
                          {member.notes && (
                            <Typography component="span" variant="body2" display="block">
                              Notes: {member.notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => removeTeamMember(member.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};

export default TeamStep; 