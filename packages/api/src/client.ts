import { ApiError, type ApiProblemDetails } from '@kijk/api/errors';
import {
  createClient,
  toRequestInit,
  type ClientInstance,
  type DecodedResponse,
} from '@kijk/api/generated/.kubb/client';

/** Settings an app passes once at startup, before it sends the first request. */
export interface ApiClientOptions {
  /** Base URL of the Kijk API, without the `/api` prefix. */
  baseUrl: string;
  /** Returns the bearer token of the signed-in user, or nothing while signed out. */
  getAuthToken?: () => Promise<string | null | undefined> | string | null | undefined;
  /** Fetch implementation supplied by a browser, native runtime, or isolated server request. */
  fetch?: typeof globalThis.fetch;
  /** Headers sent with every request, such as the CSRF marker a backend for frontend requires. */
  headers?: Record<string, string>;
}

let client: ClientInstance | undefined;

/**
 * Creates the API client. Its request functions are generated from the OpenAPI specification with Kubb
 * (`@kijk/api/generated/sdk`); every request function takes the client as its `client` option.
 */
export function configureApiClient(options: ApiClientOptions) {
  client = createApiClient(options);
}

/** Creates an isolated client; server requests must use their own instance rather than the browser default. */
export function createApiClient(options: ApiClientOptions) {
  const { getAuthToken, fetch = (...args) => globalThis.fetch(...args) } = options;
  const instance = createClient({
    baseURL: options.baseUrl,
    headers: options.headers,
    auth: getAuthToken ? async () => (await getAuthToken()) ?? undefined : undefined,
    transport: async (request) => {
      const nativeRequest = new Request(request.url, toRequestInit(request));
      const response = await fetch(nativeRequest);
      return { webResponse: response, request: nativeRequest, response };
    },
  });
  instance.interceptors.response.use(raiseApiError);
  instance.interceptors.error.use(logError);
  return instance;
}

/** Returns the API client configured with {@link configureApiClient}. */
export function apiClient() {
  if (!client) {
    throw new Error('The API client is not configured. Call configureApiClient() before sending requests.');
  }

  return client;
}

// ##### Interceptors #####

/** Turns every failed response into an {@link ApiError}, including calls that read the full result. */
function raiseApiError(result: DecodedResponse) {
  if (result.status >= 200 && result.status < 300) {
    return result;
  }

  throw new ApiError(readApiError(result), result.response, result.request);
}

function readApiError({ data, status, statusText }: DecodedResponse): ApiProblemDetails {
  if (data === undefined || data === null || data === '') {
    return { status, title: statusText };
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as ApiProblemDetails;
    } catch {
      return { detail: data, status, title: statusText };
    }
  }

  return data as ApiProblemDetails;
}

function logError(error: Error) {
  if (error.name !== 'AbortError' && !ApiError.isApiError(error)) {
    console.error(error);
  }
}
