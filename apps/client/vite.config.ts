import posthogRollupPlugin from '@posthog/rollup-plugin';
import babel from '@rolldown/plugin-babel';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv, lazyPlugins } from 'vite-plus';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sentryUpload = env.SENTRY_ENABLE === 'true';
  const posthogUpload = env.POSTHOG_ENABLE === 'true';
  return {
    build: {
      sourcemap: sentryUpload || posthogUpload ? 'hidden' : false,
    },
    optimizeDeps: {
      include: [
        '@tanstack/charts',
        '@tanstack/charts/react',
        '@tanstack/charts/scales/band',
        '@tanstack/charts/scales/linear',
        '@tanstack/charts/tooltip',
        'd3-shape',
      ],
    },
    plugins: lazyPlugins(() => [
      // ViteDevTools({ builtinDevTools: false }),
      tanstackDevtools({
        removeDevtoolsOnBuild: true,
      }),
      tanstackRouter({
        autoCodeSplitting: true,
        routeFileIgnorePattern: String.raw`\.(test|spec)\.[cm]?[jt]sx?$`,
        target: 'react',
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      // Both tools get the same source maps. PostHog runs first; the last uploader deletes the maps from the build.
      posthogRollupPlugin({
        host: env.POSTHOG_HOST,
        personalApiKey: env.POSTHOG_API_KEY ?? '',
        projectId: env.POSTHOG_PROJECT_ID,
        sourcemaps: { deleteAfterUpload: !sentryUpload, enabled: posthogUpload },
      }),
      sentryVitePlugin({
        authToken: env.SENTRY_AUTH_TOKEN,
        disable: env.SENTRY_ENABLE !== 'true',
        org: 'maxstue',
        project: 'kijk-client',
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
        telemetry: env.SENTRY_ENABLE_TELEMETRY === 'true',
      }),
    ]),
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 5004,
    },
  };
});
