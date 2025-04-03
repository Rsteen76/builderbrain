export type DocumentType = 'contract' | 'permit' | 'blueprint' | 'invoice' | 'other';

export interface Document {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  uploadedBy?: string;
  uploadedAt: Date;
  updatedAt?: Date;
  version?: number;
  tags?: string[];
  isArchived?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DocumentFilter {
  projectId?: string;
  type?: DocumentType;
  tags?: string[];
  isArchived?: boolean;
} 