import posthogRollupPlugin from '@posthog/rollup-plugin';
import babel from '@rolldown/plugin-babel';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { devtools as tanstackDevtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
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
        '@clerk/tanstack-react-start',
        '@clerk/tanstack-react-start/legacy',
        '@clerk/tanstack-react-start > @clerk/react/internal',
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
      nitro(),
      tanstackStart({
        router: {
          routeFileIgnorePattern: String.raw`\.(test|spec)\.[cm]?[jt]sx?$`,
        },
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
          filesToDeleteAfterUpload: ['./dist/**/*.map', './.output/**/*.map'],
        },
        telemetry: env.SENTRY_ENABLE_TELEMETRY === 'true',
      }),
    ]),
    resolve: {
      dedupe: ['react', 'react-dom', '@clerk/shared'],
      tsconfigPaths: true,
    },
    server: {
      port: 5004,
    },
  };
});
