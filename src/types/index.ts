import { Timestamp } from 'firebase/firestore';

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
  clientId?: string;
  contractorId?: string;
  startDate: Date;
  endDate?: Date | null;
  budget: {
    total: number;
    spent: number;
    remaining: number;
  } | number;
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
  phases?: {
    name: string;
    duration: string;
    description: string;
    dependencies: string[];
  }[];
  keyMilestones?: {
    name: string;
    date: string;
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
}

export interface Expense {
  id: string;
  userId: string;
  projectId: string;
  category: 'labor' | 'materials' | 'equipment' | 'permits' | 'other';
  description: string;
  amount: number;
  date: Date;
  receiptUrl?: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Bid {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string;
  subcontractorId?: string;
  subcontractorName?: string;
  title?: string;
  scope?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'revision_requested';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  submissionDeadline?: Date;
  startDate?: Date | null;
  completionDate?: Date | null;
  totalAmount: number;
  currentVersionId?: string;
  versions?: BidVersion[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  notes?: string;
  requiresInsurance?: boolean;
  requiresBond?: boolean;
  isPublic?: boolean;
  isApproved?: boolean;
  attachments?: { name: string; url: string }[] | string[];
}

export interface BidVersion {
  id: string;
  versionNumber: number;
  createdAt: Date;
  totalAmount: number;
  notes?: string;
  lineItems?: LineItem[];
  attachments?: string[];
}

export interface LineItem {
  id: string;
  description: string;
  category: 'material' | 'labor' | 'subcontractor' | 'equipment' | 'permit' | 'other';
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost: number;
  notes?: string;
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