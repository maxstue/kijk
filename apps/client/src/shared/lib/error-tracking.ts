import * as Sentry from '@sentry/react';

import { router } from '@/router';
import { env } from '@/shared/env';

export const createSentry = () =>
  Sentry.init({
    dsn: env.SentryDsn,
    environment: env.Mode,
    integrations: [
      Sentry.extraErrorDataIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration(),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.5,
    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/kijk-api.fly\.dev\/api/,
      /^https:\/\/kijk-client.vercel\.app/,
      /^https:\/\/kijk-client.fly\.dev\/api/,
    ],

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Set profilesSampleRate to 1.0 to profile every transaction.
    // Since profilesSampleRate is relative to tracesSampleRate,
    // the final profiling rate can be computed as tracesSampleRate * profilesSampleRate
    // For example, a tracesSampleRate of 0.5 and profilesSampleRate of 0.5 would
    // results in 25% of transactions being profiled (0.5*0.5=0.25)
    profilesSampleRate: 0.5,
  });
