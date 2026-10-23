import { ROOT_CONTEXT, trace } from '@opentelemetry/api';
import type { Span, Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  SamplingDecision,
  TraceIdRatioBasedSampler,
  TracerProvider,
} from '@opentelemetry/sdk-trace';
import type { Sampler, SpanExporter } from '@opentelemetry/sdk-trace';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

import type { AppRouter } from '@/router';
import { sanitizeRouteName } from '@/shared/lib/error-event-scrubber';

/** Share of navigations that is traced; the decision is made once per trace, so both tools receive the same traces. */
export const TRACES_SAMPLE_RATE = 0.1;

export interface TracingOptions {
  environment: string;
  hasConsent: () => boolean;
  posthog?: { key: string; url: string };
  router: AppRouter;
  sampleRate?: number;
  sentryDsn?: string;
  version: string;
}

interface OtlpDestination {
  headers: Record<string, string>;
  url: string;
}

/** Derives the OTLP traces endpoint and its public key header from a Sentry DSN. */
export function sentryDestination(dsn: string): OtlpDestination | undefined {
  try {
    const { host, password: _secret, pathname, protocol, username } = new URL(dsn);
    const projectId = pathname.split('/').findLast(Boolean);
    if (!username || !projectId) {
      return undefined;
    }
    return {
      headers: { 'x-sentry-auth': `sentry sentry_key=${username}` },
      url: `${protocol}//${host}/api/${projectId}/integration/otlp/v1/traces`,
    };
  } catch {
    return undefined;
  }
}

/** Derives the OTLP traces endpoint from the PostHog ingestion host and authenticates with the public project token. */
export function posthogDestination(key: string, url: string): OtlpDestination {
  return { headers: { Authorization: `Bearer ${key}` }, url: `${url.replace(/\/+$/, '')}/i/v1/traces` };
}

/** Only samples while the user consents, so no trace starts without or after withdrawn consent. */
class ConsentSampler implements Sampler {
  constructor(
    private readonly inner: Sampler,
    private readonly hasConsent: () => boolean,
  ) {}

  shouldSample(...args: Parameters<Sampler['shouldSample']>) {
    return this.hasConsent() ? this.inner.shouldSample(...args) : { decision: SamplingDecision.NOT_RECORD };
  }

  toString() {
    return 'ConsentSampler';
  }
}

function routeTemplate(router: AppRouter) {
  return sanitizeRouteName(router.state.matches.at(-1)?.fullPath);
}

/**
 * Traces page loads and navigations of the router. Spans hold only the sanitized route template and timing; request
 * tracing, trace propagation to the API and user identifiers are excluded.
 */
function traceRouter(tracer: Tracer, router: AppRouter) {
  let active: { kind: 'navigation' | 'pageload'; span: Span } | undefined = router.state.resolvedLocation
    ? undefined
    : {
        kind: 'pageload',
        span: tracer.startSpan('pageload', {
          attributes: { 'navigation.type': 'pageload' },
          startTime: performance.timeOrigin,
        }),
      };

  const unsubscribeStart = router.subscribe('onBeforeNavigate', () => {
    // The initial load emits this event too; keep its pageload span until the first resolution.
    if (active?.kind === 'pageload') {
      return;
    }
    active?.span.end();
    active = {
      kind: 'navigation',
      span: tracer.startSpan('navigation', { attributes: { 'navigation.type': 'navigation' } }),
    };
  });
  const unsubscribeResolved = router.subscribe('onResolved', () => {
    if (!active) {
      return;
    }
    const route = routeTemplate(router);
    active.span.updateName(`${active.kind} ${route}`);
    active.span.setAttribute('http.route', route);
    active.span.end();
    active = undefined;
  });

  return {
    pageload: active?.span,
    stop: () => {
      unsubscribeStart();
      unsubscribeResolved();
      active?.span.end();
    },
  };
}

/**
 * Reports the Core Web Vitals of the first page load as spans of its trace, so both tools show them next to the page
 * load. Navigations afterwards have no vitals of their own. INP is left out, as before.
 */
function traceWebVitals(tracer: Tracer, pageload: Span) {
  const parent = trace.setSpan(ROOT_CONTEXT, pageload);
  const report = (metric: Metric) => {
    tracer
      .startSpan(
        `web-vital ${metric.name.toLowerCase()}`,
        {
          attributes: {
            'web_vital.name': metric.name,
            'web_vital.rating': metric.rating,
            'web_vital.value': metric.value,
          },
        },
        parent,
      )
      .end();
  };
  onCLS(report);
  onFCP(report);
  onLCP(report);
  onTTFB(report);
}

function createExporters(options: TracingOptions) {
  const destinations: OtlpDestination[] = [];
  const sentry = options.sentryDsn ? sentryDestination(options.sentryDsn) : undefined;
  if (sentry) {
    destinations.push(sentry);
  }
  if (options.posthog) {
    destinations.push(posthogDestination(options.posthog.key, options.posthog.url));
  }
  return destinations.map(({ headers, url }): SpanExporter => {
    const exporter = new OTLPTraceExporter({ headers, url });
    return {
      // Check at transmission, after batching: withdrawal also discards spans that have already ended.
      export: (spans, done) => (options.hasConsent() ? exporter.export(spans, done) : done({ code: 0 })),
      forceFlush: () => exporter.forceFlush(),
      shutdown: () => exporter.shutdown(),
    };
  });
}

/**
 * Starts OpenTelemetry tracing of the router. One provider, one sampler and one scrubbing rule feed an OTLP exporter
 * per configured tool (Sentry and PostHog), so both receive identical traces.
 *
 * @returns A function that stops tracing and resolves when queued spans are exported.
 */
export function startTracing(options: TracingOptions) {
  const exporters = createExporters(options);
  if (exporters.length === 0) {
    return () => Promise.resolve();
  }

  const provider = new TracerProvider({
    resource: resourceFromAttributes({
      'deployment.environment': options.environment,
      'deployment.environment.name': options.environment,
      [ATTR_SERVICE_NAME]: 'kijk-client',
      [ATTR_SERVICE_VERSION]: options.version,
    }),
    sampler: new ConsentSampler(
      new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(options.sampleRate ?? TRACES_SAMPLE_RATE) }),
      options.hasConsent,
    ),
    spanProcessors: exporters.map((exporter) => new BatchSpanProcessor({ exporter })),
  });

  const tracer = provider.getTracer('kijk-client');
  const { pageload, stop: stopRouterTracing } = traceRouter(tracer, options.router);
  if (pageload) {
    traceWebVitals(tracer, pageload);
  }
  return () => {
    stopRouterTracing();
    return provider.shutdown();
  };
}
