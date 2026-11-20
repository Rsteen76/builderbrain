# Builderbrain Refactoring Guide

## Overview

This document is an internal engineering guide for the ongoing Builderbrain frontend refactor. It explains the patterns being introduced, how the codebase is transitioning, and how contributors should work with the new architecture during the migration.

## Key Improvements

1. **Type System**
   - Separated types by domain entity
   - Standardized interfaces and enforced consistency
   - Added proper utility types for API responses

2. **Service Layer**
   - Created a base service with common CRUD operations
   - Implemented consistent error handling
   - Standardized data transformation between Firestore and app

3. **State Management**
   - Added React Query for data fetching and caching
   - Reduced boilerplate for loading, error, and success states
   - Implemented proper cache invalidation patterns

## How to Work with the New Patterns

### Using the New Type System

Types are now organized by domain entity:

```typescript
// Import specific types from their domain files
import { Project, ProjectStatus } from '../types/project.types';
import { Bid, BidStatus } from '../types/bid.types';

// Or import everything through the barrel file
import { Project, Bid, Task } from '../types';
```

### Using the Service Layer

Services follow a consistent pattern:

```typescript
import { projectService } from '../api';

// Using the service directly
const response = await projectService.getById('project-123');
if (response.status === 'success' && response.data) {
  // Use the project data
  console.log(response.data.name);
} else {
  // Handle the error
  console.error(response.error);
}
```

### Using React Query Hooks

New hooks provide a cleaner way to interact with data:

```typescript
import { useProject, useUpdateProject } from '../hooks/use-projects';

function ProjectComponent({ projectId, userId }) {
  // Fetch a project
  const { data: project, isLoading, error } = useProject(projectId, userId);
  
  // Update a project
  const { mutate: updateProject, isLoading: isUpdating } = useUpdateProject();
  
  const handleSave = () => {
    updateProject({
      id: projectId,
      data: { name: 'New name' }
    });
  };
  
  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <h1>{project.name}</h1>
      <button onClick={handleSave} disabled={isUpdating}>
        Save Changes
      </button>
    </div>
  );
}
```

## Transition Strategy

The refactoring is being done incrementally:

1. **Phase 1 (Current)**: Infrastructure and foundation
   - Type system reorganization
   - Service layer architecture
   - React Query integration

2. **Phase 2 (Upcoming)**: Component refactoring
   - Migrate components to use the new hooks
   - Update contexts to use React Query where appropriate
   - Improve component organization

3. **Phase 3 (Planned)**: Performance and UX
   - Optimize data loading patterns
   - Add proper loading and error states
   - Implement better mobile UX

## How to Contribute

When working on the codebase during this transition:

1. For **new features**, use the new patterns from the start
2. For **bug fixes** in existing code, make minimal changes to fix the issue
3. For **enhancements** to existing features, consider migrating to the new patterns

## Testing the Changes

To test the refactored components:

1. Run the app with `npm start`
2. Open the React Query Devtools (visible in development mode)
3. Observe the data flow and caching behavior

## Questions and Feedback

If you have questions or feedback about the refactoring:

- Check the REFACTORING_PLAN.md for details on the overall plan
- Review REFACTORING_PROGRESS.md for updates on what has been completed
- Reach out to the team with specific questions or concerns 
