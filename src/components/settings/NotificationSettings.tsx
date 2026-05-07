import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { Notifications as NotificationsIcon, Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../services/user';

const defaultSettings = {
  notifications: true,
  emailNotifications: true,
};

const NotificationSettings: React.FC = () => {
  const { userData, updateUserProfile } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSettings({
      notifications: userData?.settings?.notifications ?? defaultSettings.notifications,
      emailNotifications: userData?.settings?.emailNotifications ?? defaultSettings.emailNotifications,
    });
  }, [userData?.settings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile({ settings } as Partial<User>);
      setSuccess('Notification preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences.');
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
                <NotificationsIcon color="primary" />
                <Typography variant="h6">Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose which account-level alerts should be sent when notification channels are active.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h6">Notification Preferences</Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={(event) => setSettings(current => ({
                        ...current,
                        notifications: event.target.checked,
                      }))}
                    />
                  }
                  label="In-app notifications"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(event) => setSettings(current => ({
                        ...current,
                        emailNotifications: event.target.checked,
                      }))}
                    />
                  }
                  label="Email notifications"
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    Save Preferences
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationSettings;
