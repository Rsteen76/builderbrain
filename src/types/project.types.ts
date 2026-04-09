import type { Task } from './task.types';

export type ProjectStatus = 
  | 'estimate' 
  | 'planning' 
  | 'in_progress' 
  | 'completed' 
  | 'on_hold' 
  | 'draft' 
  | 'active' 
  | 'cancelled';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export type LineItemCategory = 
  | 'material' 
  | 'labor' 
  | 'subcontractor' 
  | 'equipment' 
  | 'permit' 
  | 'other';

export interface ProjectLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ProjectBudget {
  total: number;
  spent: number;
  remaining: number;
}

export interface ProjectMilestone {
  name: string;
  date: Date | null;
  description: string;
}

export interface ProjectRequirements {
  permits: string[];
  inspections: string[];
  documents: string[];
}

export interface Phase {
  id: string;
  projectId?: string;
  name: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  progress?: number;
  order?: number;
  tasks?: Task[];
  budget?: number;
  actualCost?: number;
}

export interface LineItem {
  id: string;
  projectId?: string;
  phaseId?: string;
  description: string;
  category: LineItemCategory;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority?: ProjectPriority;
  clientId?: string;
  contractorId?: string;
  startDate: Date;
  endDate?: Date | null;
  budget: ProjectBudget | number;
  actualCost?: number;
  location: ProjectLocation | string;
  createdAt: Date;
  updatedAt: Date;
  team?: string[];
  projectType?: string;
  estimatedDuration?: string;
  phases?: Phase[];
  keyMilestones?: ProjectMilestone[];
  requirements?: ProjectRequirements;
  lineItems?: LineItem[];
  tasks?: Task[];
  expenses?: string[]; // Array of expense IDs
  bids?: string[]; // Array of bid IDs
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

// We might also need a Contractor type later
// export interface Contractor {
//   id: string;
//   name: string;
//   contactPerson?: string;
//   email?: string;
//   phone?: string;
//   specialty?: string; // e.g., Plumbing, Electrical, Framing
// } 
