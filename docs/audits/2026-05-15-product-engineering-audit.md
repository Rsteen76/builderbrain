# Builderbrain — Product Engineering Audit
**Date:** 2026-05-15  
**Scope:** Read-only audit — no code changes  
**Auditor:** Second-opinion review against live codebase  
**Stack:** React / TypeScript / Vite / Firebase (Firestore + Auth)

---

## Direct Answer

**Partially.** The app has real Firestore data, solid auth scoping, a working project wizard with a genuine cost model, and good bid/payment structure. But it is not using as much useful intelligence as it could — all "intelligence" is static keyword matching and deterministic rules with no ML, no LLM, and no predictive logic. More importantly, the app is riddled with dead navigation: dashboard insight cards, the entire timeline's click handlers, multiple quick-action buttons, and priority item drilldowns all link to routes that do not exist. A user clicking around the dashboard is hitting dead ends constantly. The shared-report sharing feature is architecturally broken at two layers. Fixing navigation alone would make the product feel dramatically more functional without a single new feature.

---

## Findings — Ordered by Severity

---

### CRITICAL

---

#### C-1 — Shared Report Route Is Behind ProtectedRoute
**File:** `src/App.tsx:194`  
**Impact:** The entire public sharing feature is broken. A client who receives a share link is redirected to `/login`. There is no way for an unauthenticated user to view a shared budget report despite the UI offering to generate and email share links.

**Evidence:**
```tsx
// App.tsx:194
<Route path="shared-reports/:shareId" element={
  <ProtectedRoute><SharedReportView /></ProtectedRoute>
} />
```
`SharedReportView` implements its own password logic (`src/pages/SharedReportView.tsx:53–101`). The `ProtectedRoute` never lets it render.

**Fix:** Remove the `<ProtectedRoute>` wrapper. The component handles access control internally.

---

#### C-2 — `shared_reports` Collection Missing from Firestore Rules
**File:** `firestore.rules` (collection absent throughout)  
**Impact:** Even if C-1 is fixed, any Firestore read of the `shared_reports` collection hits the default deny rule (`firestore.rules:165–167`). Both authenticated and unauthenticated users get a permission-denied error. The feature cannot function end-to-end.

**Evidence:** `firestore.rules` defines rules for 13 collections. `shared_reports` is used by `ReportService` (`src/services/ReportService.ts`) and `SharedReportView` but has zero rules.

**Fix:** Add a rule allowing public read by `shareId`, owner write:
```firestore
match /shared_reports/{reportId} {
  allow read: if true;  // bearer-token model; shareId is the secret
  allow create, update: if isOwner(resource.data.userId) || isOwner(request.resource.data.userId);
  allow delete: if isOwner(resource.data.userId);
}
```

---

### HIGH

---

#### H-1 — Massive Dead-Navigation Surface Across Dashboard, Timeline, and Calendar
**Impact:** Every clickable insight card, every timeline event, and multiple quick-action buttons either navigate to a 404 or silently fall back to a root route. Users experience broken product without any error message.

**Dead routes confirmed** (verified against `App.tsx:166–195`):

| Component | Line | Route | Status |
|---|---|---|---|
| `Timeline.tsx` | 118 | `/projects/:id/milestones` | ❌ No route |
| `Timeline.tsx` | 121 | `/tasks/:id` | ❌ No route |
| `Timeline.tsx` | 124 | `/finance/payments/:id` | ❌ No `/finance` prefix |
| `Timeline.tsx` | 127 | `/materials/deliveries/:id` | ❌ No `/materials` prefix |
| `PriorityItems.tsx` | 134 | `/tasks/:id` | ❌ No route |
| `PriorityItems.tsx` | 233 | `/finance/payments/:id` | ❌ No route |
| `PriorityItems.tsx` | 425 | `/finance/payments` | ❌ No route |
| `PriorityItems.tsx` | 533 | `/tasks/new` | ❌ No route |
| `QuickActions.tsx` | 277 | `/tasks/new` | ❌ No route |
| `QuickActions.tsx` | 297 | `/team` | ❌ No route |
| `QuickActions.tsx` | 358 | `/actions` | ❌ No route ("View All") |
| `ProjectInsights.tsx` | 262 | `/finance` | ❌ No route |
| `ProjectInsights.tsx` | 284 | `/projects/:id/milestones` | ❌ No route |
| `ProjectInsights.tsx` | 292 | `/finance/budget-analysis` | ❌ No route |
| `ProjectInsights.tsx` | 302 | `/materials?status=to-order` | ❌ No route |
| `UpcomingDeadlines.tsx` | 375 | `/projects/:id/milestones` | ❌ No route |
| `Calendar.tsx` | 229 | `/projects/:id/milestones` | ❌ No route |
| `Navbar.tsx` | 85 | `/profile` | ❌ No route |

**Fix options (choose one per route):** Add stub route → existing page, or remove the `onClick` handler. Priority redirects:
- Milestone clicks → `/projects/:id`
- `/tasks/new`, `/tasks/:id` → `/tasks`
- `/finance/*` → `/payments`
- `/team` → `/subcontractors`
- `/profile` → `/settings`
- `/actions`, `/materials` → remove handler

---

#### H-2 — Dashboard Insight Cards Display Hardcoded Fake Trend Percentages
**File:** `src/components/dashboard/ProjectInsights.tsx:254, 263, 273`  
**Impact:** Users see change chips (+8%, +12%, +15%/-5%) that are static hardcoded numbers, not computed from any historical data. The comments are explicit: `// Example data - in real app get from API`. This is shipped to production.

**Evidence:**
```tsx
change: 8,  // Example data - in real app get from API   (line 254)
change: 12, // Example data - in real app get from API   (line 263)
change: stats.tasksDue > 10 ? 15 : -5, // Example data  (line 273)
```

**Fix:** Remove the `change` prop from those three cards until real historical snapshots are stored (e.g., snapshot a previous period in `dashboard_summaries`).

---

#### H-3 — Dashboard `overduePayments` and `recentActivity` Are Permanently Empty Arrays
**File:** `src/services/dashboard-summary.ts:247–248`  
**Impact:** The "Priority Items" panel shows an "Overdue Payments" tab that always has zero items. The "Recent Activity" section always shows nothing. These are prominent UI surfaces promising live data that never materializes. `materialsToOrder` is also hardcoded to `0` (line 261).

**Evidence:**
```ts
overduePayments: [],  // dashboard-summary.ts:247
recentActivity: [],   // dashboard-summary.ts:248
materialsToOrder: 0,  // dashboard-summary.ts:261
```
`deriveDashboardSummary()` computes tasks and milestones but never queries payments or activity collections.

**Fix:** Query `expense_transactions` or `bids` with `status = overdue` and a past due date to populate `overduePayments`. Build `recentActivity` from the most recent writes across expenses, tasks, and bids.

---

#### H-4 — Payment Template Logic Duplicated Between Two Files
**Files:** `src/hooks/usePaymentTerms.ts:186–240` and `src/components/bids/form/paymentTermsHelpers.ts:18–100`  
**Impact:** Both files implement `one-time`, `standard`, and `trades` template percentages independently. The `standard` template uses 50/50 in `paymentTermsHelpers` but `usePaymentTerms` uses 20/80 as its default baseline. Any future change to template splits must be made in two places. The files are already diverging.

**Fix:** `usePaymentTerms.ts:applyPaymentTemplate` should delegate to `buildPaymentTemplateTerms` from `paymentTermsHelpers.ts` and adapt its output to the hook's state shape. Delete the duplicate switch block.

---

#### H-5 — `documents` Route Silently Redirects to Projects — No Document Management UI
**File:** `src/App.tsx:182`  
**Impact:** If any sidebar or deep link targets `/documents`, users land on the Projects list with no explanation. The `documents` Firestore collection exists with security rules but has no corresponding UI.

**Evidence:**
```tsx
// App.tsx:182
<Route path="documents" element={<ProtectedRoute><Navigate to="/projects" replace /></ProtectedRoute>} />
```

**Fix:** Build a minimal document list scoped to project detail (where documents belong), or remove the `/documents` route and any nav link pointing to it.

---

### MEDIUM

---

#### M-1 — Shared Report Expiration Enforced Only on Client
**File:** `src/pages/SharedReportView.tsx:65`  
**Impact:** A determined user can bypass expiration by modifying the client-side check or calling the Firestore SDK directly with the `shareId`. Sensitive budget data remains readable past its intended expiry.

**Evidence:**
```tsx
if (!metadata || metadata.isExpired) { /* client-side only — bypassable */ }
```

**Fix:** Add a Firestore rule condition:
```firestore
allow read: if resource.data.expiresAt == null || request.time < resource.data.expiresAt;
```

---

#### M-2 — Zero AI/LLM Integration — All "Intelligence" Is Static Rules
**Impact:** The app has meaningful construction domain data (cost models, phase-to-category mapping, bid structures) but uses none of it with language-model capabilities. Specific missed opportunities:

| Opportunity | Effort | Value |
|---|---|---|
| Expense description → category suggestion (replace keyword matching) | Low | High |
| Invoice/estimate photo/PDF parsing → expense line items | Medium | Very High |
| Bid comparison anomaly detection (flag outlier line items) | Low | High |
| Phase schedule generation from project type + budget | Medium | High |
| Client report narrative (plain-language budget summary) | Low | High |
| Risk summary (budget variance + schedule slip → proactive alert) | Medium | High |

**Evidence:** `grep -rn "openai|anthropic|gpt|claude|llm"` returns zero results across all source files. `src/utils/categorySuggestions.ts` uses static keyword arrays.

---

#### M-3 — `DEFAULT_CATEGORY_MAPPING` Maps `materials → 'interior_finishes'`
**File:** `src/types/category.types.ts:98–103`  
**Impact:** When an expense is categorized as "materials" and the system maps it to a construction category, it defaults to `interior_finishes` — wrong for concrete, framing, roofing, MEP, and most other materials. This silently distorts budget category reports.

**Evidence:**
```ts
materials: 'interior_finishes', // Most common default — incorrect for ~70% of materials expenses
subcontractor: 'uncategorized',
other: 'uncategorized'
```

**Fix:** Change the default to `'general_conditions'` or require explicit selection. The phase-based suggestion system is more accurate and should be the primary path.

---

#### M-4 — Tasks Have No Structural Connections to Phases, Bids, or Budget
**Impact:** Tasks are standalone records. There is no link from a task to the phase it belongs to, the bid that spawned it, the budget line it affects, or any material/subcontractor dependency. The PM experience is pure CRUD with no project graph.

**Evidence:** `src/types/task.types.ts` — fields: `title`, `description`, `status`, `priority`, `dueDate`, `assignedTo`, `projectId`, `createdAt`, `updatedAt`. No `phaseId`, `bidId`, `categoryId`, `dependsOn`, `blockedBy`, `subcontractorId`.

**Fix (incremental):** Add optional `phaseId` to the task type. Populate it from the project wizard phase step. Surface tasks grouped by phase in the project detail view. Do not over-engineer dependencies in the first pass.

---

#### M-5 — Budget Forecasting Is Manual — Users Enter Projections by Hand
**File:** `src/services/budget.ts`  
**Impact:** `BudgetProjection` objects are user-created manual entries. There is no system-generated forecast. "Projected Future Costs" in shared reports comes from user input, not any extrapolation from actual spend rate.

**Fix (deterministic, no AI required):** Given `totalBudget`, `spent`, and `percentComplete`, compute a linear forecast: `forecastFinalCost = spent / percentComplete`. Display this as a system-generated projection alongside user projections.

---

#### M-6 — `alert()` Used for Error Handling in Multiple Components
**Files:** `BudgetReport.tsx:456, 462, 498`, `ExpenseForm.tsx:43`, `ExtraPaymentForm.tsx:59`, `PaymentStageForm.tsx:129`, `SettingsMenu.tsx:66, 80`  
**Impact:** `alert()` blocks the UI thread, looks unprofessional, and cannot be styled or dismissed gracefully.

**Fix:** Replace all instances with MUI `<Snackbar>` or `<Alert>` notifications — the pattern already exists elsewhere in the app.

---

#### M-7 — ProjectInsights Refresh Uses Artificial 800ms `setTimeout` Delay
**File:** `src/components/dashboard/ProjectInsights.tsx:238–244`  
**Impact:** Spinner runs for 800ms regardless of whether data has actually loaded — UX dishonesty.

**Evidence:**
```tsx
setTimeout(() => { onRefresh(); setIsRefreshing(false); }, 800);
```

**Fix:** Pass refresh as an `async` function and await it; show the spinner only while it is genuinely pending.

---

### LOW

---

#### L-1 — Global Test Coverage Threshold Is 18%
**File:** `package.json` (coverage thresholds)  
**Impact:** CI accepts the build at 18% statement coverage. Critical paths — project creation, bid acceptance, payment recording, expense categorization — can regress silently.

**Fix:** Raise global threshold to 40%, then 60% within 90 days. Prioritize integration tests for the bid → commitment → payment chain.

---

#### L-2 — No E2E Tests Despite Playwright Being Configured
**Files:** `playwright.config.ts` (present), `/e2e/` (empty)  
**Impact:** Route regressions, dialog flows, and wizard steps are untested end-to-end. The 18 dead routes in H-1 would have been caught immediately by a single E2E smoke test.

**Fix:** Write a 10-minute smoke suite: login → create project → add expense → view dashboard. Catches ~80% of navigation regressions with minimal effort.

---

#### L-3 — N+1-Adjacent Pattern on Project Deletion
**File:** `src/services/project.ts:88–104`  
**Impact:** Project deletion fires 5 parallel `getDocs` queries across 5 collections via `Promise.all`. Acceptable for a deletion flow, but worth noting as volume grows.

**Fix:** Low priority — acceptable as-is unless rate-limit errors appear.

---

#### L-4 — Duplicate Bid Type Definition Files
**Files:** `src/types/bid.types.ts` and `src/types/bids.types.ts`  
**Impact:** Two files with overlapping bid types. `bid.types.ts:104` has a `TODO` noting the duplication.

**Fix:** Delete `bids.types.ts` after confirming all consumers import from `bid.types.ts`.

---

#### L-5 — Oversized Components With Mixed Concerns
| File | Lines |
|---|---|
| `src/components/projects/budget/BudgetReport.tsx` | 1,006 |
| `src/components/tasks/TasksList.tsx` | 959 |
| `src/components/projects/BidManager.tsx` | 934 |
| `src/components/projects/budget/BudgetAllocationTracker.tsx` | 894 |
| `src/contexts/ProjectWizardContext.tsx` | 867 |

**Impact:** Business logic (budget calculation, bid state) embedded in component render functions makes testing and refactoring difficult.

**Fix:** Extract business logic into services/hooks. `BudgetReport.tsx` should contain only rendering; PDF/share logic should move to a service.

---

#### L-6 — `materialsToOrder` Always Equals 0
**File:** `src/services/dashboard-summary.ts:261`  
**Impact:** The "Materials to Order" insight card is permanently `0`, making it a dead metric.

**Fix:** Either remove the card or count expenses with a materials-pending status flag.

---

## 30/60/90-Day Cleanup Roadmap

### 30 Days — Stop the Bleeding

1. **Fix shared report** (C-1, C-2): Remove `ProtectedRoute`, add Firestore rules, add server-side expiration. ~2 hours.
2. **Fix all dead navigation** (H-1): Redirect each broken route to the nearest valid equivalent. ~1 day.
3. **Remove fake trend percentages** (H-2): Delete three `change:` lines. ~30 minutes.
4. **Fix `DEFAULT_CATEGORY_MAPPING`** (M-3): Change `materials` default or require explicit selection. ~15 minutes.
5. **Replace all `alert()` calls** (M-6): Swap for Snackbar notifications. ~2 hours.

### 60 Days — Intelligence and Data Completeness

6. **Populate `overduePayments`** (H-3): Query `expense_transactions` for overdue items. ~1 day.
7. **Consolidate payment template logic** (H-4): Delete the duplicate switch block in `usePaymentTerms.ts`. ~2 hours.
8. **Add `phaseId` to Task type** (M-4): Wire task creation to current phase. ~2 days.
9. **Add linear budget forecast** (M-5): Compute `forecastFinalCost = spent / percentComplete` in `deriveDashboardSummary`. ~1 day.
10. **Write E2E smoke suite** (L-2): Login, create project, add expense, check dashboard. ~1 day.
11. **LLM feature #1 — category suggestion**: Replace static keyword matching with a Claude API call using expense description + current phase. ~2 days.

### 90 Days — Real Intelligence

12. **Bid comparison view**: Side-by-side comparison for multiple bids on the same phase with variance highlighting. Deterministic — no AI needed. ~3 days.
13. **LLM feature #2 — client report narrative**: "Generate Summary" button in `BudgetReport.tsx` that sends the budget snapshot to Claude and returns a plain-language status paragraph. ~2 days.
14. **LLM feature #3 — schedule generation in wizard**: After the budget step, call Claude with project type, budget, and regional market to suggest phase schedule with durations. ~3 days.
15. **Raise test coverage to 40% globally**: Focus on bid service, expense service, payment flow, and wizard context.
16. **Break up oversized files** (L-5): Extract `BudgetReport` PDF/share logic into a service; extract `TasksList` filter logic into a custom hook.

---

## Top 5 Changes to Make First

| Priority | Change | Estimated Time | Rationale |
|---|---|---|---|
| 1 | Fix shared report: remove `ProtectedRoute` + add Firestore rules | ~2 hours | Feature is completely broken; clients cannot view any shared report |
| 2 | Fix all dead navigation in dashboard, timeline, and calendar | ~1 day | Every insight card click fails; biggest UX regression in the product |
| 3 | Remove hardcoded fake change percentages from insight cards | ~30 min | Shipping static fake metrics to production is misleading; trivially removed |
| 4 | Populate `overduePayments` in dashboard from real data | ~1 day | "Priority Items: Overdue Payments" is a core PM feature currently showing nothing |
| 5 | Add `phaseId` to Task + wire to current project phase | ~2 days | Without phase linkage, tasks are disconnected from all project structure |
