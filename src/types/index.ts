import { Timestamp } from 'firebase/firestore';
import type { Bid } from './bid.types';
export * from './bids.types';
export * from './expense-transaction.types';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'contractor' | 'subcontractor' | 'client';
  companyName?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  settings: {
    notifications: boolean;
    emailNotifications: boolean;
    theme: 'light' | 'dark';
  };
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeType?: 'user' | 'subcontractor';
  assigneeId?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  parentTaskId?: string;
  dependencies?: string[];
  attachments?: string[];
  phaseId?: string;
  phaseName?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  phases: { name: string; percentage: number }[];
  createdBy: string;
  createdAt: Date;
  isSystem: boolean;
}

export interface Document {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  type: 'contract' | 'permit' | 'blueprint' | 'invoice' | 'other';
  url: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  size?: number;
  mimeType?: string;
  version?: number;
  isArchived?: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  projectId: string;
  invoiceId?: string;
  amount: number;
  type: 'deposit' | 'progress' | 'final';
  status: 'pending' | 'completed' | 'failed';
  method: 'credit_card' | 'bank_transfer' | 'check';
  date: Date;
  reference?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Subcontractor {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  rating?: number;
  totalProjects?: number;
  lastBid?: {
    date: Date;
    amount: number;
    projectId?: string;
  } | null;
  contact: {
    phone?: string;
    email?: string;
    location?: string;
  };
  performance?: {
    onTime?: number;
    quality?: number;
    communication?: number;
  } | null;
  companyInfo?: {
    website?: string;
    founded?: string;
    employees?: number;
    license?: string;
  } | null;
  projects?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export types from their domain-specific files
export * from './user.types';
export * from './project.types';
export * from './bid.types';
export * from './task.types';
export * from './expense.types';
export * from './document.types';
export * from './accounting.types';

// Common types used across multiple domains
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error' | 'loading';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FilterOptions {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

export interface BidSummary {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  title?: string;
  status: Bid['status'];
  priority?: Bid['priority'];
  submissionDeadline?: Date;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  submissionDate?: Date | string;
  approvalDate?: Date | string;
  rejectionDate?: Date | string;
  rejectionReason?: string;
  description?: string;
  tags?: string[];
}

// Expense Analytics Types (Moved from utils)
export interface ExpenseChartData {
  name: string; // Category name
  value: number; // Total amount
  color: string; // Color for the chart segment
}

export interface ExpenseBreakdown {
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
}

// Ensure all relevant types are exported
export type {
  // ... existing exports ...
  // ProjectPhase, // Removed duplicate export
  // ExpenseChartData, // Removed duplicate export
  // ExpenseBreakdown, // Removed duplicate export
  // ... ensure other necessary TYPE-ONLY exports are here ...
};

// Add more common types as needed
