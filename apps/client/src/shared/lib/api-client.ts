import { browserStorage } from '@kijk/core/lib/browser-storage';
import createClient from 'openapi-fetch';
import type { Middleware } from 'openapi-fetch';

import type { paths } from '@/shared/api/generated/kijk';
import { config } from '@/shared/config';
import { getAuthToken } from '@/shared/lib/auth-client';
import { CORRELATION_ID_HEADER, type ApiProblemDetails } from '@/shared/types/app';
import { ApiError } from '@/shared/types/errors/api-error';

/**
 * A client for making API calls to the backend. It is auto generated using the OpenAPI specification and the
 * openapi-fetch library. The used types are {@link paths} from the generated API types file.
 */
export const apiClient = createClient<paths>({
  baseUrl: config.BaseApiUrl,
});

// ##### Middlewares #####

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${(await getAuthToken()) ?? ''}`);

    if (request.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const correlationId = browserStorage.getItem<string>(CORRELATION_ID_HEADER);
    if (correlationId) {
      headers.set(CORRELATION_ID_HEADER, correlationId);
    }

    return new Request(request, { headers });
  },
  onResponse({ response }) {
    const correlationId = response.headers.get(CORRELATION_ID_HEADER);
    if (correlationId) {
      browserStorage.setItem(CORRELATION_ID_HEADER, correlationId);
    }
    return response;
  },
  onError({ error }) {
    console.error(error);
  },
};

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

apiClient.use(authMiddleware, apiResponseMiddleware);
