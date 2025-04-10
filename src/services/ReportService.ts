import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Project, Expense, ProjectPhase, Bid, BudgetProjection } from '../types';

interface ReportData {
  projectId: string;
  projectName: string;
  userId: string;
  createdAt: any; // Timestamp from Firebase
  expiresAt: any; // Timestamp from Firebase
  reportType: 'budget' | 'timeline' | 'custom';
  shareId: string;
  password?: string;
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

export class ReportService {
  private static collection = collection(db, 'shared_reports');

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
      // Generate a unique shareId with timestamp and random string
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const shareId = `${projectId.substring(0, 8)}-${timestamp}-${randomStr}`;
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);
      
      // Create report data
      const reportData: ReportData = {
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
        // In a real app, you'd hash this password before storing
        reportData.password = password;
      }
      
      // Add to Firestore
      await addDoc(this.collection, reportData);
      
      return shareId;
    } catch (error) {
      console.error('Error generating share link:', error);
      throw new Error('Failed to generate share link');
    }
  }
  
  /**
   * Get a shared report by its shareId
   * @param shareId The share ID to look up
   * @param password Optional password for protected reports
   * @returns The report data or null if not found/expired/wrong password
   */
  static async getSharedReport(shareId: string, password?: string): Promise<ReportData | null> {
    try {
      // Query for the report with the given shareId
      const q = query(this.collection, where('shareId', '==', shareId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null; // No matching report found
      }
      
      const reportDoc = querySnapshot.docs[0];
      const reportData = reportDoc.data() as ReportData;
      
      // Check if the report has expired
      const expiresAt = reportData.expiresAt?.toDate();
      if (expiresAt && expiresAt < new Date()) {
        return null; // Report has expired
      }
      
      // Check password if report is password protected
      if (reportData.isPasswordProtected && reportData.password !== password) {
        return null; // Incorrect password
      }
      
      // Update access count and last accessed time
      await updateDoc(reportDoc.ref, {
        accessCount: (reportData.accessCount || 0) + 1,
        lastAccessedAt: serverTimestamp()
      });
      
      return reportData;
    } catch (error) {
      console.error('Error getting shared report:', error);
      throw new Error('Failed to access shared report');
    }
  }
  
  /**
   * Get all shared reports created by a user
   * @param userId The user ID to filter by
   * @returns Array of shared report data
   */
  static async getUserSharedReports(userId: string): Promise<ReportData[]> {
    try {
      const q = query(this.collection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as ReportData);
    } catch (error) {
      console.error('Error getting user shared reports:', error);
      throw new Error('Failed to retrieve shared reports');
    }
  }
}

export default ReportService; 