import React from 'react';
import {
  Stack,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  CircularProgress,
  alpha,
  Theme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  Update as UpdateIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface ProjectDetailHeaderActionsProps {
  isMobile: boolean;
  isSmall: boolean;
  quickUpdateMode: boolean;
  isSaving: boolean;
  theme: Theme;
  menuAnchorEl: null | HTMLElement;
  handleEnterQuickUpdateMode: () => void;
  handleEdit: () => void;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleCancelQuickUpdates: () => void;
  handleSaveQuickUpdates: () => void;
  handleMenuClose: () => void;
  handleAddPhase: () => void;
  handleAddBid: () => void;
  handleDelete: () => void;
}

const ProjectDetailHeaderActions: React.FC<ProjectDetailHeaderActionsProps> = ({
  isMobile,
  isSmall,
  quickUpdateMode,
  isSaving,
  theme,
  menuAnchorEl,
  handleEnterQuickUpdateMode,
  handleEdit,
  handleMenuOpen,
  handleCancelQuickUpdates,
  handleSaveQuickUpdates,
  handleMenuClose,
  handleAddPhase,
  handleAddBid,
  handleDelete,
}) => {
  return (
    <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center">
      {!quickUpdateMode && (
        <>
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            startIcon={!isSmall && <UpdateIcon />}
            onClick={handleEnterQuickUpdateMode}
            sx={{ 
              display: { xs: 'none', sm: 'flex' },
              borderRadius: 1.5,
            }}
          >
            {isSmall ? <UpdateIcon /> : "Quick Update"}
          </Button>
          
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            startIcon={!isSmall && <DownloadIcon />}
            sx={{ 
              display: { xs: 'none', sm: 'flex' },
              borderRadius: 1.5,
            }}
          >
            {isSmall ? <DownloadIcon /> : "Export"}
          </Button>
          
          <Button
            variant="contained"
            size={isMobile ? "small" : "medium"}
            startIcon={!isSmall && <EditIcon />}
            onClick={handleEdit}
            sx={{ 
              borderRadius: 1.5,
              minWidth: isSmall ? 40 : undefined
            }}
          >
            {isSmall ? <EditIcon /> : "Edit Project"}
          </Button>
          
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 1.5,
              p: '6px',
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </>
      )}
      
      {quickUpdateMode && (
        <>
          <Button
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            startIcon={<CloseIcon />}
            onClick={handleCancelQuickUpdates}
            sx={{ 
              borderRadius: 1.5,
            }}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            size={isMobile ? "small" : "medium"}
            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveQuickUpdates}
            disabled={isSaving}
            sx={{ 
              borderRadius: 1.5,
            }}
          >
            {isSaving ? 'Saving...' : 'Save Updates'}
          </Button>
        </>
      )}
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: 200,
            borderRadius: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Edit Project
        </MenuItem>
        <MenuItem onClick={handleAddPhase}>
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          Add Phase
        </MenuItem>
        <MenuItem onClick={handleAddBid}>
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          Add Bid
        </MenuItem>
        <MenuItem onClick={handleEnterQuickUpdateMode}>
          <ListItemIcon><UpdateIcon fontSize="small" /></ListItemIcon>
          Quick Update Mode
        </MenuItem>
        <MenuItem onClick={() => console.log('Share project')}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          Share Project
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          Delete Project
        </MenuItem>
      </Menu>
    </Stack>
  );
};

export default ProjectDetailHeaderActions; 