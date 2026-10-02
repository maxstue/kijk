import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ['src/**/*.test.{ts,tsx}', 'src/routeTree.gen.ts', 'src/shared/api/generated/**', 'src/test/**'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 5,
        functions: 4,
        lines: 6,
        statements: 6,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          include: ['src/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        extends: true,
        // Pre-bundle the runtime dependencies up front. Otherwise Vite discovers some of them while the first test
        // files run, re-optimizes and reloads the page, which fails in-flight test imports on slow CI runners
        // ("Failed to fetch dynamically imported module").
        optimizeDeps: {
          include: [
            '@clerk/react',
            '@hookform/resolvers/zod',
            '@posthog/react',
            '@sentry/react',
            '@tanstack/react-query',
            '@tanstack/react-router',
            '@tanstack/react-table',
            '@tanstack/react-virtual',
            '@tanstack/zod-adapter',
            'date-fns',
            'framer-motion',
            'lucide-react',
            'lucide-react/dynamic',
            'msw',
            'msw/browser',
            'openapi-fetch',
            'posthog-js',
            'radix-ui',
            'react',
            'react-dom/client',
            'react-error-boundary',
            'react-hook-form',
            'recharts',
            'sonner',
            'zod',
            'zustand',
            'zustand/middleware',
            'zustand/middleware/immer',
          ],
        },
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: 'chromium' }],
            provider: playwright(),
          },
          // Shared CI runners time out while starting many browser iframes in parallel; run files one by one there.
          fileParallelism: !process.env.CI,
          include: ['src/**/*.browser.test.tsx'],
          name: 'component',
          setupFiles: ['./src/test/browser-setup.ts'],
        },
      },
    ],
  },
});
