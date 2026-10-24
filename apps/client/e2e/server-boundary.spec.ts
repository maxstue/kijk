import { expect, test } from '@playwright/test';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('the server verifies the real Clerk session without returning credentials', async ({ context }) => {
  // APIRequestContext bypasses the browser's MSW worker and exercises the real Start server.
  const response = await context.request.get('/api/session');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  const identity = (await response.json()) as Record<string, unknown>;
  expect(Object.keys(identity).sort()).toEqual(['id', 'userId']);
  expect(identity.userId).toEqual(expect.any(String));

  const spoofed = await context.request.get('/api/session', { headers: { 'X-User-Id': 'someone-else' } });
  expect(await spoofed.json()).toEqual(identity);
});

test('the real BFF rejects a cross-origin mutation before contacting the API', async ({ context }) => {
  const response = await context.request.post('/api/users/me/feedback', {
    headers: { origin: 'https://other.example' },
    data: { message: 'Must never reach the API' },
  });
  expect(response.status()).toBe(403);
});

test('the real BFF rejects anonymous data requests', async ({ playwright }) => {
  const anonymous = await playwright.request.newContext({
    baseURL: 'http://127.0.0.1:5004',
    storageState: { cookies: [], origins: [] },
  });
  try {
    const response = await anonymous.get('/api/users/me');
    expect(response.status()).toBe(401);
  } finally {
    await anonymous.dispose();
  }
});
