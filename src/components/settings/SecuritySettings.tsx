import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LockReset as LockResetIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { isDevAuthBypassEnabled } from '../../config/devMode';

const SecuritySettings: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canChangePassword = useMemo(() => {
    if (isDevAuthBypassEnabled) return true;
    return Boolean(user?.providerData.some(provider => provider.providerId === 'password'));
  }, [user?.providerData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canChangePassword) {
      setError('Password changes are managed by your sign-in provider.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Security</Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep account access protected with a current password check before changes are saved.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <Typography variant="h6">Change Password</Typography>

                  {!canChangePassword && (
                    <Alert severity="info">
                      This account signs in with an external provider, so password changes are handled there.
                    </Alert>
                  )}

                  {error && <Alert severity="error">{error}</Alert>}
                  {success && <Alert severity="success">{success}</Alert>}

                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    disabled={!canChangePassword || saving || isDevAuthBypassEnabled}
                    required={!isDevAuthBypassEnabled}
                  />

                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={!canChangePassword || saving}
                    required
                    helperText="Use at least 8 characters."
                  />

                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={!canChangePassword || saving}
                    required
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={18} /> : <LockResetIcon />}
                      disabled={!canChangePassword || saving}
                    >
                      Update Password
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecuritySettings;
