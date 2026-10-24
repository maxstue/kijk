import { SpanKind } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, TraceIdRatioBasedSampler, TracerProvider } from '@opentelemetry/sdk-trace';
import * as Sentry from '@sentry/node';

import release from '@/release-metadata.json';
import { scrubErrorEvent } from '@/shared/lib/error-event-scrubber';
import { posthogDestination, sentryDestination } from '@/shared/lib/otlp-destinations';

import { allowedApiOperations } from './api-operations';
import { isAllowedApiOperation } from './api-relay';

let provider: TracerProvider | undefined;
let errorsInitialized = false;

/** Keeps route identifiers and arbitrary request input out of server traces. */
export function serverRouteTemplate(request: Request) {
  const path = new URL(request.url).pathname;
  if (['/', '/privacy', '/terms', '/imprint', '/auth', '/sso-callback', '/health', '/api/session'].includes(path)) {
    return path;
  }
  if (isAllowedApiOperation(path, request.method)) {
    const segments = path.split('/');
    return (
      allowedApiOperations.find(
        ([pattern, methods]) =>
          methods.includes(request.method.toLowerCase()) &&
          pattern.split('/').length === segments.length &&
          pattern.split('/').every((segment, index) => segment.startsWith('{') || segment === segments[index]),
      )?.[0] ?? '/api'
    );
  }
  return path.startsWith('/api/') ? '/api' : '/app';
}

function getProvider() {
  if (provider) {
    return provider;
  }
  const destinations = [];
  const sentry = process.env.VITE_SENTRY_DSN ? sentryDestination(process.env.VITE_SENTRY_DSN) : undefined;
  if (sentry) {
    destinations.push(sentry);
  }
  if (process.env.VITE_POSTHOG_KEY && process.env.VITE_POSTHOG_URL) {
    destinations.push(posthogDestination(process.env.VITE_POSTHOG_KEY, process.env.VITE_POSTHOG_URL));
  }
  if (!destinations.length) {
    return;
  }
  provider = new TracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'kijk-web', 'service.version': release.version }),
    sampler: new TraceIdRatioBasedSampler(0.1),
    spanProcessors: destinations.map(
      (destination) => new BatchSpanProcessor({ exporter: new OTLPTraceExporter(destination) }),
    ),
  });
  return provider;
}

/** Starts one anonymous server span for both OTLP destinations; no propagation or request enrichment is enabled. */
export function startServerSpan(request: Request) {
  const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(request.method)
    ? request.method
    : 'OTHER';
  const route = serverRouteTemplate(request);
  return getProvider()
    ?.getTracer('kijk-web')
    .startSpan(`${method} ${route}`, {
      kind: SpanKind.SERVER,
      attributes: { 'http.request.method': method, 'http.route': route },
    });
}

/** Sends the same allowlisted error type and stack to both tools; messages and request context are discarded. */
export function captureServerError(error: unknown) {
  if (!errorsInitialized) {
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN,
      enabled: Boolean(process.env.VITE_SENTRY_DSN),
      defaultIntegrations: false,
      tracesSampleRate: 0,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpBodies: [],
        databaseQueryData: false,
        genAI: { inputs: false, outputs: false },
      },
      maxBreadcrumbs: 0,
      beforeSend: scrubErrorEvent,
    });
    errorsInitialized = true;
  }
  const event = toServerErrorEvent(error);
  Sentry.captureEvent(event);
  const key = process.env.VITE_POSTHOG_KEY;
  const host = process.env.VITE_POSTHOG_URL;
  if (key && host) {
    void fetch(`${host.replace(/\/+$/, '')}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event: '$exception',
        distinct_id: 'anonymous',
        properties: {
          $process_person_profile: false,
          $lib: 'kijk-web',
          $lib_version: release.version,
          $exception_level: 'error',
          $exception_list: event.exception?.values?.map((exception) => ({
            type: exception.type,
            value: '[Filtered]',
            stacktrace: { type: 'raw', frames: exception.stacktrace?.frames },
          })),
        },
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => undefined);
  }
}

/** Produces only error type and sanitized stack frames, including for non-Error thrown values. */
export function toServerErrorEvent(error: unknown) {
  const value = error instanceof Error ? error : new Error('UnknownError');
  return scrubErrorEvent({
    type: undefined,
    level: 'error',
    platform: 'node',
    release: release.version,
    exception: {
      values: [
        { type: value.name, value: '[Filtered]', stacktrace: { frames: Sentry.defaultStackParser(value.stack ?? '') } },
      ],
    },
  });
}
