# Type Safety & Correctness Audit

Agent D reviewed `CODEBASE_MAP.md` first, then inspected the React/Firebase TypeScript code under `src/` with focus on unsafe casts, Firestore conversion boundaries, null/date handling, mutation/race risks, and magic limits. No code fixes were implemented.

## Findings

### HIGH: Partial expense updates can null out required fields and reset dates

- Evidence: `src/api/base.service.ts:92` accepts `Partial<T>`, but `src/api/base.service.ts:95` casts it to full `T` before passing it through the converter. `src/api/expense.service.ts:17` then builds a full Firestore document from the partial, including required fields like `userId`, `projectId`, `category`, and `amount`; missing date fields fall back to `Timestamp.now()` at `src/api/expense.service.ts:40` and `src/api/expense.service.ts:45`. `src/hooks/use-expenses.ts:203` calls this path with `Partial<Expense>`.
- Impact: Updating one field, such as `{ status: 'approved' }`, can write null/missing values for unrelated fields and can reset `date`/`createdAt` to now. This is a data corruption risk hidden by the generic `data as T` cast.
- Proposed fix: Split converters into `toCreateFirestore` and `toUpdateFirestore` or make `BaseService.update` use a partial-aware converter that only serializes provided keys. Do not synthesize defaults for missing fields during updates; only set `updatedAt`.

### HIGH: Accepted bid expense creation is non-atomic and can duplicate expenses

- Evidence: `src/components/projects/BidManager.tsx:343` updates bid payment progress, `src/components/projects/BidManager.tsx:387` creates an expense, and `src/components/projects/BidManager.tsx:394` updates the payment schedule with the expense ID as three separate awaits. There is no transaction or idempotency check around the accepted bid/payment stage.
- Impact: Two clients accepting or resubmitting the same bid concurrently can both observe a stage without `expenseId`, create duplicate expenses, and race on the final schedule update.
- Proposed fix: Move accepted-bid expense creation into a service-level Firestore transaction. Re-read the bid inside the transaction, check whether the target stage already has `expenseId`, create or reference an expense with a deterministic key such as `${bidId}_${paymentStageId}`, then update `paymentProgress` and `paymentSchedule` atomically.

### MEDIUM: Invalid Date values still reach `Timestamp.fromDate`

- Evidence: `src/utils/firestoreConverter.ts:17` detects valid `Date` instances, but invalid dates fall through to `Timestamp.fromDate(date)` at `src/utils/firestoreConverter.ts:25`. `src/services/expense.ts:146` creates dates from strings with `new Date(value)` and passes them to `toTimestamp` at `src/services/expense.ts:147`.
- Impact: Invalid user-entered or imported date strings can throw at write time despite the converter comment claiming graceful handling. The failure path is late and inconsistent across services.
- Proposed fix: Make `toTimestamp` return `undefined` or throw a typed validation error when `Number.isNaN(date.getTime())`. Validate parsed date strings before calling `toTimestamp`, and surface a field-level error to callers instead of letting Firebase throw.

### MEDIUM: Firestore document reads are asserted into domain types without runtime validation

- Evidence: `src/services/expense.ts:588` reads `doc.data()` as `any`, then returns `as unknown as Expense` at `src/services/expense.ts:619`; dates from unexpected shapes become `undefined` at `src/services/expense.ts:591` to `src/services/expense.ts:593`. `src/services/task.ts:153` casts every document to `FirestoreTask`, and `src/services/task.ts:47` calls `docData.createdAt.toDate()` without guarding for missing or non-Timestamp values.
- Impact: A malformed, legacy, migrated, or manually edited Firestore document can become an `Expense` with `date`/`createdAt` undefined or crash task list rendering entirely. TypeScript cannot protect these boundaries because the data is untrusted.
- Proposed fix: Add runtime decoders for Firestore entities. Validate required fields and timestamp-like objects, supply explicit safe defaults only where the domain allows them, and skip/quarantine invalid documents with structured logging instead of asserting them into domain types.

### MEDIUM: Bid numeric coercion can persist `NaN`

- Evidence: `src/services/bid.ts:400` and `src/services/bid.ts:401` convert string `amount` and `percentage` with `parseFloat` and then write the result through `updateDoc` at `src/services/bid.ts:478`. No `Number.isFinite` check follows the coercion.
- Impact: Empty strings or formatted currency strings can become `NaN`, breaking payment schedule totals and potentially causing Firestore write failures or inconsistent UI calculations.
- Proposed fix: Centralize numeric parsing for bid/payment fields. Reject non-finite values before persistence, return a validation error, and keep the Firestore payload typed as `number` only after validation.

### MEDIUM: Bid status array filter misses Firestore's `in` limit

- Evidence: `src/services/bid.ts:713` checks only that a status array is non-empty, then passes it to `where('status', 'in', filters.status)` at `src/services/bid.ts:716`. Firestore `in` filters are capped at 10 values; the expense service handles this limit separately, but bid service does not.
- Impact: A caller that passes more than 10 statuses will fail the whole bid query at runtime. This is currently masked because the status union is small, but the type is `string | string[]`, so invalid or expanded status arrays are accepted.
- Proposed fix: Narrow `BidFilter.status` to `Bid['status'] | Bid['status'][]`, validate allowed status values, and reject or chunk arrays longer than Firestore's limit before building query constraints.

### LOW: Bid conversion drops date strings and silently rewrites timestamps

- Evidence: `src/services/bid.ts:946` to `src/services/bid.ts:948` store `submissionDeadline`, `startDate`, and `completionDate` as `null` unless they are `Date` instances. Payment stage dates fall back to `Timestamp.now()` at `src/services/bid.ts:886` and `src/services/bid.ts:887` when not `Date` instances.
- Impact: Forms or imports that supply ISO date strings lose dates or get current timestamps instead of the intended values. This creates hard-to-diagnose schedule drift.
- Proposed fix: Accept a single explicit date input type at service boundaries, or normalize `Date | string | Timestamp` with validation before building Firestore payloads. Never use `Timestamp.now()` as a fallback for a supplied-but-unparseable field.

### LOW: Dev data objects are returned by reference

- Evidence: `src/services/devDataStore.ts:1880` returns the project object found in hydrated state, `src/services/devDataStore.ts:2029` returns a task object by reference, `src/services/devDataStore.ts:2117` returns an expense by reference, and `src/services/devDataStore.ts:2329` returns a bid by reference.
- Impact: Callers can mutate returned objects without going through `updateDev*`, which can create state mismatches between in-memory objects and `localStorage` serialization. This only affects dev bypass mode, but it can hide production-only immutability issues.
- Proposed fix: Return deep-cloned or frozen domain objects from dev read/list functions, and require all mutations to go through the update helpers.
