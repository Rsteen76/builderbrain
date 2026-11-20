# Hardening Report

Generated: 2026-05-07

## Completed

- Produced the baseline codebase map in `CODEBASE_MAP.md`.
- Produced seven domain audits under `audit/`.
- Consolidated findings, dependency ordering, wave plan, and conflicts in `audit/SUMMARY.md`.
- Migrated the app from Create React App/react-scripts to Vite.
- Removed all current `npm audit` vulnerabilities.
- Added direct Jest/Babel config and coverage thresholds.
- Added CI parity checks for typecheck, coverage, rules tests, build, and e2e.
- Updated README, env, runtime, CI, Firebase Hosting, and deploy documentation.
- Added Firebase Hosting security headers and CSP.
- Added client-side and Storage Rules upload validation for PDFs/images and size limits.
- Hardened auth startup so Firestore profile load/create failures block authentication instead of continuing with partial user state.
- Fixed partial expense update serialization so patch writes do not reset required fields or dates.
- Fixed payment modal persistence so async save failures keep the modal open and visible to the user.
- Fixed user data reset so partial deletion failures are reported instead of swallowed.
- Replaced predictable shared report IDs with cryptographically generated IDs.
- Added idempotent accepted-bid payment-stage expense creation and routed bid acceptance flows through it.
- Fixed the payment dashboard N+1 transaction query by bulk-loading expense transactions.
- Added an owner-scoped dashboard summary read model with a bounded cached read, project-derived refresh fallback, and Firestore rules for `dashboard_summaries/{userId}`.
- Consolidated project-detail loading into a single data service so phases are derived from the project document, bids/expenses are loaded once, and only referenced subcontractors are fetched for the detail context.
- Replaced Settings stubs with real profile, password, and notification preference surfaces; removed the inactive appearance/dark-mode controls until a real theme system exists.
- Moved Calendar and Timeline reads behind a shared service/hook boundary and removed per-event project lookups by reusing a project-name map.
- Moved budget projection and project budget writes behind a budget service boundary with centralized projection ID creation and timestamp serialization.
- Split the largest service modules into cohesive helper modules: project mapping/date/residential helpers, bid serialization/payment-schedule helpers, and dev data seed/storage helpers.
- Split the expense page and expense form into focused list, dashboard, form-option, validation, line-item, and row components/helpers.
- Continued UI splitting so `BudgetDashboard.tsx` is below the 300-line ceiling, `ExpenseFormModal.tsx` is under 650 lines, and `Expenses.tsx` is under 810 lines.
- Migrated React Query v3 to `@tanstack/react-query` v5 across the query provider and project/bid/expense/task/document hooks.
- Added logger redaction for sensitive fields and moved core auth/user/task/subcontractor logs through the shared logger.
- Added Vite manual vendor chunking and lazy-loaded the project expense tab's nested expense list to remove production build chunk warnings.
- Added a mutation-oriented Playwright smoke test for creating an expense in local dev bypass mode.
- Fixed the `ExpenseFormModal` render loop exposed by e2e tests.
- Fixed DOM nesting warnings on the exercised project overview and expense dialog paths.
- Accepted random, unguessable shared report links as the production sharing model for now; backend password validation is no longer treated as a blocker for this release.

## Tests Added Or Expanded

- `src/api/expense.service.test.ts`
- `src/contexts/AuthContext.test.tsx`
- `src/hooks/useExpenseLineItems.test.ts`
- `src/services/data-reset.service.test.ts`
- `src/services/ReportService.test.ts`
- `src/services/storage.service.test.ts`
- `src/services/dashboard-summary.service.test.ts`
- `src/services/project-detail-data.service.test.ts`
- `src/services/calendar-timeline.service.test.ts`
- `src/services/budget.service.test.ts`
- `src/components/expenses/dashboard/expenseDashboardUtils.test.ts`
- `src/components/expenses/form/expenseFormOptions.test.ts`
- `src/components/expenses/form/expenseFormValidation.test.ts`
- `src/components/expenses/form/expenseLineItems.test.ts`
- `src/components/expenses/list/ExpenseRow.test.tsx`
- `src/components/expenses/list/expenseListUtils.test.ts`
- `src/services/bid/paymentSchedule.test.ts`
- `src/services/devDataStore/storage.test.ts`
- `src/services/project/dates.test.ts`
- `src/services/project/residential.test.ts`
- `src/components/expenses/form/expenseFormSavePayload.test.ts`
- `src/components/expenses/page/ExpenseActionMenu.test.tsx`
- `src/components/expenses/page/ExpenseDashboardPanels.test.tsx`
- `src/components/projects/budget/dashboard/budgetDashboardUtils.test.ts`
- `src/utils/logger.test.ts`
- Expanded:
  - `src/components/expenses/PaymentFormModal.test.tsx`
  - `src/services/expense.service.test.ts`
  - `src/services/payment.service.test.ts`
  - `e2e/builderbrain.smoke.spec.ts`
  - `scripts/firestore-rules-test.js`

## Final Verification

- `npm install`
  - Passed, 0 vulnerabilities.
- `npm run typecheck`
  - Passed.
- `npm run test:coverage -- --coverageReporters=text-summary`
  - Passed: 46 suites, 196 tests.
  - Coverage: statements 15.09%, branches 12.12%, functions 15.41%, lines 15.43%.
- `npm run build`
  - Passed.
  - No Vite chunk-size or ineffective dynamic import warnings remain.
- `npm audit --json`
  - Passed: 0 vulnerabilities.
- `npm run test:e2e -- --project=chromium --workers=1`
  - Passed: 11/11.
  - Expanded coverage now includes project detail navigation, accepted bid payment stages, payments dashboard commitments, documents, budget report, project creation, expense creation, and settings notifications.
  - React Router v7 future-flag notices were addressed by opting into the supported v6 future flags.
- `npm run test:rules`
  - Passed with OpenJDK 21.

## Remaining Risks

- Large module cleanup is improved but not fully complete. `project.ts`, `bid.ts`, `devDataStore.ts`, and `BudgetDashboard.tsx` are now split behind helper modules/components. `Expenses.tsx` and `ExpenseFormModal.tsx` have focused section boundaries but still exceed the target file-size ceiling and should continue shrinking in focused PRs.
- Some direct-Firestore-in-UI cleanup may remain in secondary/admin utility surfaces, but the dashboard, project detail, calendar, timeline, and budget projection paths now have service boundaries.
- Dashboard summaries are currently client-refreshed. That is acceptable for this SPA release; a future Cloud Function should maintain them immediately after writes if contractor accounts grow into very high project counts or multi-user write volume.
- Direct `console.*` calls remain in lower-priority UI surfaces. Core services/hooks/utilities now go through the redacting logger, and the remaining sweep should focus on component-level debug output.
- CI should continue to run on GitHub-hosted runners or self-hosted Actions Runner `v2.327.1+` because the official checkout/setup actions now use Node 24 runtimes.
