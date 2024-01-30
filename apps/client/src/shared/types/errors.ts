export type ErrorType = 'UNKNOWN' | 'AUTHENTICATION' | 'ENVIRONMENT' | 'VALIDATION';

interface CtorType<TData> {
  type: ErrorType;
  message: string;
  cause?: unknown;
  data?: TData;
}

export class AppError<TData = unknown> extends Error {
  type: ErrorType;
  message: string;
  data?: TData;

  constructor({ type, message, cause, data }: CtorType<TData>) {
    super();
    this.type = type;
    this.message = message;
    this.cause = cause;
    this.data = data;
  }
}
