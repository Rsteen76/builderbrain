# Performance & Resource Use Audit

Scope: Builderbrain hardening audit, Agent F. Reviewed `CODEBASE_MAP.md` first, then inspected Firestore services, hooks, dashboard/payment flows, storage utilities, report export code, indexes, and dependency usage. No code fixes were implemented.

## Findings

### HIGH - Payments dashboard has an N+1 Firestore transaction query pattern

Evidence:
- `src/components/payments/Payments.tsx:72` loads `PaymentService.getPaymentsDashboard(user.uid)` when the Payments page mounts.
- `src/services/payment.ts:99-101` fetches all user expenses and the accounting dashboard in parallel.
- `src/services/payment.ts:178-186` then maps every expense with `transactionIds` to `ExpenseTransactionService.getTransactionsForExpense(...)`.
- `src/services/expense-transaction.ts:212-219` performs one Firestore query per expense: `where('expenseId', '==', expenseId)`, `where('userId', '==', userId)`, `orderBy('transactionDate', 'desc')`.

Impact: Users with many paid/partially-paid expenses will trigger 1 expense query plus N transaction queries on page load. This increases latency, read costs, and the chance of request bursts/rate pressure.

Proposed fix: Fetch transactions in bulk for the dashboard instead of per expense. Prefer a bounded `getTransactionsForUser` or project/date-scoped query ordered by `transactionDate`, then join in memory. If only selected expense IDs are needed, batch IDs with Firestore `in`/`array-contains-any` limits and cap concurrency.

### HIGH - Project detail load duplicates full project document reads and broad related reads

Evidence:
- `src/hooks/useProjectData.ts:32-35` composes `useProject`, `useProjectPhases`, `useProjectBids`, and `useProjectExpenses` for the same detail page.
- `src/hooks/useProject.ts:37` fetches the full project document via `ProjectService.getProject(...)`.
- `src/hooks/useProjectPhases.ts:84-87` fetches the full project document again only to read phases.
- `src/hooks/useProjectData.ts:51` also fetches all subcontractors for the user through `SubcontractorService.getSubcontractors(user.uid)`.
- `src/services/subcontractor.ts:158-174` reads the full user subcontractor list ordered by `createdAt`.

Impact: Opening a project detail page performs duplicate reads of the same potentially large project document plus unbounded user-wide subcontractor reads. Because projects embed phases, line items, tasks, bids, milestones, and projections, duplicate full-document reads amplify latency and payload size.

Proposed fix: Make `useProjectData` the owner of the project document and derive phases from that result, or expose a single project-detail query/context consumed by child tabs. For subcontractors, fetch only subcontractors referenced by the project/bids/expenses, or paginate/search the selector data instead of loading all user subcontractors eagerly.

### HIGH - Dashboard does full user project scans and repeated client-side aggregation on mount/refresh

Evidence:
- `src/components/dashboard/Dashboard.tsx:367-368` loads all projects with `ProjectService.getProjects(user.uid)` and maps every document to dashboard data.
- `src/services/project.ts:421-443` queries all projects for the user ordered by `createdAt` with no limit.
- `src/services/project.ts:449-451` converts every document, including embedded arrays such as phases, line items, bids, tasks, team, milestones, and projections.
- `src/components/dashboard/Dashboard.tsx:372-503` repeatedly loops over all dashboard projects for risk, totals, team members, tasks, milestones, and budget variance.

Impact: Dashboard cost grows linearly with the user's full project history and embedded project document size. A user with many projects or large embedded arrays pays the full read/parse/render cost every mount and refresh even though the dashboard only needs summaries and recent items.

Proposed fix: Maintain denormalized project summary fields or a `dashboard_summaries` collection with the stats needed for the dashboard. Add `limit(...)` for recent projects and dedicated queries for upcoming/at-risk items. Avoid loading embedded detail arrays unless a detail tab needs them.

### MEDIUM - Several Firestore queries do not have matching composite index definitions

Evidence:
- `src/api/document.service.ts:61-72` queries `documents` by `projectId`, optional `type`, optional `isArchived`, and `orderBy('createdAt', 'desc')`.
- `src/services/bid.ts:802-806` queries recent bids by `userId` ordered by `createdAt`.
- `src/services/bid.ts:824-829` queries upcoming bids by `userId`, `submissionDeadline >= now`, and `orderBy('submissionDeadline', 'asc')`.
- `firestore.indexes.json:136-177` only defines bid indexes using `updatedAt`, not `createdAt` or `submissionDeadline`.
- `firestore.indexes.json:180-228` proceeds from `tasks` to `users`; no `documents` indexes are defined.

Impact: These query shapes can fail in production with missing-index errors or become easy to regress when filters are enabled. Even when Firestore suggests indexes at runtime, users see broken screens until indexes are deployed.

Proposed fix: Add composite indexes for deployed query shapes, at minimum `documents(projectId, isArchived, createdAt desc)`, `documents(projectId, type, isArchived, createdAt desc)`, `bids(userId, createdAt desc)`, and `bids(userId, submissionDeadline asc)`. Audit dynamic bid filters in `getBids` before exposing new sort/filter combinations.

### MEDIUM - Firebase Storage listing/deletion uses unbounded `listAll` and unbounded parallel operations

Evidence:
- `src/services/storage.ts:28-30`, `src/services/storage.ts:43-45`, and `src/services/storage.ts:85-87` list all documents/photos/attachments for a folder.
- `src/services/storage.ts:122-125` calls `listAll(folderRef)` and then `Promise.all(result.items.map(getDownloadURL))`.
- `src/services/storage.ts:133-136` recursively calls `listAll` and deletes all items/prefixes with `Promise.all`.
- `src/services/project.ts:385-389` calls `StorageService.deleteProjectFiles(projectId)` during project deletion.

Impact: `listAll` materializes the full folder listing in memory and the subsequent `Promise.all` starts one request per object. Large project folders can cause slow screens, high memory use, request bursts, or failed project deletions.

Proposed fix: Use paginated Storage listing with `list(..., { maxResults, pageToken })`, cap concurrent `getDownloadURL`/delete operations, and store document metadata/download URLs in Firestore so UI reads do not need to enumerate Storage folders.

### MEDIUM - Payment/accounting dashboards read entire financial collections and aggregate client-side

Evidence:
- `src/services/payment.ts:99-101` loads all user expenses plus `AccountingService.getAccountingDashboard(userId)`.
- `src/services/accounting.ts:310-316` loads commitments, vendor invoices, vendor payments, owner invoices, and owner payments in parallel.
- `src/services/accounting.ts:265-304` each helper reads all documents for `userId` unless a `projectId` is supplied.
- `src/services/accounting.ts:325-346` computes dashboard totals with repeated filters/reduces over the full arrays.

Impact: The Payments page performs broad scans over multiple financial collections, then does all aggregation in the browser. This will become slow and costly as historical invoices/payments grow.

Proposed fix: Add date/project/status filters to dashboard queries, paginate record lists, and maintain rollup summary documents for frequently displayed totals. Compute only visible records client-side.

### LOW - PDF export libraries and rasterization are eagerly bundled into report views

Evidence:
- `src/components/projects/budget/BudgetReport.tsx:74-75` statically imports `jspdf` and `html2canvas`.
- `src/pages/SharedReportView.tsx:34-35` statically imports the same libraries.
- `src/components/projects/budget/BudgetReport.tsx:380-418` rasterizes the report/sections at `scale: 2` and converts canvases to image data.
- `src/pages/SharedReportView.tsx:135-142` rasterizes the shared report at `scale: 2` and exports JPEG data.
- `package.json:24-25` includes `html2canvas` and `jspdf` as runtime dependencies.

Impact: Report pages pay the initial JavaScript bundle parse/download cost for PDF export even when users only view the report. Large reports can also allocate large canvases and base64 image strings during export.

Proposed fix: Dynamically import `jspdf` and `html2canvas` inside the export handler, add export progress/error states, and consider server-side/report-worker generation for large reports. Cap canvas dimensions or section count to avoid browser memory spikes.

## Notes

- I did not find Node-style synchronous filesystem I/O on request paths; this is a browser/Firebase app.
- Local `localStorage` use exists in selectors, but inspected use is small and not a top performance risk compared with broad Firestore/Storage reads.
