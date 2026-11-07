import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { envDetector, resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace';

// This file is preloaded by Node before Nitro or any application dependencies.
// The existing anonymous Sentry/PostHog pipeline remains independent.
const allowedAttributes = new Set([
  'http.request.method',
  'http.response.status_code',
  'http.method',
  'http.status_code',
  'network.protocol.version',
  'server.address',
  'server.port',
  'error.type',
]);

export function scrubSpan(span) {
  for (const key of Object.keys(span.attributes)) {
    if (!allowedAttributes.has(key)) {
      delete span.attributes[key];
    }
  }
  span.events.splice(0);
  delete span.status.message;
}

function isTelemetryUrl(value) {
  try {
    const url = new URL(value);
    const configured = [
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      process.env.VITE_POSTHOG_URL,
      process.env.VITE_SENTRY_DSN,
    ];
    return (
      url.hostname.endsWith('.sentry.io') || configured.some((target) => target && new URL(target).host === url.host)
    );
  } catch {
    return false;
  }
}

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
  const sdk = new NodeSDK({
    resourceDetectors: [envDetector],
    resource: resourceFromAttributes(
      process.env.OTEL_SERVICE_VERSION ? { 'service.version': process.env.OTEL_SERVICE_VERSION } : {},
    ),
    metricReaders: [],
    logRecordProcessors: [],
    spanProcessors: [
      { onStart() {}, onEnd: scrubSpan, forceFlush: async () => {}, shutdown: async () => {} },
      new BatchSpanProcessor({ exporter: new OTLPTraceExporter() }),
    ],
    instrumentations: [
      new HttpInstrumentation({
        ignoreOutgoingRequestHook: (request) => isTelemetryUrl(`${request.protocol}//${request.getHeader('host')}`),
      }),
      new UndiciInstrumentation({ ignoreRequestHook: (request) => isTelemetryUrl(request.origin) }),
    ],
  });
  sdk.start();
  // Nitro's bundled plugin calls the preloaded SDK only after HTTP requests drain.
  // Passing a callback avoids bundling and initializing another SDK in Nitro.
  let shutdown;
  globalThis[Symbol.for('kijk.railwayTracing.shutdown')] = () => (shutdown ??= sdk.shutdown());
}
