import { z } from 'zod';

const envSchema = z.object({
  // Base
  Mode: z.enum(['development', 'production', 'test']).default('development'),
  // App
  ApiUrl: z.string().url(),
  // Devtools
  DevToolsLogger: z.string().transform((x) => x === 'true'),
  // Auth
  AuthClientId: z.string().trim().min(1),
  AuthDomain: z.string().trim().min(1),
  AuthAudience: z.string().trim().min(1),
  AuthRedirectUrl: z.string().url(),
});

const envParse = envSchema.safeParse({
  Mode: import.meta.env.MODE,
  // App
  ApiUrl: import.meta.env.VITE_API_URL,
  // Devtools
  DevToolsLogger: import.meta.env.VITE_DEVTOOLS_LOGGER,
  // Auth
  AuthClientId: import.meta.env.VITE_KINDE_CLIENT_ID,
  AuthDomain: import.meta.env.VITE_KINDE_DOMAIN,
  AuthAudience: import.meta.env.VITE_KINDE_AUDIENCE,
  AuthRedirectUrl: import.meta.env.VITE_KINDE_REDIRECT_URL,
});

if (!envParse.success) {
  console.error('[env.ts]', envParse.error.issues);
  throw new Error('There is an error with the environment variables');
}

export const env = envParse.data;
