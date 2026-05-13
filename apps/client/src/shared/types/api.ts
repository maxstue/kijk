import type { components } from '@/shared/api/generated/kijk';
import type { Optional } from '@/shared/types/common';

export type ApiProblemDetails = components['schemas']['Problem'] & {
  correlationId?: string;
  errorType?: string;
  errors?: Optional<ApiProblemDetailsError[]>;
  requestId?: string;
  timestamp?: string;
  traceId?: string;
};

export interface ApiProblemDetailsError {
  type: string;
  code: string;
  description: string;
}

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';
