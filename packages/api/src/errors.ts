import { ResponseError } from '@kijk/api/generated/.kubb/client';
import type * as Api from '@kijk/api/generated/types';

/** Problem details returned by the API, including Kijk's extension fields. */
export type ApiProblemDetails = Api.Problem & {
  correlationId?: string;
  errorType?: string;
  /** Validation messages per request property. */
  errors?: Record<string, string[]>;
  timestamp?: string;
  traceId?: string;
};

/**
 * An error response of the Kijk API with its problem details. It extends the generated Kubb `ResponseError`, so the
 * error type that generated request and query helpers declare is the error that the API client actually throws. Its
 * `name` stays `ApiError`; check it with {@link ApiError.isApiError}, not with Kubb's name-based `isResponseError`.
 */
export class ApiError extends ResponseError<ApiProblemDetails> {
  constructor(problem: ApiProblemDetails, response: Response, request: Request) {
    super({
      data: problem,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('Content-Type') ?? undefined,
      headers: response.headers,
      request,
      response,
    });
    this.name = 'ApiError';
    this.message = problem.detail ?? problem.title ?? response.statusText;
  }

  public static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  public getErrorsString() {
    const messages = Object.values(this.data.errors ?? {}).flat();
    if (messages.length > 0) {
      return messages.join(', ');
    }

    return `${this.data.status} ${this.data.title}`;
  }
}
