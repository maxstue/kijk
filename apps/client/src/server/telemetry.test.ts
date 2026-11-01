import { expect, test } from 'vite-plus/test';

import { serverRouteTemplate, toServerErrorEvent } from './telemetry';

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
