import babel from '@rolldown/plugin-babel';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    build: {
      rolldownOptions: {
        devtools: {}, // Enable devtools mode
      },
      sourcemap: env.SENTRY_ENABLE === 'true',
    },
    plugins: [
      // TODO make it configurable via env variable
      // ViteDevTools({ builtinDevTools: false }),
      tanstackDevtools({
        removeDevtoolsOnBuild: true,
      }),
      tanstackRouter({ autoCodeSplitting: true, target: 'react' }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        disable: env.SENTRY_ENABLE === 'false',
        org: 'maxstue',
        project: 'kijk-client',
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
        telemetry: env.SENTRY_ENABLE_TELEMETRY === 'true',
      }),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 5004,
    },
  };
});
