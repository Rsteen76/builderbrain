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
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  clientId: string;
  contractorId: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  budget: {
    total: number;
    spent: number;
    remaining: number;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Expense {
  id: string;
  category: 'labor' | 'materials' | 'equipment' | 'permits' | 'other';
  description: string;
  amount: number;
  date: Timestamp;
  receiptUrl?: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdBy: string;
  approvedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
}

export interface Bid {
  id: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  totalAmount: number;
  breakdown: {
    materials: number;
    labor: number;
    overhead: number;
    profit: number;
  };
  validUntil: Timestamp;
  createdBy: string;
  sentTo: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  attachments: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string[];
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  parentTaskId?: string;
  dependencies: string[];
  attachments: string[];
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'permit' | 'blueprint' | 'invoice' | 'other';
  url: string;
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  size: number;
  mimeType: string;
  version: number;
  isArchived: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  type: 'deposit' | 'progress' | 'final';
  status: 'pending' | 'completed' | 'failed';
  method: 'credit_card' | 'bank_transfer' | 'check';
  date: Timestamp;
  reference?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
} 