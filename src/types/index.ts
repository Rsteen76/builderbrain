import { Timestamp } from 'firebase/firestore';
import { Expense, ExpenseCategory, ExpenseStatus, PaymentDetails } from './expense.types';
import { ExpenseTransaction, TransactionStatus, PaymentMethod } from './expense-transaction.types';
import { CategoryMappingPreferences } from './budget.types';
import { Bid } from './bid.types';
import { LineItem } from './project.types';
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

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'estimate' | 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'draft' | 'active' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  clientId?: string;
  contractorId?: string;
  startDate: Date;
  endDate?: Date | null;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    contingency?: number;
  } | number;
  actualCost?: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  } | string;
  createdAt: Date;
  updatedAt: Date;
  team?: string[];
  projectType?: string;
  estimatedDuration?: string;
  phases: ProjectPhase[];
  keyMilestones?: {
    name: string;
    date: Date | null;
    description: string;
  }[];
  requirements?: {
    permits: string[];
    inspections: string[];
    documents: string[];
  };
  lineItems?: LineItem[];
  bids?: Bid[];
  tasks?: Task[];
  expenses?: Expense[];
  budgetPreferences?: CategoryMappingPreferences;
  projections?: BudgetProjection[];
  progress: number;
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

// Add or enhance the Phase interface
export interface Phase {
  id: string;
  projectId?: string;
  name: string;
  description?: string;
  startDate?: Date | null | Timestamp;
  endDate?: Date | null | Timestamp;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'planning' | 'delayed';
  progress: number;
  order?: number;
  tasks?: Task[];
  budget: number;
  actualCost: number;
}

// Add the ProjectPhase interface (or enhance existing Phase if preferred)
// Note: Ensure Task type is imported or defined if used within ProjectPhase
export interface ProjectPhase extends Phase {
  // id is already optional in Phase, but often required in components
  // Ensure you handle potential undefined id if extending base Phase
  id: string; 
  // Override tasks to be Task[] instead of string[]
  tasks?: Task[];
  // Other properties are inherited from Phase
  // Add any ProjectDetailPage specific enhancements here if needed
  // e.g., tasks: Task[]; // Ensure Task type is imported/defined
}

// Re-export types from their domain-specific files
export * from './user.types';
export * from './project.types';
export * from './bid.types';
export * from './task.types';
export * from './expense.types';
export * from './document.types';

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

// Interface for Budget Projections
export interface BudgetProjection {
  id: string;
  categoryId: string;
  amount: number;
  notes: string | null;
  createdAt: Date | Timestamp;
  userId: string;
  projectId: string;
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
