// Fake .NET API for E2E tests. The built web app relays to it through `API_ORIGIN`, so every browser request passes
// the real BFF. Runs with Node's type stripping: `node src/test/e2e/mock-api/server.ts`.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { getResponse } from 'msw';

import { mockApiOrigin } from './config.ts';
import { handlers, resetMockApi } from './handlers.ts';

/** A request as the BFF sent it upstream; the bearer token itself is never recorded. */
export interface UpstreamRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
}

let upstreamRequests: UpstreamRequest[] = [];

async function toRequest(message: IncomingMessage) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(message.headers)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      headers.append(name, item);
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of message) {
    chunks.push(chunk as Buffer);
  }
  const method = message.method ?? 'GET';
  return new Request(new URL(message.url ?? '/', mockApiOrigin), {
    method,
    headers,
    body: ['GET', 'HEAD'].includes(method) ? undefined : Buffer.concat(chunks),
  });
}

async function handle(request: Request) {
  const { pathname } = new URL(request.url);
  if (pathname === '/__e2e/health') {
    return new Response('ok');
  }
  if (pathname === '/__e2e/reset' && request.method === 'POST') {
    resetMockApi();
    upstreamRequests = [];
    return new Response(null, { status: 204 });
  }
  if (pathname === '/__e2e/requests') {
    return Response.json(upstreamRequests);
  }

  upstreamRequests.push({
    method: request.method,
    path: pathname,
    headers: Object.fromEntries(
      [...request.headers].map(([name, value]) => [name, name === 'authorization' ? value.split(' ')[0] : value]),
    ),
  });
  // Like the real API, nothing is answered without the bearer token the BFF attaches.
  if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
    return Response.json({ status: 401, title: 'Unauthorized' }, { status: 401 });
  }
  return (await getResponse(handlers, request)) ?? Response.json({ status: 404, title: 'Not mocked' }, { status: 404 });
}

async function respond(message: IncomingMessage, response: ServerResponse) {
  try {
    const result = await handle(await toRequest(message));
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(error);
    response.writeHead(500).end();
  }
}

const { hostname, port } = new URL(mockApiOrigin);
createServer((message, response) => void respond(message, response)).listen(Number(port), hostname, () =>
  console.log(`E2E mock API: ${mockApiOrigin}`),
);
