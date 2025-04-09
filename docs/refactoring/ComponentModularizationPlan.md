# Component Modularization Plan

**Date:** 2025-04-08
**Last Updated:** 2025-04-09

## Overview

This document outlines a detailed plan for modularizing overgrown components in the Construction Management App. It builds upon the existing [REFACTORING_PLAN.md](../../REFACTORING_PLAN.md) and [ProjectDetailPageRefactorPlan.md](./ProjectDetailPageRefactorPlan.md), focusing specifically on breaking down large components into manageable, maintainable units.

## Identified Overgrown Components

Through code analysis, we've identified the following components that require immediate attention:

1. **`ProjectDetailPage.tsx`** (~680+ lines)
2. **`ProjectPhasesTab.tsx`** (1000+ lines)
3. **Other Tab Components** (likely following similar patterns)
4. **`TabContent.tsx`** (excessive prop interface)

## Modularization Strategy by Component

### 1. ProjectDetailPage.tsx

*Current Status:* Data fetching hooks extracted. `ProjectDetailContext` implemented. Core component uses context for Bid/Expense dialogs and Bid operations. Phase/Expense operations remain local for now.

#### 1.1 Complete the Data Layer Extraction

- [x] Extract project data fetching (`useProject` hook - completed)
- [x] Extract phases data fetching (`useProjectPhases` hook - completed)
- [x] Extract bids data fetching (`useProjectBids` hook - completed)
- [x] Extract expenses data fetching (`useProjectExpenses` hook - completed)
- [x] Create a combined `useProjectData` hook to simplify usage

#### 1.2 Dialog State Management Extraction

- [ ] Create a `useDialogManager` hook for centralized dialog state management (Optional - Context may suffice)
- [x] Extract dialog-specific logic into dedicated hooks:
  - [x] `useBidFormDialog` hook (State/Actions moved to `ProjectDetailContext` Provider)
  - [x] `useQuickAddSubcontractorDialog` hook (Remains local to `ProjectDetailPage`)
  - [x] `usePhaseDetailsDialog` hook (Remains local to `ProjectPhasesTab`)
  - [x] `useExpenseFormDialog` hook (State/Actions moved to `ProjectDetailContext` Provider)

#### 1.3 Extract Business Logic

- [x] Move calculation functions to separate utility files:
  - [x] `projectMetrics.ts` for budget calculations
  - [x] `expenseAnalytics.ts` for expense breakdowns
  - [x] `phaseCalculations.ts` for phase costs and progress
  - [x] `timelineUtils.ts` for timeline calculations

#### 1.4 Create Dedicated Event Handler Modules

- [x] Extract phase-related handlers to `usePhaseOperations` hook (Hook instantiated in `ProjectDetailContext` Provider)
- [x] Extract bid-related handlers to `useBidOperations` hook (Hook instantiated in `ProjectDetailContext` Provider)
- [x] Extract expense-related handlers to `useExpenseOperations` hook (Hook instantiated in `ProjectDetailContext` Provider)
- [x] Extract project-related handlers to `useProjectOperations` hook (Not yet integrated with context)

#### 1.5 Refine Component Structure

- [x] Create a `ProjectDetailHeader` component
- [x] Extract notification logic to a `useNotification` hook (Instantiated in `ProjectDetailContext` Provider)
- [x] Create a `ProjectActionsMenu` component

### 2. ProjectPhasesTab.tsx

*Current Status:* Refactored to use `ProjectDetailContext`. Uses local state hooks (`usePhaseExpandState`, `usePhaseMenuState`, `usePhaseDetailsDialog`) and local `usePhaseOperations` hook.

#### 2.1 Extract Visualization Components

- [x] Create a `PhaseTimelineChart` component
- [ ] Create a `PhaseBudgetPieChart` component (Seems replaced by Bar Chart?)
- [ ] Create a `PhaseMetricsCards` component

#### 2.2 Extract Phase Card Component

- [x] Create a `PhaseCard` component with the following sub-components:
  - [ ] `PhaseCardHeader`
  - [x] `PhaseCardMetrics`
  - [ ] `PhaseCardActions`
  - [x] `PhaseCardCharts`
  - [ ] `PhaseCardDetails` (expanded content)

#### 2.3 Extract Helper Functions

- [x] Move `getPhasePayments` to a utility file
- [x] Move `getPhaseBids` to a utility file
- [x] Move `getPhaseExpenses` to a utility file
- [x] Move status-related functions to a utility file

#### 2.4 Create Local State Hooks

- [x] Create a `usePhaseExpandState` hook for expand/collapse state
- [x] Create a `usePhaseMenuState` hook for menu state

### 3. Other Tab Components

Apply similar patterns to other tab components:

#### 3.1 ProjectOverviewTab.tsx

*Current Status:* Refactored to use `ProjectDetailContext`.
- [ ] Break into meaningful sub-components
- [ ] Extract visualization components
- [ ] Move calculation logic to utility files

#### 3.2 ProjectBidsTab.tsx

*Current Status:* Refactored to use `ProjectDetailContext`.
- [x] Extract `BidList` component
- [x] Extract `BidCard` component (replaces planned "BidSummary" component)
- [x] Extract `BidRow` component for simplified view
- [x] Extract `FilterPanel` component for filter controls
- [x] Extract `BidListHeader` component for search and actions
- [x] Create a barrel file for bid components
- [x] Extract dialog state management into a `useBidDialogs` hook (Superseded by Context)
- [x] Extract bid-related calculations to utility files
- [x] Create a `BidListActions` component for action buttons

#### 3.3 ProjectExpensesTab.tsx

*Current Status:* Refactored to use `ProjectDetailContext`.
- [ ] Extract `ExpenseList` component
- [ ] Extract `ExpenseSummary` component
- [ ] Extract expense-related calculations to utility files

#### 3.4 ProjectTaskManager.tsx

*Current Status:* Created as placeholder using `ProjectDetailContext`.
- [ ] Implement task fetching and display
- [ ] Implement task creation/update functionality

### 4. TabContent.tsx and Component Interfaces

#### 4.1 Replace Prop Drilling with Context

- [x] Create a `ProjectDetailContext` to provide data to all tabs
- [ ] Create a `TabNavigationContext` for tab state and navigation

#### 4.2 Simplify Component Interfaces

- [x] Reduce props passed to tab components by leveraging context (Largely done for Overview, Phases, Bids, Expenses, TaskManager tabs)
- [ ] Organize remaining props into logical interface groupings

## Implementation Order and Dependencies

```mermaid
graph TD
    subgraph "Phase 1: Foundation"
        A1[Complete Data Fetching Hooks]
        A2[Extract Business Logic]
        A3[Create ProjectDetailContext]
    end

    subgraph "Phase 2: Dialog Management & Context Integration"
        B1[Extract Dialog State Management & Integrate into Context]
        B2[Create/Refactor Dialog Components]
    end

    subgraph "Phase 3: Main Component Refactoring"
        C1[Refactor ProjectDetailPage]
        C2[Refine Component Structure]
    end

    subgraph "Phase 4: Tab Components Refactoring"
        D1[Refactor ProjectPhasesTab]
        D2[Refactor Other Tab Components]
        D3[Simplify TabContent]
    end

    A1 --> A3
    A2 --> C1
    A3 --> C1
    A3 --> B1 // Context is needed to integrate dialog state
    A3 --> D1
    A3 --> D2
    B1 --> C1 // Page needs context dialogs
    C1 --> C2
    C2 --> D3
    A3 --> D3 // TabContent simplified due to Context
    D1 & D2 --> D3 // Refactoring tabs allows TabContent simplification
```

## Testing Strategy

1. **Unit Tests:**
    - Create tests for all extracted utility functions
    - Create tests for custom hooks (using `@testing-library/react-hooks`)
2. **Integration Tests:**
    - Test interaction between context provider and consumers (tabs)
    - Test dialog opening/submission logic via context actions
3. **End-to-End Tests:**
    - Verify overall `ProjectDetailPage` functionality after refactoring