export type ErrorType = 'UNKNOWN' | 'AUTHENTICATION' | 'ENVIRONMENT' | 'VALIDATION';

interface CtorType<TData> {
  type: ErrorType;
  message: string;
  cause?: unknown;
  data?: TData;
}

/** Base error class for the application. All custom errors should extend this class. */
export class AppError<TData = unknown> extends Error {
  type: ErrorType;
  message: string;
  data?: TData;

  constructor({ type, message, cause, data }: CtorType<TData>) {
    super();
    this.name = 'AppError';
    this.type = type;
    this.message = message;
    this.cause = cause;
    this.data = data;
  }
}
