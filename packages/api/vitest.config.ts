import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    clearMocks: true,
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      thresholds: { branches: 35, functions: 11, lines: 24, statements: 24 },
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/generated/**'],
      reporter: ['text-summary', 'html', ['lcov', { projectRoot: fileURLToPath(new URL('../..', import.meta.url)) }]],
    },
  },
});
