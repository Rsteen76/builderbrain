import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
  Stack,
  Divider,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  ConstructionOutlined as ConstructionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
}

const AuthPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    displayName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        if (!formData.displayName) {
          throw new Error('Display name is required');
        }
        await signUp(formData.email, formData.password, formData.displayName);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 5,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                mx: 'auto',
                mb: 2,
                width: 56,
                height: 56,
                bgcolor: theme.palette.primary.main,
              }}
            >
              <ConstructionIcon fontSize="large" />
            </Avatar>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogin
                ? 'Sign in to manage your construction projects'
                : 'Register to start managing your construction projects'}
            </Typography>
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' }
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {!isLogin && (
                <TextField
                  label="Full Name"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  autoComplete="name"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              )}

              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                required
                autoComplete="email"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        size="small"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {isLogin && (
                <Box sx={{ textAlign: 'right' }}>
                  <Link 
                    href="#" 
                    color="primary" 
                    variant="body2" 
                    underline="hover"
                    sx={{ fontWeight: 500 }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mt: 2,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 3, mb: 3 }}>
            <Divider>
              <Typography
                variant="body2"
                component="span"
                sx={{
                  px: 1,
                  color: theme.palette.text.secondary,
                }}
              >
                OR
              </Typography>
            </Divider>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.9rem',
              mb: 2,
              color: theme.palette.text.primary,
              borderColor: alpha(theme.palette.divider, 0.5),
              '&:hover': {
                borderColor: theme.palette.divider,
                backgroundColor: alpha(theme.palette.common.black, 0.02),
              },
            }}
          >
            Continue with Google
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Link
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                onClick={toggleAuthMode}
                sx={{ ml: 1, fontWeight: 600 }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Link>
            </Typography>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Construction Management App
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
              Privacy Policy
            </Link>
            •
            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
              Terms of Service
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthPage; 