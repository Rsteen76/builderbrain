import React, { useCallback } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useStorage } from '../../hooks/useStorage';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  buttonText?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Upload File',
  buttonText = 'Choose File',
  disabled = false,
}) => {
  const {
    uploadProgress,
    error,
    uploadProjectDocument,
    uploadProjectPhoto,
    uploadUserAvatar,
    uploadCompanyLogo,
    uploadBidAttachment,
  } = useStorage();

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file size
      if (file.size > maxSize) {
        onUploadError?.(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        return;
      }

      try {
        let url: string | null = null;

        // Determine the appropriate upload function based on the file type
        if (file.type.startsWith('image/')) {
          // For images, we'll use project photos as default
          url = await uploadProjectPhoto('temp', file);
        } else {
          // For documents, we'll use project documents as default
          url = await uploadProjectDocument('temp', file);
        }

        if (url) {
          onUploadComplete(url);
        }
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [maxSize, onUploadComplete, onUploadError, uploadProjectDocument, uploadProjectPhoto]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <input
        accept={accept}
        style={{ display: 'none' }}
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <label htmlFor="file-upload">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={disabled}
          fullWidth
        >
          {buttonText}
        </Button>
      </label>

      {uploadProgress && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {uploadProgress.state === 'success'
                ? 'Upload complete'
                : uploadProgress.state === 'error'
                ? 'Upload failed'
                : 'Uploading...'}
            </Typography>
            {uploadProgress.state === 'success' && (
              <Tooltip title="Clear">
                <IconButton size="small" onClick={() => onUploadComplete('')}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={uploadProgress.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }}
          />
        </Box>
      )}

      {error && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mt: 1 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}; 