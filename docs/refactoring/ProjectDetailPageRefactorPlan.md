# Refactoring Plan: `frontend/src/pages/ProjectDetailPage.tsx`

**Date:** 2025-04-08

**Goal:** Improve maintainability, testability, and separation of concerns by extracting logic and state management from the main `ProjectDetailPage.tsx` component.

**Analysis:**

The current `ProjectDetailPage.tsx` component (over 2000 lines) handles numerous responsibilities, making it difficult to maintain and test:

1.  **Data Fetching:** Acquiring project details, phases, bids, expenses, and potentially related data like subcontractors.
2.  **State Management:** Managing loading/error states, fetched data, UI states (active tab, dialog visibility, menus), form inputs (bids, expenses), and temporary states (like `phasesBeingUpdated`).
3.  **Business Logic/Calculations:** Computing derived data like project progress, budget summaries, timeline data, and expense breakdowns (using `useMemo`).
4.  **Rendering:** Displaying the overall page structure, header, metric cards, tab navigation, tab content, and various dialogs.
5.  **Event Handling:** Managing user interactions like tab changes, button clicks (edit, delete, add), form submissions, quick updates, and handling custom events (`bid-deleted`, `expense-status-changed`).

**Refactoring Steps (Prioritized):**

1.  **Extract Data Fetching Logic into Custom Hooks:**
    *   Create dedicated hooks: `useProject(projectId)`, `useProjectPhases(projectId)`, `useProjectBids(projectId)`, `useProjectExpenses(projectId)`, `useSubcontractors()` (if applicable).
    *   These hooks will encapsulate API calls, loading states, error handling, and potentially related event listeners (like `bid-deleted`).
    *   *Benefit:* Isolates data fetching, cleans up `ProjectDetailPage`, improves testability.

2.  **Simplify Dialog State Management:**
    *   Identify all dialogs associated with this page (e.g., `BidFormDialog`, `QuickAddSubcontractorDialog`, `QuickBidDialog`, `PhaseDetailsDialog`, `BidDeletePortal` trigger, potentially others).
    *   Analyze the state each dialog requires (visibility, form data, IDs for editing/deleting, etc.).
    *   Implement a cleaner state management strategy. Options to consider during implementation:
        *   **A) Centralized Reducer/Context:** Use `useReducer` or `React.Context` to manage the state of *all* dialogs.
        *   **B) Dedicated Hooks per Dialog:** Create specific hooks like `useBidFormDialog()`, `useExpenseDialog()`, etc.
        *   **C) State within Dialog Components:** Move state management *inside* the respective dialog components.
    *   Refactor `ProjectDetailPage` to use the chosen strategy, removing scattered `useState` calls for dialogs.
    *   *Benefit:* Centralizes or encapsulates dialog logic, reduces state variables in `ProjectDetailPage`, improves clarity.

3.  **Extract Business Logic/Calculations:**
    *   Move complex `useMemo` calculations (`projectProgress`, `budgetData`, `timeline`, `expenseBreakdown`, etc.) into pure utility functions or dedicated custom hooks (`useProjectMetrics`).
    *   *Benefit:* Separates calculations, makes them testable, improves readability.

4.  **Ensure Tab Components are Self-Contained:**
    *   Review props passed to tab components (`ProjectOverviewTab`, etc.).
    *   Pass only necessary data/callbacks. Move tab-specific derived state or logic into the tabs themselves or hooks used by them.
    *   *Benefit:* Increases tab independence and reusability.

5.  **Simplify `ProjectDetailPage` Component:**
    *   The final step involves cleaning up `ProjectDetailPage` so it primarily orchestrates the hooks and components, passes props, and handles top-level layout and navigation.
    *   *Benefit:* Results in a much smaller, more understandable main component.

**Visualization (Proposed Structure):**

```mermaid
graph TD
    subgraph Current Structure
        PD_Before[ProjectDetailPage.tsx (Handles Everything)]
        PD_Before --> API[API Services]
    end

    subgraph Proposed Structure
        PD_After[ProjectDetailPage.tsx (Orchestrator)]

        subgraph Hooks
            H_Project[useProject]
            H_Phases[useProjectPhases]
            H_Bids[useProjectBids]
            H_Expenses[useProjectExpenses]
            H_Metrics[useProjectMetrics / Utils]
            H_Dialogs[useDialogManager / Utils]
            H_QuickUpdate[useQuickUpdate]
        end

        subgraph Components
            Layout[PageLayout]
            Header[ProjectDetailHeaderActions]
            Metrics[ProjectMetricCards]
            Tabs[TabNavigation + TabContent]
            Tab1[ProjectOverviewTab]
            Tab2[...]
            Dialogs[ProjectDialogs / Specific Dialogs]
        end

        PD_After -- uses --> H_Project
        PD_After -- uses --> H_Phases
        PD_After -- uses --> H_Bids
        PD_After -- uses --> H_Expenses
        PD_After -- uses --> H_Metrics
        PD_After -- uses --> H_Dialogs
        PD_After -- uses --> H_QuickUpdate

        H_Project --> API
        H_Phases --> API
        H_Bids --> API
        H_Expenses --> API

        PD_After -- renders --> Layout
        PD_After -- renders --> Header
        PD_After -- renders --> Metrics
        PD_After -- renders --> Tabs
        PD_After -- renders --> Dialogs

        Tabs -- renders --> Tab1
        Tabs -- renders --> Tab2

        %% Data Flow (Simplified)
        H_Project -- data --> PD_After
        H_Phases -- data --> PD_After
        H_Bids -- data --> PD_After
        H_Expenses -- data --> PD_After
        H_Metrics -- data --> PD_After

        PD_After -- props --> Header
        PD_After -- props --> Metrics
        PD_After -- props --> Tabs
        PD_After -- props --> Dialogs
        Tabs -- props --> Tab1 & Tab2
    end
```

**Testing Strategy:**

*   Write unit tests for all new custom hooks and utility functions. Mock API calls where necessary.
*   Write integration tests (e.g., using React Testing Library) for the refactored `ProjectDetailPage` and the individual tab components to ensure they render correctly and interactions work as expected with the new hooks.
*   Maintain or add end-to-end tests for critical user flows involving this page.