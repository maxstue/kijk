import { z } from 'zod';

const envSchema = z.object({
  // Base
  Mode: z.enum(['development', 'production', 'test']).default('development'),
  // App
  ApiUrl: z.string().url(),
  // Devtools
  DevToolsLogger: z.string().transform((x) => x === 'true'),
  // Auth
  AuthUrl: z.string().trim().min(1),
  AuthKey: z.string().trim().min(1),
});

const envParse = envSchema.safeParse({
  Mode: import.meta.env.MODE,
  // App
  ApiUrl: import.meta.env.VITE_API_URL,
  // Devtools
  DevToolsLogger: import.meta.env.VITE_DEVTOOLS_LOGGER,
  // Auth
  AuthUrl: import.meta.env.VITE_SUPABASE_URL,
  AuthKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!envParse.success) {
  console.error('[env.ts]', envParse.error.issues);
  throw new Error('There is an error with the environment variables');
}

export const env = envParse.data;
