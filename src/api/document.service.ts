import { Timestamp, DocumentData, where, query, getDocs, orderBy } from 'firebase/firestore';
import { BaseService } from './base.service';
import { Document, ApiResponse } from '../types';

interface FirestoreDocument extends Omit<Document, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class DocumentService extends BaseService<Document> {
  constructor() {
    super('documents', {
      toFirestore: (document: Document): DocumentData => {
        const firestoreDocument: DocumentData = {
          userId: document.userId,
          projectId: document.projectId,
          name: document.name,
          type: document.type,
          url: document.url,
          uploadedBy: document.uploadedBy,
          size: document.size,
          mimeType: document.mimeType,
          version: document.version,
          isArchived: document.isArchived,
          
          // Convert dates to Timestamps
          createdAt: document.createdAt ? this.dateToTimestamp(document.createdAt) : Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        return firestoreDocument;
      },
      
      fromFirestore: (data: DocumentData): Document => {
        // Convert timestamps to dates
        const createdAt = this.timestampToDate(data.createdAt) || new Date();
        const updatedAt = this.timestampToDate(data.updatedAt) || new Date();
        
        return {
          id: data.id,
          userId: data.userId,
          projectId: data.projectId,
          name: data.name,
          type: data.type,
          url: data.url,
          uploadedBy: data.uploadedBy,
          createdAt,
          updatedAt,
          size: data.size,
          mimeType: data.mimeType,
          version: data.version,
          isArchived: data.isArchived || false,
        };
      }
    });
  }
  
  /**
   * Get documents for a specific project
   */
  async getDocumentsByProject(projectId: string, filters?: {
    type?: string;
    isArchived?: boolean;
  }): Promise<ApiResponse<Document[]>> {
    try {
      let constraints = [where('projectId', '==', projectId)];
      
      // Apply additional filters if provided
      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      
      if (filters?.isArchived !== undefined) {
        constraints.push(where('isArchived', '==', filters.isArchived));
      }
      
      const q = query(this.collectionRef, ...constraints, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const documents: Document[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const document = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        documents.push(document);
      });
      
      return {
        data: documents,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Document[]>(error, 'getDocumentsByProject');
    }
  }
  
  /**
   * Archive a document
   */
  async archiveDocument(documentId: string): Promise<ApiResponse<Document>> {
    try {
      const documentResponse = await this.getById(documentId);
      
      if (documentResponse.status === 'error') {
        return documentResponse;
      }
      
      const document = documentResponse.data;
      
      if (!document) {
        return {
          status: 'error',
          error: 'Document not found',
        };
      }
      
      document.isArchived = true;
      document.updatedAt = new Date();
      
      return this.update(documentId, document);
    } catch (error) {
      return this.handleError<Document>(error, 'archiveDocument');
    }
  }
  
  /**
   * Unarchive a document
   */
  async unarchiveDocument(documentId: string): Promise<ApiResponse<Document>> {
    try {
      const documentResponse = await this.getById(documentId);
      
      if (documentResponse.status === 'error') {
        return documentResponse;
      }
      
      const document = documentResponse.data;
      
      if (!document) {
        return {
          status: 'error',
          error: 'Document not found',
        };
      }
      
      document.isArchived = false;
      document.updatedAt = new Date();
      
      return this.update(documentId, document);
    } catch (error) {
      return this.handleError<Document>(error, 'unarchiveDocument');
    }
  }
  
  /**
   * Update document version
   */
  async updateVersion(documentId: string, newUrl: string, newSize?: number): Promise<ApiResponse<Document>> {
    try {
      const documentResponse = await this.getById(documentId);
      
      if (documentResponse.status === 'error') {
        return documentResponse;
      }
      
      const document = documentResponse.data;
      
      if (!document) {
        return {
          status: 'error',
          error: 'Document not found',
        };
      }
      
      document.url = newUrl;
      document.version = (document.version || 0) + 1;
      
      if (newSize !== undefined) {
        document.size = newSize;
      }
      
      document.updatedAt = new Date();
      
      return this.update(documentId, document);
    } catch (error) {
      return this.handleError<Document>(error, 'updateVersion');
    }
  }
} 