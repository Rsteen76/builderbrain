import { useState } from 'react';
import { StorageService, UploadProgress } from '../services/storage';

export const useStorage = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProgress = (progress: UploadProgress) => {
    setUploadProgress(progress);
    if (progress.state === 'error') {
      setError('Upload failed');
    }
  };

  const uploadProjectDocument = async (projectId: string, file: File): Promise<string | null> => {
    try {
      setError(null);
      return await StorageService.uploadProjectDocument(projectId, file, handleProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      return null;
    }
  };

  const uploadProjectPhoto = async (projectId: string, file: File): Promise<string | null> => {
    try {
      setError(null);
      return await StorageService.uploadProjectPhoto(projectId, file, handleProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      return null;
    }
  };

  const uploadUserAvatar = async (userId: string, file: File): Promise<string | null> => {
    try {
      setError(null);
      return await StorageService.uploadUserAvatar(userId, file, handleProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      return null;
    }
  };

  const uploadCompanyLogo = async (companyId: string, file: File): Promise<string | null> => {
    try {
      setError(null);
      return await StorageService.uploadCompanyLogo(companyId, file, handleProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
      return null;
    }
  };

  const uploadBidAttachment = async (bidId: string, file: File): Promise<string | null> => {
    try {
      setError(null);
      return await StorageService.uploadBidAttachment(bidId, file, handleProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment');
      return null;
    }
  };

  const getProjectDocuments = async (projectId: string): Promise<string[]> => {
    try {
      setError(null);
      return await StorageService.getProjectDocuments(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      return [];
    }
  };

  const getProjectPhotos = async (projectId: string): Promise<string[]> => {
    try {
      setError(null);
      return await StorageService.getProjectPhotos(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      return [];
    }
  };

  const getBidAttachments = async (bidId: string): Promise<string[]> => {
    try {
      setError(null);
      return await StorageService.getBidAttachments(bidId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attachments');
      return [];
    }
  };

  const deleteFile = async (path: string): Promise<boolean> => {
    try {
      setError(null);
      await StorageService.deleteFile(path);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      return false;
    }
  };

  return {
    uploadProgress,
    error,
    uploadProjectDocument,
    uploadProjectPhoto,
    uploadUserAvatar,
    uploadCompanyLogo,
    uploadBidAttachment,
    getProjectDocuments,
    getProjectPhotos,
    getBidAttachments,
    deleteFile,
  };
}; 