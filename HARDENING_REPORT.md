# Hardening Report

Generated: 2026-05-07

## Completed This Pass

- Produced the baseline codebase map in `CODEBASE_MAP.md`.
- Produced seven domain audits under `audit/`.
- Consolidated findings, dependency ordering, wave plan, and conflicts in `audit/SUMMARY.md`.
- Removed unused direct `@firebase/auth`, `@firebase/firestore`, and `@firebase/storage` dependencies.
- Updated dependency tree to remove the critical audit advisory:
  - `firebase` to `^11.10.0`
  - `@firebase/rules-unit-testing` to `^4.0.1`
  - `react-router-dom` to `^6.30.3`
  - `uuid` to `^11.1.1`
  - `firebase-tools` to `^15.17.0`
- Fixed partial expense update serialization so patch writes do not reset required fields or dates.
- Fixed payment modal persistence so async save failures keep the modal open and visible to the user.
- Fixed user data reset so partial deletion failures are reported instead of being swallowed.
- Replaced predictable shared report IDs with cryptographically generated IDs.

## Tests Added

- `src/api/expense.service.test.ts`
- `src/services/data-reset.service.test.ts`
- `src/services/ReportService.test.ts`
- Added async success/failure coverage to `src/components/expenses/PaymentFormModal.test.tsx`.

## Verification

- `npm test -- --watchAll=false src/components/expenses/PaymentFormModal.test.tsx src/api/expense.service.test.ts src/api/project.service.test.ts src/services/data-reset.service.test.ts src/services/ReportService.test.ts src/utils/reportPasswords.test.ts`
  - Passed: 6 suites, 17 tests.
- `npx tsc --noEmit`
  - Passed.
- `npm run test:ci`
  - Passed: 22 suites, 100 tests.
- `npm run build`
  - Passed with existing ESLint warnings and CRA bundle-size warning.
- `npm audit --json`
  - Critical vulnerabilities reduced from 1 to 0.
  - Remaining advisories: 26 total, all through `react-scripts@5.0.1` and its transitive build/test toolchain.

## Deferred Risks

- Shared report password validation is still client-side. The real fix needs a backend validation boundary; random IDs only reduce link enumeration risk.
- CRA/react-scripts remains the source of all remaining high audit advisories. Avoid `npm audit fix --force`; it proposes an invalid `react-scripts@0.0.0` path. The durable fix is a Vite migration.
- Accepted-bid expense creation is still not transactional/idempotent.
- Auth startup can still continue after Firestore profile load/create failures.
- Payment/dashboard/project performance findings remain open:
  - Payments dashboard N+1 transaction reads.
  - Project detail duplicate reads.
  - Dashboard all-project scan.
- Storage upload validation, CSP/security headers, logging cleanup, and Firestore index gaps remain open.
- Large modules and direct Firestore-in-UI patterns remain open for Wave 2 structural refactoring.

## Next Fix Wave

1. Make accepted-bid expense creation idempotent and covered by regression tests.
2. Add blocking auth/profile error state and tests.
3. Add storage upload validation and matching storage rules/tests.
4. Add Firebase Hosting security headers and CSP.
5. Start CRA-to-Vite migration in a separate branch because it is broad and will change build/test tooling.
