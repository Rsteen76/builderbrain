import { Bid, Expense, Project, Subcontractor, Task } from '../../types';

export interface DevDataState {
  version: number;
  projects: Project[];
  tasks: Task[];
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
}
