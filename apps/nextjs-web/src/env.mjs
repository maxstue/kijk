import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_URL_DIRECT: z.string().url(),
    NODE_ENV: z.enum(['development', 'production']),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url()
    ),
    NEXTAUTH_SECRET: process.env.NODE_ENV === 'production' ? z.string().min(1) : z.string().min(1).optional(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
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
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
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
