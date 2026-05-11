# Release Checklist

Use this checklist for production releases from the `simplification` branch to Firebase Hosting.

## GitHub Secrets

Configure this repository secret before enabling automated deploys:

- `FIREBASE_SERVICE_ACCOUNT_CONSTRUCTIONBRAIN_9FF10`: JSON credentials for a Google service account that can deploy Firebase Hosting to project `constructionbrain-9ff10`.

The secret value must not be committed to the repository. Store the full service-account JSON as the GitHub Actions secret value.

## GitHub Actions Variables

Configure these repository variables for the hosted production build. They are compiled into the browser bundle and should match the Firebase web app for `constructionbrain-9ff10`:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`

`REACT_APP_FIREBASE_PROJECT_ID` is set by the workflow to `constructionbrain-9ff10`. The workflow also sets `REACT_APP_DEV_AUTH_BYPASS=false` and `REACT_APP_ENABLE_CLIENT_LOGS=false` for the production build.

## Release Flow

1. Merge or push the release commit to `simplification`.
2. Wait for the `CI` workflow on that push to complete successfully.
3. Confirm the `Deploy Firebase Hosting` workflow starts from the successful CI run.
4. Confirm the workflow validates the GitHub Actions variables, checks out the tested commit, runs `npm ci`, runs `npm run build`, and deploys the `build/` output to the live Firebase Hosting channel for `constructionbrain-9ff10`.
5. Smoke-test the hosted app after deploy, including login, dashboard load, projects, bids, expenses, and shared report routes.

## Rollback

Use the Firebase console or Firebase CLI Hosting release history to roll back to a previous Hosting release if a live deploy must be reverted:

```bash
npx firebase hosting:clone constructionbrain-9ff10:live:<SOURCE_VERSION> constructionbrain-9ff10:live
```

Only roll back Hosting from a known-good release. Firestore rules, Storage rules, and indexes are not deployed by the automated Hosting workflow.
