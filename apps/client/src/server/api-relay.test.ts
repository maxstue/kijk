import { expect, test, vi } from 'vite-plus/test';

import { forwardApiRequest, hasBffRequestHeader, matchApiOperation } from './api-relay';

function write(path = '/api/spaces/space/resources', options: RequestInit = {}) {
  return new Request(`https://app.example.test${path}`, {
    method: 'POST',
    headers: { origin: 'https://app.example.test' },
    ...options,
  });
}

test('forwards only operations declared in the OpenAPI document', () => {
  expect(matchApiOperation('/api/spaces/space/resources', 'POST')).toBe('/api/spaces/{spaceId}/resources');
  expect(matchApiOperation('/api/spaces/space/resources', 'PATCH')).toBeUndefined();
  expect(matchApiOperation('/api/admin', 'GET')).toBeUndefined();
  expect(matchApiOperation('/api/spaces/a%2Fb/resources', 'GET')).toBeUndefined();
});

test('requires the CSRF header that only the same-origin API client sends', () => {
  expect(hasBffRequestHeader(write(undefined, { headers: { 'X-CSRF': '1' } }))).toBe(true);
  expect(hasBffRequestHeader(write())).toBe(false);
  expect(hasBffRequestHeader(write(undefined, { headers: { 'X-CSRF': 'yes' } }))).toBe(false);
});

test('replaces client credentials and preserves multipart uploads exactly', async () => {
  const form = new FormData();
  form.set('accountId', 'account');
  form.set('file', new File(['date,amount\n2026-10-24,12.50'], 'bank.csv', { type: 'text/csv' }));
  const request = write('/api/spaces/space/imports', {
    body: form,
    headers: {
      origin: 'https://app.example.test',
      Authorization: 'Bearer forged',
      Cookie: 'private=cookie',
      'X-User-Id': 'other',
    },
  });
  const expectedBody = await request.clone().text();
  let forwardedBody = '';
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_target, options) => {
    forwardedBody = await new Response(options?.body).text();
    return Response.json({ id: 'import' }, { status: 202 });
  });
  const response = await forwardApiRequest(request, {
    apiOrigin: 'https://api.example.test',
    token: 'verified',
    fetch,
  });
  const [target, options] = fetch.mock.calls[0];
  expect(options).toMatchObject({ duplex: 'half' });
  expect((target as URL).href).toBe('https://api.example.test/api/spaces/space/imports');
  const headers = new Headers(options?.headers);
  expect(headers.get('Authorization')).toBe('Bearer verified');
  expect(headers.get('content-type')).toContain('multipart/form-data; boundary=');
  expect(headers.has('cookie')).toBe(false);
  expect(headers.has('X-User-Id')).toBe(false);
  expect(forwardedBody).toBe(expectedBody);
  expect(response.status).toBe(202);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});

test('preserves file contents and filename but never upstream cookies or caching', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
    new Response('date,value\n', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="readings.csv"',
        'Set-Cookie': 'secret=upstream',
        'Cache-Control': 'public, max-age=999',
      },
    }),
  );
  const response = await forwardApiRequest(
    new Request('https://app.example.test/api/spaces/space/consumptions/export?year=2026'),
    {
      apiOrigin: 'https://api.example.test',
      token: 'verified',
      fetch,
    },
  );
  expect((fetch.mock.calls[0][0] as URL).href).toContain('?year=2026');
  expect(await response.text()).toBe('date,value\n');
  expect(response.headers.get('Content-Disposition')).toContain('readings.csv');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(response.headers.has('set-cookie')).toBe(false);
  expect(fetch.mock.calls[0][1]?.redirect).toBe('error');
});

test('keeps API permission failures and ProblemDetails unchanged', async () => {
  const problem = { status: 403, title: 'Forbidden' };
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(problem, { status: 403 }));
  const response = await forwardApiRequest(new Request('https://app.example.test/api/users/me'), {
    apiOrigin: 'https://api.example.test',
    token: 'verified',
    fetch,
  });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual(problem);
});

test('does not leak upstream errors or retry mutations', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error('sensitive upstream information'));
  const response = await forwardApiRequest(write(), {
    apiOrigin: 'https://api.example.test',
    token: 'verified',
    fetch,
  });
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain('sensitive');
  expect(fetch).toHaveBeenCalledOnce();
});

test('rejects a declared oversized upload before contacting the API', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  const response = await forwardApiRequest(
    write(undefined, { body: 'x', headers: { 'Content-Length': String(16 * 1024 * 1024 + 1) } }),
    { apiOrigin: 'https://api.example.test', token: 'verified', fetch },
  );
  expect(response.status).toBe(413);
  expect(fetch).not.toHaveBeenCalled();
});

test('aborts a streamed upload that exceeds the limit without Content-Length', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_target, options) => {
    await new Response(options?.body).arrayBuffer();
    return new Response(null, { status: 202 });
  });
  const response = await forwardApiRequest(write(undefined, { body: new Uint8Array(16 * 1024 * 1024 + 1) }), {
    apiOrigin: 'https://api.example.test',
    token: 'verified',
    fetch,
  });
  expect(response.status).toBe(413);
});

test('concurrent requests keep user credentials isolated', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_url, options) =>
    Response.json({
      auth: new Headers(options?.headers).get('Authorization'),
    }),
  );
  const responses = await Promise.all(
    ['alice', 'bob'].map((token) =>
      forwardApiRequest(new Request('https://app.example.test/api/users/me'), {
        apiOrigin: 'https://api.example.test',
        token,
        fetch,
      }),
    ),
  );
  expect(await Promise.all(responses.map((response) => response.json()))).toEqual([
    { auth: 'Bearer alice' },
    { auth: 'Bearer bob' },
  ]);
});
