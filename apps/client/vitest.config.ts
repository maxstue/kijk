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
