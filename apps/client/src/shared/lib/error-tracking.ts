import * as Sentry from '@sentry/react';

import { router } from '@/router';
import { env } from '@/shared/env';

/** ErrorService is a wrapper around the Sentry error tracking library. */
const ErrorService = {
  init: () => {
    Sentry.init({
      dsn: env.SentryDsn,
      environment: env.Mode,
      integrations: [
        Sentry.extraErrorDataIntegration(),
        Sentry.browserProfilingIntegration(),
        Sentry.tanstackRouterBrowserTracingIntegration(router),
      ],
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
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
      // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
      // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
      // results in 25% of transactions being profiled (0.5*0.5=0.25)
      profilesSampleRate: 0.5,
    });
  },

  getInstance: () => Sentry,
  withProfiler: Sentry.withProfiler,

  captureException: (error: unknown, extra?: Record<string, unknown>) => {
    Sentry.captureException(error, { extra });
  },

  captureMessage: (message: string) => {
    Sentry.captureMessage(message);
  },
};

export { ErrorService };
