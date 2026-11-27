import type { CaptureResult } from 'posthog-js';
import { expect, test } from 'vite-plus/test';

import { removeProviderParameters, scrubAnalyticsEvent } from './analytics-event-scrubber';

const ticketUrl = 'https://kijk.example.test/auth?__clerk_ticket=secret-ticket&__clerk_status=sign_up&from=%2Finbox';

test('removes Clerk link parameters and keeps the rest of the URL', () => {
  expect(removeProviderParameters(ticketUrl)).toBe('https://kijk.example.test/auth?from=%2Finbox');
  expect(removeProviderParameters('https://kijk.example.test/inbox?tab=all#top')).toBe(
    'https://kijk.example.test/inbox?tab=all#top',
  );
  expect(removeProviderParameters('https://kijk.example.test/auth#__clerk_ticket=secret-ticket')).toBe(
    'https://kijk.example.test/auth',
  );
  expect(removeProviderParameters('not a url __clerk_ticket=secret-ticket')).toBe('');
});

test('no URL property of a page view keeps the invitation ticket', () => {
  const event = {
    event: '$pageview',
    properties: {
      $current_url: ticketUrl,
      $referrer: ticketUrl,
      $pathname: '/auth',
      token: 'project-token',
    },
    $set: { $current_url: ticketUrl },
    $set_once: { $initial_current_url: ticketUrl, $initial_referrer: ticketUrl },
    uuid: 'event',
  } as unknown as CaptureResult;

  const scrubbed = scrubAnalyticsEvent(event);

  expect(JSON.stringify(scrubbed)).not.toContain('secret-ticket');
  expect(scrubbed?.properties.$current_url).toBe('https://kijk.example.test/auth?from=%2Finbox');
  expect(scrubbed?.properties.$pathname).toBe('/auth');
  expect(scrubbed?.properties.token).toBe('project-token');
  expect(scrubbed?.event).toBe('$pageview');
});
