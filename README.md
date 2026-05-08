# Builderbrain

Builderbrain is a React and Firebase construction-management app for tracking projects, phases, bids, expenses, tasks, documents, subcontractors, payments, schedules, and project reporting.

This repository is the frontend application. It uses Firebase Auth, Firestore, and Firebase Storage for app data and file-backed workflows.

## What It Covers

- Project dashboard and portfolio views
- Custom and residential project setup flows
- Project detail pages with phases, budgets, bids, tasks, and expenses
- Bid management and subcontractor tracking
- Expense and payment workflows
- Documents, timeline, and calendar views
- Shared report route support

## Tech Stack

- React 18
- TypeScript
- Material UI
- React Router
- React Query
- Firebase Auth
- Cloud Firestore
- Firebase Storage

## Current Status

- Public repository
- Local development works
- Firebase-backed production-style auth/data flow
- Local dev auth bypass is available for UI exploration
- Firebase Hosting configuration is included for the built SPA
- GitHub Actions CI runs unit coverage, Firebase rules, build, and e2e smoke checks

## Screenshots

Captured locally using dev auth bypass with the seeded demo dataset.

### Dashboard

![Builderbrain dashboard](./docs/screenshots/dashboard.png)

### Projects

![Builderbrain projects view](./docs/screenshots/projects.png)

### Project Detail

![Builderbrain project detail view](./docs/screenshots/project-detail.png)

### Bids

![Builderbrain bids view](./docs/screenshots/bids.png)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment variables

Copy [.env.example](./.env.example) to `.env` and set your Firebase values. These `REACT_APP_*` values are compiled into the browser bundle through the Vite config, so do not put secrets in them.

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyA1234567890abcdefghijklmnopqrstuv
REACT_APP_FIREBASE_AUTH_DOMAIN=builderbrain-local.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=builderbrain-local
REACT_APP_FIREBASE_STORAGE_BUCKET=builderbrain-local.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=000000000000
REACT_APP_FIREBASE_APP_ID=1:000000000000:web:000000000000000000000000
REACT_APP_DEV_AUTH_BYPASS=false
REACT_APP_ENABLE_CLIENT_LOGS=false
```

### 3. Start the app

```bash
npm start
```

The Vite dev server runs at `http://localhost:3000` by default.

## Local Demo Mode

For local UI review without real Firebase auth, set:

```env
REACT_APP_DEV_AUTH_BYPASS=true
```

When bypass mode is enabled:

- any login/signup credentials will enter the app locally
- a seeded demo dataset is loaded into browser `localStorage`
- projects, bids, tasks, expenses, and subcontractors are available for walkthroughs

This mode is intended for development only. Real save/auth behavior still depends on Firebase configuration.

The Firebase SDK still initializes in demo mode, so keep syntactically valid Firebase web config values in `.env`. The dummy values in [.env.example](./.env.example) are non-secret placeholders for local bypass mode only; replace them with real Firebase project values for production-style auth/data runs and hosted builds.

The seeded data is stored under `localStorage["builderbrain:dev-data:v1"]`. Clear that key, or use browser storage reset tools, to force the demo seed data to reload.

## Runtime Prerequisites

- Node.js 20 for CI parity
- npm, using `npm ci` in clean CI-style installs
- Java 21 for Firebase emulator-backed rules tests
- Playwright Chromium browser dependencies for e2e tests
- Firebase CLI access through the checked-in `firebase-tools` dev dependency

## Available Scripts

```bash
npm start
```

Runs the local development server.

```bash
npm test
```

Runs the interactive Jest test runner.

```bash
npm run test:coverage
```

Runs Jest once with coverage enabled. The repository currently enforces modest global coverage thresholds as a ratchet, not as a claim of broad coverage.

```bash
npm run test:rules
```

Runs Firestore and Storage rules tests through Firebase emulators. Requires Java 21.

```bash
npm run test:e2e
```

Runs Playwright smoke tests against `http://127.0.0.1:3001`. The Playwright config starts the dev server with `REACT_APP_DEV_AUTH_BYPASS=true`, so these tests use local seeded browser storage instead of real Firebase auth.

```bash
npm run typecheck
```

Runs TypeScript without emitting files.

```bash
npm run build
```

Builds the app for production output in `build/`.

## Local Verification

The CI-equivalent local sequence is:

```bash
npm ci
npm run test:coverage
npm run typecheck
npm run test:rules
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

CI uses Node 20 and Java 21, then runs the same coverage, typecheck, rules, build, and e2e gates. Pull requests run CI; pushes run CI on `simplification` and `codex/**` branches.

## App Structure

Key areas of the codebase:

- [src/App.tsx](./src/App.tsx): routes and app shell wiring
- [src/contexts/AuthContext.tsx](./src/contexts/AuthContext.tsx): auth state and dev bypass handling
- [src/config/firebase.ts](./src/config/firebase.ts): Firebase initialization
- [src/components/projects](./src/components/projects): project creation, detail, and budget UI
- [src/components/bids](./src/components/bids): bid workflows
- [src/components/expenses](./src/components/expenses): expense tracking UI
- [src/components/tasks](./src/components/tasks): task views and forms
- [src/components/subcontractors](./src/components/subcontractors): subcontractor management
- [src/services](./src/services): Firebase-facing and local dev data services
- [src/api](./src/api): refactor-in-progress API layer

## Routing Surface

The current app includes routes for:

- dashboard
- projects
- tasks
- expenses
- documents
- bids
- payments
- subcontractors
- settings
- templates
- timeline
- calendar
- shared reports

See [src/App.tsx](./src/App.tsx) for the current route map.

## Firebase And Deploy Notes

This repo includes:

- [firebase.json](./firebase.json)
- [.firebaserc](./.firebaserc)
- [firestore.rules](./firestore.rules)
- [firestore.indexes.json](./firestore.indexes.json)
- [storage.rules](./storage.rules)

Firebase Hosting is configured in [firebase.json](./firebase.json) to serve the `build/` directory and rewrite all routes to `/index.html` for the React single-page app. The checked-in [.firebaserc](./.firebaserc) default project is `constructionbrain-9ff10`; verify or override the active Firebase project before deploying from a local machine.

Typical deploy flow:

```bash
npm run build
npx firebase deploy --only hosting
```

Rules and indexes are also described in Firebase config, but deploy them deliberately:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Refactoring Docs

The repository also contains active refactoring notes:

- [REFACTORING_README.md](./REFACTORING_README.md)
- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)
- [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md)
- [docs/refactoring/ProjectDetailPageRefactorPlan.md](./docs/refactoring/ProjectDetailPageRefactorPlan.md)
- [docs/refactoring/ComponentModularizationPlan.md](./docs/refactoring/ComponentModularizationPlan.md)

These documents are engineering notes, not end-user product docs.

## Gaps To Know Up Front

- Some parts of the codebase are mid-refactor between legacy service usage and the newer `src/api` / hook-based patterns.
- Hosted environment URLs and release ownership are not documented in this repository at this time.
- Coverage thresholds are intentionally low until more critical flows have focused tests.

## License

No license file is currently included in this repository.
