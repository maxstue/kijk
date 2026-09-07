import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: 'test-results',
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:5004',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec vite --mode test --host 127.0.0.1',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://127.0.0.1:5004/privacy',
  },
  workers: process.env.CI ? 1 : undefined,
  projects: [
    {
      name: 'clerk setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      dependencies: ['clerk setup'],
      name: 'public chromium',
      testMatch: /public-pages\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      dependencies: ['clerk setup'],
      name: 'authenticated chromium',
      testMatch: /authenticated\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.clerk/user.json',
      },
    },
  ],
});
