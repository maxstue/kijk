import { browserStorage } from '@kijk/core/lib/browser-storage';
import createClient from 'openapi-fetch';
import type { Middleware } from 'openapi-fetch';

import type { components, paths } from '@/shared/api/generated/kijk';
import { config } from '@/shared/config';
import { getAuthToken } from '@/shared/lib/auth-client';
import { CORRELATION_ID_HEADER } from '@/shared/types/app';

type ApiProblem = components['schemas']['Problem'] & {
  correlationId?: string;
  errorType?: string;
  errors?: unknown;
  requestId?: string;
  timestamp?: string;
  traceId?: string;
};

type ApiResponse<TData, TError> =
  | {
      data: TData;
      error?: never;
      response: Response;
    }
  | {
      data?: never;
      error: TError;
      response: Response;
    };

class ApiClientError<TError = ApiProblem> extends Error {
  error: TError;
  response: Response;
  status: number;

  constructor(error: TError, response: Response) {
    super(getErrorMessage(error, response));
    this.name = 'ApiClientError';
    this.error = error;
    this.response = response;
    this.status = response.status;
  }
}

function getErrorMessage(error: unknown, response: Response) {
  if (isApiProblem(error)) {
    return error.detail ?? error.title ?? response.statusText;
  }

  return response.statusText;
}

function isApiProblem(error: unknown): error is ApiProblem {
  return typeof error === 'object' && error !== null;
}

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

const apiClient = createClient<paths>({
  baseUrl: config.BaseApiUrl,
});

apiClient.use(authMiddleware);

function unwrapApiResponse<TData, TError>(result: ApiResponse<TData, TError>) {
  if (result.error) {
    throw new ApiClientError(result.error, result.response);
  }

  if (result.data === undefined) {
    throw new ApiClientError(
      { status: result.response.status, title: 'Empty API response' } as TError,
      result.response,
    );
  }

  return result.data;
}

export { ApiClientError, apiClient, unwrapApiResponse };
export type { ApiProblem };
