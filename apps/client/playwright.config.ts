import { defineConfig, devices } from '@playwright/test';

import { appOrigin, mockApiOrigin } from './src/test/e2e/mock-api/config';

// Tests run against the production build, like TanStack Start's own E2E suite. The fake API replaces the .NET API
// behind the BFF, so every browser request passes the real relay. Its data is shared, hence one worker.
export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: 'test-results',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './src/test/e2e',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: appOrigin,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node src/test/e2e/mock-api/server.ts',
      reuseExistingServer: false,
      timeout: 30_000,
      url: `${mockApiOrigin}/__e2e/health`,
    },
    {
      command: 'vp build && node .output/server/index.mjs',
      env: {
        API_ORIGIN: mockApiOrigin,
        APP_ORIGIN: appOrigin,
        HOST: new URL(appOrigin).hostname,
        PORT: new URL(appOrigin).port,
      },
      reuseExistingServer: false,
      timeout: 240_000,
      url: `${appOrigin}/health`,
    },
  ],
  workers: 1,
  projects: [
    {
      name: 'clerk setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      dependencies: ['clerk setup'],
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
