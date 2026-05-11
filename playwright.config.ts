import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      'PORT=3001 REACT_APP_DEV_AUTH_BYPASS=true REACT_APP_FIREBASE_API_KEY=AIzaSyA1234567890abcdefghijklmnopqrstuv REACT_APP_FIREBASE_AUTH_DOMAIN=builderbrain-local.firebaseapp.com REACT_APP_FIREBASE_PROJECT_ID=builderbrain-local REACT_APP_FIREBASE_STORAGE_BUCKET=builderbrain-local.appspot.com REACT_APP_FIREBASE_MESSAGING_SENDER_ID=000000000000 REACT_APP_FIREBASE_APP_ID=1:000000000000:web:000000000000000000000000 npm run build && npx vite preview --host 127.0.0.1 --port 3001 --strictPort',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
