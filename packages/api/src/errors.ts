import type { components } from '@kijk/api/generated/kijk';

/** Problem details returned by the API, including Kijk's extension fields. */
export type ApiProblemDetails = components['schemas']['Problem'] & {
  correlationId?: string;
  errorType?: string;
  /** Validation messages per request property. */
  errors?: Record<string, string[]>;
  timestamp?: string;
  traceId?: string;
};

/**
 * Represents an error that occurs during an API call. This error includes the details of the API problem, the original
 * response, and the HTTP status code.
 */
export class ApiError extends Error {
  error: ApiProblemDetails;
  response: Response;
  status: number;

  constructor(error: ApiProblemDetails, response: Response) {
    super();
    this.name = 'ApiError';
    this.error = error;
    this.response = response;
    this.status = response.status;
    this.message = this.getErrorMessage(error, response);
  }

  public static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  public getErrorsString() {
    const messages = Object.values(this.error.errors ?? {}).flat();
    if (messages.length > 0) {
      return messages.join(', ');
    }

    return `${this.error.status} ${this.error.title}`;
  }

  getErrorMessage(error: unknown, response: Response) {
    if (this.isApiProblemDetail(error)) {
      return error.detail ?? error.title ?? response.statusText;
    }

    return response.statusText;
  }

  isApiProblemDetail(error: unknown): error is ApiProblemDetails {
    return typeof error === 'object' && error !== null && 'status' in error && 'title' in error;
  }
}
