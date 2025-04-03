// Import base service types
import { BaseService } from './base.service';
import { ApiResponse } from '../types';

// Import service implementations
import { ProjectService } from './project.service';
import { BidService } from './bid.service';
import { TaskService } from './task.service';
import { ExpenseService } from './expense.service';
import { DocumentService } from './document.service';

// Create service instances
const projectService = new ProjectService();
const bidService = new BidService();
const taskService = new TaskService();
const expenseService = new ExpenseService();
const documentService = new DocumentService();

// Export service instances
export {
  projectService,
  bidService,
  taskService,
  expenseService,
  documentService,
  BaseService,
};

// Export types
export type { ApiResponse };

// More services will be added as we implement them 