# Structure & Modularity Audit

Scope: `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.js`, and `src/**/*.jsx`.

Method: read `CODEBASE_MAP.md`, then inspected source line counts and representative implementation bodies. Line-count evidence below uses `wc -l`; code evidence uses 1-based file line numbers from the current working tree.

## Top Findings

### HIGH - Dev data store is a single mixed-concern repository, fixture, hydrator, and domain service

- Evidence: `src/services/devDataStore.ts:1` is 2,485 lines.
- Evidence: fixture seeding spans `src/services/devDataStore.ts:177` through `src/services/devDataStore.ts:1734`.
- Evidence: persistence/hydration starts at `src/services/devDataStore.ts:158` and `src/services/devDataStore.ts:1736`.
- Evidence: project/task/expense/subcontractor/bid repository operations all live together from `src/services/devDataStore.ts:1864` through `src/services/devDataStore.ts:2485`.
- Problem: one module owns localStorage persistence, seed data, entity hydration, derived project aggregation, and all dev-mode CRUD. This makes dev-mode behavior hard to compare with Firestore services and encourages production services to import a broad god module.
- Proposed fix: split into `devData/seed.ts`, `devData/storage.ts`, `devData/hydration.ts`, and one repository per entity (`projectRepository.ts`, `taskRepository.ts`, `expenseRepository.ts`, `bidRepository.ts`, `subcontractorRepository.ts`). Keep a narrow facade only for public dev-mode exports.

### HIGH - Bid service mixes Firestore mapping, repository queries, payment orchestration, expense creation, and dev-mode branching

- Evidence: `src/services/bid.ts:1` is 1,488 lines.
- Evidence: `BidService` starts at `src/services/bid.ts:147` and runs to `src/services/bid.ts:1411`.
- Evidence: `createBid` runs from `src/services/bid.ts:165` to `src/services/bid.ts:336` (>50 lines).
- Evidence: `updateBid` starts at `src/services/bid.ts:382` and contains payment schedule conversion, date conversion, undefined cleanup, and persistence.
- Evidence: bid-to-expense orchestration imports the expense service dynamically at `src/services/bid.ts:1118` and again at `src/services/bid.ts:1344`.
- Problem: repository code, serialization, payment domain rules, cross-aggregate workflows, and environment switching are coupled in one static class. The dynamic import is a circular-dependency workaround, not a clean boundary.
- Proposed fix: split into `bidRepository` for Firestore access, `bidMapper` for Timestamp conversion, `bidPaymentScheduleService` for payment progress/stage rules, and `bidExpenseSyncService` for bid-expense workflows. Inject a dev/prod repository implementation rather than branching inside every service method.

### HIGH - Project service is both data access and residential construction template engine

- Evidence: `src/services/project.ts:1` is 1,202 lines.
- Evidence: Firestore repository methods live near `src/services/project.ts:189`, `src/services/project.ts:241`, `src/services/project.ts:307`, `src/services/project.ts:371`, and `src/services/project.ts:396`.
- Evidence: template descriptions and task generation start at `src/services/project.ts:501`; `createPhaseTasks` contains a large phase switch through `src/services/project.ts:985`.
- Evidence: `createResidentialProject` runs from `src/services/project.ts:994` to `src/services/project.ts:1128` (>50 lines).
- Problem: low-level Firestore CRUD, deletion cascades, phase template definitions, generated task defaults, budget allocation math, and compatibility wrappers are all in one service.
- Proposed fix: move construction templates into `src/domain/projectTemplates/residential.ts`, phase/task factories into `src/domain/phases`, Firestore persistence into `projectRepository`, and keep `ProjectService` as a thin application service orchestrating those modules.

### HIGH - Several React components are page-sized containers with form state, business rules, data access, and view markup

- Evidence: `src/components/expenses/ExpenseFormModal.tsx:165` starts a component that ends at `src/components/expenses/ExpenseFormModal.tsx:1623`; file has 1,625 lines.
- Evidence: `src/components/projects/BidPaymentSchedule.tsx:78` starts the main component; the same file also declares `PaymentStageForm` at `src/components/projects/BidPaymentSchedule.tsx:854`, `ExpenseForm` at `src/components/projects/BidPaymentSchedule.tsx:1344`, and `ExtraPaymentForm` at `src/components/projects/BidPaymentSchedule.tsx:1482`; file has 1,618 lines.
- Evidence: `src/components/expenses/Expenses.tsx:89` starts a 1,488-line route/container component, and `handleSaveExpense` starts at `src/components/expenses/Expenses.tsx:328` with bid-adjustment business logic embedded in the UI flow.
- Evidence: `src/components/projects/budget/BudgetDashboard.tsx:135` starts a 1,394-line dashboard; direct projection mutation handlers run at `src/components/projects/budget/BudgetDashboard.tsx:664`, `src/components/projects/budget/BudgetDashboard.tsx:706`, `src/components/projects/budget/BudgetDashboard.tsx:752`, and `src/components/projects/budget/BudgetDashboard.tsx:794`.
- Problem: these components are hard to test because UI state, data mutation, business rules, formatting, validation, duplicate detection, charts, and dialogs are coupled in render files.
- Proposed fix: use route/container components for data loading and orchestration, extract hooks for state machines (`useExpenseForm`, `useBidPaymentSchedule`, `useBudgetProjections`), move domain mutation rules to services, and split markup into cohesive presentational components/tabs/sections.

### HIGH - UI components bypass service/repository boundaries and query Firestore directly

- Evidence: `src/components/timeline/Timeline.tsx:35` imports `db`; direct Firestore reads begin at `src/components/timeline/Timeline.tsx:350` and continue through events/deliveries/payments to `src/components/timeline/Timeline.tsx:575`.
- Evidence: `src/components/calendar/Calendar.tsx:28` imports `db`; direct Firestore reads run from `src/components/calendar/Calendar.tsx:165` through `src/components/calendar/Calendar.tsx:374`.
- Evidence: `src/components/projects/budget/BudgetDashboard.tsx:68` imports Firestore Timestamp and `src/components/projects/budget/BudgetDashboard.tsx:69` imports `doc`/`updateDoc`; projection writes occur at `src/components/projects/budget/BudgetDashboard.tsx:677`, `src/components/projects/budget/BudgetDashboard.tsx:723`, `src/components/projects/budget/BudgetDashboard.tsx:765`, and `src/components/projects/budget/BudgetDashboard.tsx:811`.
- Evidence: `src/components/projects/budget/BudgetAllocationTracker.tsx:74` imports Firestore and writes at `src/components/projects/budget/BudgetAllocationTracker.tsx:237` and `src/components/projects/budget/BudgetAllocationTracker.tsx:327`.
- Problem: presentation code now depends on Firestore schemas and Timestamp conversion. This prevents reuse in tests, makes dev-mode parity inconsistent, and duplicates query/join behavior across views.
- Proposed fix: create calendar/timeline/projection application services or React Query hooks that return view models. Components should call hooks/services, not `db`, `collection`, `doc`, or `updateDoc`.

### MEDIUM - Duplicate API and service layers model the same collections differently

- Evidence: generic API service begins at `src/api/base.service.ts:27`; `src/api/project.service.ts:5` and `src/api/expense.service.ts:5` extend it.
- Evidence: parallel production services for the same domains exist at `src/services/project.ts:61` and `src/services/expense.ts:35`.
- Evidence: the API project mapper stores budget as a number at `src/api/project.service.ts:27`, while `src/services/project.ts:29` defines `FirestoreProject.budget` as an object with `total`, `spent`, and `remaining`.
- Evidence: `src/api/expense.service.ts:95`, `src/api/expense.service.ts:154`, `src/api/expense.service.ts:217`, `src/api/expense.service.ts:248`, and `src/api/expense.service.ts:275` repeat expense query variants that overlap the hooks/services layer.
- Problem: two service families create divergent serialization contracts and query behavior for the same Firestore collections. Callers can accidentally select incompatible APIs.
- Proposed fix: choose one data access layer. If `src/api` is the intended repository abstraction, migrate `src/services/*` domain logic to depend on it. If not, remove or quarantine `src/api` as legacy and consolidate tests around the chosen layer.

### MEDIUM - Category system logic and data are duplicated across data and utility modules

- Evidence: `src/data/hierarchicalCategories.ts:1` is 1,156 lines and exports category data plus lookup/mapping functions starting at `src/data/hierarchicalCategories.ts:941`.
- Evidence: `src/data/constructionCategories.ts:1` is 398 lines with another hierarchy and lookup implementation starting at `src/data/constructionCategories.ts:306`.
- Evidence: `src/data/newHierarchicalCategories.ts:1` defines another enhanced category source and lookup helpers.
- Evidence: `src/utils/categoryMapper.ts:11` maps between systems and has fallback matching at `src/utils/categoryMapper.ts:114`; `src/utils/categoryMappingUtils.ts:137` and `src/utils/categoryMappingUtils.ts:177` provide overlapping conversion and best-match behavior.
- Problem: multiple sources of truth for category data and mapping make category behavior order-dependent and hard to reason about. UI components import from different sources.
- Proposed fix: create one `src/domain/categories` package with canonical category data, adapters for legacy/enhanced IDs, and one public mapping API. Keep raw data separate from mapping algorithms.

### MEDIUM - Calendar and timeline duplicate event aggregation logic

- Evidence: `src/components/timeline/Timeline.tsx:341` fetches projects, tasks, milestones, payments, deliveries, and events into `TimelineEvent`.
- Evidence: `src/components/calendar/Calendar.tsx:150` repeats the same collection reads and project-name joins into `CalendarEvent`.
- Evidence: both perform per-item project lookups (`src/components/timeline/Timeline.tsx:381`, `src/components/timeline/Timeline.tsx:458`, `src/components/calendar/Calendar.tsx:183`, `src/components/calendar/Calendar.tsx:267`).
- Problem: two views independently know the event schema, Firestore collection names, date fields, and project-name join strategy. Changes to an event source must be duplicated.
- Proposed fix: introduce `eventFeedService` or `useEventFeed({userId, startDate, endDate})` that aggregates all event-like records once and returns a normalized event view model used by both calendar and timeline.

### MEDIUM - Business workflows leak into page components instead of application services

- Evidence: `src/components/expenses/Expenses.tsx:328` saves expenses and contains bid payment adjustment logic beginning at `src/components/expenses/Expenses.tsx:393`.
- Evidence: `src/components/projects/BidPaymentSchedule.tsx:169` deletes stages, redistributes amounts, updates expenses, and persists bid state.
- Evidence: `src/components/projects/BidPaymentSchedule.tsx:290` handles stage save, partial payment split, expense updates, and bid refresh.
- Evidence: `src/components/projects/budget/BudgetDashboard.tsx:664` through `src/components/projects/budget/BudgetDashboard.tsx:838` performs projection CRUD directly.
- Problem: routes and widgets are becoming transaction scripts. This makes domain invariants dependent on which UI path triggered the operation.
- Proposed fix: move expense-payment, bid-stage, and budget-projection workflows to application services with narrow request/response types. Components should only collect input, call the workflow, and render results.

### LOW - Folder organization has ambiguous boundaries and duplicate locations

- Evidence: dialogs live in both `src/dialogs/PhaseDetailsDialog.tsx:1` and `src/components/projects/dialogs/PhaseDetailsDialog.tsx:1`.
- Evidence: bid management exists in both `src/components/projects/BidManager.tsx:1` and `src/components/bids/BidManager.tsx:1`.
- Evidence: project detail concerns are spread across `src/components/projects/detailTabs`, `src/components/projects/budget`, `src/components/projects/dialogs`, and top-level `src/components/projects`.
- Problem: feature ownership is unclear. Developers must inspect imports to know which component is authoritative.
- Proposed fix: organize by feature route/domain (`features/projects`, `features/bids`, `features/expenses`, `features/calendar`) with local `components`, `hooks`, `services`, and `types`, or enforce the current layered layout with no duplicate domain component names.

## God Objects And Functions

- HIGH: `src/services/devDataStore.ts:177` `createSeedState` is roughly 1,558 lines. Split seed fixtures by entity and scenario.
- HIGH: `src/services/bid.ts:147` `BidService` spans roughly 1,265 lines. Split repository, mapper, payment rules, and bid-expense sync.
- HIGH: `src/services/project.ts:61` `ProjectService` spans roughly 1,100 lines. Split repository, deletion cascade, project templates, and phase/task factories.
- HIGH: `src/components/expenses/ExpenseFormModal.tsx:165` component spans roughly 1,459 lines. Split tabs/sections and extract `useExpenseForm`.
- HIGH: `src/components/projects/BidPaymentSchedule.tsx:78` file contains multiple form components and payment workflow functions. Split into schedule list, stage dialog, expense dialog, extra-payment dialog, and a `useBidPaymentSchedule` hook.
- MEDIUM: `src/components/projects/budget/BudgetDashboard.tsx:135` component spans roughly 1,258 lines. Split summary cards, charts, projection actions, and allocation tracker integration.
- MEDIUM: `src/components/timeline/Timeline.tsx:341` `fetchTimelineData` runs to `src/components/timeline/Timeline.tsx:590` (>200 lines). Move aggregation to an event-feed service.
- MEDIUM: `src/components/calendar/Calendar.tsx:150` `fetchEvents` runs to `src/components/calendar/Calendar.tsx:382` (>200 lines). Reuse event-feed service.
- MEDIUM: `src/components/expenses/Expenses.tsx:328` `handleSaveExpense` embeds persistence and bid adjustment workflow. Move to an expense workflow service.
- MEDIUM: `src/services/project.ts:994` `createResidentialProject` runs to `src/services/project.ts:1128` (>50 lines). Move to a template factory.

## Oversized Source Files (>200 LOC)

| Lines | Evidence | Proposed split boundary |
|---:|---|---|
| 2485 | `src/services/devDataStore.ts:1` | Seed data, storage adapter, hydration, and per-entity repositories |
| 1625 | `src/components/expenses/ExpenseFormModal.tsx:1` | Form hook, validation, tabs, line items, payment, receipt, duplicate warning |
| 1618 | `src/components/projects/BidPaymentSchedule.tsx:1` | Schedule view, stage form, expense form, extra payment form, payment workflow hook |
| 1488 | `src/components/expenses/Expenses.tsx:1` | Route container, summary widgets, table row, grouping/sorting, payment workflow |
| 1488 | `src/services/bid.ts:1` | Repository, Firestore mapper, payment schedule domain, expense sync |
| 1412 | `src/components/bids/ReusableBidForm.tsx:1` | Form state hook, line items, payment terms, attachments, validation, sections |
| 1394 | `src/components/projects/budget/BudgetDashboard.tsx:1` | Budget selectors, charts, summary cards, projection CRUD hook, report controls |
| 1352 | `src/components/bids/BidCard.tsx:1` | Summary card, expanded details, action menu, status/date helpers |
| 1202 | `src/services/project.ts:1` | Repository, Firestore mapper, residential template, phase/task factories |
| 1189 | `src/components/projects/Projects.tsx:1` | Route container, filters, cards/list, dialogs, project mutations |
| 1156 | `src/data/hierarchicalCategories.ts:1` | Raw category data, lookup selectors, mapping heuristics |
| 1005 | `src/components/projects/budget/BudgetReport.tsx:1` | Data preparation, report sections, charts, export/render |
| 998 | `src/components/projects/BidManager.tsx:1` | Data hook, filters/table, dialogs, payment terms |
| 962 | `src/components/dashboard/Dashboard.tsx:1` | Data aggregation hook, dashboard cards, charts, quick actions |
| 958 | `src/components/tasks/TasksList.tsx:1` | Task query/container, filters, table/list, row actions |
| 928 | `src/components/timeline/Timeline.tsx:1` | Event-feed service, filters, item card, timeline layout |
| 910 | `src/components/bids/BidDetails.tsx:1` | Header, detail sections, payment schedule, versions, actions |
| 759 | `src/components/projects/detailTabs/ProjectOverviewTab.tsx:1` | Metrics selectors, summary sections, charts |
| 747 | `src/components/projects/LineItemManager.tsx:1` | Line-item state hook, table, row editor, bulk actions |
| 746 | `src/components/calendar/Calendar.tsx:1` | Event-feed service, calendar grid, event cell, navigation controls |
| 704 | `src/dialogs/PhaseDetailsDialog.tsx:1` | Dialog shell, metrics, task list, expense list, bid list |
| 679 | `src/components/subcontractors/Subcontractors.tsx:1` | Data hook, filters, list/table, dialogs |
| 673 | `src/components/projects/ProjectForm.tsx:1` | Form state hook, steps/sections, validation |
| 665 | `src/components/bids/BidManager.tsx:1` | Bid query hook, filters, list, dialogs |
| 664 | `src/services/expense.ts:1` | Repository, mapper, payment operations, duplicate detection |
| 645 | `src/pages/SharedReportView.tsx:1` | Load state hook, auth/password flow, report renderer |
| 633 | `src/components/bids/BidList.tsx:1` | Filter/sort hook, list/table, pagination/actions |
| 567 | `src/components/dashboard/PriorityItems.tsx:1` | Data selectors, item list, priority scoring |
| 547 | `src/components/projects/detailTabs/ProjectTaskManager.tsx:1` | Task hook, filters, form dialog, list/table |
| 543 | `src/components/projects/ProjectCard.tsx:1` | Card shell, metrics, actions, progress sections |
| 502 | `src/utils/bidOperations.ts:1` | Payment calculations, expense creation, bid updates |
| 489 | `src/components/common/EnhancedCategorySelector.tsx:1` | Category selectors, search, tree rendering |
| 487 | `src/components/projects/ProjectMetricCards.tsx:1` | Metric calculations, card rendering |
| 482 | `src/components/subcontractors/SubcontractorForm.tsx:1` | Form hook, sections, validation |
| 479 | `src/components/projects/BidPaymentTermsModal.tsx:1` | Terms form, schedule calculations, preview |
| 475 | `src/hooks/useProjectBidManagement.ts:1` | Query/mutation hook, derived selectors, dialog state |
| 469 | `src/components/expenses/PaymentFormModal.tsx:1` | Payment form state, validation, summary sections |
| 467 | `src/components/projects/TemplateAdjuster.tsx:1` | Template calculation hook, editor UI |
| 462 | `src/contexts/ProjectWizardContext.tsx:1` | Reducer/actions, defaults, persistence, provider |
| 458 | `src/components/projects/budget/CategoryMigrationInterface.tsx:1` | Migration state hook, mapping table, actions |
| 440 | `src/components/projects/detailTabs/ProjectPhasesTab.tsx:1` | Phase selectors, cards, actions, dialogs |
| 428 | `src/components/dashboard/UpcomingDeadlines.tsx:1` | Deadline selectors, item component, filters |
| 427 | `src/services/bid.service.test.ts:1` | Test fixtures, timestamp mocks, create/update/payment behavior suites |
| 424 | `src/components/projects/budget/BudgetAllocationTracker.tsx:1` | Allocation calculations, projection form, persistence |
| 417 | `src/components/subcontractors/SubcontractorDetails.tsx:1` | Detail sections, metrics, project/bid history |
| 415 | `src/utils/categoryMapper.ts:1` | Static mapping table, fuzzy matching, public API |
| 404 | `src/components/projects/PhaseSetupStepper.tsx:1` | Step state, phase generation, progress UI |
| 398 | `src/data/constructionCategories.ts:1` | Raw hierarchy, selectors, flat/hierarchical mapper |
| 397 | `src/components/tasks/TaskFormModal.tsx:1` | Form state, fields, validation |
| 391 | `src/components/dashboard/QuickActions.tsx:1` | Action config, rendering, navigation handlers |
| 377 | `src/components/dashboard/ProjectInsights.tsx:1` | Insight selectors, chart/cards |
| 376 | `src/components/projects/ProjectExpenseCard.tsx:1` | Expense card, actions, payment status |
| 370 | `src/services/category.service.ts:1` | Firestore repository, mapping service, migration helpers |
| 367 | `src/components/projects/LineItemFormModal.tsx:1` | Line item form state and UI |
| 366 | `src/api/expense.service.ts:1` | Mapper, generic queries, expense-specific operations |
| 356 | `src/hooks/use-expenses.ts:1` | Query hooks, mutation hooks, cache invalidation |
| 354 | `src/components/projects/detailTabs/ProjectDocumentsTab.tsx:1` | Document hook usage, filters, table/cards |
| 353 | `src/services/accounting.ts:1` | Commitment mapper, repository methods, dashboard calculations |
| 330 | `src/components/project-wizard/BudgetStep.tsx:1` | Budget form, template suggestions, validation |
| 329 | `src/components/common/CategorySelector.tsx:1` | Selector state, rendering, category mapping |
| 323 | `src/services/expense.service.test.ts:1` | Expense fixtures, query cases, mutation assertions |
| 317 | `src/components/project-wizard/TeamStep.tsx:1` | Team form, search/selection, validation |
| 317 | `src/data/expenseFormConstants.ts:1` | Constants grouped by form/phase category |
| 308 | `src/theme.ts:1` | Palette, component overrides, typography tokens |
| 305 | `src/data/bidFormConstants.ts:1` | Bid form constants and templates |
| 298 | `src/components/projects/dialogs/PhaseDetailsDialog.tsx:1` | Dialog sections and data presentation |
| 297 | `src/services/expense-transaction.ts:1` | Transaction repository and payment logic |
| 297 | `src/api/project.service.test.ts:1` | API service fixtures and Firestore serialization tests |
| 296 | `src/services/payment.service.test.ts:1` | Payment fixtures and service behavior tests |
| 293 | `src/components/settings/UserProfile.tsx:1` | Profile form, auth/user updates, view sections |
| 291 | `src/components/layout/SettingsMenu.tsx:1` | Menu config and rendering |
| 288 | `src/hooks/usePaymentTerms.ts:1` | Payment-term state, calculations, persistence helpers |
| 279 | `src/components/bids/LineItemsTable.tsx:1` | Row editor, calculations, table UI |
| 279 | `src/components/layout/MainLayout.tsx:1` | Layout shell, nav state, route outlet |
| 279 | `src/components/projects/budget/CategoryMigrationWizard.tsx:1` | Wizard state, steps, migration actions |
| 271 | `src/components/bids/FilterPanel.tsx:1` | Filter state and controls |
| 270 | `src/components/project-wizard/ReviewStep.tsx:1` | Review selectors, sections, validation display |
| 266 | `src/services/user.service.ts:1` | User repository and profile operations |
| 264 | `src/components/dashboard/RecentProjects.tsx:1` | Project list rendering and navigation |
| 263 | `src/components/projects/detailTabs/ProjectTaskManager.test.tsx:1` | Task manager render and interaction tests |
| 263 | `src/contexts/ProjectDetailContext.tsx:1` | Project detail provider, data loading, refresh orchestration |
| 262 | `src/components/payments/Payments.tsx:1` | Payments page state, filters, table/cards |
| 260 | `src/utils/categoryMappingUtils.ts:1` | Category system preference, conversion, matching |
| 250 | `src/api/task.service.ts:1` | Task mapper and query/mutation methods |
| 248 | `src/services/payment.ts:1` | Payment repository and summary logic |
| 244 | `src/services/ReportService.ts:1` | Shared report persistence, sanitization, expiry |
| 242 | `src/hooks/use-expenses.test.tsx:1` | Expense hook wrappers, fixtures, cache/mutation behavior |
| 241 | `src/components/common/CategoryManagementPanel.tsx:1` | Category management UI and actions |
| 238 | `src/hooks/use-tasks.ts:1` | Task query/mutation hooks |
| 237 | `src/contexts/AuthContext.tsx:1` | Auth provider, dev bypass, auth state mapping |
| 234 | `src/components/projects/BidFormModal.tsx:1` | Bid modal state and UI |
| 231 | `src/components/project-wizard/ScheduleStep.tsx:1` | Schedule form, milestone state, validation |
| 229 | `src/data/categoryMaps.ts:1` | Legacy/enhanced mapping tables |
| 227 | `src/api/base.service.ts:1` | Generic Firestore repository abstraction |
| 225 | `src/hooks/use-documents.ts:1` | Document query/mutation hooks |
| 221 | `src/api/project.service.ts:1` | Project mapper and user queries |
| 216 | `src/utils/phaseCalculations.ts:1` | Phase budget/progress/payment selectors |
| 211 | `src/services/accounting.service.test.ts:1` | Accounting service fixtures and dashboard assertions |
| 208 | `src/services/subcontractor.ts:1` | Subcontractor repository and queries |
| 206 | `src/components/project-wizard/ProjectInfoStep.tsx:1` | Project info form section |
| 205 | `src/api/bid.service.ts:1` | Bid mapper and query/mutation methods |
| 201 | `src/types/index.ts:1` | Central type barrel and type definitions |

## Separation Recommendations

1. Define domain/application boundaries before further feature work: repositories own Firestore/dev-store access, domain services own construction/bid/expense rules, hooks own UI data fetching/cache wiring, and components own rendering only.
2. Replace direct Firestore imports in `src/components/**` with hooks/services. A simple lint rule banning `firebase/firestore` and `config/firebase` imports outside repositories would prevent regressions.
3. Consolidate duplicate service layers (`src/api` vs `src/services`) and duplicate category modules before adding more features.
4. Add a module-size budget: warn at 200 LOC, require split justification over 400 LOC, and block new mixed-concern components/services over 800 LOC.
