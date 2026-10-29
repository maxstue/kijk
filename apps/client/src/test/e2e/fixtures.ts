import { test as base, expect } from '@playwright/test';

import { mockApiOrigin } from './mock-api/config';
import type { UpstreamRequest } from './mock-api/server';

interface E2eFixtures {
  /** Console messages or page errors a test expects; any other error fails the test. */
  whitelistErrors: Array<string | RegExp>;
  /** Requests the fake API received from the BFF since the test started. */
  upstreamRequests: () => Promise<UpstreamRequest[]>;
}

/** Playwright `test` for the web app: fresh fake API data per test and no unexpected browser errors. */
export const test = base.extend<E2eFixtures>({
  whitelistErrors: [[], { option: true }],
  upstreamRequests: [
    async ({ playwright }, use) => {
      const api = await playwright.request.newContext({ baseURL: mockApiOrigin });
      expect((await api.post('/__e2e/reset')).status()).toBe(204);
      await use(async () => (await (await api.get('/__e2e/requests')).json()) as UpstreamRequest[]);
      await api.dispose();
    },
    { auto: true },
  ],
  page: async ({ page, whitelistErrors }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use(page);
    const unexpected = errors.filter(
      (error) =>
        !whitelistErrors.some((allowed) =>
          typeof allowed === 'string' ? error.includes(allowed) : allowed.test(error),
        ),
    );
    expect(unexpected).toEqual([]);
  },
});

export { expect };
