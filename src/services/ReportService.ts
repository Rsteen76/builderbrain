import { collection, addDoc, query, where, getDocs, updateDoc, Timestamp, serverTimestamp, deleteField } from 'firebase/firestore';
import type { DocumentData, DocumentReference } from 'firebase/firestore';
import { db } from '../config/firebase';
import { hashReportPassword, verifyStoredReportPassword } from '../utils/reportPasswords';
import { logger } from '../utils/logger';

interface SharedReportData {
  projectId: string;
  projectName: string;
  userId: string;
  createdAt: any; // Timestamp from Firebase
  expiresAt: any; // Timestamp from Firebase
  reportType: 'budget' | 'timeline' | 'custom';
  shareId: string;
  accessCount: number;
  lastAccessedAt?: any;
  isPasswordProtected: boolean;
  reportSnapshot: {
    budgetSummary: {
      totalBudget: number;
      totalSpent: number;
      pendingTotal: number;
      remainingBudget: number;
      projectedTotal: number;
      projectedRemaining: number;
      spentPercentage: number;
      pendingPercentage: number;
      projectedPercentage: number;
    };
    expensesByCategory: Array<{
      name: string;
      spent: number;
      pending: number;
      projected: number;
      total: number;
    }>;
    metadata: {
      expenseCount: number;
      projectionCount: number;
      generatedOn: any; // Timestamp
    };
  };
}

interface StoredReportData extends SharedReportData {
  password?: string;
  passwordHash?: string;
}

interface SharedReportMetadata {
  isPasswordProtected: boolean;
  isExpired: boolean;
}

const isReportExpired = (reportData: Pick<SharedReportData, 'expiresAt'>): boolean => {
  const expiresAt = reportData.expiresAt?.toDate?.();
  return !!(expiresAt && expiresAt < new Date());
};

const sanitizeReportData = (reportData: StoredReportData): SharedReportData => {
  const { password, passwordHash, ...sanitizedReportData } = reportData;
  return sanitizedReportData;
};

const generateRandomShareId = (): string => {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  if (cryptoApi?.randomUUID) {
    return `${cryptoApi.randomUUID()}${cryptoApi.randomUUID()}`.replace(/-/g, '');
  }

  throw new Error('Web Crypto API is unavailable');
};

export class ReportService {
  private static collection = collection(db, 'shared_reports');

  private static async migrateLegacyPassword(
    reportRef: DocumentReference<DocumentData>,
    password: string
  ): Promise<void> {
    try {
      await updateDoc(reportRef, {
        passwordHash: await hashReportPassword(password),
        password: deleteField(),
      });
    } catch (error) {
      logger.warn('Failed to migrate legacy shared report password:', error);
    }
  }

  /**
   * Generate a share link for a budget report
   * @param projectId The ID of the project
   * @param projectName The name of the project
   * @param userId The ID of the user generating the report
   * @param reportSnapshot Snapshot of the report data
   * @param expirationDays Number of days until the link expires (default: 30)
   * @param password Optional password protection
   * @returns The generated shareId for accessing the report
   */
  static async generateShareLink(
    projectId: string,
    projectName: string,
    userId: string,
    reportSnapshot: any,
    expirationDays: number = 30,
    password?: string
  ): Promise<string> {
    try {
      const shareId = generateRandomShareId();
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      
      // Create report data
      const reportData: StoredReportData = {
        projectId,
        projectName,
        userId,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expirationDate),
        reportType: 'budget',
        shareId,
        accessCount: 0,
        isPasswordProtected: !!password,
        reportSnapshot: {
          ...reportSnapshot,
          metadata: {
            expenseCount: reportSnapshot.expenseCount || 0,
            projectionCount: reportSnapshot.projectionCount || 0,
            generatedOn: serverTimestamp()
          }
        }
      };
      
      // Add password if provided
      if (password) {
        reportData.passwordHash = await hashReportPassword(password);
      }
      
      // Add to Firestore
      await addDoc(this.collection, reportData);
      
      return shareId;
    } catch (error) {
      logger.error('Error generating share link:', error);
      throw new Error('Failed to generate share link');
    }
  }
  
  /**
   * Get a shared report by its shareId
   * @param shareId The share ID to look up
   * @param password Optional password for protected reports
   * @returns The report data or null if not found/expired/wrong password
   */
  static async getSharedReportMetadata(shareId: string): Promise<SharedReportMetadata | null> {
    try {
      const q = query(this.collection, where('shareId', '==', shareId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const reportData = querySnapshot.docs[0].data() as StoredReportData;

      return {
        isPasswordProtected: reportData.isPasswordProtected,
        isExpired: isReportExpired(reportData),
      };
    } catch (error) {
      logger.error('Error getting shared report metadata:', error);
      throw new Error('Failed to inspect shared report');
    }
  }

  static async getSharedReport(shareId: string, password?: string): Promise<SharedReportData | null> {
    try {
      // Query for the report with the given shareId
      const q = query(this.collection, where('shareId', '==', shareId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null; // No matching report found
      }
      
      const reportDoc = querySnapshot.docs[0];
      const reportData = reportDoc.data() as StoredReportData;
      
      // Check if the report has expired
      if (isReportExpired(reportData)) {
        return null; // Report has expired
      }
      
      // Check password if report is password protected
      if (reportData.isPasswordProtected) {
        const passwordMatches = await verifyStoredReportPassword({
          inputPassword: password,
          storedPasswordHash: reportData.passwordHash,
          legacyPassword: reportData.password,
        });

        if (!passwordMatches) {
          return null;
        }

        if (reportData.password && !reportData.passwordHash && password) {
          await this.migrateLegacyPassword(reportDoc.ref, password);
        }
      }
      
      // Update access count and last accessed time
      try {
        await updateDoc(reportDoc.ref, {
          accessCount: (reportData.accessCount || 0) + 1,
          lastAccessedAt: serverTimestamp()
        });
      } catch (error) {
        logger.warn('Failed to update shared report access metadata:', error);
      }
      
      return sanitizeReportData(reportData);
    } catch (error) {
      logger.error('Error getting shared report:', error);
      throw new Error('Failed to access shared report');
    }
  }
  
  /**
   * Get all shared reports created by a user
   * @param userId The user ID to filter by
   * @returns Array of shared report data
   */
  static async getUserSharedReports(userId: string): Promise<SharedReportData[]> {
    try {
      const q = query(this.collection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((reportDoc) =>
        sanitizeReportData(reportDoc.data() as StoredReportData)
      );
    } catch (error) {
      logger.error('Error getting user shared reports:', error);
      throw new Error('Failed to retrieve shared reports');
    }
  }
}

export default ReportService; 
