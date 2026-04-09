import { Timestamp, DocumentData, where, query, getDocs } from 'firebase/firestore';
import { BaseService } from './base.service';
import { Bid, BidStatus, BidVersion, ApiResponse } from '../types';

export class BidService extends BaseService<Bid> {
  constructor() {
    super('bids', {
      toFirestore: (bid: Bid): DocumentData => {
        const firestoreBid: DocumentData = {
          userId: bid.userId,
          projectId: bid.projectId,
          phaseId: bid.phaseId,
          phaseName: bid.phaseName,
          projectName: bid.projectName,
          subcontractorId: bid.subcontractorId,
          subcontractorName: bid.subcontractorName,
          contractorName: bid.contractorName,
          bidAmount: bid.bidAmount,
          title: bid.title,
          scope: bid.scope,
          status: bid.status,
          priority: bid.priority,
          totalAmount: bid.totalAmount,
          timeline: bid.timeline,
          paymentTerms: bid.paymentTerms,
          currentVersionId: bid.currentVersionId,
          tags: bid.tags,
          
          // Convert dates to Timestamps
          createdAt: bid.createdAt ? this.dateToTimestamp(bid.createdAt) : Timestamp.now(),
          updatedAt: Timestamp.now(),
          submissionDeadline: bid.submissionDeadline ? this.dateToTimestamp(bid.submissionDeadline) : null,
          startDate: bid.startDate ? this.dateToTimestamp(bid.startDate) : null,
          completionDate: bid.completionDate ? this.dateToTimestamp(bid.completionDate) : null,
          
          // Complex objects
          versions: bid.versions?.map(version => ({
            ...version,
            createdAt: version.createdAt ? this.dateToTimestamp(version.createdAt) : Timestamp.now(),
          })),
          
          // Add remaining bid properties
          notes: bid.notes,
          requiresInsurance: bid.requiresInsurance,
          requiresBond: bid.requiresBond,
          isPublic: bid.isPublic,
          isApproved: bid.isApproved,
          attachments: bid.attachments,
          paymentSchedule: bid.paymentSchedule,
          paymentProgress: bid.paymentProgress,
          createdBy: bid.createdBy,
          updatedBy: bid.updatedBy,
        };
        
        return firestoreBid;
      },
      
      fromFirestore: (data: DocumentData): Bid => {
        // Convert timestamps to dates
        const createdAt = this.timestampToDate(data.createdAt) || new Date();
        const updatedAt = this.timestampToDate(data.updatedAt) || new Date();
        const submissionDeadline = data.submissionDeadline ? this.timestampToDate(data.submissionDeadline) : null;
        const startDate = data.startDate ? this.timestampToDate(data.startDate) : null;
        const completionDate = data.completionDate ? this.timestampToDate(data.completionDate) : null;
        
        // Convert versions if they exist
        const versions: BidVersion[] = data.versions?.map((version: any) => ({
          ...version,
          createdAt: this.timestampToDate(version.createdAt) || new Date(),
        })) || [];
        
        return {
          id: data.id,
          userId: data.userId,
          projectId: data.projectId,
          phaseId: data.phaseId,
          phaseName: data.phaseName,
          projectName: data.projectName,
          subcontractorId: data.subcontractorId,
          subcontractorName: data.subcontractorName,
          contractorName: data.contractorName,
          bidAmount: data.bidAmount,
          title: data.title,
          scope: data.scope,
          status: data.status,
          priority: data.priority,
          submissionDeadline,
          startDate,
          completionDate,
          totalAmount: data.totalAmount,
          timeline: data.timeline,
          paymentTerms: data.paymentTerms,
          currentVersionId: data.currentVersionId,
          versions,
          tags: data.tags || [],
          createdAt,
          updatedAt,
          notes: data.notes,
          requiresInsurance: data.requiresInsurance,
          requiresBond: data.requiresBond,
          isPublic: data.isPublic,
          isApproved: data.isApproved,
          attachments: data.attachments || [],
          paymentSchedule: data.paymentSchedule || [],
          paymentProgress: data.paymentProgress,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy,
        };
      }
    });
  }
  
  /**
   * Get bids for a specific project
   */
  async getBidsByProject(projectId: string): Promise<ApiResponse<Bid[]>> {
    try {
      const q = query(this.collectionRef, where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      
      const bids: Bid[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const bid = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        bids.push(bid);
      });
      
      return {
        data: bids,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Bid[]>(error, 'getBidsByProject');
    }
  }
  
  /**
   * Get bids by user ID
   */
  async getBidsByUser(userId: string, status?: BidStatus): Promise<ApiResponse<Bid[]>> {
    try {
      const constraints = [where('userId', '==', userId)];
      
      if (status) {
        constraints.push(where('status', '==', status));
      }
      
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const bids: Bid[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const bid = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        bids.push(bid);
      });
      
      return {
        data: bids,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Bid[]>(error, 'getBidsByUser');
    }
  }
  
  /**
   * Get bids by subcontractor ID
   */
  async getBidsBySubcontractor(subcontractorId: string, status?: BidStatus): Promise<ApiResponse<Bid[]>> {
    try {
      const constraints = [where('subcontractorId', '==', subcontractorId)];
      
      if (status) {
        constraints.push(where('status', '==', status));
      }
      
      const q = query(this.collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const bids: Bid[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const bid = this.converter!.fromFirestore({
          ...data,
          id: doc.id
        });
        bids.push(bid);
      });
      
      return {
        data: bids,
        status: 'success',
      };
    } catch (error) {
      return this.handleError<Bid[]>(error, 'getBidsBySubcontractor');
    }
  }
} 
