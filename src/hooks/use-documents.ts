import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Document } from '../types';
import { documentService } from '../api';

// Query key for documents
const DOCUMENTS_QUERY_KEY = 'documents';

/**
 * Hook to fetch documents by project ID
 */
export const useProjectDocuments = (
  projectId: string,
  filters?: {
    type?: string;
    isArchived?: boolean;
  },
  enabled = true
) => {
  return useQuery(
    [DOCUMENTS_QUERY_KEY, 'project', projectId, filters],
    async () => {
      const response = await documentService.getDocumentsByProject(projectId, filters);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!projectId && enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook to fetch a single document by ID
 */
export const useDocument = (documentId: string, enabled = true) => {
  return useQuery(
    [DOCUMENTS_QUERY_KEY, documentId],
    async () => {
      const response = await documentService.getById(documentId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      enabled: !!documentId && enabled,
    }
  );
};

/**
 * Hook to create a new document
 */
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await documentService.create(document as any);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: (newDocument) => {
        if (!newDocument) return;

        // Invalidate project documents query
        queryClient.invalidateQueries([DOCUMENTS_QUERY_KEY, 'project', newDocument.projectId]);
        
        // Add the new document to the cache
        queryClient.setQueryData([DOCUMENTS_QUERY_KEY, newDocument.id], newDocument);
      },
    }
  );
};

/**
 * Hook to update an existing document
 */
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ id, document }: { id: string; document: Partial<Document> }) => {
      const response = await documentService.update(id, document);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: (updatedDocument) => {
        if (!updatedDocument) return;

        // Update the cache for this specific document
        queryClient.setQueryData([DOCUMENTS_QUERY_KEY, updatedDocument.id], updatedDocument);
        
        // Invalidate project documents query
        queryClient.invalidateQueries([DOCUMENTS_QUERY_KEY, 'project', updatedDocument.projectId]);
      },
    }
  );
};

/**
 * Hook to archive a document
 */
export const useArchiveDocument = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (documentId: string) => {
      const response = await documentService.archiveDocument(documentId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: (archivedDocument) => {
        if (!archivedDocument) return;

        // Update the cache for this specific document
        queryClient.setQueryData([DOCUMENTS_QUERY_KEY, archivedDocument.id], archivedDocument);
        
        // Invalidate project documents query
        queryClient.invalidateQueries([DOCUMENTS_QUERY_KEY, 'project', archivedDocument.projectId]);
      },
    }
  );
};

/**
 * Hook to unarchive a document
 */
export const useUnarchiveDocument = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (documentId: string) => {
      const response = await documentService.unarchiveDocument(documentId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: (unarchivedDocument) => {
        if (!unarchivedDocument) return;

        // Update the cache for this specific document
        queryClient.setQueryData([DOCUMENTS_QUERY_KEY, unarchivedDocument.id], unarchivedDocument);
        
        // Invalidate project documents query
        queryClient.invalidateQueries([DOCUMENTS_QUERY_KEY, 'project', unarchivedDocument.projectId]);
      },
    }
  );
};

/**
 * Hook to update document version
 */
export const useUpdateDocumentVersion = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ documentId, newUrl, newSize }: { documentId: string; newUrl: string; newSize?: number }) => {
      const response = await documentService.updateVersion(documentId, newUrl, newSize);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: (updatedDocument) => {
        if (!updatedDocument) return;

        // Update the cache for this specific document
        queryClient.setQueryData([DOCUMENTS_QUERY_KEY, updatedDocument.id], updatedDocument);
        
        // Invalidate project documents query
        queryClient.invalidateQueries([DOCUMENTS_QUERY_KEY, 'project', updatedDocument.projectId]);
      },
    }
  );
};

/**
 * Hook to delete a document
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (documentId: string) => {
      // Get the document first so we can invalidate related queries
      const documentResponse = await documentService.getById(documentId);
      const document = documentResponse.data;
      
      const response = await documentService.delete(documentId);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      
      return document;
    },
    {
      onSuccess: (document) => {
        if (!document) return;

        // Remove from the cache
        queryClient.removeQueries([DOCUMENTS_QUERY_KEY, document.id]);
        
        // Invalidate project documents query
        queryClient.invalidateQueries([DOCUMENTS_QUERY_KEY, 'project', document.projectId]);
      },
    }
  );
}; 