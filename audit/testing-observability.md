# Testing & Observability Audit

Agent E scope: test coverage gaps, untested critical paths, logging strategy and levels, health checks, metrics/traces, and the minimum suite needed to ship safely.

## Findings

### HIGH - Coverage is generated but not enforced in CI

Evidence: `coverage/lcov-report/index.html:26` reports 2.77% statement coverage, `coverage/lcov-report/index.html:33` reports 2.41% branch coverage, `coverage/lcov-report/index.html:40` reports 1.51% function coverage, and `coverage/lcov-report/index.html:47` reports 2.9% line coverage. `package.json:41` runs Jest in CI without coverage, while `package.json:42` defines a coverage script that is not used by `.github/workflows/ci.yml:29`.

Impact: A PR can pass while removing coverage from critical flows or leaving new production paths entirely untested.

Proposed fix: Add `coverageThreshold` to Jest configuration and run `npm run test:coverage` in CI. Start with realistic ratcheting thresholds for the whole repo, then add higher per-file thresholds for `src/contexts/AuthContext.tsx`, `src/hooks/useExpensePayment.ts`, `src/services/expense-transaction.ts`, `src/services/ReportService.ts`, `src/services/storage.ts`, and the Firebase-facing project/bid/expense/payment services.

### HIGH - Payment persistence and bid-adjustment flow is not covered end to end

Evidence: `src/hooks/useExpensePayment.ts:112` creates a separate payment expense record, `src/hooks/useExpensePayment.ts:139` updates the original expense totals/status, and `src/hooks/useExpensePayment.ts:157` adjusts linked bid payment stages. Existing tests cover the dashboard aggregation path through mocked transactions in `src/services/payment.service.test.ts:1`, but `rg` only finds `useExpensePayment` in its implementation and no test file. The UI submits the payment modal through `src/components/expenses/PaymentFormModal.tsx:193` to `src/components/expenses/PaymentFormModal.tsx:200`, but existing e2e only asserts that the expense tab and Add Expense button render at `e2e/builderbrain.smoke.spec.ts:63`.

Impact: Duplicate payments, partial-payment status regressions, and bid schedule drift can ship while the smoke suite still passes.

Proposed fix: Add focused tests for `useExpensePayment`: happy path creates a payment record, updates the original expense, and updates bid progress; failure mode 1 verifies `ExpenseService.createExpense` failure leaves no original-expense or bid update; failure mode 2 verifies `BidService.updateBid` failure returns a visible failure and does not report success. Add one Playwright flow that marks a seeded expense as paid and verifies the payments page and bid stage reflect the result.

### HIGH - Auth and Firebase initialization have no direct tests or startup health signal

Evidence: Firebase is initialized directly from env variables in `src/config/firebase.ts:7` to `src/config/firebase.ts:17` with no validation or observable readiness state. Auth state creates or loads the Firestore user profile at `src/contexts/AuthContext.tsx:66` to `src/contexts/AuthContext.tsx:83`, and catches profile-load failures while continuing with only Firebase Auth data at `src/contexts/AuthContext.tsx:84` to `src/contexts/AuthContext.tsx:87`. Existing tests mock auth consumers, but `rg` finds no test for `AuthContext` itself.

Impact: Missing Firebase env, auth listener failures, or Firestore profile bootstrap failures may appear as blank app startup or partial sessions without a clear test failure or operational signal.

Proposed fix: Add AuthProvider tests for dev bypass, authenticated user with existing profile, authenticated user that requires profile creation, profile-load failure, and signed-out redirect. Add a small startup readiness check that validates required Firebase config before `initializeApp`, reports a structured startup error, and renders a user-facing failure state instead of silently continuing.

### HIGH - Shared report generation and password access are critical but untested

Evidence: Shared reports are part of the product surface in `README.md:15` and route map in `README.md:153`. `src/services/ReportService.ts:91` to `src/services/ReportService.ts:138` generates share IDs and stores report snapshots; `src/services/ReportService.ts:172` to `src/services/ReportService.ts:217` enforces expiration, password checks, legacy password migration, access count, and sanitization. There is no `ReportService` test; `rg` finds only password utility tests, not service tests.

Impact: Password-protected links, expired reports, or legacy password migration can regress without detection, exposing reports or blocking legitimate clients.

Proposed fix: Add `ReportService` tests with Firestore mocks for: happy path generate/get with hashed password and sanitized response; failure mode 1 wrong/missing password returns null and does not increment access count; failure mode 2 expired report returns null. Include a legacy password migration test and a Firestore update failure test that still returns the sanitized report while warning.

### MEDIUM - Storage workflows and document upload/list/delete behavior are mostly untested

Evidence: `src/services/storage.ts:19` to `src/services/storage.ts:25` uploads project documents, `src/services/storage.ts:48` to `src/services/storage.ts:52` deletes project document/photo folders, and `src/services/storage.ts:120` to `src/services/storage.ts:129` catches list failures and returns an empty array. Existing project deletion tests mock only that `StorageService.deleteProjectFiles` is called at `src/services/project.service.test.ts:138`; the storage service itself has no test.

Impact: File upload progress, download URL mapping, recursive deletion, and masked listing failures can break documents/bid attachments while unit and e2e suites still pass.

Proposed fix: Add `StorageService` tests for upload success progress and returned URL; upload failure progress and thrown error; list success returning URLs; list failure producing a warning/error and an explicit failure mode decision. Add one e2e document upload/list/delete scenario if Firebase Storage emulator support is available in the browser test environment.

### MEDIUM - Browser smoke tests exercise navigation, not data mutation failure modes

Evidence: Playwright runs only Chromium in `playwright.config.ts:23` to `playwright.config.ts:28`. The current smoke suite asserts loaded projects, project detail overview, wizard reaches review, and expense tab basics at `e2e/builderbrain.smoke.spec.ts:13`, `e2e/builderbrain.smoke.spec.ts:21`, `e2e/builderbrain.smoke.spec.ts:29`, and `e2e/builderbrain.smoke.spec.ts:63`. The wizard test stops before pressing Submit at `e2e/builderbrain.smoke.spec.ts:59` to `e2e/builderbrain.smoke.spec.ts:60`.

Impact: The app can pass e2e while project creation, bid acceptance, payment recording, storage upload, and shared report creation are broken.

Proposed fix: Keep the fast smoke suite, but add a small critical-flow Playwright project with seeded local data and mutations: create project submit and verify detail page; add/accept bid and create payment-stage expense; record payment and verify payments dashboard; generate shared report and access it; upload/delete a document. For each flow, add two browser-level failure tests by mocking Firebase/service failures where practical.

### MEDIUM - Logging is inconsistent and too noisy in development while absent in production by default

Evidence: The logger wrapper disables output in production unless `REACT_APP_ENABLE_CLIENT_LOGS` or `builderbrain:debugLogs` is enabled at `src/utils/logger.ts:5` to `src/utils/logger.ts:18`. However, direct `console.*` calls still exist across `src`; `rg "console\\." src | wc -l` reports 377 direct calls, with examples in auth at `src/contexts/AuthContext.tsx:67`, payment UI at `src/components/expenses/PaymentFormModal.tsx:170`, and storage at `src/services/storage.ts:128`. Logger usage is concentrated in a few files rather than standardized.

Impact: Production incidents have little structured signal by default, while development and enabled debug logs may expose user IDs, project data, payment amounts, and report errors without levels, redaction, or correlation.

Proposed fix: Standardize on `src/utils/logger.ts`, add levels and structured fields, and ban direct `console.*` in `src` through ESLint except tests/dev scripts. Redact user IDs, emails, file paths, payment details, and report share IDs. Add tests for production logging disabled, debug override enabled, and error logging preserving a safe error code/message.

### MEDIUM - Web vitals, metrics, traces, and error reporting are effectively disabled

Evidence: `src/reportWebVitals.ts:3` to `src/reportWebVitals.ts:11` only records metrics if a handler is supplied, but `src/index.tsx:20` calls `reportWebVitals()` with no handler. Repository-wide search only finds comments for analytics/metrics in `src/index.tsx:18`, `src/index.tsx:19`, and `public/index.html:36`; no Sentry, analytics, tracing, or custom metrics sink is configured.

Impact: Regressions in startup, route performance, Firebase latency, and client crashes will be invisible outside user reports.

Proposed fix: Add a lightweight observability adapter that sends web vitals, route changes, uncaught errors, unhandled rejections, and critical service-operation timings to the chosen backend. At minimum, log structured events for auth startup, Firestore read/write failures, storage failures, payment processing failures, report access failures, and build version.

### LOW - No explicit health/readiness endpoint or synthetic check

Evidence: Firebase Hosting serves the built SPA with a catch-all rewrite to `/index.html` in `firebase.json:9` to `firebase.json:21`. `public/index.html:30` to `public/index.html:31` only provides the JS root; there is no static `/healthz`, build metadata file, or runtime readiness check in the hosting config.

Impact: Monitoring can tell only whether Hosting returns the shell, not whether the deployed build, Firebase config, Auth, Firestore, and Storage are usable.

Proposed fix: Add a static `healthz.json` generated at build time with version/commit/build timestamp and configure uptime checks against it. Add an authenticated synthetic browser check for login/dev-safe auth, projects read, Firestore write/delete in a test collection, and Storage upload/delete in a test prefix.

## Minimum Suite To Ship Safely

Critical flow 1: Auth/session bootstrap

- Happy path: AuthProvider receives a Firebase user, loads existing profile, renders protected routes.
- Failure mode: Firestore profile read fails; app renders an actionable degraded/auth error and logs a structured auth bootstrap error.
- Failure mode: required Firebase env is missing; startup fails before `initializeApp` with a clear configuration error.

Critical flow 2: Project lifecycle

- Happy path: create project through service and Playwright wizard submit, then verify project detail route.
- Failure mode: Firestore create succeeds but follow-up `getProjectById` fails; user sees failure and no false success.
- Failure mode: delete project related-doc cleanup/storage deletion fails; operation reports failure and does not silently leave orphaned records.

Critical flow 3: Bid acceptance/payment-stage expense

- Happy path: create/accept bid with payment schedule, create expense from payment stage, verify expense ID is linked back to the stage.
- Failure mode: bid missing or stage missing returns a controlled error/null and logs a safe structured warning.
- Failure mode: expense create succeeds but bid stage update fails; test documents compensating behavior or blocks success until consistent.

Critical flow 4: Expense payment processing

- Happy path: partial and full payments create payment records, update original expense totals/status, update bid payment progress, and render in Payments.
- Failure mode: payment record creation fails; original expense and bid are not updated.
- Failure mode: bid update fails after expense update; user sees a partial-failure state and a recoverable retry path.

Critical flow 5: Shared reports

- Happy path: generate password-protected report, fetch metadata, fetch report with correct password, verify sanitized payload and access count update.
- Failure mode: wrong password returns null and does not increment access count.
- Failure mode: expired report returns null.

Critical flow 6: Storage-backed documents

- Happy path: upload project document, receive URL, list document URL, delete file/folder.
- Failure mode: upload fails and progress emits `error`.
- Failure mode: list/delete fails and caller receives an explicit failure path rather than silently treating missing files as empty success.

Critical flow 7: Observability hooks

- Happy path: web vitals handler emits CLS/FCP/LCP/TTFB and critical service timing events with safe fields.
- Failure mode: observability sink fails; app operation still succeeds and logger records a bounded warning.
- Failure mode: production logging disabled by default; debug override enables logs without leaking sensitive fields.

## CI Recommendation

Keep current CI order, but replace `.github/workflows/ci.yml:29` with coverage-enabled Jest and upload coverage artifacts. Keep `npm run test:rules`, `npm run build`, and `npm run test:e2e`; add a second Playwright job for mutation-critical flows once it is stable. Publish Playwright traces and Firebase emulator logs on failure.
