# Codebase Hardening Summary

Generated: 2026-05-07

## Phase Status

- Phase 1 complete: `CODEBASE_MAP.md`
- Phase 2 complete:
  - `audit/structure-modularity.md`
  - `audit/security.md`
  - `audit/error-reliability.md`
  - `audit/type-correctness.md`
  - `audit/testing-observability.md`
  - `audit/performance.md`
  - `audit/docs-dx.md`
- Phase 3 complete: this summary ranks findings, dependencies, fix waves, and conflicts.
- Phase 4 partially complete in this branch:
  - Completed: dependency vulnerabilities, auth startup failure handling, payment save reliability, data reset reliability, partial expense update safety, shared report ID entropy, accepted-bid expense idempotency, storage validation, hosting headers/CSP, payments N+1 query, dashboard summary read model, Vite migration, docs/test gates.
  - Not fully closed: large structural refactors and project-detail aggregation require separate reviewable follow-up PRs.

## Ranked Findings

### CRITICAL

1. Dependency audit reports exploitable vulnerabilities.
   - Evidence: `package.json:23`, `package.json:30`, `package.json:31`, `package.json:34`, `package.json:67`
   - Details: `npm audit --json` reported 64 vulnerabilities, including critical `form-data`, high `@remix-run/router`, `firebase-tools`, `undici`, and `react-scripts` transitive issues.
   - Fix: upgrade direct dependencies where possible, isolate unavoidable CRA/react-scripts debt, and plan the Vite migration as the durable fix.

### HIGH

1. Shared report protection is implemented entirely client-side.
   - Evidence: `src/services/ReportService.ts:44`, `src/services/ReportService.ts:151`, `src/services/ReportService.ts:172`, `src/utils/reportPasswords.ts:10`, `src/utils/reportPasswords.ts:36`
   - Risk: anyone with read access to shared-report metadata can validate passwords offline; legacy plaintext passwords are still accepted.
   - Resolution: product decision for this release is random, unguessable share links without treating passwords as a security boundary. Backend password validation remains a future feature if stronger access control is required.

2. Shared report IDs are predictable.
   - Evidence: `src/services/ReportService.ts:100`, `src/components/budget/BudgetReport.tsx:486`
   - Risk: IDs disclose project linkage and use timestamp plus `Math.random`.
   - Fix: generate cryptographically random share IDs.

3. Partial expense updates can corrupt required fields and reset timestamps.
   - Evidence: `src/api/base.service.ts:92`, `src/api/base.service.ts:95`, `src/api/expense.service.ts:17`, `src/api/expense.service.ts:40`, `src/hooks/use-expenses.ts:203`
   - Risk: `Partial<Expense>` updates pass through a full document converter, causing missing fields to become `undefined` and dates to be reset.
   - Fix: support partial update conversion or bypass full-document converters for patch writes.

4. Accepted-bid expense creation is non-atomic.
   - Evidence: `src/components/projects/BidManager.tsx:343`, `src/components/projects/BidManager.tsx:387`, `src/components/projects/BidManager.tsx:394`
   - Risk: a bid can be accepted without a corresponding committed expense, or users can double-click into duplicate expenses.
   - Fix: wrap bid acceptance and expense creation in a transaction or idempotent service operation.

5. Auth startup can continue after profile load/create failures.
   - Evidence: `src/contexts/AuthContext.tsx:66`, `src/contexts/AuthContext.tsx:71`, `src/contexts/AuthContext.tsx:84`, `src/contexts/AuthContext.tsx:214`
   - Risk: the app may show an authenticated user whose Firestore profile is missing or failed to load.
   - Fix: surface a blocking auth/profile error state and avoid marking auth ready with incomplete user state.

6. Payment save callback drops promises and hides async failures.
   - Evidence: `src/components/expenses/PaymentFormModal.tsx:41`, `src/components/expenses/PaymentFormModal.tsx:193`, `src/components/expenses/Expenses.tsx:1423`
   - Risk: modal closes as if saved while persistence fails in the parent.
   - Fix: make `onSave` return a promise and await it before closing.

7. User data reset swallows deletion failures.
   - Evidence: `src/services/data-reset.ts:47`, `src/services/data-reset.ts:73`, `src/services/data-reset.ts:101`
   - Risk: partial deletion can be reported as success.
   - Fix: collect and report per-collection failures; only return success when all deletions complete.

8. Payments dashboard performs N+1 transaction queries.
   - Evidence: `src/components/payments/Payments.tsx:72`, `src/services/payment.ts:99`, `src/services/payment.ts:178`, `src/services/expense-transaction.ts:212`
   - Risk: dashboard load cost grows linearly with expenses.
   - Fix: bulk-load transactions by chunked `in` queries or denormalize payment summaries.

9. Project detail duplicates reads and eagerly loads all subcontractors.
   - Evidence: `src/hooks/useProjectData.ts:32`, `src/hooks/useProject.ts:37`, `src/hooks/useProjectPhases.ts:84`, `src/hooks/useProjectData.ts:51`, `src/services/subcontractor.ts:158`
   - Risk: unnecessary Firestore reads and slow project pages as accounts grow.
   - Fix: consolidate project detail data into a single query boundary and load only needed subcontractor records.

10. Dashboard scans all user projects for client-side aggregation.
    - Evidence: `src/components/dashboard/Dashboard.tsx:367`, `src/services/project.ts:421`, `src/services/project.ts:449`, `src/components/dashboard/Dashboard.tsx:372`
    - Risk: dashboard becomes expensive and slow for real contractor accounts.
    - Fix: added `dashboard_summaries/{userId}` read model with owner-only rules and a project-derived refresh fallback.

11. Coverage is very low and unenforced.
    - Evidence: `coverage/lcov.info`, `package.json:42`, `.github/workflows/ci.yml:29`
    - Risk: critical user flows can regress without blocking CI.
    - Fix: add focused regression tests for critical flows and introduce ratcheting thresholds.

12. Large god modules and page components block safe change.
    - Evidence: `src/services/devDataStore.ts:1`, `src/services/bid.ts:1`, `src/services/project.ts:1`, `src/components/expenses/ExpenseFormModal.tsx:165`, `src/components/expenses/Expenses.tsx:89`, `src/components/budget/BudgetDashboard.tsx:135`
    - Risk: mixed concerns make tests brittle and fixes risky.
    - Fix: split by domain responsibility only after correctness blockers are patched.

13. UI components directly perform Firestore reads and writes.
    - Evidence: `src/components/timeline/Timeline.tsx:35`, `src/components/calendar/Calendar.tsx:28`, `src/components/budget/BudgetDashboard.tsx:68`, `src/components/budget/BudgetAllocationTracker.tsx:74`
    - Risk: no consistent authorization, error handling, caching, or test seams.
    - Fix: move persistence into services/hooks and test those boundaries.

## Dependency Graph

1. Dependency updates come before security status can be considered acceptable.
2. Shared report passwords are not a release blocker because random share links are the accepted production model for this release.
3. Data-access boundary consolidation should follow immediate corruption fixes; do not wait to patch active data-loss paths.
4. Runtime Firestore decoders and partial update semantics should precede broad service refactors.
5. Payment async handling should be fixed before adding payment workflow e2e tests.
6. Accepted-bid expense creation must be made idempotent or transactional before optimizing bid/payment reads.
7. Storage validation must be added before documenting upload guarantees or expanding storage tests.
8. Logging cleanup should align security and observability: redacted telemetry, not production console dumping.

## Fix Sequence

### Wave 1: Security and Correctness Blockers

- Patch dependency vulnerabilities that can be fixed without changing app behavior.
- Fix payment modal promise handling and add regression coverage.
- Fix partial expense update conversion and add regression coverage.
- Fix user data reset failure reporting.
- Make accepted-bid expense creation idempotent/transactional.
- Replace predictable shared report IDs with cryptographic random IDs.
- Add storage upload validation for file type and size.
- Add missing Firestore indexes for known query shapes.

### Wave 2: Structural Refactors

- Consolidate overlapping `src/api` and `src/services` responsibilities.
- Move direct Firestore access out of page components into hooks/services.
- Split `bid.ts`, `project.ts`, `devDataStore.ts`, `Expenses.tsx`, `ExpenseFormModal.tsx`, and budget dashboards along cohesive boundaries.
- Create a shared event feed/query service for calendar and timeline.
- Rework project detail data loading to avoid duplicate and unbounded reads.

### Wave 3: Polish and Gates

- Add coverage thresholds and ratchet them upward.
- Expand e2e tests from navigation smoke to project, bid, expense, payment, document, report, and settings mutation flows.
- Update README, env docs, deploy docs, and runtime prerequisites.
- Standardize redacted logging and add client-side web vitals reporting.
- Lazy-load PDF export libraries and other heavy optional flows.

## Conflicts and Coordination Notes

- Shared report protection cannot be fully solved with a stronger client hash. The real fix needs server-side validation; a cryptographic share ID is only a partial mitigation.
- `react-scripts` audit fixes overlap with the CRA-to-Vite migration. Short-term package updates may leave transitive vulnerabilities that only the migration removes.
- Fixing `src/api/base.service.ts` may touch a layer that later gets consolidated, but the active partial-update corruption path should be patched first.
- Logging has competing goals: security wants less sensitive console output, while observability needs production signals. The compatible fix is redacted structured telemetry.
- Storage reliability and performance findings should be fixed together: distinguish permission/error states while replacing unbounded `listAll` paths.
- Accepted-bid fixes overlap old bid UI, bid utility functions, and payment schedule code. Serialize that workflow instead of letting multiple agents edit it concurrently.
