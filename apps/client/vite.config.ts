import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const ReactCompilerConfig = {
  target: '19', // '17' | '18' | '19'
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      SHORT_APP_VERSION: JSON.stringify(env.npm_package_version.split('-')[0]),
      LONG_APP_VERSION: JSON.stringify(env.npm_package_version),
    },
    build: {
      sourcemap: env.SENTRY_ENABLE === 'true',
      rollupOptions: {
        output: {
          manualChunks: (name) => {
            if (name.includes('node_modules')) {
              return 'vendor';
            }
            return;
          },
        },
      },
    },
    server: {
      port: 5004,
    },
    plugins: [
      tsconfigPaths(),
      TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        },
      }),
      tailwindcss(),
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        org: 'maxstue',
        project: 'kijk-client',
        telemetry: env.SENTRY_ENABLE_TELEMETRY === 'true',
        disable: env.SENTRY_ENABLE === 'false',
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
    ],
  };
});
