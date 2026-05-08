import type { Timestamp } from 'firebase/firestore';
import type { Bid, BudgetProjection, LineItem, Phase, Project, Task } from '../../types';

export interface FirestoreProject extends Omit<Project, 'id' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'budget' | 'location' | 'lineItems' | 'bids' | 'tasks' | 'team' | 'keyMilestones' | 'projections' | 'phases'> {
  id?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    contingency?: number;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  lineItems: LineItem[];
  bids: Bid[];
  tasks: Task[];
  team: string[];
  keyMilestones: {
    name: string;
    date: Date | null;
    description: string;
  }[];
  projections: BudgetProjection[];
  status: 'estimate' | 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'draft' | 'active' | 'cancelled';
  progress: number;
  phases?: Phase[];
}
