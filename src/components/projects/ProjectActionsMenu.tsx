import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface ProjectActionsMenuProps {
  projectId: string;
  onEdit: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  // Add other action handlers as needed, e.g., onDelete
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  projectId,
  onEdit,
  onArchive,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    onEdit(projectId);
    handleClose();
  };

  const handleArchiveClick = () => {
    onArchive(projectId);
    handleClose();
  };

  return (
    <div>
      <IconButton
        aria-label="project actions"
        aria-controls={open ? 'project-actions-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="project-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'project actions button',
        }}
      >
        <MenuItem onClick={handleEditClick}>Edit Project</MenuItem>
        <MenuItem onClick={handleArchiveClick}>Move to On Hold</MenuItem>
        {/* Add other menu items here */}
      </Menu>
    </div>
  );
};
