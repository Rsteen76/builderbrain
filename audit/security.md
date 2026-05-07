# Security Audit

Scope: Builderbrain frontend, Firebase config/rules, storage rules, environment files, and npm dependency state. Reviewed on 2026-05-07.

## Commands Run

- `sed -n '1,240p' CODEBASE_MAP.md`
- `git status --short`
- `rg --files -g '.env*' -g '!node_modules' -g '!build' -g '!coverage' -g '!test-results'`
- `git ls-files | rg '(^|/)\\.env|\\.env'`
- `sed -n '1,120p' .env.example && sed -n '1,120p' .env.production.local`
- `sed -n '1,240p' firestore.rules`
- `sed -n '1,220p' storage.rules`
- `sed -n '1,220p' firebase.json`
- `rg -n "(API_KEY|apiKey|secret|password|token|credential|private_key|REACT_APP|DEV_AUTH|bypass|admin|cors|CORS|Content-Security|CSP|innerHTML|dangerouslySetInnerHTML|eval\\(|new Function|fetch\\(|axios|XMLHttpRequest|localStorage|sessionStorage|console\\.(log|error|warn)|upload|put\\(|ref\\(|getDownloadURL|where\\(|doc\\(|collection\\()" src firebase.json firestore.rules storage.rules public package.json .github scripts e2e -g '!node_modules' -g '!build' -g '!coverage' -g '!test-results'`
- `rg -n "shared_reports|ReportService|createShared|shareReport|getSharedReport" src firestore.rules scripts e2e`
- `rg -n "dangerouslySetInnerHTML|innerHTML|DOMParser|href=|src=|window\\.open|location\\.|navigate\\(|toDataURL|useCORS|javascript:" src -g '!node_modules'`
- `rg -n "process\\.env|AIza|BEGIN [A-Z ]*PRIVATE KEY|password\\s*=|password:|token\\s*=|token:|secret\\s*=|secret:|Authorization|Bearer|refreshToken" . -g '!node_modules' -g '!build' -g '!coverage' -g '!test-results' -g '!package-lock.json'`
- `npm audit --json`

## Findings

### CRITICAL: Vulnerable npm dependency tree includes critical and high advisories

Evidence:
- `package.json:23` pins `firebase` at `^10.8.0`.
- `package.json:30` pins `react-router-dom` at `^6.22.1`.
- `package.json:31` pins `react-scripts` at `5.0.1`.
- `package.json:34` pins `uuid` at `^11.1.0`.
- `package.json:67` pins `firebase-tools` at `14.27.0`.
- `npm audit --json` reported 64 vulnerabilities: 1 critical, 29 high, 21 moderate, 13 low. Notable entries included critical `form-data`, high `@remix-run/router` XSS via open redirects, high `firebase-tools` via `tar`, high `undici` issues under Firebase packages, and high `serialize-javascript`/`svgo`/`workbox` issues through `react-scripts`.

Impact:
- Build/test tooling and runtime packages contain known exploitable issues. The React Router advisory is browser-relevant; Firebase/undici affects SDK paths; `firebase-tools`/tar and react-scripts transitive issues raise supply-chain and local tooling risk.

Proposed fix:
- Upgrade direct dependencies and regenerate `package-lock.json`. Prioritize `react-router-dom`, `firebase`, `uuid`, and `firebase-tools`. For `react-scripts`, evaluate migrating away from CRA or using supported overrides only as a short-term bridge, then rerun `npm audit --omit=dev` and full `npm audit` until critical/high findings are resolved or explicitly accepted.

### HIGH: Shared report password protection is enforced client-side with unsalted SHA-256

Evidence:
- `src/services/ReportService.ts:44-46` stores `password` or `passwordHash` fields on shared report documents.
- `src/services/ReportService.ts:151-160` reads shared report metadata from Firestore by `shareId`.
- `src/services/ReportService.ts:172-199` reads the report document first and then validates the password in browser code.
- `src/utils/reportPasswords.ts:10-20` hashes the password with a single unsalted SHA-256 digest.
- `src/utils/reportPasswords.ts:36-37` still accepts legacy plaintext passwords.

Impact:
- If Firestore rules are opened to make public shared reports work, any visitor who can read a protected report document can receive the password hash or legacy password material and perform offline guessing. Unsalted SHA-256 is fast and unsuitable for password storage, especially for share passwords that users may choose weakly.

Proposed fix:
- Move shared-report access behind a trusted backend or Firebase Cloud Function. Validate `shareId`, expiration, rate limits, and password server-side; return only sanitized report data after authorization. Store password verifiers using a slow salted password KDF such as Argon2id, bcrypt, or PBKDF2 with a per-report salt. Remove plaintext legacy password fallback after a one-time migration.

### HIGH: Shared report IDs are predictable enough for enumeration pressure

Evidence:
- `src/services/ReportService.ts:100-103` generates `shareId` from the first eight characters of `projectId`, a timestamp, and `Math.random().toString(36).substring(2, 8)`.
- `src/components/projects/budget/BudgetReport.tsx:486-488` exposes this ID directly in `/shared-reports/${shareId}` links.

Impact:
- The share ID embeds project-derived data and timestamp structure, leaving only a short non-cryptographic random suffix. If shared report reads are exposed, attackers can focus enumeration around known timestamps/project IDs and try many candidate IDs.

Proposed fix:
- Generate share IDs with `crypto.getRandomValues` or backend-generated 128-bit-or-greater random tokens. Do not include project IDs or timestamps in bearer URLs. Add server-side rate limiting and monitoring for failed share lookups.

### MEDIUM: Firebase Storage accepts arbitrary file types and sizes for user-controlled uploads

Evidence:
- `src/services/storage.ts:24` uploads project documents using `file.name`.
- `src/services/storage.ts:39` uploads project photos using `file.name`.
- `src/services/storage.ts:61` uploads avatars without checking MIME type or size.
- `src/services/storage.ts:81` uploads bid attachments using `file.name`.
- `src/services/storage.ts:97` sends the file directly with `uploadBytes`.
- `storage.rules:20-29` allow project owners and bid owners to read/write matching paths without `request.resource.size` or `request.resource.contentType` restrictions.

Impact:
- Authenticated owners can upload oversized files, unexpected active content, or misleading file types. That increases storage-cost denial-of-service risk and can expose other users to malicious downloads or rendered content when links are opened.

Proposed fix:
- Add client-side validation for allowed extensions, MIME types, and max sizes. Enforce the same constraints in `storage.rules` using `request.resource.size` and `request.resource.contentType.matches(...)`. Store files under generated names and persist original names as metadata after sanitization.

### MEDIUM: Firebase Hosting has no CSP or baseline security headers

Evidence:
- `firebase.json:9-22` configures Hosting `public`, `ignore`, and SPA rewrites, but no `headers` block.
- `src/pages/SharedReportView.tsx:629-640` and `src/components/projects/budget/BudgetReport.tsx:865-880` use `dangerouslySetInnerHTML` for static print CSS. These are static today, but the app has no CSP defense if future dynamic HTML is introduced.

Impact:
- Browsers receive no app-level Content-Security-Policy, HSTS, clickjacking, MIME sniffing, referrer, or permissions policy protections. A future XSS bug or third-party script compromise would have fewer containment barriers.

Proposed fix:
- Add Firebase Hosting security headers, including a tested CSP (`default-src 'self'`; Firebase/Auth/Storage endpoints as needed; no broad `*`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `frame-ancestors 'none'` or an explicit allow-list.

### MEDIUM: Client logging can expose project financial data and stack traces

Evidence:
- `src/utils/logger.ts:6-15` enables logging outside production, with production re-enable via `REACT_APP_ENABLE_CLIENT_LOGS=true` or `localStorage['builderbrain:debugLogs']='true'`.
- `src/components/expenses/Expenses.tsx:332-340` logs raw expense data, payment details, and full JSON-stringified expense data.
- `src/services/bid.ts:301-304` and `src/services/bid.ts:329-332` log Firestore errors and stack traces.
- `src/contexts/AuthContext.tsx:67-80` logs authenticated user IDs and full user data.

Impact:
- Financial amounts, payment details, user IDs, emails, bid data, and stack traces can be exposed to browser consoles, shared screenshots, support tooling, or compromised extensions. The localStorage switch also lets any XSS persistence enable verbose logs in production.

Proposed fix:
- Remove raw object logging from user/bid/expense flows or redact sensitive fields before logging. Disable the localStorage production override, gate production logging behind server-controlled config, and avoid stack traces/user objects in client logs.

### LOW: Local production Firebase config exists with real project identifiers

Evidence:
- `.env.production.local:1-6` contains a real Firebase API key, auth domain, project ID, storage bucket, sender ID, and app ID.
- `.gitignore:19-22` ignores `.env.local`, `.env.development.local`, `.env.test.local`, and `.env.production.local`.
- `git ls-files | rg '(^|/)\\.env|\\.env'` showed only `.env.example` tracked.

Impact:
- The file is not tracked, so this is not a repository secret leak. Firebase web API keys are not secret by themselves, but they identify the project and should be paired with strict Firebase Auth, Firestore, Storage, and API key restrictions. Local untracked files are still easy to copy into tickets or commits by mistake.

Proposed fix:
- Keep `.env.production.local` untracked, rotate or restrict the Firebase API key if it was exposed elsewhere, and document that Firebase web config is public but must be protected by rules and Google Cloud API key restrictions.

### LOW: Dev auth bypass is build-time enabled by a public React env variable

Evidence:
- `src/config/devMode.ts:4-5` enables the bypass whenever `REACT_APP_DEV_AUTH_BYPASS === 'true'`.
- `src/config/devMode.ts:9-37` defines a fake Firebase user and token.
- `src/contexts/AuthContext.tsx:56-64` treats the bypass user as authenticated during provider initialization.
- `src/contexts/AuthContext.tsx:98-129` makes sign-in and sign-up succeed locally when bypass is enabled.

Impact:
- If a production build is accidentally created with `REACT_APP_DEV_AUTH_BYPASS=true`, the UI authentication gate is bypassed. Firestore rules should reject the fake token for real backend access, but client-side protected routes and any local/dev data flows would still be exposed in the shipped app.

Proposed fix:
- Require `NODE_ENV !== 'production'` in addition to the env flag, fail the build if the flag is true in production, and keep e2e bypass configuration isolated to Playwright/dev server scripts.

## Additional Notes

- No tracked `.env.production.local` or `.env.local` file was found; only `.env.example` is tracked.
- No direct `eval(...)`, `new Function(...)`, or server-side command execution surface was found in the inspected source.
- Firestore rules default-deny unknown collections at `firestore.rules:155-158`; however, `shared_reports` has no explicit rule, so the current client-side shared report service appears incompatible with deployed rules unless another deployment path grants access.
