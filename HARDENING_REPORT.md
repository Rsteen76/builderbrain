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
  - Passed: 29 suites, 132 tests.
  - Coverage: statements 11.11%, branches 8.58%, functions 10.72%, lines 11.48%.
- `npm run build`
  - Passed.
  - Remaining build warning: large Vite chunks, especially the main app chunk and dev demo data.
- `npm audit --json`
  - Passed: 0 vulnerabilities.
- `npm run test:e2e -- --project=chromium --workers=1`
  - Passed: 5/5.
  - Remaining browser warnings: React Router v7 future-flag notices only.
- `npm run test:rules`
  - Passed with OpenJDK 21.

## Remaining Risks

- Large module cleanup is not fully complete. The audit identifies `devDataStore.ts`, `bid.ts`, `project.ts`, `Expenses.tsx`, and `ExpenseFormModal.tsx` as structural refactor targets. Splitting them safely requires reviewable feature-by-feature PRs.
- Some direct-Firestore-in-UI cleanup may remain in secondary/admin utility surfaces, but the dashboard, project detail, calendar, timeline, and budget projection paths now have service boundaries.
- Dashboard summaries are currently client-refreshed. That is acceptable for this SPA release; a future Cloud Function should maintain them immediately after writes if contractor accounts grow into very high project counts or multi-user write volume.
- Vite build still reports large chunks. The next performance pass should split dev demo data, PDF/reporting libraries, and project/expense surfaces more aggressively.
- React Router v7 future flags remain as warnings. They are not runtime failures, but should be addressed before a router major upgrade.
