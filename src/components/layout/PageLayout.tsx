import React from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  Breadcrumbs,
  Link,
  Stack,
  alpha,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  actionButton?: React.ReactNode;
  actions?: React.ReactNode; // Alias for actionButton to maintain backward compatibility
  breadcrumbs?: Array<{ label: string; path: string }>;
  sx?: React.CSSProperties | any; // Allow sx prop for custom styling
}

/**
 * PageLayout provides a consistent layout for individual pages
 * This is used inside MainLayout which provides the overall app structure
 */
const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title,
  subtitle,
  icon, 
  actionButton,
  actions, // Support both actionButton and actions
  breadcrumbs,
  sx
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a React element, just return it as is
    if (React.isValidElement(icon)) {
      return <Box sx={{ mr: 1.5, color: theme.palette.primary.main, display: 'flex' }}>{icon}</Box>;
    }
    
    // If icon is a component type, render it
    const IconComponent = icon as React.ComponentType<any>;
    return <IconComponent sx={{ mr: 1.5, color: theme.palette.primary.main }} />;
  };
  
  return (
    <Box sx={{ ...sx }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 2 }}>
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                component="button"
                variant="body2"
                onClick={() => navigate(crumb.path)}
                underline={index === breadcrumbs.length - 1 ? 'none' : 'hover'}
                color={index === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
                sx={{ fontWeight: index === breadcrumbs.length - 1 ? 600 : 400 }}
              >
                {crumb.label}
              </Link>
            ))}
          </Breadcrumbs>
        )}

        {/* Title and Actions */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          spacing={2}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderIcon()}
            <Box>
              <Typography variant="h4" fontWeight={600}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body1" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          
          {(actionButton || actions) && (
            <Box>
              {actionButton || actions}
            </Box>
          )}
        </Stack>
      </Box>
      
      {/* Page Content */}
      <Box>
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;