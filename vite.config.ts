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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('/@mui/icons-material/')) {
              return 'vendor-mui-icons';
            }

            if (id.includes('/@mui/x-date-pickers/')) {
              return 'vendor-mui-date-pickers';
            }

            if (id.includes('/@mui/material/')) {
              return 'vendor-mui-material';
            }

            if (id.includes('/@mui/') || id.includes('/@emotion/')) {
              return 'vendor-mui-core';
            }

            if (id.includes('/firebase/') || id.includes('/@firebase/')) {
              return 'vendor-firebase';
            }

            if (id.includes('/recharts/') || id.includes('/d3') || id.includes('/victory-vendor/')) {
              return 'vendor-charts';
            }

            if (id.includes('/jspdf/')) {
              return 'vendor-pdf';
            }

            if (id.includes('/html2canvas/')) {
              return 'vendor-canvas';
            }

            if (id.includes('/date-fns/')) {
              return 'vendor-date-fns';
            }

            if (id.includes('/react-query/')) {
              return 'vendor-react-query';
            }

            if (id.includes('/uuid/')) {
              return 'vendor-uuid';
            }

            if (id.includes('/lodash/') || id.includes('/lodash-es/')) {
              return 'vendor-lodash';
            }

            if (id.includes('/@popperjs/') || id.includes('/react-popper/')) {
              return 'vendor-popper';
            }

            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/') || id.includes('/react-router/')) {
              return 'vendor-react';
            }

            if (
              id.includes('/@babel/runtime/') ||
              id.includes('/clsx/') ||
              id.includes('/prop-types/') ||
              id.includes('/react-is/') ||
              id.includes('/react-transition-group/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-support';
            }

            return 'vendor';
          },
        },
      },
    },
    preview: {
      port,
      strictPort: true,
    },
  };
});
