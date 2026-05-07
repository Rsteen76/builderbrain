# Documentation & DX Audit

Scope: README completeness/staleness, setup/run/test/deploy docs, environment variable documentation, API/data-access contract docs, stale/non-obvious comments, and developer experience gaps.

## Findings

### 1. MEDIUM - README deployment notes are stale and contradict checked-in Firebase config

Evidence:
- `README.md:34` says "No public deployment configuration is currently included in this repo."
- `README.md:164` says the repo does not include Firebase Hosting configuration such as `firebase.json` or `.firebaserc`.
- `firebase.json:9` through `firebase.json:22` define Firebase Hosting with `build/` as the public directory and SPA rewrites.
- `.firebaserc:2` through `.firebaserc:4` define a default Firebase project.
- `CODEBASE_MAP.md:261` states Firebase Hosting serves `build/` per `firebase.json`.

Impact: Contributors following the README will not know that deploy config exists, may create duplicate Firebase setup, or may deploy to the default `.firebaserc` project without realizing the repo already has a target.

Proposed fix: Update the README Firebase/deployment section to describe the current Firebase Hosting config, the default project alias, the expected deploy flow (`npm run build`, then Firebase deploy command), and whether the checked-in `.firebaserc` target is safe for all contributors or should be overridden locally.

### 2. MEDIUM - README omits important test and CI-equivalent workflows

Evidence:
- `README.md:102` through `README.md:120` document only `npm start`, `npm test`, and `npm run build`.
- `package.json:41` through `package.json:44` define additional `test:ci`, `test:coverage`, `test:rules`, and `test:e2e` scripts.
- `.github/workflows/ci.yml:17` through `.github/workflows/ci.yml:37` show CI uses Node 20, Java 17, `npm ci`, Jest, Firebase rules tests, build, Playwright install, and e2e tests.
- `playwright.config.ts:16` through `playwright.config.ts:20` start the app on port `3001` with `REACT_APP_DEV_AUTH_BYPASS=true`.

Impact: A new contributor cannot reliably reproduce CI locally from the README, especially the Java-backed Firebase emulator tests and the Playwright dev-auth bypass server.

Proposed fix: Add a "Verification" or "Testing" section that lists the full local/CI check sequence, prerequisites for each check, Playwright browser install requirements, and the port/dev-auth behavior used by e2e.

### 3. MEDIUM - Runtime prerequisites are implicit instead of documented

Evidence:
- `.github/workflows/ci.yml:17` through `.github/workflows/ci.yml:25` pin Node 20 and Java 17 in CI.
- `package.json:1` through `package.json:5` has no `engines` field.
- `README.md:56` through `README.md:84` quick start documents install and start but does not state Node/npm/Java requirements.
- `CODEBASE_MAP.md:226` through `CODEBASE_MAP.md:230` note that rules/e2e tests exist and that local rules tests previously failed because Java Runtime was missing.

Impact: Local setup can fail in non-obvious ways when contributors use a different Node version or do not have a Java runtime for Firebase emulators.

Proposed fix: Add documented prerequisites to README and consider adding `.nvmrc`/`.node-version` plus `package.json` `engines`. Include Java 17 as required for `npm run test:rules`.

### 4. MEDIUM - Environment variable docs list keys but not behavior, validation, or safety constraints

Evidence:
- `.env.example:1` through `.env.example:7` list Firebase values and `REACT_APP_DEV_AUTH_BYPASS` without descriptions.
- `README.md:64` through `README.md:76` repeats the same keys but does not document which are required for build, local demo mode, tests, or deployment.
- `src/config/firebase.ts:6` through `src/config/firebase.ts:17` initializes Firebase directly from `process.env` with no documented validation or troubleshooting path.
- `src/config/devMode.ts:4` through `src/config/devMode.ts:5` enables dev auth bypass only when `REACT_APP_DEV_AUTH_BYPASS === 'true'`.

Impact: Developers do not know which values can be placeholders in demo mode, which are production-only, or how the app fails when a Firebase value is missing. Because CRA exposes `REACT_APP_*` values to the browser, the docs should also be explicit about not putting server secrets there.

Proposed fix: Expand `.env.example` comments and README environment docs with purpose, required/optional status, allowed values, local demo guidance, production guidance, and a note that `REACT_APP_*` values are public client config rather than secrets.

### 5. MEDIUM - API/data-access contracts are undocumented while two service layers coexist

Evidence:
- `README.md:134` through `README.md:135` point to both `src/services` and `src/api`.
- `README.md:181` says the codebase is mid-refactor between legacy service usage and newer `src/api`/hook patterns.
- `REFACTORING_PROGRESS.md:25` through `REFACTORING_PROGRESS.md:29` list remaining service/hook migration work.
- `src/types/index.ts:132` through `src/types/index.ts:145` define `ApiResponse<T>` and `PaginatedResponse<T>`.
- `src/api/base.service.ts:70` through `src/api/base.service.ts:86` define create response behavior; `src/api/base.service.ts:92` through `src/api/base.service.ts:104` define update behavior that returns success without updated data.
- `src/hooks/use-projects.ts:93` through `src/hooks/use-projects.ts:101` compensate for update not returning an updated project by fetching it again.

Impact: Contributors must reverse-engineer which layer to use, what service methods return, and whether hooks or direct services are preferred. This increases inconsistent data-access patterns during the ongoing refactor.

Proposed fix: Add a short data-access contract doc or README section that defines preferred patterns for new work, acceptable legacy-service touch points, `ApiResponse` conventions, pagination limitations, cache invalidation expectations, and examples for create/update/delete flows.

### 6. LOW - Refactoring docs appear stale and internally inconsistent

Evidence:
- `REFACTORING_PLAN.md:9` through `REFACTORING_PLAN.md:18` still show foundational service-layer tasks unchecked.
- `REFACTORING_PROGRESS.md:6` through `REFACTORING_PROGRESS.md:18` mark the base service, services, and hooks as completed.
- `REFACTORING_PROGRESS.md:65` through `REFACTORING_PROGRESS.md:76` include dates from 2023 while the codebase map was generated on 2026-05-07 at `CODEBASE_MAP.md:3`.
- `REFACTORING_README.md:96` through `REFACTORING_README.md:106` describes Phase 1 as current and Phase 2 as upcoming, while `REFACTORING_PROGRESS.md:87` through `REFACTORING_PROGRESS.md:99` says component refactoring is already in progress.

Impact: New contributors cannot tell which refactoring instructions are current, which tasks remain, or whether old guidance should still govern new code.

Proposed fix: Add "last reviewed" dates and current status banners to refactoring docs, reconcile the checklists, or archive superseded plans under a clearly labeled historical directory.

### 7. LOW - Local demo data reset and persistence behavior are under-documented

Evidence:
- `README.md:94` through `README.md:100` says demo mode loads seeded data into browser `localStorage`.
- `src/services/devDataStore.ts:14` through `src/services/devDataStore.ts:16` define the concrete storage key and dev user.
- `src/services/devDataStore.ts:1848` through `src/services/devDataStore.ts:1862` expose seed and reset functions.
- `src/services/data-reset.ts:145` through `src/services/data-reset.ts:155` clears most local storage keys but is not documented in the README.

Impact: Developers running smoke tests or manually exploring demo mode may see stale mutated demo data and not know how to reset to a clean seed.

Proposed fix: Document how local demo data persists, how to reset it safely, and the exact localStorage key used for seeded demo data. Include whether Settings reset affects Firebase data, local demo data, or both.

### 8. LOW - Non-obvious placeholder/stub code is not surfaced in docs

Evidence:
- `src/services/project.ts:1193` through `src/services/project.ts:1198` export `getAllProjects` but log that it is not implemented and return an empty array.
- `src/services/category.service.ts:344` through `src/services/category.service.ts:349` write a placeholder `CATEGORY_ID` during category assignment.
- `src/api/index.ts:29` through `src/api/index.ts:32` says more services will be added as implemented.
- `src/components/settings/Settings.tsx:80`, `src/components/settings/Settings.tsx:91`, and `src/components/settings/Settings.tsx:102` show "coming soon" settings features in the UI.

Impact: These comments and placeholders are easy to miss during feature work and can lead contributors to call incomplete APIs or assume UI settings are supported.

Proposed fix: Add a known limitations section to README or the refactoring guide that lists incomplete service exports, placeholder migrations, and user-visible "coming soon" areas. For code comments, replace vague placeholders with issue links or explicit owner/status where possible.

## Top Priorities

1. Fix README deployment staleness because it contradicts committed Firebase Hosting config.
2. Add full local verification docs for CI parity, including Node 20, Java 17, Firebase emulators, and Playwright.
3. Document the data-access contract so new work uses the intended service/hook layer consistently.
