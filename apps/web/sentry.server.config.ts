import { env } from '@/env.mjs';
import * as Sentry from '@sentry/nextjs';

if (env.SENTRY_ENABLE) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
