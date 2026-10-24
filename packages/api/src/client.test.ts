import { afterEach, expect, test, vi } from 'vite-plus/test';

import * as accountsApi from './accounts/requests';
import { configureApiClient, createApiClient } from './client';
import { ApiError } from './errors';

afterEach(() => vi.unstubAllGlobals());

test('isolated API clients never share authentication callbacks', async () => {
  const tokens: Array<string | null> = [];
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
    tokens.push((input as Request).headers.get('Authorization'));
    return Response.json({ status: 'Ready' });
  });
  const alice = createApiClient({ baseUrl: 'https://api.example.test', fetch, getAuthToken: () => 'alice' });
  const bob = createApiClient({ baseUrl: 'https://api.example.test', fetch, getAuthToken: () => 'bob' });
  await Promise.all([alice.GET('/api/users/me'), bob.GET('/api/users/me')]);
  expect(tokens.toSorted((left, right) => (left ?? '').localeCompare(right ?? ''))).toEqual([
    'Bearer alice',
    'Bearer bob',
  ]);
});

test('the same-origin BFF transport does not add a bearer header', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({ status: 'Ready' }));
  const browser = createApiClient({ baseUrl: 'https://app.example.test', fetch });
  await browser.GET('/api/users/me');
  expect((fetch.mock.calls[0][0] as Request).headers.has('Authorization')).toBe(false);
});

function respond(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  configureApiClient({ baseUrl: 'https://api.example.test', getAuthToken: () => null });
}

test('deleting an account accepts a successful response without a body', async () => {
  respond(new Response(null, { status: 204 }));
  await expect(accountsApi.remove('space', 'account')).resolves.toBeUndefined();
});

test('the same middleware raises problem details for reads and bodyless mutations', async () => {
  const problem = { status: 403, title: 'Forbidden', detail: 'No permission for this account' };
  for (const request of [() => accountsApi.list('space'), () => accountsApi.remove('space', 'account')]) {
    respond(Response.json(problem, { status: 403 }));
    await expect(request()).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: problem.detail,
      error: problem,
    });
  }
});

test.each([
  { body: 'Gateway unavailable', expected: 'Gateway unavailable' },
  { body: null, expected: 'Bad Gateway' },
])('handles non-JSON and empty HTTP failures: $body', async ({ body, expected }) => {
  respond(new Response(body, { status: 502, statusText: 'Bad Gateway' }));
  await expect(accountsApi.remove('space', 'account')).rejects.toBeInstanceOf(ApiError);
  respond(new Response(body, { status: 502, statusText: 'Bad Gateway' }));
  await expect(accountsApi.list('space')).rejects.toMatchObject({ status: 502, message: expected });
});

test('lists every validation message of a validation problem', async () => {
  const problem = {
    status: 400,
    title: 'One or more validation errors occurred.',
    errors: { Name: ["E0004: 'Name' must be set", "E0004: 'Name' is too short"], Color: ['E0004: Invalid color'] },
  };
  respond(Response.json(problem, { status: 400 }));
  const error = await accountsApi.list('space').catch((thrown: unknown) => thrown);

  expect(ApiError.isApiError(error) && error.getErrorsString()).toBe(
    "E0004: 'Name' must be set, E0004: 'Name' is too short, E0004: Invalid color",
  );
});

test('does not send or store a correlation id', async () => {
  respond(new Response(null, { status: 204, headers: { 'X-Correlation-Id': 'server-id' } }));
  await accountsApi.remove('space', 'account');
  respond(new Response(null, { status: 204 }));
  await accountsApi.remove('space', 'account');

  const [request] = vi.mocked(fetch).mock.calls[0] as [Request];
  expect(request.headers.has('X-Correlation-Id')).toBe(false);
  expect(new URL(request.url).pathname).toBe('/api/spaces/space/accounts/account');
});
