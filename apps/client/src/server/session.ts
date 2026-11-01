import { auth } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';

import type { AppSession, AuthGateway } from '@/shared/runtime/auth';

/** Resolves the routing identity from the verified Clerk session; no token or profile reaches the browser. */
export const getSession = createServerFn({ method: 'GET' }).handler(async (): Promise<AppSession | null> => {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('Authentication is not configured.');
  }
  const { sessionId, userId } = await auth();
  return sessionId && userId ? { id: sessionId, userId } : null;
});

/** Session lookup for the route guards, injected through the router context. */
export const serverAuth: AuthGateway = { getSession: () => getSession() };
