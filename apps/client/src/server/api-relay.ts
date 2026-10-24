import { allowedApiOperations } from './api-operations';

const maxUploadBytes = 16 * 1024 * 1024;
const readMethods = new Set(['GET', 'HEAD']);

/** Produces an uncached response without exposing upstream details. */
export function apiProblem(status: number, title: string) {
  return Response.json({ status, title }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Validates cookie-authenticated writes independently of server-function middleware. */
export function isSameOriginWrite(request: Request, webOrigin?: string) {
  if (readMethods.has(request.method)) {
    return true;
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return false;
  }
  const source = request.headers.get('origin') ?? request.headers.get('referer');
  if (!source) {
    return false;
  }
  try {
    return new URL(source).origin === (webOrigin ?? new URL(request.url).origin);
  } catch {
    return false;
  }
}

/** Only the existing API's explicit paths and HTTP operations are forwarded. */
export function isAllowedApiOperation(path: string, method: string) {
  if (/%2f|%5c|\\/i.test(path)) {
    return false;
  }
  return allowedApiOperations.some(([pattern, methods]) => {
    const segments = pattern.split('/');
    const actual = path.split('/');
    return (
      methods.includes(method.toLowerCase()) &&
      segments.length === actual.length &&
      segments.every((segment, index) => (segment.startsWith('{') ? Boolean(actual[index]) : segment === actual[index]))
    );
  });
}

interface RelayOptions {
  apiOrigin: string;
  token: string;
  webOrigin?: string;
  fetch?: typeof globalThis.fetch;
}

/** Forwards a verified user's request to one fixed backend, preserving bodies and file responses. */
export async function forwardApiRequest(request: Request, options: RelayOptions) {
  const url = new URL(request.url);
  if (!isAllowedApiOperation(url.pathname, request.method)) {
    return apiProblem(404, 'Not found');
  }
  if (!isSameOriginWrite(request, options.webOrigin)) {
    return apiProblem(403, 'Cross-origin request rejected');
  }
  if (!options.token.trim()) {
    return apiProblem(401, 'Authentication required');
  }

  const target = new URL(options.apiOrigin);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
    throw new Error('API_ORIGIN must be an HTTP origin without credentials.');
  }
  target.pathname = url.pathname;
  target.search = url.search;
  target.hash = '';

  const headers = new Headers({ Authorization: `Bearer ${options.token}` });
  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  let body: Uint8Array<ArrayBuffer> | undefined;
  if (!readMethods.has(request.method) && request.body) {
    if (Number(request.headers.get('content-length')) > maxUploadBytes) {
      return apiProblem(413, 'Upload too large');
    }
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      length += chunk.value.byteLength;
      if (length > maxUploadBytes) {
        await reader.cancel();
        return apiProblem(413, 'Upload too large');
      }
      chunks.push(chunk.value);
    }
    body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }

  try {
    const response = await (options.fetch ?? globalThis.fetch)(target, {
      method: request.method,
      headers,
      body,
      redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'content-disposition', 'retry-after']) {
      const value = response.headers.get(name);
      if (value) {
        responseHeaders.set(name, value);
      }
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return apiProblem(502, 'The API is currently unavailable');
  }
}
