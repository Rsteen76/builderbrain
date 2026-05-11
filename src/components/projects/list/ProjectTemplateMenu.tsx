import React from 'react';
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Business as BusinessIcon,
  Construction as ConstructionIcon,
  Home as HomeIcon,
  House as HouseIcon,
  Landscape as LandscapeIcon,
} from '@mui/icons-material';
import { PROJECT_WIZARD_ROUTE } from '../../../constants/projectRoutes';

export interface ProjectTemplateOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  route: string;
  params: { template: string };
  color: string;
}

interface ProjectTemplateMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (template: ProjectTemplateOption) => void;
}

export const useProjectTemplates = (): ProjectTemplateOption[] => {
  const theme = useTheme();

  return [
    {
      id: 'residential',
      name: 'Residential Construction',
      icon: <HouseIcon fontSize="small" />,
      description: 'Single-family homes, multi-family units, renovations, and additions.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'residential' },
      color: theme.palette.primary.main,
    },
    {
      id: 'commercial',
      name: 'Commercial Building',
      icon: <BusinessIcon fontSize="small" />,
      description: 'Office buildings, retail spaces, warehouses, and industrial facilities.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'commercial' },
      color: theme.palette.secondary.main,
    },
    {
      id: 'renovation',
      name: 'Renovation Project',
      icon: <ConstructionIcon fontSize="small" />,
      description: 'Remodeling existing structures, tenant improvements, and historic renovations.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'renovation' },
      color: '#ff9800',
    },
    {
      id: 'kitchen-remodel',
      name: 'Kitchen Remodel',
      icon: <HomeIcon fontSize="small" />,
      description: 'Specialized kitchen renovation with industry-standard phases and timelines.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'kitchen-remodel' },
      color: '#e91e63',
    },
    {
      id: 'landscaping',
      name: 'Landscaping Project',
      icon: <LandscapeIcon fontSize="small" />,
      description: 'Outdoor spaces, hardscaping, softscaping, and landscape construction.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'landscaping' },
      color: '#4caf50',
    },
    {
      id: 'custom',
      name: 'Custom Project',
      icon: <AddCircleOutlineIcon fontSize="small" />,
      description: 'Create your own project structure with custom phases tailored to your specific needs.',
      route: PROJECT_WIZARD_ROUTE,
      params: { template: 'custom' },
      color: '#9c27b0',
    },
  ];
};

const ProjectTemplateMenu: React.FC<ProjectTemplateMenuProps> = ({ anchorEl, onClose, onSelect }) => {
  const templates = useProjectTemplates();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        elevation: 2,
        sx: {
          minWidth: 220,
          maxWidth: 280,
          borderRadius: 1.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          pb: 1,
        },
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ px: 2, py: 1.5, fontWeight: 600, color: 'text.primary' }}
      >
        Choose Project Type
      </Typography>

      {templates.map((template) => (
        <MenuItem
          key={template.id}
          onClick={() => onSelect(template)}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': {
              backgroundColor: alpha(template.color, 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ color: template.color, minWidth: 36 }}>
            {template.icon}
          </ListItemIcon>
          <ListItemText
            primary={template.name}
            sx={{
              '& .MuiTypography-root': {
                fontWeight: 600,
                fontSize: '0.9rem',
              },
            }}
          />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default ProjectTemplateMenu;
