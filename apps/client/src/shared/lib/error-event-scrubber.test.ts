import type { CaptureResult } from 'posthog-js';
import { describe, expect, test } from 'vite-plus/test';

import { sanitizeRouteName, scrubErrorEvent, scrubPosthogEvent } from './error-event-scrubber';

const frame = {
  colno: 4,
  filename: 'https://app.example/assets/index.js?token=private#hash',
  function: 'run',
  lineno: 9,
};

describe('route names', () => {
  test('replaces parameter names and removes query and hash', () => {
    expect(sanitizeRouteName('/resources/$resourceId?name=private#x')).toBe('/resources/:parameter');
    expect(sanitizeRouteName(undefined)).toBe('route');
  });
});

describe('error scrubbing parity', () => {
  const error = new TypeError('Private input');

  test('Sentry and PostHog keep the same type, frames and a filtered value', () => {
    const sentry = scrubErrorEvent({
      exception: {
        values: [{ stacktrace: { frames: [{ ...frame, in_app: true }] }, type: error.name, value: error.message }],
      },
      type: undefined,
      user: { id: 'synthetic-user' },
    });
    const posthog = scrubPosthogEvent({
      event: '$exception',
      properties: {
        $current_url: 'https://app.example/private?x=1',
        $exception_list: [
          {
            mechanism: { handled: false },
            stacktrace: { frames: [{ ...frame, in_app: true }], type: 'raw' },
            type: error.name,
            value: error.message,
          },
        ],
        $exception_values: [error.message],
        $referrer: 'https://elsewhere.example',
        distinct_id: 'anonymous',
        token: 'phc_public',
      },
      uuid: 'id',
    } as CaptureResult);

    const sentryException = sentry.exception?.values?.[0];
    const [posthogException] = posthog!.properties.$exception_list as Array<{
      stacktrace: { frames: unknown[] };
      type: string;
      value: string;
    }>;

    expect(sentryException?.type).toBe(posthogException!.type);
    expect(sentryException?.value).toBe('[Filtered]');
    expect(posthogException!.value).toBe('[Filtered]');
    expect(sentryException?.stacktrace?.frames?.[0]).toMatchObject({
      filename: 'https://app.example/assets/index.js',
      function: 'run',
      lineno: 9,
    });
    expect(posthogException!.stacktrace.frames[0]).toMatchObject({
      filename: 'https://app.example/assets/index.js',
      function: 'run',
      lineno: 9,
    });
  });

  test('PostHog drops everything but the allowlisted properties', () => {
    const result = scrubPosthogEvent({
      event: '$exception',
      properties: {
        $current_url: 'x',
        $exception_values: ['private'],
        $referrer: 'y',
        $exception_list: [],
        token: 'phc_public',
      },
      uuid: 'id',
    } as CaptureResult);
    expect(Object.keys(result!.properties).toSorted()).toEqual(['$exception_list', 'token']);
  });

  test.each(['$pageview', '$autocapture', 'survey sent'])(
    'PostHog drops the %s event of the error instance',
    (event) => {
      expect(scrubPosthogEvent({ event, properties: {}, uuid: 'id' } as CaptureResult)).toBeNull();
    },
  );

  test('PostHog drops a missing event', () => {
    expect(scrubPosthogEvent(null)).toBeNull();
  });
});
