import { apiOperations } from '@kijk/api/generated/operations';

import { bffRequestHeader } from '@/shared/lib/api-client';

const maxUploadBytes = 16 * 1024 * 1024;
const readMethods = new Set(['GET', 'HEAD']);
const forwardedRequestHeaders = ['accept', 'content-type'];
const forwardedResponseHeaders = ['content-type', 'content-disposition', 'retry-after'];
const operations = Object.entries(apiOperations) as Array<[string, readonly string[]]>;

/** Produces an uncached response without exposing upstream details. */
export function apiProblem(status: number, title: string) {
  return Response.json({ status, title }, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Checks the CSRF marker that the browser API client sends with every request. */
export function hasBffRequestHeader(request: Request) {
  return request.headers.get(bffRequestHeader.name) === bffRequestHeader.value;
}

/** Returns the OpenAPI path template of an operation the API declares; other paths are never forwarded. */
export function matchApiOperation(path: string, method: string) {
  if (/%2f|%5c|\\/i.test(path)) {
    return undefined;
  }
  const actual = path.split('/');
  const verb = method.toLowerCase();
  return operations.find(([pattern, methods]) => {
    const segments = pattern.split('/');
    return (
      methods.includes(verb) &&
      segments.length === actual.length &&
      segments.every((segment, index) => (segment.startsWith('{') ? Boolean(actual[index]) : segment === actual[index]))
    );
  })?.[0];
}

interface RelayOptions {
  apiOrigin: string;
  token: string;
  fetch?: typeof globalThis.fetch;
}

/** Forwards a verified user's request to one fixed backend, streaming bodies and file responses. */
export async function forwardApiRequest(request: Request, options: RelayOptions) {
  const url = new URL(request.url);
  if (!matchApiOperation(url.pathname, request.method)) {
    return apiProblem(404, 'Not found');
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
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  let tooLarge = false;
  let body: ReadableStream<Uint8Array> | undefined;
  if (!readMethods.has(request.method) && request.body) {
    if (Number(request.headers.get('content-length')) > maxUploadBytes) {
      return apiProblem(413, 'Upload too large');
    }
    let length = 0;
    body = request.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          length += chunk.byteLength;
          if (length > maxUploadBytes) {
            tooLarge = true;
            controller.error(new RangeError('Upload too large'));
            return;
          }
          controller.enqueue(chunk);
        },
      }),
    );
  }

  try {
    const response = await (options.fetch ?? globalThis.fetch)(target, {
      method: request.method,
      headers,
      body,
      duplex: 'half',
      redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    } as RequestInit);
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of forwardedResponseHeaders) {
      const value = response.headers.get(name);
      if (value) {
        responseHeaders.set(name, value);
      }
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return tooLarge ? apiProblem(413, 'Upload too large') : apiProblem(502, 'The API is currently unavailable');
  }
}
