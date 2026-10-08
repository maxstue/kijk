import type { components } from '@/shared/api/generated/kijk';

/** Problem details returned by the API, including Kijk's extension fields. */
export type ApiProblemDetails = components['schemas']['Problem'] & {
  correlationId?: string;
  errorType?: string;
  errors?: ApiProblemDetailsError[];
  requestId?: string;
  timestamp?: string;
  traceId?: string;
};

/** A single validation error inside problem details. */
export interface ApiProblemDetailsError {
  type: string;
  code: string;
  description: string;
}

/** Response header with the request's correlation id. */
export const CORRELATION_ID_HEADER = 'X-Correlation-Id';
