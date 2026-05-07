import { storage } from '../config/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
} from 'firebase/storage';

export interface UploadProgress {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
  downloadURL?: string;
}

type UploadKind = 'document' | 'image';

const MB = 1024 * 1024;

const UPLOAD_LIMITS: Record<UploadKind, { maxSizeBytes: number; contentTypes: string[]; extensions: string[] }> = {
  document: {
    maxSizeBytes: 10 * MB,
    contentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  },
  image: {
    maxSizeBytes: 5 * MB,
    contentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
};

export class StorageService {
  // Project Documents
  static async uploadProjectDocument(
    projectId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    this.validateFile(file, 'document');
    const fileRef = ref(storage, `projects/${projectId}/documents/${file.name}`);
    return this.uploadFile(fileRef, file, onProgress);
  }

  static async getProjectDocuments(projectId: string): Promise<string[]> {
    const folderRef = ref(storage, `projects/${projectId}/documents`);
    return this.listFiles(folderRef);
  }

  // Project Photos
  static async uploadProjectPhoto(
    projectId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    this.validateFile(file, 'image');
    const fileRef = ref(storage, `projects/${projectId}/photos/${file.name}`);
    return this.uploadFile(fileRef, file, onProgress);
  }

  static async getProjectPhotos(projectId: string): Promise<string[]> {
    const folderRef = ref(storage, `projects/${projectId}/photos`);
    return this.listFiles(folderRef);
  }

  static async deleteProjectFiles(projectId: string): Promise<void> {
    await Promise.all([
      this.deleteFolder(ref(storage, `projects/${projectId}/documents`)),
      this.deleteFolder(ref(storage, `projects/${projectId}/photos`)),
    ]);
  }

  // User Avatars
  static async uploadUserAvatar(
    userId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    this.validateFile(file, 'image');
    const fileRef = ref(storage, `users/${userId}/avatar.jpg`);
    return this.uploadFile(fileRef, file, onProgress);
  }

  // Company Logos
  static async uploadCompanyLogo(
    companyId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    this.validateFile(file, 'image');
    const fileRef = ref(storage, `companies/${companyId}/logo.jpg`);
    return this.uploadFile(fileRef, file, onProgress);
  }

  // Bid Attachments
  static async uploadBidAttachment(
    bidId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    this.validateFile(file, 'document');
    const fileRef = ref(storage, `bids/${bidId}/attachments/${file.name}`);
    return this.uploadFile(fileRef, file, onProgress);
  }

  static async getBidAttachments(bidId: string): Promise<string[]> {
    const folderRef = ref(storage, `bids/${bidId}/attachments`);
    return this.listFiles(folderRef);
  }

  // Generic file operations
  private static async uploadFile(
    fileRef: StorageReference,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      if (onProgress) {
        onProgress({
          progress: 100,
          state: 'success',
          downloadURL,
        });
      }

      return downloadURL;
    } catch (error) {
      if (onProgress) {
        onProgress({
          progress: 0,
          state: 'error',
        });
      }
      throw error;
    }
  }

  private static validateFile(file: File, kind: UploadKind): void {
    const limits = UPLOAD_LIMITS[kind];

    if (!limits.contentTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
    }

    const fileName = file.name.toLowerCase();
    if (!limits.extensions.some((extension) => fileName.endsWith(extension))) {
      throw new Error('Unsupported file extension');
    }

    if (file.size > limits.maxSizeBytes) {
      throw new Error(`File size exceeds ${limits.maxSizeBytes / MB}MB limit`);
    }
  }

  private static async listFiles(folderRef: StorageReference): Promise<string[]> {
    try {
      const result = await listAll(folderRef);
      const downloadURLs = await Promise.all(
        result.items.map((item) => getDownloadURL(item))
      );
      return downloadURLs;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  private static async deleteFolder(folderRef: StorageReference): Promise<void> {
    const result = await listAll(folderRef);
    await Promise.all(result.items.map((item) => deleteObject(item)));
    await Promise.all(result.prefixes.map((prefix) => this.deleteFolder(prefix)));
  }

  static async deleteFile(path: string): Promise<void> {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}
