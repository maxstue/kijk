import { describe, expect, test } from 'vite-plus/test';

import { scrubPerformanceSpan } from './error-event-scrubber';

describe('Sentry performance scrubbing', () => {
  test('removes span attributes and route parameter names before upload', () => {
    const span = {
      data: { 'url.full': 'https://example.com/resource?token=private' },
      description: '/resources/$resourceId?token=private',
      op: 'navigation',
    };

    expect(scrubPerformanceSpan(span)).toEqual({
      data: {},
      description: '/resources/:parameter',
      op: 'navigation',
    });
  });
});
