import * as Sentry from '@sentry/react';

import { router } from '@/router';
import { config } from '@/shared/config';

/** ErrorService is a wrapper around the Sentry error tracking library. */
const ErrorService = {
  captureException: (error: unknown, extra?: Record<string, unknown>) => {
    Sentry.captureException(error, { extra });
  },

  captureMessage: (message: string) => {
    Sentry.captureMessage(message);
  },
  getInstance: () => Sentry,

  init: () => {
    Sentry.init({
      dsn: config.SentryDsn,
      environment: config.Mode,
      integrations: [
        Sentry.extraErrorDataIntegration(),
        Sentry.browserProfilingIntegration(),
        Sentry.tanstackRouterBrowserTracingIntegration(router),
      ],
      // Set tracesSampleRate to 1.0 to capture 100%
      // Of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 0.5,
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/kijk-api\.xyz\/api/,
        /^https:\/\/kijk-app\.xyz/,
        /^https:\/\/kijk\.xyz/,
      ],

      // Set profilesSampleRate to 1.0 to profile every transaction.
      // Since profilesSampleRate is relative to tracesSampleRate,
      // The final profiling rate can be computed as tracesSampleRate * profilesSampleRate
      // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
      // Results in 25% of transactions being profiled (0.5*0.5=0.25)
      profilesSampleRate: 0.5,
    });
  },

  withProfiler: Sentry.withProfiler,
};

export { ErrorService };
