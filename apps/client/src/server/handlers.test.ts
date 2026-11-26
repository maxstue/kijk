import { auth } from '@clerk/tanstack-react-start/server';
import { afterEach, expect, test, vi } from 'vite-plus/test';

import { relayApiRequest } from './handlers';

vi.mock('@clerk/tanstack-react-start/server', () => ({ auth: vi.fn<typeof auth>() }));

afterEach(() => {
  vi.unstubAllEnvs();
});

function request() {
  return new Request('https://app.example.test/api/users/me', { headers: { 'X-CSRF': '1' } });
}

function signIn() {
  vi.stubEnv('CLERK_SECRET_KEY', 'configured-for-test');
  vi.mocked(auth).mockResolvedValue({ userId: 'user', getToken: async () => 'verified' } as Awaited<
    ReturnType<typeof auth>
  >);
}

test('keeps missing API_URL details in server logs and returns user-facing Problem Details', async () => {
  signIn();
  vi.stubEnv('API_URL', '');
  const fetch = vi.spyOn(globalThis, 'fetch');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const response = await relayApiRequest(request());
  expect(response.status).toBe(503);
  expect(response.headers.get('content-type')).toBe('application/problem+json');
  expect(await response.json()).toEqual({
    type: 'about:blank',
    title: 'Service Unavailable',
    status: 503,
    detail: 'You are signed in, but your account could not be loaded. Please try again later.',
    instance: '/api/users/me',
  });
  expect(fetch).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith('BFF configuration error: API_URL is missing.');
});

test('reports missing authentication configuration separately from a missing session', async () => {
  vi.stubEnv('CLERK_SECRET_KEY', '');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const response = await relayApiRequest(request());
  expect(response.status).toBe(503);
  expect((await response.json()).detail).toBe('Sign-in is temporarily unavailable. Please try again later.');
  expect(log).toHaveBeenCalledWith('BFF configuration error: CLERK_SECRET_KEY is missing.');
});

test('asks anonymous users to sign in again', async () => {
  vi.stubEnv('CLERK_SECRET_KEY', 'configured-for-test');
  vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);
  const response = await relayApiRequest(request());
  expect(response.status).toBe(401);
  expect((await response.json()).detail).toContain('Please sign in again');
});

test('forwards to API_URL after verifying the session', async () => {
  signIn();
  vi.stubEnv('API_URL', 'http://backend.example.test:5140');
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ id: 'user' }));
  const response = await relayApiRequest(request());
  expect(response.status).toBe(200);
  expect((fetch.mock.calls[0][0] as URL).href).toBe('http://backend.example.test:5140/api/users/me');
});
