import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    clearMocks: true,
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      thresholds: { branches: 84, functions: 35, lines: 45, statements: 41 },
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text-summary', 'html', ['lcov', { projectRoot: fileURLToPath(new URL('../..', import.meta.url)) }]],
    },
  },
});
