import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import babel from '@rolldown/plugin-babel'


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
    },
    server: {
      port: 5004,
    },
    plugins: [
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
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
