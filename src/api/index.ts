// Export the base service
export * from './base.service';

// Export service implementations
export * from './project.service';

// Create service instances
import { ProjectService } from './project.service';

// Initialize services
export const projectService = new ProjectService();

// In the future, add more services like:
// export const taskService = new TaskService();
// export const bidService = new BidService();
// etc. 