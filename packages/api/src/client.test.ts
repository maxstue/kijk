import { afterEach, expect, test, vi } from 'vite-plus/test';

import { deleteAccount, getAccounts } from './accounts/requests';
import { configureApiClient } from './client';
import { ApiError } from './errors';

afterEach(() => vi.unstubAllGlobals());

function respond(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  configureApiClient({ baseUrl: 'https://api.example.test', getAuthToken: () => null });
}

test('deleting an account accepts a successful response without a body', async () => {
  respond(new Response(null, { status: 204 }));
  await expect(deleteAccount('space', 'account')).resolves.toBeUndefined();
});

test('the same middleware raises problem details for reads and bodyless mutations', async () => {
  const problem = { status: 403, title: 'Forbidden', detail: 'No permission for this account' };
  for (const request of [() => getAccounts('space'), () => deleteAccount('space', 'account')]) {
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
  await expect(deleteAccount('space', 'account')).rejects.toBeInstanceOf(ApiError);
  respond(new Response(body, { status: 502, statusText: 'Bad Gateway' }));
  await expect(getAccounts('space')).rejects.toMatchObject({ status: 502, message: expected });
});

test('lists every validation message of a validation problem', async () => {
  const problem = {
    status: 400,
    title: 'One or more validation errors occurred.',
    errors: { Name: ["E0004: 'Name' must be set", "E0004: 'Name' is too short"], Color: ['E0004: Invalid color'] },
  };
  respond(Response.json(problem, { status: 400 }));
  const error = await getAccounts('space').catch((thrown: unknown) => thrown);

  expect(ApiError.isApiError(error) && error.getErrorsString()).toBe(
    "E0004: 'Name' must be set, E0004: 'Name' is too short, E0004: Invalid color",
  );
});

test('does not send or store a correlation id', async () => {
  respond(new Response(null, { status: 204, headers: { 'X-Correlation-Id': 'server-id' } }));
  await deleteAccount('space', 'account');
  respond(new Response(null, { status: 204 }));
  await deleteAccount('space', 'account');

  const [request] = vi.mocked(fetch).mock.calls[0] as [Request];
  expect(request.headers.has('X-Correlation-Id')).toBe(false);
  expect(new URL(request.url).pathname).toBe('/api/spaces/space/accounts/account');
});
