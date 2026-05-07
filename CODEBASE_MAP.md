# Codebase Map

Generated on 2026-05-07 for `builderbrain` on branch `codex/refactor-baseline`.

## Scope And Counting Rules

Counts below exclude generated/runtime folders: `node_modules`, `build`, `coverage`, and `test-results`.

## Directory Tree

Depth 3 view:

```text
.
├── .github
│   └── workflows
│       └── ci.yml
├── docs
│   ├── refactoring
│   └── screenshots
├── e2e
│   ├── builderbrain.smoke.spec.ts
│   └── test-utils.ts
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── scripts
│   ├── capture-readme-screenshots.js
│   └── firestore-rules-test.js
├── src
│   ├── __tests__
│   ├── api
│   ├── components
│   │   ├── admin
│   │   ├── auth
│   │   ├── bids
│   │   ├── calendar
│   │   ├── common
│   │   ├── dashboard
│   │   ├── dialogs
│   │   ├── documents
│   │   ├── expenses
│   │   ├── landing
│   │   ├── layout
│   │   ├── payments
│   │   ├── project-wizard
│   │   ├── projects
│   │   ├── settings
│   │   ├── subcontractors
│   │   ├── tasks
│   │   └── timeline
│   ├── config
│   ├── constants
│   ├── contexts
│   ├── data
│   ├── dialogs
│   ├── hooks
│   ├── pages
│   ├── services
│   ├── types
│   └── utils
│       └── migrations
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── package-lock.json
├── package.json
├── playwright.config.ts
├── storage.rules
└── tsconfig.json
```

## File Count And LOC

Total counted files: **280**

Total counted LOC: **100,942**

Language / extension breakdown:

| Extension | Files | LOC |
|---|---:|---:|
| `.tsx` | 134 | 45,803 |
| `.ts` | 118 | 23,575 |
| `.json` | 6 | 28,036 |
| `.png` | 6 | 2,059 |
| `.md` | 6 | 830 |
| `.js` | 2 | 320 |
| `.rules` | 2 | 196 |
| `.css` | 2 | 65 |
| `.html` | 1 | 43 |
| `.txt` | 1 | 3 |
| `.ico` | 1 | 12 |
| `.svg` | 1 | 0 |

Note: JSON LOC is dominated by `package-lock.json` and Firebase indexes.

## Entry Points

Application:

- `public/index.html`
- `src/index.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/index.css`

Firebase / hosting / rules:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `.firebaserc`

Automation and tests:

- `.github/workflows/ci.yml`
- `playwright.config.ts`
- `scripts/firestore-rules-test.js`
- `scripts/capture-readme-screenshots.js`
- `e2e/builderbrain.smoke.spec.ts`

## External Dependencies

Primary dependency manifest:

- `package.json`
- `package-lock.json`

Runtime dependencies:

- React 18: `react`, `react-dom`
- Routing: `react-router-dom`
- UI: `@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers`, `@emotion/react`, `@emotion/styled`
- Firebase: `firebase`, `@firebase/auth`, `@firebase/firestore`, `@firebase/storage`
- Data fetching: `react-query`
- Charts/reporting: `recharts`, `html2canvas`, `jspdf`
- Utilities: `date-fns`, `uuid`, `react-hot-toast`, `web-vitals`

Development/test dependencies:

- `react-scripts`
- `typescript`
- Testing Library: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- Jest types: `@types/jest`
- Playwright: `@playwright/test`
- Firebase rules testing/tooling: `@firebase/rules-unit-testing`, `firebase-tools`

Other dependency files checked:

- No `requirements.txt`
- No `pyproject.toml`
- No `go.mod`
- No `Cargo.toml`

## Environment Configuration

Documented example:

- `.env.example`

Expected variables:

```text
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_DEV_AUTH_BYPASS
```

Additional local env file present:

- `.env.production.local`

This file is intentionally not expanded in this map. Security review should inspect whether any secret-bearing env files are tracked or pushed.

## Test Coverage Status

Tests exist.

Discovered test files:

```text
src/services/accounting.service.test.ts
src/services/expense.service.test.ts
src/services/payment.service.test.ts
src/services/bid.service.test.ts
src/services/project.service.test.ts
src/api/project.service.test.ts
src/hooks/use-expenses.test.tsx
e2e/builderbrain.smoke.spec.ts
src/components/expenses/ExpenseSummaryCards.test.tsx
src/components/expenses/ExpenseControls.test.tsx
src/components/expenses/ExpenseTable.test.tsx
src/components/expenses/PaymentFormModal.test.tsx
src/components/dashboard/projectCreationNavigation.test.tsx
src/components/bids/BidDetails.test.tsx
src/utils/reportPasswords.test.ts
src/utils/phaseCalculations.test.ts
src/components/payments/Payments.test.tsx
src/components/projects/detailTabs/ProjectDocumentsTab.test.tsx
src/components/projects/detailTabs/ProjectTaskManager.test.tsx
src/components/projects/ProjectMetricCards.test.tsx
```

Current observed status from the last local run before this map:

- Jest suite: **19 suites passed, 93 tests passed**
- TypeScript check: passed with `npx tsc --noEmit --pretty false`
- Production build: passed, with existing ESLint/Browserslist warnings

Coverage tooling:

- `npm run test:coverage` exists.
- A `coverage/` directory exists locally.
- No coverage threshold is configured in `package.json` or CI.

Rules/e2e:

- `npm run test:rules` exists and is configured in CI with Java 17.
- Local `test:rules` previously failed on this machine because Java Runtime was missing.
- `npm run test:e2e` exists and uses Playwright against `http://127.0.0.1:3001` with `REACT_APP_DEV_AUTH_BYPASS=true`.

## Build And Run Commands

From `package.json`:

```bash
npm start
npm run build
npm test
npm run test:ci
npm run test:coverage
npm run test:rules
npm run test:e2e
```

Inferred local development:

```bash
npm install
npm start
```

Create React App defaults to `http://localhost:3000`; Playwright config starts the app on port `3001`.

Inferred production build:

```bash
npm run build
```

Firebase Hosting serves the `build/` directory per `firebase.json`.

CI (`.github/workflows/ci.yml`) runs:

```bash
npm ci
npm run test:ci
npm run test:rules
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

## Major Code Areas

- `src/components`: UI by feature/domain, with several large legacy components still present.
- `src/services`: Firebase-facing services plus local dev data store.
- `src/api`: newer API/service abstraction layer; appears to coexist with legacy services.
- `src/hooks`: React Query hooks and workflow hooks.
- `src/contexts`: Auth, project detail, project wizard, query provider contexts.
- `src/types`: domain type definitions.
- `src/utils`: formatting, category mapping, bid/expense operations, migrations, logging helpers.
- `src/data`: seeded constants and category maps.
- `src/pages`: routed page wrappers.

## Immediate Recon Notes For Phase 2

These are not final audit findings; they are pointers for the domain agents:

- The repo has both `src/services` and `src/api` data-access layers.
- Large component/service files are expected in `src/components/bids`, `src/components/projects`, `src/components/expenses`, `src/services`, and `src/data`.
- README says Firebase Hosting config is not included, but `firebase.json` and `.firebaserc` are present.
- Placeholder/stub scan returned 13 matches in non-test `src` files.
- Build currently succeeds with many existing ESLint warnings, especially unused imports and hook dependency warnings.
