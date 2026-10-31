import type { ErrorEvent } from '@sentry/react';
import type { CaptureResult } from 'posthog-js';

const filteredValue = '[Filtered]';

/** Properties of a PostHog `$exception` event that survive scrubbing: the project token, SDK identity and the error. */
const allowedPosthogProperties = new Set([
  '$exception_level',
  '$exception_list',
  '$lib',
  '$lib_version',
  '$process_person_profile',
  'distinct_id',
  'token',
  'trace_id',
]);

type Frame = Record<string, unknown>;

/**
 * Reduces a browser error event to the technical fields needed to group and diagnose a failure. User input, navigation
 * data and arbitrary extras are deliberately discarded instead of relying on field-name based redaction.
 */
export function scrubErrorEvent(event: ErrorEvent): ErrorEvent {
  const exception = event.exception?.values?.map((value) => ({
    module: stripUrlData(value.module),
    stacktrace: value.stacktrace
      ? {
          frames: value.stacktrace.frames?.map((frame) => ({
            colno: frame.colno,
            filename: stripUrlData(frame.filename),
            function: frame.function,
            in_app: frame.in_app,
            lineno: frame.lineno,
            module: stripUrlData(frame.module),
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

/**
 * Reduces a PostHog event to the information {@link scrubErrorEvent} leaves in a Sentry event, so both tools receive the
 * same error: type, stack frames and level. Messages, URLs, device details and everything that is not an exception are
 * discarded; events other than `$exception` are dropped entirely.
 */
export function scrubPosthogEvent(event: CaptureResult | null): CaptureResult | null {
  if (event?.event !== '$exception') {
    return null;
  }

  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(event.properties)) {
    if (allowedPosthogProperties.has(key)) {
      properties[key] = value;
    }
  }

  const exceptions: unknown = properties.$exception_list;
  properties.$exception_list = Array.isArray(exceptions) ? exceptions.map(scrubPosthogException) : [];

  return { event: event.event, properties, timestamp: event.timestamp, uuid: event.uuid };
}

function scrubPosthogException(exception: unknown) {
  const { stacktrace, type } = (exception ?? {}) as { stacktrace?: { frames?: Frame[] }; type?: string };
  return {
    stacktrace: stacktrace?.frames ? { frames: stacktrace.frames.map(scrubPosthogFrame), type: 'raw' } : undefined,
    type,
    value: filteredValue,
  };
}

function scrubPosthogFrame(frame: Frame) {
  return {
    colno: frame.colno,
    filename: stripUrlData(frame.filename as string | undefined),
    function: frame.function,
    in_app: frame.in_app,
    lineno: frame.lineno,
    module: stripUrlData(frame.module as string | undefined),
    platform: frame.platform,
  };
}

function stripUrlData(value: string | undefined) {
  if (!value) {
    return value;
  }

  const dataStart = value.search(/[?#]/);
  return dataStart === -1 ? value : value.slice(0, dataStart);
}

/** Replaces route parameter names by a placeholder and strips query and hash, so a route name holds no user data. */
export function sanitizeRouteName(routeName: string | undefined) {
  if (!routeName) {
    return 'route';
  }
  const path = stripUrlData(routeName)!;
  if (!path.includes('$')) {
    return path;
  }
  return path.replaceAll(/\$[^/]+/g, ':parameter');
}
