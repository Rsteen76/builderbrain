# Builderbrain Error Handling & Reliability Audit

Scope: reviewed `CODEBASE_MAP.md`, then inspected actual React, hook, service, Firebase, and utility code for swallowed errors, missing async/network/file/Firestore handling, timeout/retry gaps, unhandled promises, resource leaks, and production logging. No code fixes were implemented.

## Findings

### HIGH - Auth can continue with incomplete Firestore user state after profile load/create failure

Evidence:
- `src/contexts/AuthContext.tsx:66` registers `onAuthStateChanged` with an async callback.
- `src/contexts/AuthContext.tsx:71-83` fetches or creates the Firestore user document.
- `src/contexts/AuthContext.tsx:84-87` catches failures, logs them, and explicitly continues without Firestore data.
- `src/contexts/AuthContext.tsx:214-226` treats `!!user` as authenticated and renders children, while `role` falls back to `'team_member'`.

Impact: if Firestore is unavailable, rules reject the read, or user document creation fails, the app can render as authenticated with `userData === null` and a default role. This hides the reliability failure from the user and can route downstream code through partially initialized account state.

Proposed fix: make the auth bootstrap state explicit. On Firestore user load/create failure, set a blocking auth/profile error state and do not render authenticated app routes until the profile is available, or sign the user out. Add retry/backoff for transient Firestore failures and surface a recoverable "retry profile load" path. Avoid defaulting authorization-related role state when profile fetch failed.

### HIGH - Payment save callback drops returned promises, so async failures are unhandled and the modal closes as if work completed

Evidence:
- `src/components/expenses/PaymentFormModal.tsx:41-46` types `onSave` as returning `void`.
- `src/components/expenses/PaymentFormModal.tsx:193-201` calls `onSave(finalAmount, paymentDetailsObj)` inside `setTimeout`, catches only synchronous exceptions, then clears loading and closes the modal.
- `src/components/expenses/Expenses.tsx:1423-1431` passes an `async` `onSave` that awaits `processExpensePayment(...)`.

Impact: rejected promises from payment processing are not caught by `PaymentFormModal`; the modal closes and loading stops before persistence completes. A failed payment update can become an unhandled rejection or be reported only indirectly, while the user sees a completed flow.

Proposed fix: change the prop to `onSave: (...) => Promise<void> | void`, make the submit path async, remove the artificial `setTimeout`, and `await Promise.resolve(onSave(...))` in a `try/catch/finally`. Only close the modal after success, or leave it open with an error state on failure.

### HIGH - User data reset swallows per-collection deletion failures and can report success after partial deletion

Evidence:
- `src/services/data-reset.ts:47-52` deletes many collections via `Promise.all`.
- `src/services/data-reset.ts:73-104` wraps each collection deletion in `try/catch`.
- `src/services/data-reset.ts:101-104` logs collection errors and does not rethrow.
- `src/services/data-reset.ts:51-60` logs "All user data has been reset", clears local storage, and redirects after `Promise.all` resolves.

Impact: a permission error, missing index, network failure, or failed batch commit for one collection is swallowed by `deleteUserDocumentsInCollection`, causing `resetAllUserData` to complete as if all data was deleted. This is especially risky because the operation is destructive and the UI can redirect before the user knows which data remains.

Proposed fix: return structured per-collection results or rethrow deletion failures. Use `Promise.allSettled`, aggregate failures, and show a partial-failure report. Only clear local storage and redirect when all required remote deletions succeed, or make the partial state explicit and retryable.

### MEDIUM - Firebase Storage listing masks errors as empty folders

Evidence:
- `src/services/storage.ts:120-126` lists Firebase Storage items and resolves download URLs.
- `src/services/storage.ts:127-130` catches any error, logs it, and returns `[]`.

Impact: permission denials, expired auth, network failures, or malformed storage paths are indistinguishable from a truly empty folder. UI and callers can silently hide documents/photos instead of showing a recoverable error, which can lead users to believe files are missing.

Proposed fix: return a typed result that distinguishes empty success from failure, or rethrow and let callers show an error state. If some item URL lookups can fail independently, use `Promise.allSettled` and report partial failures while still returning successful URLs.

### MEDIUM - Async data-loading effects update state after unmount or stale requests

Evidence:
- `src/components/calendar/Calendar.tsx:149-383` starts `fetchEvents()` inside `useEffect` and performs multiple awaited Firestore reads before calling `setEvents` and `setLoading`.
- `src/components/timeline/Timeline.tsx:342-590` starts `fetchTimelineData()` inside `useEffect` and performs multiple awaited Firestore reads before calling `setProjects`, `setEvents`, `setFilteredEvents`, and `setLoading`.
- `src/components/common/VendorSelector.tsx:48-115` starts `fetchVendorsFromExpenses()` and calls `setVendors`/`setIsLoading` after awaited expense and local storage work.

Impact: if the component unmounts or dependencies change while these reads are in flight, stale requests can still write state. This can produce React warnings, stale calendar/timeline/vendor data, and inconsistent loading flags under slow Firestore responses or fast route changes.

Proposed fix: add a cancellation guard per effect, such as `let cancelled = false`, check it before every state update, and set it in the cleanup. For request races, track a request id or use React Query for these reads so stale responses are ignored. Prefer `finally` guarded by the cancellation flag for loading state.

### MEDIUM - Firestore calls lack a consistent timeout/retry/error policy outside React Query

Evidence:
- `src/contexts/QueryContext.tsx:6-12` configures React Query retries only for queries that use React Query.
- Many production paths call Firestore directly without this policy, including `src/components/calendar/Calendar.tsx:174-176`, `src/components/calendar/Calendar.tsx:215-217`, `src/components/timeline/Timeline.tsx:356-373`, and service methods like `src/services/task.ts:78`, `src/services/task.ts:99`, `src/services/task.ts:152`, `src/services/task.ts:181`, and `src/services/task.ts:193`.
- `src/api/base.service.ts:58-64` normalizes errors but does not classify retryable failures, add backoff, or expose timeout/abort semantics.

Impact: transient Firestore/network stalls and retryable errors are handled inconsistently across the app. Some paths fail immediately, some log and continue with partial data, and direct calls have no user-visible retry model. Firestore web SDK calls are not abortable in the same way as `fetch`, so callers need an app-level policy for timeout UX and stale-request handling.

Proposed fix: centralize Firestore operations behind a small reliability wrapper or migrate direct reads into React Query hooks. Classify Firebase error codes, retry only safe idempotent reads with bounded exponential backoff, expose consistent loading/error/retry UI, and add stale-request cancellation guards at component boundaries.

### LOW - Production paths use raw console logging instead of the gated logger

Evidence:
- `src/utils/logger.ts:5-18` provides a production-gated logger.
- Direct console calls remain widespread: `rg` found 372 `console.*` calls under `src` excluding tests.
- Examples include auth/user identifiers in `src/contexts/AuthContext.tsx:67`, full user documents in `src/contexts/AuthContext.tsx:80`, vendor data in `src/components/common/VendorSelector.tsx:49-74`, and payment/status debug messages in `src/components/expenses/PaymentFormModal.tsx:158-170`.

Impact: production bundles can emit user identifiers, business data, and noisy debug traces to browser consoles. This weakens observability hygiene and can expose sensitive operational data on shared machines or during support sessions.

Proposed fix: replace direct console calls in app code with `logger`, remove debug-only logs, and add an ESLint rule such as `no-console` with narrow exceptions for scripts/tests. Ensure logged payloads avoid raw user, payment, vendor, and document objects.

## Notes

- I did not find literal empty `catch {}` blocks in production `src` code.
- Several service methods intentionally rethrow after logging; I did not count those as swallowed errors unless the caller-facing behavior masked failure or continued as success.
