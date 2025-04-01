import React from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
  Avatar,
  alpha,
  useTheme,
  useMediaQuery,
  SxProps,
  Theme
} from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon: SvgIconComponent;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  sx?: SxProps<Theme>;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  actions,
  maxWidth = 'xl',
  sx
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container 
      maxWidth={maxWidth} 
      sx={{
        mt: { xs: 2, sm: 3 }, 
        pb: 4,
        ...sx
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ 
          mb: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2 }
        }}
      >
        <Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
              }}
            >
              <Icon />
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                component="h1" 
                fontWeight={600}
                sx={{ 
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
        {actions && (
          <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {actions}
          </Box>
        )}
      </Stack>
      {children}
    </Container>
  );
};

export default PageLayout; 