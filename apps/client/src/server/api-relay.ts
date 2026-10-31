import { apiOperations } from '@kijk/api/generated/operations';

import { bffRequestHeader } from '@/shared/lib/api-client';

import { apiProblem } from './problem';

const maxUploadBytes = 16 * 1024 * 1024;
const readMethods = new Set(['GET', 'HEAD']);
const forwardedRequestHeaders = ['accept', 'content-type'];
const forwardedResponseHeaders = ['content-type', 'content-disposition', 'retry-after'];
const operations = Object.entries(apiOperations) as Array<[string, readonly string[]]>;

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
  apiUrl: string;
  token: string;
  fetch?: typeof globalThis.fetch;
}

/** Forwards a verified user's request to one fixed backend, streaming bodies and file responses. */
export async function forwardApiRequest(request: Request, options: RelayOptions) {
  const url = new URL(request.url);
  if (!matchApiOperation(url.pathname, request.method)) {
    return apiProblem(request, 404, 'This API path and HTTP method are not available through the web application.');
  }
  if (!options.token.trim()) {
    return apiProblem(request, 401, 'Your session could not be verified. Please sign in again.');
  }

  let target: URL;
  try {
    target = new URL(options.apiUrl);
    if (
      !['http:', 'https:'].includes(target.protocol) ||
      target.username ||
      target.password ||
      target.pathname !== '/' ||
      target.search ||
      target.hash
    ) {
      throw new Error('Invalid API_URL');
    }
  } catch {
    console.error(
      'BFF configuration error: API_URL must be an HTTP(S) origin without credentials, a path, query parameters or a fragment.',
    );
    return apiProblem(request, 503, 'Your account is temporarily unavailable. Please try again later.');
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
      return apiProblem(request, 413, 'The upload exceeds the 16 MiB request limit. Please choose a smaller file.');
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

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]);
  try {
    const response = await (options.fetch ?? globalThis.fetch)(target, {
      method: request.method,
      headers,
      body,
      duplex: 'half',
      redirect: 'error',
      signal,
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
    if (tooLarge) {
      return apiProblem(request, 413, 'The upload exceeds the 16 MiB request limit. Please choose a smaller file.');
    }
    if (signal.aborted && !request.signal.aborted) {
      return apiProblem(request, 504, 'The service did not respond in time. Please try again shortly.');
    }
    return apiProblem(request, 502, 'We could not reach the service. Please try again shortly.');
  }
}
