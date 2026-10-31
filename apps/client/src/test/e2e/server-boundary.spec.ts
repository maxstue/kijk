import { expect, test } from './fixtures';
import { appOrigin } from './mock-api/config';

// Requests through APIRequestContext skip the browser and exercise the built Start server directly.
const bffHeaders = { 'sec-fetch-site': 'same-origin', 'x-csrf': '1' };
const spaceId = '00000000-0000-4000-8000-000000000003';

test.describe('signed in', () => {
  test.use({ storageState: 'playwright/.clerk/user.json' });

  // Loading the app first lets Clerk refresh the short-lived session cookie that page.request reuses.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });

  test('relays reads with a server-side token and without browser credentials', async ({ page, upstreamRequests }) => {
    const response = await page.request.get('/api/users/me', { headers: bffHeaders });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');

    const forwarded = (await upstreamRequests()).filter((request) => request.path === '/api/users/me');
    expect(forwarded.length).toBeGreaterThan(0);
    for (const request of forwarded) {
      expect(request.headers.authorization).toBe('Bearer');
      expect(request.headers).not.toHaveProperty('cookie');
      expect(request.headers).not.toHaveProperty('x-csrf');
    }
  });

  test('streams multipart uploads to the API unchanged', async ({ page }) => {
    const file = Buffer.from('date,amount\n2026-10-24,12.50\n');
    const response = await page.request.post(`/api/spaces/${spaceId}/imports`, {
      headers: bffHeaders,
      multipart: { accountId: 'account', file: { name: 'bank.csv', mimeType: 'text/csv', buffer: file } },
    });
    expect(response.status()).toBe(202);
    expect(await response.json()).toEqual({ fileName: 'bank.csv', size: file.byteLength });
  });

  test('rejects oversized uploads before they reach the API', async ({ page, upstreamRequests }) => {
    const response = await page.request.post(`/api/spaces/${spaceId}/imports`, {
      headers: bffHeaders,
      multipart: {
        file: { name: 'large.csv', mimeType: 'text/csv', buffer: Buffer.alloc(16 * 1024 * 1024 + 1) },
      },
    });
    expect(response.status()).toBe(413);
    expect((await upstreamRequests()).some((request) => request.path.endsWith('/imports'))).toBe(false);
  });

  test('passes file downloads through without upstream cookies', async ({ page }) => {
    const response = await page.request.get(`/api/spaces/${spaceId}/consumptions/export?year=2026`, {
      headers: bffHeaders,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toContain('readings.csv');
    expect(response.headers()).not.toHaveProperty('set-cookie');
    expect(await response.text()).toBe('date,value\n');
  });

  test('forwards only operations of the OpenAPI document', async ({ page, upstreamRequests }) => {
    const response = await page.request.get('/api/admin', { headers: bffHeaders });
    expect(response.status()).toBe(404);
    expect((await upstreamRequests()).some((request) => request.path === '/api/admin')).toBe(false);
  });

  test('rejects same-origin requests without the CSRF header', async ({ page }) => {
    const response = await page.request.get('/api/users/me', { headers: { 'sec-fetch-site': 'same-origin' } });
    expect(response.status()).toBe(403);
  });
});

test('rejects cross-site requests before contacting the API', async ({ playwright, upstreamRequests }) => {
  const client = await playwright.request.newContext({ baseURL: appOrigin });
  try {
    const response = await client.post('/api/users/me/feedback', {
      headers: { ...bffHeaders, 'sec-fetch-site': 'cross-site', origin: 'https://other.example' },
      data: { message: 'Must never reach the API' },
    });
    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('Forbidden');
    expect(await upstreamRequests()).toEqual([]);
  } finally {
    await client.dispose();
  }
});

test('rejects anonymous data requests', async ({ playwright, upstreamRequests }) => {
  const anonymous = await playwright.request.newContext({
    baseURL: appOrigin,
    storageState: { cookies: [], origins: [] },
  });
  try {
    const response = await anonymous.get('/api/users/me', { headers: bffHeaders });
    expect(response.status()).toBe(401);
    expect(await upstreamRequests()).toEqual([]);
  } finally {
    await anonymous.dispose();
  }
});
