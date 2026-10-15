import { ApiError, type ApiProblemDetails } from '@kijk/api/errors';
import type { paths } from '@kijk/api/generated/kijk';
import createClient from 'openapi-fetch';
import type { Client, Middleware } from 'openapi-fetch';

/** Settings an app passes once at startup, before it sends the first request. */
export interface ApiClientOptions {
  /** Base URL of the Kijk API, without the `/api` prefix. */
  baseUrl: string;
  /** Returns the bearer token of the signed-in user, or nothing while signed out. */
  getAuthToken: () => Promise<string | null | undefined> | string | null | undefined;
}

let client: Client<paths> | undefined;

/**
 * Creates the API client. It is generated from the OpenAPI specification with openapi-fetch; the types are {@link paths}
 * from the generated API types file.
 */
export function configureApiClient(options: ApiClientOptions) {
  client = createClient<paths>({ baseUrl: options.baseUrl });
  client.use(createAuthMiddleware(options.getAuthToken), apiResponseMiddleware);
}

/** Returns the API client configured with {@link configureApiClient}. */
export function apiClient() {
  if (!client) {
    throw new Error('The API client is not configured. Call configureApiClient() before sending requests.');
  }

  return client;
}

// ##### Middlewares #####

function createAuthMiddleware(getAuthToken: ApiClientOptions['getAuthToken']): Middleware {
  return {
    async onRequest({ request }) {
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${(await getAuthToken()) ?? ''}`);

      if (request.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      return new Request(request, { headers });
    },
    onError({ error }) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error(error);
    },
  };
}

const apiResponseMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) {
      return response;
    }

    throw new ApiError(await readApiError(response), response);
  },
};

async function readApiError(response: Response) {
  const error = await response.clone().text();
  if (!error) {
    return { status: response.status, title: response.statusText } satisfies ApiProblemDetails;
  }

  try {
    return JSON.parse(error) as ApiProblemDetails;
  } catch {
    return { detail: error, status: response.status, title: response.statusText } satisfies ApiProblemDetails;
  }
}
