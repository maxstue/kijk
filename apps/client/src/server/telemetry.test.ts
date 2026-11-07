import { context, createTraceState, ROOT_CONTEXT, trace, TraceFlags } from '@opentelemetry/api';
import { afterEach, expect, test, vi } from 'vite-plus/test';

import { serverRouteTemplate, startServerSpan, toServerErrorEvent } from './telemetry';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test('anonymous spans do not inherit the active Railway trace or trace state', () => {
  const incoming = {
    traceId: '12345678901234567890123456789012',
    spanId: '1234567890123456',
    traceFlags: TraceFlags.SAMPLED,
    traceState: createTraceState('vendor=private-correlation'),
    isRemote: true,
  };
  vi.spyOn(context, 'active').mockReturnValue(trace.setSpanContext(ROOT_CONTEXT, incoming));
  vi.stubEnv('VITE_SENTRY_DSN', '');
  vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
  vi.stubEnv('VITE_POSTHOG_URL', 'http://127.0.0.1:1');

  const span = startServerSpan(new Request('https://app.example/'));
  expect(span).toBeDefined();
  expect(span?.spanContext().traceId).not.toBe(incoming.traceId);
  expect(span?.spanContext().traceState?.serialize()).toBeUndefined();
  span?.end();
});

test('server traces retain only route templates, never IDs, search or fragments', () => {
  expect(
    serverRouteTemplate(
      new Request('https://app.example/api/spaces/private-space/imports/private-import?token=secret#details'),
    ),
  ).toBe('/api/spaces/{spaceId}/imports/{id}');
  expect(serverRouteTemplate(new Request('https://app.example/private-space/finances?counterparty=private'))).toBe(
    '/app',
  );
  expect(serverRouteTemplate(new Request('https://app.example/api/unknown/private'))).toBe('/api');
});

test('server errors discard messages and sensitive URL data before either provider receives them', () => {
  const error = new Error('private@example.test secret-token');
  error.stack =
    'Error: private@example.test secret-token\n    at example (https://app.example/main.js?token=secret-token:10:20)';
  const event = toServerErrorEvent(error);
  expect(event.exception?.values?.[0]?.value).toBe('[Filtered]');
  expect(JSON.stringify(event)).not.toContain('private@example.test');
  expect(JSON.stringify(event)).not.toContain('secret-token');
  expect(event.exception?.values?.[0]?.type).toBe('Error');
});
