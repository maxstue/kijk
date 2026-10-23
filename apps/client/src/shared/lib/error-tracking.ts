import * as Sentry from '@sentry/react';
import { posthog } from 'posthog-js';
import type { PostHog } from 'posthog-js';

import { config } from '@/shared/config';
import { scrubErrorEvent, scrubPosthogEvent } from '@/shared/lib/error-event-scrubber';

/** Name of the PostHog instance that only reports errors; analytics starts separately after consent. */
const ERRORS_INSTANCE = 'errors';

/**
 * Provider-neutral entry point for privacy-preserving error reporting. Sentry and PostHog are set up the same way: both
 * capture unhandled errors and rejections on their own, both receive manual captures from here, and both reduce every
 * error to type and stack frames before it leaves the browser. Errors carry no user data, so they do not depend on the
 * analytics consent.
 */
class ErrorTrackingService {
  private posthogErrors?: PostHog;

  captureException(error: unknown) {
    Sentry.captureException(error);
    this.posthogErrors?.captureException(error);
  }

  init() {
    Sentry.init({
      dsn: config.SentryDsn,
      environment: config.Mode,
      integrations: (defaults) => defaults.filter((integration) => integration.name !== 'BrowserSession'),
      attachStacktrace: false,
      maxBreadcrumbs: 0,
      beforeBreadcrumb: () => null,
      beforeSend: scrubErrorEvent,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: {
          request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
          response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
        },
        httpBodies: [],
        urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
        genAI: { inputs: false, outputs: false },
        databaseQueryData: false,
        graphQL: { document: false, variables: false },
      },
    });

    this.initPosthog();
  }

  private initPosthog() {
    if (!config.PosthogKey || !config.PosthogUrl) {
      return;
    }

    this.posthogErrors = posthog.init(
      config.PosthogKey,
      {
        api_host: config.PosthogUrl,
        autocapture: false,
        before_send: scrubPosthogEvent,
        capture_exceptions: {
          capture_console_errors: false,
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
        },
        capture_pageleave: false,
        capture_pageview: false,
        capture_performance: false,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        // The default consent key is shared by project token, even between named instances.
        consent_persistence_name: 'kijk_errors_consent',
        disable_persistence: true,
        disable_session_recording: true,
        disable_surveys: true,
        advanced_disable_flags: true,
        person_profiles: 'never',
      },
      ERRORS_INSTANCE,
    );
  }
}

/** Provider-neutral entry point for privacy-preserving error reporting. */
const ErrorService = new ErrorTrackingService();

export { ErrorService };
