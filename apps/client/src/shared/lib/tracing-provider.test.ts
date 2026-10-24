import type { ReadableSpan } from '@opentelemetry/sdk-trace';
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';

import type { AppRouter } from '@/router';

import { posthogDestination, sentryDestination, startTracing } from './tracing-provider';

interface Recorded {
  headers: Record<string, string>;
  spans: unknown[];
  url: string;
}
const exporters = vi.hoisted(() => [] as Recorded[]);
vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: class {
    readonly record: (typeof exporters)[number];
    constructor(config: { headers: Record<string, string>; url: string }) {
      this.record = { headers: config.headers, spans: [], url: config.url };
      exporters.push(this.record);
    }
    export(spans: unknown[], done: (result: { code: number }) => void) {
      this.record.spans.push(...spans);
      done({ code: 0 });
    }
    forceFlush() {
      return Promise.resolve();
    }
    shutdown() {
      return Promise.resolve();
    }
  },
}));

const vitals = vi.hoisted(() => ({ callbacks: new Map<string, (metric: unknown) => void>() }));
vi.mock('web-vitals', () => {
  const register = (name: string) => (callback: (metric: unknown) => void) => void vitals.callbacks.set(name, callback);
  return { onCLS: register('CLS'), onFCP: register('FCP'), onLCP: register('LCP'), onTTFB: register('TTFB') };
});

type Handler = () => void;

function createRouter(resolved = false) {
  const handlers: Record<string, Handler[]> = {};
  const router = {
    state: {
      matches: [{ fullPath: '/$spaceId/finances/budgets' }],
      resolvedLocation: resolved ? {} : undefined,
    },
    subscribe(event: string, handler: Handler) {
      (handlers[event] ??= []).push(handler);
      return () => {
        handlers[event] = (handlers[event] ?? []).filter((entry) => entry !== handler);
      };
    },
  };
  const emit = (event: string) => (handlers[event] ?? []).forEach((handler) => handler());
  return { emit, router: router as unknown as AppRouter };
}

const options = {
  environment: 'test',
  posthog: { key: 'phc_public', url: 'https://eu.i.posthog.example/' },
  sampleRate: 1,
  sentryDsn: 'https://publickey:secret@o1.ingest.de.sentry.io/42',
  version: '1.2.3',
};

beforeEach(() => {
  exporters.length = 0;
  vitals.callbacks.clear();
});

describe('destinations', () => {
  test('derives the Sentry OTLP endpoint and public key from the DSN, never the secret', () => {
    const destination = sentryDestination('https://publickey:secret@o1.ingest.de.sentry.io/42');
    expect(destination).toEqual({
      headers: { 'x-sentry-auth': 'sentry sentry_key=publickey' },
      url: 'https://o1.ingest.de.sentry.io/api/42/integration/otlp/v1/traces',
    });
    expect(JSON.stringify(destination)).not.toContain('secret');
  });

  test.each(['', 'not a url', 'https://o1.ingest.sentry.io/42', 'https://key@o1.ingest.sentry.io/'])(
    'ignores the invalid DSN %j',
    (dsn) => {
      expect(sentryDestination(dsn)).toBeUndefined();
    },
  );

  test('derives the PostHog OTLP endpoint with the project token', () => {
    expect(posthogDestination('phc_public', 'https://eu.i.posthog.example/')).toEqual({
      headers: { Authorization: 'Bearer phc_public' },
      url: 'https://eu.i.posthog.example/i/v1/traces',
    });
  });
});

describe('router tracing', () => {
  test.each(['shutdown', 'timer'] as const)(
    'drops completed spans queued before withdrawal during %s',
    async (flush) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { emit, router } = createRouter(true);
      let consent = true;
      const stop = startTracing({ ...options, hasConsent: () => consent, router });
      try {
        emit('onBeforeNavigate');
        emit('onResolved');
        expect(exporters.every((exporter) => exporter.spans.length === 0)).toBe(true);
        consent = false;

        if (flush === 'timer') {
          await vi.advanceTimersByTimeAsync(6000);
        }
        await stop();
        expect(exporters.every((exporter) => exporter.spans.length === 0)).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  test('sends the same sanitized navigation span to both tools', async () => {
    const { emit, router } = createRouter(true);
    const stop = startTracing({ ...options, hasConsent: () => true, router });

    emit('onBeforeNavigate');
    emit('onResolved');
    await stop();

    expect(exporters.map((exporter) => exporter.url)).toEqual([
      'https://o1.ingest.de.sentry.io/api/42/integration/otlp/v1/traces',
      'https://eu.i.posthog.example/i/v1/traces',
    ]);
    const [sentry, posthog] = exporters.map((exporter) => exporter.spans as ReadableSpan[]);
    expect(sentry).toHaveLength(1);
    expect(posthog).toHaveLength(1);
    for (const span of [sentry![0]!, posthog![0]!]) {
      expect(span.name).toBe('navigation /:parameter/finances/budgets');
      expect(span.attributes).toEqual({
        'http.route': '/:parameter/finances/budgets',
        'navigation.type': 'navigation',
      });
    }
    expect(sentry![0]!.spanContext().traceId).toBe(posthog![0]!.spanContext().traceId);
  });

  test('keeps the first page load through initial navigation and traces later navigations separately', async () => {
    const { emit, router } = createRouter(false);
    const stop = startTracing({ ...options, hasConsent: () => true, router });

    emit('onBeforeNavigate');
    emit('onResolved');
    emit('onBeforeNavigate');
    emit('onResolved');
    await stop();

    const spans = exporters[0]!.spans as ReadableSpan[];
    expect(spans.map((span) => span.name)).toEqual([
      'pageload /:parameter/finances/budgets',
      'navigation /:parameter/finances/budgets',
    ]);
  });

  test('reports the web vitals of the first page load into its trace for both tools', async () => {
    const { emit, router } = createRouter(false);
    const stop = startTracing({ ...options, hasConsent: () => true, router });

    emit('onBeforeNavigate');
    emit('onResolved');
    vitals.callbacks.get('LCP')!({ name: 'LCP', rating: 'good', value: 1200 });
    vitals.callbacks.get('CLS')!({ name: 'CLS', rating: 'needs-improvement', value: 0.12 });
    await stop();

    expect([...vitals.callbacks.keys()].toSorted()).toEqual(['CLS', 'FCP', 'LCP', 'TTFB']);
    for (const exporter of exporters) {
      const spans = exporter.spans as ReadableSpan[];
      const pageload = spans.find((span) => span.name.startsWith('pageload'))!;
      const lcp = spans.find((span) => span.name === 'web-vital lcp')!;
      expect(spans.map((span) => span.name).toSorted()).toEqual(
        ['pageload /:parameter/finances/budgets', 'web-vital cls', 'web-vital lcp'].toSorted(),
      );
      expect(lcp.attributes).toEqual({ 'web_vital.name': 'LCP', 'web_vital.rating': 'good', 'web_vital.value': 1200 });
      expect(lcp.spanContext().traceId).toBe(pageload.spanContext().traceId);
      expect(lcp.parentSpanContext?.spanId).toBe(pageload.spanContext().spanId);
    }
  });

  test('reports no web vitals when tracing starts after the first page load', async () => {
    const { router } = createRouter(true);
    const stop = startTracing({ ...options, hasConsent: () => true, router });
    await stop();

    expect(vitals.callbacks.size).toBe(0);
  });

  test('creates no span without consent', async () => {
    const { emit, router } = createRouter(true);
    const stop = startTracing({ ...options, hasConsent: () => false, router });

    emit('onBeforeNavigate');
    emit('onResolved');
    await stop();

    expect(exporters.every((exporter) => exporter.spans.length === 0)).toBe(true);
  });

  test('discards a span when consent is withdrawn before it ends', async () => {
    const { emit, router } = createRouter(true);
    let consent = true;
    const stop = startTracing({ ...options, hasConsent: () => consent, router });

    emit('onBeforeNavigate');
    consent = false;
    emit('onResolved');
    await stop();

    expect(exporters.every((exporter) => exporter.spans.length === 0)).toBe(true);
  });

  test('does nothing when no destination is configured', async () => {
    const { router } = createRouter(true);
    const stop = startTracing({ environment: 'test', hasConsent: () => true, router, version: '1' });
    await expect(stop()).resolves.toBeUndefined();
    expect(exporters).toHaveLength(0);
  });
});
