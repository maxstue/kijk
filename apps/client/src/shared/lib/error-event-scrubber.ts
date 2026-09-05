import type { ErrorEvent } from '@sentry/react';

type TransactionEvent = Parameters<
  NonNullable<Parameters<(typeof import('@sentry/react'))['init']>[0]['beforeSendTransaction']>
>[0];

const filteredValue = '[Filtered]';

/**
 * Reduces a browser error event to the technical fields needed to group and diagnose a failure. User input, navigation
 * data and arbitrary extras are deliberately discarded instead of relying on field-name based redaction.
 */
export function scrubErrorEvent(event: ErrorEvent): ErrorEvent {
  const exception = event.exception?.values?.map((value) => ({
    module: value.module,
    stacktrace: value.stacktrace
      ? {
          frames: value.stacktrace.frames?.map((frame) => ({
            colno: frame.colno,
            filename: stripUrlData(frame.filename),
            function: frame.function,
            in_app: frame.in_app,
            lineno: frame.lineno,
            module: frame.module,
          })),
        }
      : undefined,
    type: value.type,
    value: filteredValue,
  }));

  return {
    dist: event.dist,
    environment: event.environment,
    event_id: event.event_id,
    exception: exception ? { values: exception } : undefined,
    level: event.level,
    platform: event.platform,
    release: event.release,
    timestamp: event.timestamp,
    type: undefined,
  };
}

export function scrubPerformanceSpan<T extends { data?: Record<string, unknown>; description?: string }>(span: T): T {
  return {
    ...span,
    data: {},
    description: sanitizeRouteName(span.description),
  };
}

export function scrubPerformanceTransaction(event: TransactionEvent): TransactionEvent {
  return {
    ...event,
    breadcrumbs: undefined,
    contexts: {},
    extra: undefined,
    request: undefined,
    spans: event.spans?.map(scrubPerformanceSpan),
    tags: undefined,
    transaction: sanitizeRouteName(event.transaction),
    user: undefined,
  };
}

function stripUrlData(value: string | undefined) {
  if (!value) return value;

  const dataStart = value.search(/[?#]/);
  return dataStart === -1 ? value : value.slice(0, dataStart);
}

function sanitizeRouteName(routeName: string | undefined) {
  if (!routeName) return 'route';
  if (!routeName.includes('$')) return routeName;
  return routeName.replaceAll(/\$[^/]+/g, ':parameter');
}
