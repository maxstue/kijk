import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  test: {
    clearMocks: true,
    restoreMocks: true,
    include: ['src/**/*.browser.test.tsx'],
    setupFiles: ['./src/test/browser-setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      thresholds: {
        branches: 1,
        functions: 3,
        lines: 2,
        statements: 2,
        'src/components/checkbox.tsx': { lines: 100, functions: 100 },
        'src/components/dialog.tsx': { lines: 66, functions: 66, branches: 54 },
      },
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
      reporter: ['text-summary', 'html', ['lcov', { projectRoot: fileURLToPath(new URL('../..', import.meta.url)) }]],
    },
  },
});
