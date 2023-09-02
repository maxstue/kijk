import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    SENTRY_ENABLE: z
      .string() // only allow "true" or "false"
      .refine((s) => s === 'true' || s === 'false')
      // transform to boolean
      .transform((s) => s === 'true'),
    SENTRY_DSN: z.string().min(1),
    SENTRY_ORG: z.string().min(1),
    SENTRY_PROJECT: z.string().min(1),
    SENTRY_LOG_LEVEL: z.enum(['info', 'warn']),
  },
  /**
   * Specify your client-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SENTRY_ENABLE: z
      .string() // only allow "true" or "false"
      .refine((s) => s === 'true' || s === 'false')
      // transform to boolean
      .transform((s) => s === 'true'),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SENTRY_ENABLE: process.env.SENTRY_ENABLE ?? false,
    NEXT_PUBLIC_SENTRY_ENABLE: process.env.NEXT_PUBLIC_SENTRY_ENABLE ?? false,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_LOG_LEVEL: process.env.SENTRY_LOG_LEVEL ?? 'warn',
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
  // Tell the library when we're in a server context.
  isServer: typeof window === 'undefined',
});
