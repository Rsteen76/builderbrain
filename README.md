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
- No public deployment configuration is currently included in this repo

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

Copy [.env.example](./.env.example) to `.env` and set your Firebase values:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_DEV_AUTH_BYPASS=false
```

### 3. Start the app

```bash
npm start
```

The Create React App dev server runs at `http://localhost:3000`.

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

## Available Scripts

```bash
npm start
```

Runs the local development server.

```bash
npm test
```

Runs the test runner.

```bash
npm run build
```

Builds the app for production output in `build/`.

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

## Firebase Notes

This repo includes:

- [firestore.rules](./firestore.rules)
- [firestore.indexes.json](./firestore.indexes.json)

It does not currently include Firebase Hosting configuration such as `firebase.json` or `.firebaserc`.

## Refactoring Docs

The repository also contains active refactoring notes:

- [REFACTORING_README.md](./REFACTORING_README.md)
- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)
- [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md)
- [docs/refactoring/ProjectDetailPageRefactorPlan.md](./docs/refactoring/ProjectDetailPageRefactorPlan.md)
- [docs/refactoring/ComponentModularizationPlan.md](./docs/refactoring/ComponentModularizationPlan.md)

These documents are engineering notes, not end-user product docs.

## Gaps To Know Up Front

- The root app documentation was recently updated from the default CRA scaffold, but broader repo docs are still being normalized.
- Some parts of the codebase are mid-refactor between legacy service usage and the newer `src/api` / hook-based patterns.
- A public hosted environment is not documented in this repository at this time.

## License

No license file is currently included in this repository.
