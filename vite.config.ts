import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const readPort = (value: string | undefined, fallback: number): number => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
};

const craClientEnvKeys = [
  'REACT_APP_DEV_AUTH_BYPASS',
  'REACT_APP_ENABLE_CLIENT_LOGS',
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
];

const devBypassFirebaseEnv: Record<string, string> = {
  REACT_APP_FIREBASE_API_KEY: 'dev-api-key',
  REACT_APP_FIREBASE_APP_ID: '1:000000000000:web:000000000000000000000000',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'builderbrain-local.firebaseapp.com',
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  REACT_APP_FIREBASE_PROJECT_ID: 'builderbrain-local',
  REACT_APP_FIREBASE_STORAGE_BUCKET: 'builderbrain-local.appspot.com',
};

export default defineConfig(({ command, mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  };
  const nodeEnv = command === 'build' ? 'production' : 'development';
  const loadedClientEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith('REACT_APP_'))
  );
  const clientEnv =
    loadedClientEnv.REACT_APP_DEV_AUTH_BYPASS === 'true'
      ? { ...devBypassFirebaseEnv, ...loadedClientEnv }
      : loadedClientEnv;
  const defineEnv = Object.fromEntries(
    [...new Set([...craClientEnvKeys, ...Object.keys(clientEnv)])].map((key) => [
      `process.env.${key}`,
      clientEnv[key] === undefined ? 'undefined' : JSON.stringify(clientEnv[key]),
    ])
  );
  const clientProcessEnv = {
    NODE_ENV: nodeEnv,
    ...clientEnv,
  };
  const port = readPort(process.env.PORT, 3000);

  return {
    plugins: [
      {
        name: 'builderbrain-cra-env',
        transformIndexHtml() {
          return [
            {
              tag: 'script',
              children: `window.process = { env: ${JSON.stringify(clientProcessEnv)} };`,
              injectTo: 'head-prepend',
            },
          ];
        },
      },
      react(),
    ],
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      ...defineEnv,
    },
    server: {
      port,
      strictPort: true,
    },
    build: {
      outDir: 'build',
    },
    preview: {
      port,
      strictPort: true,
    },
  };
});
